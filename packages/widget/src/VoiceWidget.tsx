/**
 * VoiceWidget — Embeddable voice AI orb with real-time transcript.
 *
 * Features:
 * - Pearl-gradient orb with animated rings (click to start/stop)
 * - Live speech bubbles around the orb (current turn only)
 * - Expandable transcript panel with full conversation history
 * - Word-by-word bot response rendering
 * - React context for external tool UI rendering via useVoice() hook
 */
import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { TranscriptMessage, ToolUI, SessionStatus, VoiceSessionState } from "@pinecall/voice-core";
import type { VoiceWidgetProps, VoiceWidgetTheme } from "./types";
import { useVoiceSession } from "./useVoiceSession";
import { WIDGET_CSS } from "./styles";
import { PRESETS } from "./presets";

// ── Voice Context — lets consumers render tool UI anywhere ──────────

type VoiceContextValue = ReturnType<typeof useVoiceSession> | null;
const VoiceContext = createContext<VoiceContextValue>(null);

/**
 * Hook to access the VoiceWidget session from any child component.
 *
 * Must be used inside a `<VoiceWidget>` tree. Returns the full session
 * state (toolCalls, messages, status, etc.) plus action methods
 * (sendText, dismissTool, connect, disconnect, etc.).
 *
 * @example
 * ```tsx
 * function SlotPicker() {
 *   const { toolCalls, sendText, dismissTool } = useVoice();
 *   const slots = toolCalls.find(tc => tc.name === "getSlots" && tc.result);
 *   if (!slots) return null;
 *   return slots.result.map(s => (
 *     <button onClick={() => { sendText(`Book ${s}`); dismissTool(slots.toolCallId); }}>{s}</button>
 *   ));
 * }
 * ```
 */
export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice() must be used inside <VoiceWidget>");
  return ctx;
}

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
  colorWarning: "--vw-color-warning",
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
  className,
  preset = "dark",
  theme,
  onStatusChange,
  tools,
  trackedTools: trackedToolsProp,
  languages,
  defaultLanguage,
  onLanguageChange,
  tokenProvider,
  children,
}: VoiceWidgetProps & { children?: ReactNode }) {
  const hasLanguages = languages && Object.keys(languages).length >= 2;
  const langKeys = hasLanguages ? Object.keys(languages!) : [];
  const initialLang = defaultLanguage || (langKeys[0] ?? "");
  const [selectedLang, setSelectedLang] = useState(initialLang);

  // Merge language preset config with user config
  const mergedConfig = useMemo(() => {
    const langPreset = languages?.[selectedLang];
    const langConfig: Record<string, unknown> = {};
    if (langPreset?.voice) langConfig.voice = langPreset.voice;
    if (langPreset?.stt) langConfig.stt = langPreset.stt;
    if (langPreset?.language) langConfig.language = langPreset.language;
    return { ...langConfig, ...userConfig };
  }, [selectedLang, languages, userConfig]);

  // Derive tracked tool names from both sources
  const trackedTools = useMemo(
    () => trackedToolsProp ?? (tools ? Object.keys(tools) : undefined),
    [tools, trackedToolsProp],
  );

  const session = useVoiceSession({
    server,
    agent,
    config: Object.keys(mergedConfig).length > 0 ? mergedConfig : undefined,
    metadata,
    trackedTools,
    tokenProvider,
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
  }, [session.messages, session.toolCalls]);

  /* Auto-open panel when a tool result arrives with a matching renderer */
  useEffect(() => {
    if (!tools) return;
    const hasRenderable = session.toolCalls.some(
      (tc) => tc.result !== undefined && tools[tc.name],
    );
    if (hasRenderable && !panelOpen) {
      setPanelOpen(true);
    }
  }, [session.toolCalls, tools]);

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

  // ── Orb click — always connect/disconnect ──
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
        : session.idleWarning != null
          ? "idle-warning"
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

  /* Active bubble — most recent message */
  const activeBubble = [...session.messages].reverse().find(
    (m) => m.role === "user" || (m.role === "bot" && m.text),
  );

  const showBubble = isActive && activeBubble && !panelOpen;
  const showTranscriptBtn = isActive && session.messages.length > 0;

  const widget = (
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
      {showBubble && (
        <div
          className={`vw-bubble ${activeBubble!.role === "user" ? "vw-bubble--user" : "vw-bubble--bot"} ${activeBubble!.isInterim ? "vw-interim" : ""} ${activeBubble!.speaking ? "vw-speaking" : ""} ${activeBubble!.interrupted ? "vw-interrupted" : ""}`}
          key={activeBubble!.id}
        >
          {activeBubble!.text || <Dots />}
        </div>
      )}

      {/* Transcript toggle button */}
      {showTranscriptBtn && (
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
            {/* Tool UI components — rendered inline after messages */}
            {tools &&
              session.toolCalls
                .filter((tc) => tc.result !== undefined && tools[tc.name])
                .map((tc) => (
                  <div key={tc.toolCallId} className="vw-tp-tool">
                    {tools[tc.name](
                      tc.result,
                      {
                        respond: (text: string) => {
                          session.sendText(text);
                          session.dismissTool(tc.toolCallId);
                        },
                        dismiss: () => session.dismissTool(tc.toolCallId),
                      },
                      tc,
                    )}
                  </div>
                ))}
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

  // Always wrap in context provider
  return (
    <VoiceContext.Provider value={session}>
      {widget}
      {children}
    </VoiceContext.Provider>
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
