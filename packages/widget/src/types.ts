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
  colorConnecting?: string;
  colorActive?: string;
  colorUserSpeaking?: string;
  colorSpeaking?: string;
  colorThinking?: string;
  colorAccent?: string;
  ringColor?: string;
  panelBg?: string;
  panelBorder?: string;
  bubbleBotBg?: string;
  bubbleBotColor?: string;
  labelBg?: string;
  labelColor?: string;
}

export interface VoiceWidgetProps {
  /** Agent ID to connect to */
  agent: string;
  /** EventServer URL (e.g. "https://florencia.app.pinecall.io") */
  server: string;
  /** Display name shown in status label. Default: "Agent" */
  name?: string;
  /** Idle label shown on hover. Default: "Talk to {name}" */
  label?: string;
  /** Extra class name on the root wrapper */
  className?: string;
  /** Custom theme overrides — all fields optional */
  theme?: Partial<VoiceWidgetTheme>;
  /** Called when session status changes */
  onStatusChange?: (status: SessionStatus) => void;
}
