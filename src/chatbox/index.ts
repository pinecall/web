/**
 * @pinecall/web/chatbox
 *
 * Docked chatbox Custom Element. Importing this registers `<pinecall-chat>`
 * (guarded — SSR no-op / idempotent).
 */
import { PinecallChat } from "./PinecallChat";

export { PinecallChat };

export function definePinecallChat(tagName = "pinecall-chat"): void {
  if (typeof window === "undefined" || typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) customElements.define(tagName, PinecallChat);
}

definePinecallChat();
