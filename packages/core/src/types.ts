export type SessionStatus = "idle" | "connecting" | "connected" | "error";

export type CallPhase = "idle" | "listening" | "speaking" | "pause" | "thinking";

export interface TranscriptMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  /** User: STT partial (still typing) */
  isInterim?: boolean;
  /** Bot: TTS currently playing */
  speaking?: boolean;
  /** Bot: user interrupted the agent */
  interrupted?: boolean;
  /** Bot: server-assigned message ID for word-by-word tracking */
  messageId?: string;
}

export interface VoiceSessionState {
  status: SessionStatus;
  error: string | null;
  isMuted: boolean;
  phase: CallPhase;
  userSpeaking: boolean;
  agentSpeaking: boolean;
  duration: number;
  messages: TranscriptMessage[];
}

export interface VoiceSessionOptions {
  /** Agent ID to connect to */
  agent: string;
  /** EventServer URL (e.g. "https://florencia.app.pinecall.io") */
  server: string;
}
