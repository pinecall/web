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
  /**
   * Pinecall API base URL for token exchange.
   * Default: `"https://voice.pinecall.io"`.
   *
   * The SDK fetches a WebRTC token from `GET {server}/webrtc/token?agent_id=X`.
   * The response includes the actual voice server URL for ICE + SDP negotiation.
   */
  server?: string;
  /**
   * Initial session config overrides sent in the WebRTC offer body.
   * Supported keys: `voice`, `stt`, `language`, `turnDetection`, `greeting`.
   *
   * @example
   * ```ts
   * { voice: "alloy", stt: "deepgram", language: "es", greeting: "¡Hola!" }
   * ```
   */
  config?: Record<string, unknown>;
  /** Call metadata sent in the WebRTC offer body. */
  metadata?: Record<string, unknown>;
}
