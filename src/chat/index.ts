/**
 * @pinecall/web/chat
 *
 * Framework-agnostic text chat client for Pinecall agents.
 *
 * @example
 * ```ts
 * import { ChatSession } from "@pinecall/web/chat";
 *
 * const chat = new ChatSession({ agent: "florencia" });
 * chat.subscribe(() => console.log(chat.getState()));
 * await chat.connect();
 * chat.send("Hola");
 * ```
 */
export { ChatSession } from "./ChatSession";
export type {
  ChatSessionState,
  ChatSessionOptions,
  ChatMessage,
  ChatStatus,
  ChatEventType,
} from "./types";
