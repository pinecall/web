export { VoiceWidget, useVoice } from "./widget/VoiceWidget";
export { useVoiceSession } from "./widget/useVoiceSession";
// Standalone — compose your own multi-channel UI
export { ContactHub } from "./widget/ContactHub";
export type { CallMeState } from "./widget/ContactHub";
export { ChatView } from "./widget/ChatView";
export { useAgentInfo } from "./widget/useAgentInfo";
export { t } from "./widget/locales";
export { PRESETS } from "./widget/presets";
export type {
  VoiceWidgetProps,
  VoiceWidgetTheme,
  VoiceWidgetPreset,
  LanguagePreset,
  ToolRenderer,
  ToolRenderContext,
  LocaleStrings,
  AgentChannel,
  AgentInfo,
  ChatConfig,
  ChatQuickOption,
} from "./widget/types";
// Re-export core types for convenience
export type {
  SessionStatus,
  CallPhase,
  TranscriptMessage,
  VoiceSessionState,
  VoiceSessionOptions,
  ToolCallEvent,
  ToolResultEvent,
  ToolUI,
} from "./core";
