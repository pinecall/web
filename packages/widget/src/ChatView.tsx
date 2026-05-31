/**
 * ChatView — LLM text chat inside the ContactHub popover.
 *
 * Uses @pinecall/chat-core for WebSocket chat + marked for markdown.
 * StreamingText uses rAF-based character reveal (ported from blossom Chat.jsx).
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { usePinecallChat } from "@pinecall/chat-core/react";
import { marked } from "marked";
import type { ChatConfig, LocaleStrings } from "./types.js";
import { t } from "./locales.js";

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

function sanitize(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function renderMarkdown(text: string): string {
  if (!text) return "";
  return sanitize(marked.parse(text) as string);
}

// ── Icons ─────────────────────────────────────────────────────────

const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="11" rx="3" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8l12-6-4 14-3-6-5-2z" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a2 2 0 002 2h4a2 2 0 002-2l1-9" />
  </svg>
);

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ── StreamingText — rAF character reveal + marked ─────────────────

function StreamingText({ targetText, streaming }: { targetText: string; streaming: boolean }) {
  const CHARS_PER_FRAME = 2;
  const displayedRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevTargetRef = useRef("");

  if (targetText.length < prevTargetRef.current.length) {
    displayedRef.current = 0;
  }
  prevTargetRef.current = targetText;

  useEffect(() => {
    if (!streaming) {
      displayedRef.current = targetText.length;
      if (nodeRef.current) {
        nodeRef.current.innerHTML = renderMarkdown(targetText);
      }
      return;
    }

    function tick() {
      const target = targetText.length;
      const current = displayedRef.current;
      if (current < target) {
        displayedRef.current = Math.min(current + CHARS_PER_FRAME, target);
        const visible = targetText.slice(0, displayedRef.current);
        if (nodeRef.current) {
          nodeRef.current.innerHTML = renderMarkdown(visible);
        }
        // Keep animating only while there's more text to reveal
        rafRef.current = requestAnimationFrame(tick);
      }
      // Stop when caught up — no more rAF calls
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetText, streaming]);

  const initialHtml = useMemo(() => {
    if (!streaming) return renderMarkdown(targetText);
    const visible = targetText.slice(0, displayedRef.current);
    return renderMarkdown(visible);
  }, [targetText, streaming]);

  return <div className="vw-cv-md" ref={nodeRef} dangerouslySetInnerHTML={{ __html: initialHtml }} />;
}

// ── ToolCallBubble ────────────────────────────────────────────────

function ToolCallBubble({ name, args }: { name: string; args?: string }) {
  let parsed = "";
  try {
    if (args) {
      const obj = JSON.parse(args);
      parsed = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ");
    }
  } catch { parsed = args || ""; }

  return (
    <div className="vw-cv-tool">
      <span className="vw-cv-tool-icon">⚙️</span>
      <span className="vw-cv-tool-name">{name}</span>
      {parsed && <span className="vw-cv-tool-args">({parsed})</span>}
    </div>
  );
}

// ── ChatView Component ────────────────────────────────────────────

interface ChatViewProps {
  agent: string;
  server?: string;
  name: string;
  locale: string;
  labels?: Partial<LocaleStrings>;
  chat: ChatConfig;
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
  onBack: () => void;
  onVoiceCall: () => void;
}

export function ChatView({
  agent, server, name, locale, labels, chat, tokenProvider, onBack, onVoiceCall,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve token provider: chat-specific > widget-level
  const chatTokenProvider = chat.tokenProvider || tokenProvider;

  const { messages, send, connected, typing, error } = usePinecallChat({
    agent,
    server,
    tokenProvider: chatTokenProvider as any,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      }
    });
  }, [messages, typing]);

  // Show greeting as first message if configured
  const allMessages = useMemo(() => {
    if (!chat.greeting) return messages;
    const greetingMsg = {
      id: 0,
      role: "bot" as const,
      text: chat.greeting,
      isStreaming: false,
    };
    return [greetingMsg, ...messages];
  }, [messages, chat.greeting]);

  const hasUserMessages = messages.some((m) => m.role === "user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    send(input.trim());
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };

  const handleQuick = useCallback((query: string) => {
    send(query);
  }, [send]);

  const handleClear = useCallback(() => {
    // Disconnect + reconnect to start fresh session
    // For now, just reload — ChatSession doesn't expose clearChat
    window.location.reload();
  }, []);

  return (
    <div className="vw-cv">
      {/* Header */}
      <div className="vw-cv-head">
        <button className="vw-cv-back" onClick={onBack}><IconBack /></button>
        <div className="vw-cv-avatar">
          {name.charAt(0)}
        </div>
        <div className="vw-cv-who">
          <span className="vw-cv-name">{name}</span>
          <span className="vw-cv-status">
            <span className={`vw-cv-dot ${connected ? "" : "vw-cv-dot--off"}`} />
            {connected ? "en línea" : "conectando…"}
          </span>
        </div>
        <div className="vw-cv-actions">
          {hasUserMessages && (
            <button className="vw-cv-action" onClick={handleClear} title="Nueva conversación">
              <IconTrash />
            </button>
          )}
          <button className="vw-cv-action vw-cv-action--voice" onClick={onVoiceCall} title="Llamada de voz">
            <IconMic />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="vw-cv-body" ref={bodyRef}>
        {allMessages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="vw-cv-msg vw-cv-msg--user">
                {msg.text}
              </div>
            );
          }
          return (
            <div key={msg.id} className={`vw-cv-msg vw-cv-msg--bot ${msg.isStreaming ? "vw-cv-streaming" : ""}`}>
              <StreamingText targetText={msg.text || ""} streaming={!!msg.isStreaming} />
              {msg.isStreaming && <span className="vw-cv-cursor" />}
            </div>
          );
        })}

        {/* Typing skeleton */}
        {typing && !messages.some((m) => m.isStreaming) && (
          <div className="vw-cv-msg vw-cv-msg--bot vw-cv-skeleton">
            <span className="vw-cv-sk-dot" />
            <span className="vw-cv-sk-dot" />
            <span className="vw-cv-sk-dot" />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="vw-cv-msg vw-cv-msg--bot" style={{ color: "rgba(248,113,113,.9)", borderColor: "rgba(248,113,113,.2)" }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Quick options — show before first user message */}
      {!hasUserMessages && chat.quickOptions && chat.quickOptions.length > 0 && (
        <div className="vw-cv-quick">
          {chat.quickOptions.map((opt, i) => (
            <button key={i} onClick={() => handleQuick(opt.query)} disabled={typing}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className="vw-cv-input" onSubmit={handleSubmit} autoComplete="off">
        <input
          ref={inputRef}
          type="text"
          placeholder="Escribí tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={typing}
        />
        <button type="submit" className="vw-cv-send" disabled={typing || !input.trim()}>
          <IconSend />
        </button>
      </form>
    </div>
  );
}
