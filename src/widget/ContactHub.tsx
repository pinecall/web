import React, { useState, useEffect, useCallback, useRef } from "react";
import { t } from "./locales.js";
import { HUB_CSS } from "./hub-styles.js";
import { CHAT_VIEW_CSS } from "./hub-chat-styles.js";
import { ChatView } from "./ChatView.js";
import type { TranscriptMessage } from "../core";
import type { AgentChannel, LocaleStrings, ChatConfig } from "./types.js";

// ── Call Me state (lifted to VoiceWidget) ─────────────────────────

export interface CallMeState {
  status: "dialing" | "connected" | "ended" | "error";
  messages: TranscriptMessage[];
  duration: number;
  phone: string;
  error?: string;
}

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
  /** Called when Call Me state changes */
  onCallMeState?: (state: CallMeState | null) => void;
  /** Connect to WebRTC voice session. Passed explicitly instead of using useVoice(). */
  connect: () => Promise<void>;
}

// ── ContactHub Component ──────────────────────────────────────────

export function ContactHub({
  open, onClose, channels, name, locale, labels, avatar, callMeEndpoint,
  agent, server, chat, tokenProvider, onCallMeState, connect,
}: ContactHubProps) {
  const [view, setView] = useState<"menu" | "call" | "chat">("menu");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* Inject hub + chat CSS once */
  useEffect(() => {
    if (document.getElementById("vw-hub-styles")) return;
    const el = document.createElement("style");
    el.id = "vw-hub-styles";
    el.textContent = HUB_CSS + CHAT_VIEW_CSS;
    document.head.appendChild(el);
  }, []);

  // ── SSE refs — persist across hub open/close ──
  const sseAbortRef = useRef<AbortController | null>(null);
  const sseMessagesRef = useRef<TranscriptMessage[]>([]);
  const sseIdCounter = useRef(0);
  const sseDurationRef = useRef(0);
  const sseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseStartTimeRef = useRef<number | null>(null);
  const ssePhoneRef = useRef("");

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

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      sseAbortRef.current?.abort();
      if (sseTimerRef.current) clearInterval(sseTimerRef.current);
    };
  }, []);

  const hasWebrtc = channels.some((c) => c.type === "webrtc");
  const hasChat = channels.some((c) => c.type === "chat") && !!chat;
  const waChannel = channels.find((c) => c.type === "whatsapp" && c.phone);
  const phoneChannel = channels.find((c) => c.type === "phone");
  const showCallMe = !!callMeEndpoint && !!phoneChannel;

  const handleVoice = async () => {
    onClose();
    await connect();
  };

  const l = (key: keyof LocaleStrings) => t(locale, key, labels, { name });

  const handleVoiceFromChat = async () => {
    onClose();
    await connect();
  };

  // ── SSE emit helper ──
  const emitSSEState = (status: CallMeState["status"]) => {
    onCallMeState?.({
      status,
      messages: [...sseMessagesRef.current],
      duration: sseDurationRef.current,
      phone: ssePhoneRef.current,
    });
  };

  // ── SSE event handler ──
  const handleSSEEvent = (event: string, data: any) => {
    switch (event) {
      case "call.started": {
        sseStartTimeRef.current = Date.now();
        sseTimerRef.current = setInterval(() => {
          sseDurationRef.current = Math.floor((Date.now() - sseStartTimeRef.current!) / 1000);
          emitSSEState("connected");
        }, 1000);
        emitSSEState("connected");
        break;
      }
      case "bot.word": {
        const mid = data.messageId;
        const msgs = sseMessagesRef.current;
        const idx = msgs.findIndex((m) => m.role === "bot" && m.messageId === mid);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], text: data.text, speaking: true };
        } else {
          msgs.push({ id: ++sseIdCounter.current, role: "bot", messageId: mid, text: data.text, speaking: true });
        }
        sseMessagesRef.current = [...msgs];
        emitSSEState("connected");
        break;
      }
      case "bot.confirmed": {
        const mid = data.messageId;
        const msgs = sseMessagesRef.current;
        const idx = msgs.findIndex((m) => m.role === "bot" && m.messageId === mid);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], text: data.text, speaking: false };
        } else {
          msgs.push({ id: ++sseIdCounter.current, role: "bot", messageId: mid, text: data.text, speaking: false });
        }
        sseMessagesRef.current = [...msgs];
        emitSSEState("connected");
        break;
      }
      case "user.speaking": {
        if (!data.text) break;
        const msgs = sseMessagesRef.current;
        const lastUserIdx = findLastIndex(msgs, (m) => m.role === "user");
        const hasBotAfter = lastUserIdx >= 0 && msgs.slice(lastUserIdx + 1).some((m) => m.role === "bot");
        if (lastUserIdx >= 0 && !hasBotAfter) {
          msgs[lastUserIdx] = { ...msgs[lastUserIdx], text: data.text, isInterim: true };
        } else {
          msgs.push({ id: ++sseIdCounter.current, role: "user", text: data.text, isInterim: true });
        }
        sseMessagesRef.current = [...msgs];
        emitSSEState("connected");
        break;
      }
      case "user.message": {
        if (!data.text) break;
        const msgs = sseMessagesRef.current;
        const idx = findLastIndex(msgs, (m) => m.role === "user" && !!m.isInterim);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], text: data.text, isInterim: false };
        } else {
          msgs.push({ id: ++sseIdCounter.current, role: "user", text: data.text, isInterim: false });
        }
        sseMessagesRef.current = [...msgs];
        emitSSEState("connected");
        break;
      }
      case "call.ended": {
        sseDurationRef.current = data.duration || sseDurationRef.current;
        if (sseTimerRef.current) clearInterval(sseTimerRef.current);
        onCallMeState?.({
          status: "ended",
          messages: [...sseMessagesRef.current],
          duration: sseDurationRef.current,
          phone: ssePhoneRef.current,
        });
        break;
      }
      case "error": {
        if (sseTimerRef.current) clearInterval(sseTimerRef.current);
        onCallMeState?.({
          status: "error",
          messages: [],
          duration: 0,
          phone: ssePhoneRef.current,
          error: data.message,
        });
        break;
      }
    }
  };

  // ── Start Call Me — triggered by FORM SUBMIT, not useEffect ──
  const startCallMe = async (phoneNum: string) => {
    // Reset SSE state
    sseMessagesRef.current = [];
    sseIdCounter.current = 0;
    sseDurationRef.current = 0;
    sseStartTimeRef.current = null;
    ssePhoneRef.current = phoneNum;

    const controller = new AbortController();
    sseAbortRef.current = controller;

    // Emit dialing state immediately
    onCallMeState?.({ status: "dialing", messages: [], duration: 0, phone: phoneNum });

    let res: Response;
    try {
      res = await fetch(callMeEndpoint!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNum }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      onCallMeState?.({ status: "error", messages: [], duration: 0, phone: phoneNum, error: l("callMe.error") });
      return;
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      onCallMeState?.({ status: "error", messages: [], duration: 0, phone: phoneNum, error: data.error || l("callMe.error") });
      return;
    }

    // Parse SSE stream
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
              handleSSEEvent(currentEvent, data);
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
  };

  const handleStartCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    // Close hub, start SSE — triggered by click, NOT useEffect
    onClose();
    startCallMe(phone.trim());
  };

  if (!open) return null;

  return (
    <div className="vw-hub-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`vw-hub-panel${view === "chat" ? " vw-hub-panel--chat" : ""}`}>
        {view !== "chat" && (
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
        ) : null}
      </div>
    </div>
  );
}
