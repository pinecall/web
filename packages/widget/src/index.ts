export { VoiceWidget, useVoice } from "./VoiceWidget";
export { useVoiceSession } from "./useVoiceSession";
export { ContactHub } from "./ContactHub";
export type { CallMeState } from "./ContactHub";
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

