export { VoiceWidget, useVoice } from "./VoiceWidget";
export { useVoiceSession } from "./useVoiceSession";
// Standalone — compose your own multi-channel UI
export { ContactHub } from "./ContactHub";
export type { CallMeState } from "./ContactHub";
export { ChatView } from "./ChatView";
export { useAgentInfo } from "./useAgentInfo";
export { t } from "./locales";
export { PRESETS } from "./presets";
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
} from "./types";
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
} from "@pinecall/voice-core";
