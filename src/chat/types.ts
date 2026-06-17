/**
 * @pinecall/web/chat — Type definitions.
 */

/** Chat session connection status. */
export type ChatStatus = "idle" | "connecting" | "connected" | "error" | "destroyed";

/** A single message in the conversation. */
export interface ChatMessage {
  id: number;
  role: "user" | "bot" | "system";
  text: string;
  /** Server-assigned message ID (for bot messages). */
  messageId?: string;
  /** True while the bot is still streaming this message. */
  isStreaming?: boolean;
  /** Tool call ID (for `system` tool-indicator messages). */
  toolCallId?: string;
}

/** Full state of a ChatSession (immutable snapshots). */
export interface ChatSessionState {
  status: ChatStatus;
  error: string | null;
  /** All messages in the conversation. */
  messages: ChatMessage[];
  /** True while the bot is streaming a response. */
  typing: boolean;
  /** Partial text of the current bot response being streamed. */
  streamingText: string;
  /** Session ID assigned by the server. */
  sessionId: string | null;
}

/** Options for creating a ChatSession. */
export interface ChatSessionOptions {
  /** Agent ID to connect to (e.g. "florencia", "dev-berna-florencia"). */
  agent: string;

  /**
   * Voice server URL.
   * The SDK fetches a chat token from `GET {server}/chat/token?agent_id=X`.
   * Then opens a WebSocket to `{server}/chat/ws?token=cht_xxx`.
   *
   * @default "https://voice.pinecall.io"
   */
  server?: string;

  /**
   * Custom token provider — call your backend to generate tokens instead
   * of hitting /chat/token directly. Keeps API keys server-side.
   *
   * @example
   * ```ts
   * tokenProvider: async () => {
   *   const res = await fetch("/api/token?channel=chat");
   *   return res.json(); // { token, server }
   * }
   * ```
   */
  tokenProvider?: () => Promise<{ token: string; server: string }>;
}

/** Events emitted by ChatSession via EventTarget. */
export type ChatEventType =
  | "status"     // status changed
  | "message"    // new/updated message
  | "error"      // error occurred
  | "change";    // any state change (for useSyncExternalStore)
