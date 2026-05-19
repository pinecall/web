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
