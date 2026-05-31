import React, { useState, useEffect, useCallback, useRef } from "react";
import { useVoice } from "./index.js";
import { t } from "./locales.js";
import { ChatView } from "./ChatView.js";
import type { AgentChannel, LocaleStrings, ChatConfig } from "./types.js";

// ── Inline SVG icons (no external deps) ──────────────────────────

const IconMic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="11" rx="3" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3 1.2 4.7 1.2h.1c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const IconPhone = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────

function formatPhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.length >= 9) {
    const last9 = digits.slice(-9);
    return `${last9.slice(0, 3)} ${last9.slice(3, 6)} ${last9.slice(6)}`;
  }
  return p;
}

function formatDuration(raw: number): string {
  const s = Math.round(raw);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function findLastIndex<T>(arr: T[], fn: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (fn(arr[i])) return i;
  }
  return -1;
}

function whatsappUrl(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}`;
}

// ── Types ─────────────────────────────────────────────────────────

interface ContactHubProps {
  open: boolean;
  onClose: () => void;
  channels: AgentChannel[];
  name: string;
  locale: string;
  labels?: Partial<LocaleStrings>;
  avatar?: string;
  callMeEndpoint?: string;
  agent: string;
  server?: string;
  chat?: ChatConfig;
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
}

interface TranscriptMsg {
  id: number;
  role: "bot" | "user" | "tool";
  text?: string;
  messageId?: string;
  streaming?: boolean;
  finalized?: boolean;
  name?: string;
  args?: string;
}

// ── ContactHub Component ──────────────────────────────────────────

export function ContactHub({
  open, onClose, channels, name, locale, labels, avatar, callMeEndpoint,
  agent, server, chat, tokenProvider,
}: ContactHubProps) {
  const [view, setView] = useState<"menu" | "call" | "transcript" | "chat">("menu");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { connect } = useVoice();

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setView("menu");
        setStatus("idle");
        setPhone("");
        setErrorMsg("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const hasWebrtc = channels.some((c) => c.type === "webrtc");
  const hasChat = channels.some((c) => c.type === "chat") && !!chat;
  const waChannel = channels.find((c) => c.type === "whatsapp" && c.phone);
  const phoneChannel = channels.find((c) => c.type === "phone");
  const showCallMe = !!callMeEndpoint && !!phoneChannel;

  const handleVoice = async () => {
    onClose();
    await connect();
  };

  const handleStartCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setView("transcript");
  };

  const handleTranscriptError = (err: string) => {
    setView("call");
    setErrorMsg(err || t(locale, "callMe.error", labels));
    setStatus("error");
  };

  if (!open) return null;

  const l = (key: keyof LocaleStrings) => t(locale, key, labels, { name });

  const handleVoiceFromChat = async () => {
    onClose();
    await connect();
  };

  return (
    <div className="vw-hub-backdrop" onClick={(e) => { if (e.target === e.currentTarget && view !== "transcript" && view !== "chat") onClose(); }}>
      <div className={`vw-hub-panel${view === "chat" ? " vw-hub-panel--chat" : ""}`}>
        {view !== "transcript" && view !== "chat" && (
          <button className="vw-hub-close" onClick={onClose}><IconX /></button>
        )}

        {view === "menu" ? (
          <div className="vw-hub-menu">
            <div className="vw-hub-header">
              {avatar && <div className="vw-hub-avatar">{avatar}</div>}
              <h3>{l("hub.title")}</h3>
              <p>{l("hub.subtitle")}</p>
            </div>

            <div className="vw-hub-options">
              {hasWebrtc && (
                <button className="vw-hub-opt" onClick={handleVoice}>
                  <span className="vw-hub-icon vw-hub-icon--voice"><IconMic /></span>
                  <span className="vw-hub-body">
                    <span className="vw-hub-title">{l("hub.voice")}</span>
                    <span className="vw-hub-desc">{l("hub.voiceDesc")}</span>
                  </span>
                  <span className="vw-hub-arrow">→</span>
                </button>
              )}

              {hasChat && (
                <button className="vw-hub-opt" onClick={() => setView("chat")}>
                  <span className="vw-hub-icon vw-hub-icon--chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <span className="vw-hub-body">
                    <span className="vw-hub-title">{l("hub.chat")}</span>
                    <span className="vw-hub-desc">{l("hub.chatDesc")}</span>
                  </span>
                  <span className="vw-hub-arrow">→</span>
                </button>
              )}

              {waChannel && (
                <a
                  className="vw-hub-opt"
                  href={whatsappUrl(waChannel.phone!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  <span className="vw-hub-icon vw-hub-icon--wa"><IconWhatsApp /></span>
                  <span className="vw-hub-body">
                    <span className="vw-hub-title">{l("hub.whatsapp")}</span>
                    <span className="vw-hub-desc">{l("hub.whatsappDesc")}</span>
                  </span>
                  <span className="vw-hub-arrow">→</span>
                </a>
              )}

              {showCallMe && (
                <button className="vw-hub-opt" onClick={() => setView("call")}>
                  <span className="vw-hub-icon vw-hub-icon--call"><IconPhone /></span>
                  <span className="vw-hub-body">
                    <span className="vw-hub-title">{l("hub.callMe")}</span>
                    <span className="vw-hub-desc">{l("hub.callMeDesc")}</span>
                  </span>
                  <span className="vw-hub-arrow">→</span>
                </button>
              )}
            </div>
          </div>
        ) : view === "call" ? (
          <div className="vw-cm">
            <button className="vw-cm-back" onClick={() => setView("menu")}>← {l("callMe.back")}</button>
            <div className="vw-cm-phone-icon"><IconPhone size={24} /></div>
            <h3>{l("callMe.title")}</h3>

            <form className="vw-cm-form" onSubmit={handleStartCall}>
              <input
                type="tel"
                placeholder={l("callMe.placeholder")}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (status === "error") setStatus("idle"); }}
                autoFocus
              />
              <button type="submit" disabled={!phone.trim()}>
                <IconPhone size={16} />{l("callMe.submit")}
              </button>
              {status === "error" && <span className="vw-cm-error">{errorMsg}</span>}
              {l("callMe.formNote") && (
                <span className="vw-cm-note" dangerouslySetInnerHTML={{ __html: l("callMe.formNote") }} />
              )}
            </form>
          </div>
        ) : view === "chat" ? (
          <ChatView
            agent={agent}
            server={server}
            name={name}
            locale={locale}
            labels={labels}
            chat={chat!}
            tokenProvider={tokenProvider}
            onBack={() => setView("menu")}
            onVoiceCall={handleVoiceFromChat}
          />
        ) : (
          <CallMeTranscript
            phone={phone.trim()}
            endpoint={callMeEndpoint!}
            name={name}
            locale={locale}
            labels={labels}
            onClose={onClose}
            onError={handleTranscriptError}
          />
        )}
      </div>
    </div>
  );
}

// ── CallMeTranscript ──────────────────────────────────────────────

interface CallMeTranscriptProps {
  phone: string;
  endpoint: string;
  name: string;
  locale: string;
  labels?: Partial<LocaleStrings>;
  onClose: () => void;
  onError: (err: string) => void;
}

function CallMeTranscript({ phone, endpoint, name, locale, labels, onClose, onError }: CallMeTranscriptProps) {
  const [callStatus, setCallStatus] = useState<"dialing" | "connected" | "ended" | "error">("dialing");
  const [messages, setMessages] = useState<TranscriptMsg[]>([]);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const idCounter = useRef(0);

  const l = (key: keyof LocaleStrings) => t(locale, key, labels, { name });

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) {
      requestAnimationFrame(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages]);

  // Duration counter
  useEffect(() => {
    if (callStatus === "connected") {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  const handleSSE = useCallback((event: string, data: any) => {
    switch (event) {
      case "dialing":
        setCallStatus("dialing");
        break;
      case "call.started":
        setCallStatus("connected");
        break;
      case "bot.word":
        setMessages((prev) => {
          const mid = data.messageId;
          const idx = prev.findIndex((m) => m.role === "bot" && m.messageId === mid);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], text: data.text };
            return updated;
          }
          return [...prev, { id: ++idCounter.current, role: "bot", messageId: mid, text: data.text, streaming: true }];
        });
        break;
      case "bot.confirmed":
        setMessages((prev) => {
          const mid = data.messageId;
          const idx = prev.findIndex((m) => m.role === "bot" && m.messageId === mid);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], text: data.text, streaming: false };
            return updated;
          }
          return [...prev, { id: ++idCounter.current, role: "bot", messageId: mid, text: data.text, streaming: false }];
        });
        break;
      case "user.speaking":
        if (data.text) {
          setMessages((prev) => {
            const lastUserIdx = findLastIndex(prev, (m) => m.role === "user");
            const hasBotAfter = lastUserIdx >= 0 && prev.slice(lastUserIdx + 1).some((m) => m.role === "bot");
            if (lastUserIdx >= 0 && !hasBotAfter) {
              const updated = [...prev];
              updated[lastUserIdx] = { ...updated[lastUserIdx], text: data.text, streaming: true, finalized: false };
              return updated;
            }
            return [...prev, { id: ++idCounter.current, role: "user", text: data.text, streaming: true, finalized: false }];
          });
        }
        break;
      case "user.message":
        if (data.text) {
          setMessages((prev) => {
            const idx = findLastIndex(prev, (m) => m.role === "user" && !m.finalized);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], text: data.text, streaming: false, finalized: true };
              return updated;
            }
            return [...prev, { id: ++idCounter.current, role: "user", text: data.text, streaming: false, finalized: true }];
          });
        }
        break;
      case "tool.call": {
        let parsed = "";
        try {
          const obj = JSON.parse(data.args || "{}");
          parsed = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ");
        } catch { parsed = data.args || ""; }
        setMessages((prev) => [...prev, { id: ++idCounter.current, role: "tool", name: data.name, args: parsed }]);
        break;
      }
      case "call.ended":
        setDuration(data.duration || 0);
        setCallStatus("ended");
        if (timerRef.current) clearInterval(timerRef.current);
        break;
      case "error":
        setErrorMsg(data.message || l("callMe.error"));
        setCallStatus("error");
        break;
    }
  }, [locale, labels, name]);

  // SSE stream
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setErrorMsg(l("callMe.error"));
        setCallStatus("error");
        return;
      }

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || l("callMe.error"));
        setCallStatus("error");
        onError(data.error);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;
          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                handleSSE(currentEvent, data);
              } catch { /* skip malformed */ }
              currentEvent = "";
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[ContactHub] Stream error:", err);
        }
      }
    })();

    return () => {
      controller.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phone, endpoint]);

  const handleClose = () => {
    if (abortRef.current) abortRef.current.abort();
    onClose();
  };

  return (
    <div className="vw-cm-transcript">
      {/* Header */}
      <div className="vw-cm-head">
        <div className={`vw-cm-head-icon ${callStatus === "connected" ? "vw-cm-live" : ""}`}>
          <IconPhone size={14} />
        </div>
        <div className="vw-cm-meta">
          <div className="vw-cm-phone">{formatPhone(phone)}</div>
          <div className="vw-cm-status-line">
            <span className={`vw-cm-dot ${callStatus === "ended" ? "vw-cm-dot--ended" : ""}`} />
            {callStatus === "dialing" && l("callMe.calling")}
            {callStatus === "connected" && formatDuration(duration)}
            {callStatus === "ended" && `${l("callMe.ended")} · ${formatDuration(duration)}`}
            {callStatus === "error" && "Error"}
          </div>
        </div>
        {(callStatus === "ended" || callStatus === "error") && (
          <button className="vw-hub-close" onClick={handleClose}><IconX size={14} /></button>
        )}
      </div>

      {/* Dialing */}
      {callStatus === "dialing" && (
        <div className="vw-cm-dialing">
          <div className="vw-cm-dialing-ring"><IconPhone size={22} /></div>
          <div className="vw-cm-dialing-text">{l("callMe.calling")}</div>
          <div className="vw-cm-dialing-phone">{formatPhone(phone)}</div>
        </div>
      )}

      {/* Error */}
      {callStatus === "error" && (
        <div className="vw-cm-error-view">
          <div className="vw-cm-error-text">{errorMsg}</div>
          <button className="vw-hub-close" onClick={handleClose}>{l("callMe.back")}</button>
        </div>
      )}

      {/* Messages */}
      {(callStatus === "connected" || callStatus === "ended") && (
        <>
          <div className="vw-cm-body" ref={bodyRef}>
            {messages.map((msg) => {
              if (msg.role === "tool") {
                return (
                  <div key={msg.id} className="vw-cm-tool">
                    <span className="vw-cm-tool-icon">⚙️</span>
                    <span className="vw-cm-tool-name">{msg.name}</span>
                    {msg.args && <span className="vw-cm-tool-args">({msg.args})</span>}
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`vw-cm-msg vw-cm-msg--${msg.role}${msg.streaming ? " vw-cm-msg--streaming" : ""}`}>
                  <span className="vw-cm-sender">
                    {msg.role === "bot" ? name : "You"}
                  </span>
                  {msg.text}
                  {msg.streaming && <span className="vw-cm-cursor" />}
                </div>
              );
            })}
          </div>

          {callStatus === "ended" && (
            <div className="vw-cm-ended">
              <div className="vw-cm-ended-text">
                {l("callMe.ended")} · <strong>{formatDuration(duration)}</strong>
              </div>
              <button className="vw-hub-close" onClick={handleClose}><IconX size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
