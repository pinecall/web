import type { SessionStatus, ToolUI } from "../core";

/**
 * Theme overrides for the Voice Widget.
 *
 * Colors that need alpha variants (accent, ring, speaking, etc.)
 * should be passed as **RGB triplets** so the widget can combine
 * them with `rgba()`.  Example: `"124, 58, 237"`.
 *
 * Single-value colors (labelBg, panelBg, etc.) accept any valid
 * CSS color string.
 */
export interface VoiceWidgetTheme {
  /* ── Orb idle gradient (RGB triplets) ── */
  /** Gradient highlight (center). Default: `"255, 255, 255"` */
  orbFrom?: string;
  /** Gradient midtone (35%). Default: `"240, 238, 231"` */
  orbMid?: string;
  /** Gradient outer edge (70–100%). Default: `"184, 181, 168"` */
  orbTo?: string;

  /* ── Orb state colors (RGB triplets for alpha usage) ── */
  /** Connecting state — amber.  Default: `"245, 158, 11"` */
  colorConnecting?: string;
  /** Active/connected state — green.  Default: `"76, 175, 80"` */
  colorActive?: string;
  /** User speaking state — emerald.  Default: `"52, 211, 153"` */
  colorUserSpeaking?: string;
  /** Agent speaking state — rose.  Default: `"248, 113, 113"` */
  colorSpeaking?: string;
  /** Thinking/processing state — violet.  Default: `"139, 92, 246"` */
  colorThinking?: string;
  /** Idle warning state — amber/orange.  Default: `"255, 160, 0"` */
  colorWarning?: string;
  /** User bubble accent — violet.  Default: `"124, 58, 237"` */
  colorAccent?: string;
  /** Idle ring border — warm.  Default: `"216, 65, 44"` */
  ringColor?: string;

  /* ── Panel & bubble backgrounds (full CSS values) ── */
  /** Transcript panel background.  Default: `"rgba(16, 14, 20, .92)"` */
  panelBg?: string;
  /** Transcript panel border.  Default: `"rgba(255, 255, 255, .08)"` */
  panelBorder?: string;
  /** Bot bubble background.  Default: `"rgba(18, 16, 22, .9)"` */
  bubbleBotBg?: string;
  /** Bot bubble text color.  Default: `"#e8e4f0"` */
  bubbleBotColor?: string;
  /** User bubble text color. Default: `"#e0d4f7"` */
  bubbleUserColor?: string;

  /* ── Label ── */
  /** Label tooltip background.  Default: `"#181818"` */
  labelBg?: string;
  /** Label tooltip text color.  Default: `"#fff"` */
  labelColor?: string;
}

/**
 * Built-in theme presets.
 *
 * - `"dark"` — Pearl orb on dark bg (default, refined)
 * - `"midnight"` — Deep sapphire orb, ice-blue accents
 * - `"aurora"` — Emerald/teal orb, northern lights feel
 * - `"sunset"` — Warm coral/amber tones
 * - `"light"` — Clean light theme for light-bg sites
 */
export type VoiceWidgetPreset =
  | "dark"
  | "midnight"
  | "aurora"
  | "sunset"
  | "light";

/**
 * A language preset defining voice/STT/language config for a specific locale.
 *
 * @example
 * ```ts
 * const spanish: LanguagePreset = {
 *   label: "Español",
 *   flag: "🇪🇸",
 *   voice: "elevenlabs:abc",
 *   stt: { provider: "deepgram-flux" },
 *   language: "es",
 * };
 * ```
 */
export interface LanguagePreset {
  /** Display label (e.g. "Español", "English") */
  label?: string;
  /** Flag emoji (e.g. "🇪🇸", "🇺🇸") */
  flag?: string;
  /** Voice ID override (e.g. "elevenlabs:abc123") */
  voice?: string;
  /**
   * STT override — string shortcut or full config object.
   * @example "deepgram-flux"
   * @example { provider: "deepgram-flux" }
   */
  stt?: string | Record<string, unknown>;
  /** Language code for STT (e.g. "es", "en") */
  language?: string;
}

// ── Tool UI types ──────────────────────────────────────────────────

/**
 * Context passed to tool render functions.
 * Provides methods for interacting with the conversation from tool UI.
 */
export interface ToolRenderContext {
  /**
   * Inject text into the conversation as if the user spoke it.
   * Use this for click-based interactions (e.g., selecting a calendar slot).
   * The agent processes the text exactly as if the user said it out loud.
   */
  respond: (text: string) => void;
  /** Dismiss the tool UI from the transcript. */
  dismiss: () => void;
}

/**
 * Render function for a tool result.
 *
 * Called when a server-side tool with a matching name completes.
 * Return a React element to render inline in the transcript.
 *
 * @param result - The parsed tool result from the server (any JSON value).
 * @param context - Interaction helpers (`respond`, `dismiss`).
 * @param toolCall - The full ToolUI entry with name, arguments, and metadata.
 */
export type ToolRenderer = (
  result: any,
  context: ToolRenderContext,
  toolCall: ToolUI,
) => React.ReactNode;

// ── Widget props ───────────────────────────────────────────────────

export interface VoiceWidgetProps {
  /** Agent ID to connect to */
  agent: string;
  /**
   * Pinecall API base URL for token exchange.
   * Default: `"https://voice.pinecall.io"`.
   * Only override for self-hosted deployments.
   */
  server?: string;
  /** Display name shown in status label. Default: "Agent" */
  name?: string;
  /** Idle label shown on hover. Default: "Talk to {name}" */
  label?: string;
  /**
   * Initial session config overrides (language, voice, stt).
   * Merged with the selected language preset if `languages` is provided.
   */
  config?: Record<string, unknown>;
  /** Call metadata sent to the server. */
  metadata?: Record<string, unknown>;
  /**
   * Language presets for multi-language support.
   * Keys are language codes (e.g. "es", "en"), values are preset configs.
   * When provided with ≥2 entries, a language selector appears in the widget panel.
   *
   * @example
   * ```tsx
   * <VoiceWidget
   *   languages={{
   *     en: { label: "English", flag: "🇺🇸", voice: "alloy", language: "en" },
   *     es: { label: "Español", flag: "🇪🇸", voice: "coral", language: "es" },
   *   }}
   *   defaultLanguage="en"
   * />
   * ```
   */
  languages?: Record<string, LanguagePreset>;
  /** Default language key (must match a key in `languages`). Uses the first key if omitted. */
  defaultLanguage?: string;
  /** Called when the user selects a different language. */
  onLanguageChange?: (lang: string, preset: LanguagePreset) => void;
  /** Extra class name on the root wrapper */
  className?: string;
  /**
   * Theme preset name. Sets all colors at once.
   * Individual `theme` overrides take precedence over the preset.
   * Default: "dark"
   */
  preset?: VoiceWidgetPreset;
  /** Custom theme overrides — all fields optional, merged on top of preset */
  theme?: Partial<VoiceWidgetTheme>;
  /** Called when session status changes */
  onStatusChange?: (status: SessionStatus) => void;
  /**
   * Map of tool names → render functions for interactive tool UI.
   *
   * When a server-side tool with a matching name completes, the render
   * function is called and the result is shown inline in the transcript.
   * The user can interact via voice (normal speech) or via the rendered
   * UI (e.g., clicking a calendar slot calls `respond(text)`).
   *
   * @example
   * ```tsx
   * <VoiceWidget
   *   agent="mara"
   *   tools={{
   *     getAvailableSlots: (result, { respond }) => (
   *       <div>
   *         {result.slots.map((slot: string) => (
   *           <button key={slot} onClick={() => respond(`I'd like ${slot}`)}>
   *             {slot}
   *           </button>
   *         ))}
   *       </div>
   *     ),
   *   }}
   * />
   * ```
   */
  tools?: Record<string, ToolRenderer>;
  /**
   * Tool names to track (alternative to `tools` for external rendering via `useVoice()`).
   * When provided, these tools are tracked in session state but NOT rendered in the transcript.
   * Use `useVoice().toolCalls` to render them anywhere in your component tree.
   *
   * @example
   * ```tsx
   * <VoiceWidget agent="mara" trackedTools={["getSlots", "confirmBooking"]}>
   *   <MyCustomToolUI />
   * </VoiceWidget>
   * ```
   */
  trackedTools?: string[];
  /**
   * Custom token provider — call your backend to generate tokens instead
   * of hitting /webrtc/token directly. Keeps API keys server-side.
   *
   * @example
   * ```tsx
   * <VoiceWidget
   *   agent="mara"
   *   tokenProvider={async () => {
   *     const res = await fetch("/api/token?channel=webrtc");
   *     return res.json();
   *   }}
   * />
   * ```
   */
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
}

// ── Locale strings ────────────────────────────────────────────────

/**
 * All localizable strings used by the widget.
 * Keys use dot-notation namespacing.
 */
export interface LocaleStrings {
  "hub.title": string;
  "hub.subtitle": string;
  "hub.voice": string;
  "hub.voiceDesc": string;
  "hub.chat": string;
  "hub.chatDesc": string;
  "hub.whatsapp": string;
  "hub.whatsappDesc": string;
  "hub.callMe": string;
  "hub.callMeDesc": string;
  "callMe.title": string;
  "callMe.placeholder": string;
  "callMe.submit": string;
  "callMe.formNote": string;
  "callMe.calling": string;
  "callMe.ended": string;
  "callMe.error": string;
  "callMe.back": string;
}

// ── Agent info from auto-discovery ────────────────────────────────

export interface AgentChannel {
  type: "webrtc" | "phone" | "whatsapp" | "chat" | "mic";
  numbers?: string[];
  phone?: string;
}

export interface AgentInfo {
  agent: string;
  channels: AgentChannel[];
}

// ── Chat config ───────────────────────────────────────────────────

export interface ChatQuickOption {
  /** Button label displayed to the user. */
  label: string;
  /** Message text sent when clicked. */
  query: string;
}

export interface ChatConfig {
  /** Initial greeting shown when the chat opens. Supports markdown. */
  greeting?: string;
  /** Quick-reply buttons shown before the user sends a message. */
  quickOptions?: ChatQuickOption[];
  /**
   * Custom token provider for chat. If not set, falls back to the
   * widget-level tokenProvider (which should handle channel=chat).
   */
  tokenProvider?: () => Promise<{ token: string; server: string }>;
}
