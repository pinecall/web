import type { SessionStatus } from "@pinecall/voice-core";

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
 *   voice: "coral",
 *   stt: "deepgram",
 *   language: "es",
 *   greeting: "¡Hola! ¿En qué puedo ayudarte?",
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
   * @example "deepgram"
   * @example { provider: "deepgram", model: "nova-3", language: "es" }
   */
  stt?: string | Record<string, unknown>;
  /** Language code for STT (e.g. "es", "en") */
  language?: string;
  /**
   * Turn detection override — string shortcut or config object.
   * @example "smart_turn"
   * @example { mode: "smart_turn", threshold: 0.7 }
   */
  turnDetection?: string | Record<string, unknown>;
  /** Custom greeting in this language */
  greeting?: string;
}

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
   * Initial session config overrides (language, voice, stt, turnDetection, greeting).
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
}
