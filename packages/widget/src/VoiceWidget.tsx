/**
 * VoiceWidget — Embeddable voice AI orb with real-time transcript.
 *
 * Features:
 * - Pearl-gradient orb with animated rings (click to start/stop)
 * - Live speech bubbles around the orb (current turn only)
 * - Expandable transcript panel with full conversation history
 * - Word-by-word bot response rendering
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { TranscriptMessage } from "@pinecall/voice-core";
import type { VoiceWidgetProps, VoiceWidgetTheme } from "./types";
import { useVoiceSession } from "./useVoiceSession";
import { WIDGET_CSS } from "./styles";
import { PRESETS } from "./presets";

/** Map theme keys → CSS custom property names */
const THEME_VAR_MAP: Record<keyof VoiceWidgetTheme, string> = {
  orbFrom: "--vw-orb-from",
  orbMid: "--vw-orb-mid",
  orbTo: "--vw-orb-to",
  colorConnecting: "--vw-color-connecting",
  colorActive: "--vw-color-active",
  colorUserSpeaking: "--vw-color-user-speaking",
  colorSpeaking: "--vw-color-speaking",
  colorThinking: "--vw-color-thinking",
  colorAccent: "--vw-color-accent",
  ringColor: "--vw-ring-color",
  panelBg: "--vw-panel-bg",
  panelBorder: "--vw-panel-border",
  bubbleBotBg: "--vw-bubble-bot-bg",
  bubbleBotColor: "--vw-bubble-bot-color",
  bubbleUserColor: "--vw-bubble-user-color",
  labelBg: "--vw-label-bg",
  labelColor: "--vw-label-color",
};

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Typing dots indicator */
function Dots() {
  return (
    <span className="vw-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

export function VoiceWidget({
  agent,
  server,
  name = "Agent",
  label,
  config: userConfig,
  metadata,
  languages,
  defaultLanguage,
  onLanguageChange,
  className,
  preset = "dark",
  theme,
  onStatusChange,
}: VoiceWidgetProps) {
  // ── Language state ──
  const langKeys = useMemo(
    () => (languages ? Object.keys(languages) : []),
    [languages],
  );
  const hasLanguages = langKeys.length >= 2;
  const [selectedLang, setSelectedLang] = useState(
    () => defaultLanguage || langKeys[0] || "",
  );

  // Build merged config: language preset + user overrides
  const mergedConfig = useMemo(() => {
    const base: Record<string, unknown> = {};
    if (languages && selectedLang && languages[selectedLang]) {
      const p = languages[selectedLang];
      if (p.voice) base.voice = p.voice;
      if (p.stt) base.stt = p.stt;
      if (p.language) base.language = p.language;
    }
    return { ...base, ...userConfig };
  }, [languages, selectedLang, userConfig]);

  const session = useVoiceSession({
    server,
    agent,
    config: Object.keys(mergedConfig).length > 0 ? mergedConfig : undefined,
    metadata,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  /** Merge preset + custom theme overrides → CSS custom properties */
  const themeStyle = useMemo(() => {
    const base = PRESETS[preset] ?? PRESETS.dark;
    const merged = { ...base, ...theme };
    const vars: Record<string, string> = {};
    for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
      const val = merged[key as keyof VoiceWidgetTheme];
      if (val !== undefined) vars[cssVar] = val;
    }
    return Object.keys(vars).length > 0 ? vars : undefined;
  }, [preset, theme]);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* Inject CSS once */
  useEffect(() => {
    if (document.getElementById("vw-styles")) return;
    const el = document.createElement("style");
    el.id = "vw-styles";
    el.textContent = WIDGET_CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    onStatusChange?.(session.status);
  }, [session.status, onStatusChange]);

  /* Auto-scroll transcript panel */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session.messages]);

  // ── Language change handler ──
  const handleLanguageChange = useCallback(
    (lang: string) => {
      if (lang === selectedLang) return;
      setSelectedLang(lang);
      const preset = languages?.[lang];
      if (!preset) return;

      // Build config from preset
      const cfg: Record<string, unknown> = {};
      if (preset.voice) cfg.voice = preset.voice;
      if (preset.stt) cfg.stt = preset.stt;
      if (preset.language) cfg.language = preset.language;

      // Mid-call → send via DataChannel
      if (session.status === "connected" && Object.keys(cfg).length > 0) {
        session.configure(cfg);
      } else {
        // Pre-call → update options for next connect()
        session.updateOptions({ config: { ...cfg, ...userConfig } });
      }

      onLanguageChange?.(lang, preset);
    },
    [selectedLang, languages, session, userConfig, onLanguageChange],
  );

  const handleClick = useCallback(async () => {
    if (session.status === "connected") {
      session.disconnect();
      setPanelOpen(false);
    } else if (session.status === "idle" || session.status === "error") {
      await session.connect();
    }
  }, [session]);

  const isActive = session.status === "connected";
  const idleLabel = label || `Talk to ${name}`;

  const orbState = session.agentSpeaking
    ? "speaking"
    : session.userSpeaking
      ? "user-speaking"
      : session.phase === "thinking"
        ? "thinking"
        : isActive
          ? "active"
          : session.status === "connecting"
            ? "connecting"
            : "";

  const statusLabel = (() => {
    if (session.status === "connecting") return "Connecting";
    if (session.status === "error") return session.error || "Connection failed";
    if (!isActive) return idleLabel;
    return `${name} · ${fmt(session.duration)}`;
  })();

  /* Active bubble — show the most recent message that has text.
     Bot messages start empty (bot.speaking) — user bubble stays until first bot.word. */
  const activeBubble = [...session.messages]
    .reverse()
    .find((m) => m.role === "user" || (m.role === "bot" && m.text));

  return (
    <div
      className={`vw-wrap ${isActive ? "is-live" : ""} ${className || ""}`}
      style={themeStyle as React.CSSProperties}
    >
      {/* Language selector pills */}
      {hasLanguages && (
        <div className="vw-lang-bar">
          {langKeys.map((key) => {
            const lp = languages![key];
            const isSelected = key === selectedLang;
            return (
              <button
                key={key}
                className={`vw-lang-pill ${isSelected ? "vw-lang-pill--active" : ""}`}
                onClick={() => handleLanguageChange(key)}
                aria-label={lp.label || key}
                aria-pressed={isSelected}
              >
                {lp.flag && <span className="vw-lang-flag">{lp.flag}</span>}
                <span className="vw-lang-code">
                  {lp.label || key.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Idle label */}
      <div className="vw-label">{statusLabel}</div>

      {/* Single active bubble */}
      {isActive && activeBubble && !panelOpen && (
        <div
          className={`vw-bubble ${activeBubble.role === "user" ? "vw-bubble--user" : "vw-bubble--bot"} ${activeBubble.isInterim ? "vw-interim" : ""} ${activeBubble.speaking ? "vw-speaking" : ""} ${activeBubble.interrupted ? "vw-interrupted" : ""}`}
          key={activeBubble.id}
        >
          {activeBubble.text || <Dots />}
        </div>
      )}

      {/* Transcript toggle button */}
      {isActive && session.messages.length > 0 && (
        <button
          className="vw-tp-btn"
          onClick={() => setPanelOpen((p) => !p)}
          aria-label={panelOpen ? "Close transcript" : "Open transcript"}
        >
          {panelOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Transcript panel */}
      {panelOpen && (
        <div className="vw-tp">
          <div className="vw-tp-head">
            <div className="vw-tp-title">
              Transcript · {fmt(session.duration)}
            </div>
            <button
              className="vw-tp-close"
              onClick={() => setPanelOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="vw-tp-body" ref={scrollRef}>
            {session.messages.length === 0 ? (
              <div className="vw-tp-empty">Waiting for conversation…</div>
            ) : (
              session.messages.map((msg) => (
                <TranscriptMsg key={msg.id} msg={msg} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Orb */}
      <div
        className={`vw-orb ${orbState}`}
        role="button"
        tabIndex={0}
        aria-label={isActive ? "End call" : idleLabel}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      />
    </div>
  );
}

/** Single message in the transcript panel */
function TranscriptMsg({ msg }: { msg: TranscriptMessage }) {
  const isUser = msg.role === "user";
  const cls = [
    "vw-tp-msg",
    isUser ? "vw-tp-msg--user" : "vw-tp-msg--bot",
    msg.isInterim ? "vw-interim" : "",
    msg.speaking ? "vw-speaking" : "",
    msg.interrupted ? "vw-interrupted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={cls}>{msg.text || <Dots />}</div>;
}
