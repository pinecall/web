import type { VoiceWidgetTheme, VoiceWidgetPreset } from "./types";

/**
 * Built-in theme presets. Each is a complete VoiceWidgetTheme with all fields set.
 * Users can override individual fields via the `theme` prop.
 */

/** "dark" — Refined pearl orb on dark bg. Warm ring glow, violet accent. */
const dark: Required<VoiceWidgetTheme> = {
  orbFrom: "255, 255, 255",
  orbMid: "240, 238, 231",
  orbTo: "184, 181, 168",
  colorConnecting: "245, 158, 11",
  colorActive: "76, 175, 80",
  colorUserSpeaking: "52, 211, 153",
  colorSpeaking: "248, 113, 113",
  colorThinking: "139, 92, 246",
  colorWarning: "255, 160, 0",
  colorAccent: "124, 58, 237",
  ringColor: "216, 65, 44",
  panelBg: "rgba(16, 14, 20, .92)",
  panelBorder: "rgba(255, 255, 255, .08)",
  bubbleBotBg: "rgba(18, 16, 22, .9)",
  bubbleBotColor: "#e8e4f0",
  bubbleUserColor: "#e0d4f7",
  labelBg: "#181818",
  labelColor: "#fff",
};

/** "midnight" — Deep sapphire orb, ice-blue rings, navy panels. */
const midnight: Required<VoiceWidgetTheme> = {
  orbFrom: "190, 210, 255",
  orbMid: "90, 120, 200",
  orbTo: "40, 55, 130",
  colorConnecting: "100, 180, 255",
  colorActive: "60, 200, 180",
  colorUserSpeaking: "80, 220, 200",
  colorSpeaking: "140, 160, 255",
  colorThinking: "100, 120, 240",
  colorWarning: "255, 180, 60",
  colorAccent: "100, 140, 255",
  ringColor: "70, 110, 210",
  panelBg: "rgba(10, 15, 35, .94)",
  panelBorder: "rgba(100, 140, 255, .12)",
  bubbleBotBg: "rgba(15, 20, 45, .92)",
  bubbleBotColor: "#c8d0f0",
  bubbleUserColor: "#b8c8ff",
  labelBg: "rgba(15, 20, 40, .92)",
  labelColor: "#c8d4ff",
};

/** "aurora" — Emerald/teal orb, green rings, northern lights feel. */
const aurora: Required<VoiceWidgetTheme> = {
  orbFrom: "170, 255, 215",
  orbMid: "60, 190, 150",
  orbTo: "20, 130, 90",
  colorConnecting: "255, 200, 60",
  colorActive: "50, 220, 140",
  colorUserSpeaking: "100, 240, 180",
  colorSpeaking: "180, 100, 255",
  colorThinking: "140, 80, 220",
  colorWarning: "255, 200, 60",
  colorAccent: "50, 200, 140",
  ringColor: "40, 170, 110",
  panelBg: "rgba(8, 20, 14, .94)",
  panelBorder: "rgba(50, 200, 140, .1)",
  bubbleBotBg: "rgba(10, 25, 18, .92)",
  bubbleBotColor: "#c0ecd4",
  bubbleUserColor: "#a8e8c4",
  labelBg: "rgba(10, 24, 16, .92)",
  labelColor: "#a8e8c4",
};

/** "sunset" — Warm coral/amber orb, golden rings, warm dark panels. */
const sunset: Required<VoiceWidgetTheme> = {
  orbFrom: "255, 215, 190",
  orbMid: "235, 140, 90",
  orbTo: "195, 70, 50",
  colorConnecting: "255, 180, 60",
  colorActive: "240, 160, 80",
  colorUserSpeaking: "255, 200, 100",
  colorSpeaking: "255, 100, 80",
  colorThinking: "240, 140, 100",
  colorWarning: "255, 180, 40",
  colorAccent: "240, 120, 60",
  ringColor: "215, 95, 45",
  panelBg: "rgba(25, 12, 8, .94)",
  panelBorder: "rgba(240, 120, 60, .1)",
  bubbleBotBg: "rgba(30, 16, 10, .92)",
  bubbleBotColor: "#f0d4c0",
  bubbleUserColor: "#ffd8b4",
  labelBg: "rgba(28, 14, 10, .92)",
  labelColor: "#f0d0b0",
};

/** "light" — Clean white orb, soft blue rings, light panels. For light-bg sites. */
const light: Required<VoiceWidgetTheme> = {
  orbFrom: "255, 255, 255",
  orbMid: "225, 230, 245",
  orbTo: "190, 200, 225",
  colorConnecting: "230, 140, 10",
  colorActive: "34, 150, 60",
  colorUserSpeaking: "20, 170, 110",
  colorSpeaking: "210, 50, 50",
  colorThinking: "100, 60, 200",
  colorWarning: "230, 140, 10",
  colorAccent: "80, 40, 200",
  ringColor: "100, 120, 200",
  panelBg: "rgba(255, 255, 255, .95)",
  panelBorder: "rgba(0, 0, 0, .08)",
  bubbleBotBg: "rgba(245, 245, 250, .95)",
  bubbleBotColor: "#2a2a3a",
  bubbleUserColor: "#3a2a5a",
  labelBg: "rgba(255, 255, 255, .92)",
  labelColor: "#333",
};

export const PRESETS: Record<VoiceWidgetPreset, Required<VoiceWidgetTheme>> = {
  dark,
  midnight,
  aurora,
  sunset,
  light,
};
