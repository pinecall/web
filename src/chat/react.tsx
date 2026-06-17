/**
 * @pinecall/web/chat/react
 *
 * React hook for Pinecall text chat.
 *
 * @example
 * ```tsx
 * import { usePinecallChat } from "@pinecall/web/chat/react";
 *
 * function Chat() {
 *   const { messages, send, connected, typing } = usePinecallChat({
 *     agent: "florencia",
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map((m) => (
 *         <p key={m.id}>{m.role}: {m.text}</p>
 *       ))}
 *       <input onKeyDown={(e) => {
 *         if (e.key === "Enter") {
 *           send(e.currentTarget.value);
 *           e.currentTarget.value = "";
 *         }
 *       }} />
 *     </div>
 *   );
 * }
 * ```
 */
import { useSyncExternalStore, useState, useCallback, useEffect } from "react";
import { ChatSession } from "./ChatSession";
import type { ChatSessionOptions, ChatMessage } from "./types";

export interface UsePinecallChatReturn {
  /** All messages in the conversation. */
  messages: ChatMessage[];
  /** Send a text message. */
  send: (text: string) => void;
  /** True when connected to the server. */
  connected: boolean;
  /** True while the bot is streaming a response. */
  typing: boolean;
  /** Partial text of the current response being streamed. */
  streamingText: string;
  /** Current error, if any. */
  error: string | null;
  /** Inject dynamic context into the LLM prompt. */
  setContext: (key: string, value: string | null) => void;
  /** Connect to the chat server. */
  connect: () => void;
  /** Disconnect from the chat server. */
  disconnect: () => void;
}

/**
 * React hook for Pinecall text chat.
 *
 * Creates a ChatSession and exposes reactive state via useSyncExternalStore.
 * The session auto-connects on mount and disconnects on unmount.
 */
export function usePinecallChat(
  opts: ChatSessionOptions & {
    /** Set to false to disable auto-connect on mount. @default true */
    autoConnect?: boolean;
  },
): UsePinecallChatReturn {
  // Use state for the session so React re-renders when it changes
  const [session, setSession] = useState<ChatSession>(
    () => new ChatSession(opts),
  );

  // useSyncExternalStore for reactive state
  const state = useSyncExternalStore(
    useCallback((cb: () => void) => session.subscribe(cb), [session]),
    useCallback(() => session.getState(), [session]),
  );

  // Auto-connect on mount, destroy on unmount
  useEffect(() => {
    // In Strict Mode, the previous session was destroyed.
    // Create a fresh one if the current session was destroyed.
    let activeSession = session;
    if (activeSession.getState().status === "destroyed") {
      activeSession = new ChatSession(opts);
      setSession(activeSession);
    }

    if (opts.autoConnect !== false) {
      activeSession.connect();
    }
    return () => {
      activeSession.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages: state.messages,
    send: useCallback((text: string) => session.send(text), [session]),
    connected: state.status === "connected",
    typing: state.typing,
    streamingText: state.streamingText,
    error: state.error,
    setContext: useCallback(
      (key: string, value: string | null) => session.setContext(key, value),
      [session],
    ),
    connect: useCallback(() => session.connect(), [session]),
    disconnect: useCallback(() => session.disconnect(), [session]),
  };
}

// Re-export core types for convenience
export type { ChatSessionOptions, ChatMessage, ChatSessionState } from "./types";
