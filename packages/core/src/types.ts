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

// ── Tool UI types ──────────────────────────────────────────────────

/**
 * A tool call event received from the server-side LLM via DataChannel.
 *
 * The server sends `llm.tool_call` with a batch of tool calls.
 * Each call has an `id`, `name`, and JSON `arguments`.
 */
export interface ToolCallEvent {
  /** Correlation ID — echoed in `llm.tool_result`. */
  msgId: string;
  /** Individual tool calls in this batch. */
  calls: { id: string; name: string; arguments: Record<string, unknown> }[];
}

/**
 * A tool result event relayed from the server via DataChannel.
 *
 * Sent after the Node.js SDK agent executes a tool and returns the result.
 */
export interface ToolResultEvent {
  /** Tool call ID (matches `ToolCallEvent.calls[].id`). */
  toolCallId: string;
  /** Tool function name. */
  name: string;
  /** The result value (any JSON). */
  result: unknown;
}

/**
 * A pending tool UI entry tracked in session state.
 *
 * Created when `llm.tool_call` arrives for a tracked tool name.
 * Updated with `result` when `llm.tool_result` arrives.
 * Removed via `dismissTool()` after the user interacts.
 */
export interface ToolUI {
  /** Tool call ID. */
  toolCallId: string;
  /** Tool function name. */
  name: string;
  /** Parsed arguments from the LLM. */
  arguments: Record<string, unknown>;
  /** Result from server execution (`undefined` while pending). */
  result?: unknown;
  /** Timestamp when the tool call was received. */
  timestamp: number;
}

// ── Session state ──────────────────────────────────────────────────

export interface VoiceSessionState {
  status: SessionStatus;
  error: string | null;
  isMuted: boolean;
  phase: CallPhase;
  userSpeaking: boolean;
  agentSpeaking: boolean;
  duration: number;
  messages: TranscriptMessage[];
  /** Active tool UI entries (only for tracked tools). */
  toolCalls: ToolUI[];
  /**
   * Idle warning state. Non-null when `session.idle_warning` fires,
   * meaning the user hasn't spoken and the call will timeout soon.
   * Contains the remaining seconds until timeout.
   * Resets to `null` when the user speaks.
   */
  idleWarning: number | null;
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
  /**
   * Tool names to track for UI rendering.
   *
   * When listed, VoiceSession tracks `llm.tool_call` → `llm.tool_result`
   * for these tools and exposes them in `state.toolCalls`.
   * Tools NOT listed are ignored (handled silently by the server-side agent).
   *
   * @example
   * ```ts
   * trackedTools: ["getAvailableSlots", "showLocationMap"]
   * ```
   */
  trackedTools?: string[];
}
