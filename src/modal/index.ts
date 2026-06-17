/**
 * @pinecall/web/modal
 *
 * Glass call modal as a Custom Element. Importing this module registers
 * `<pinecall-modal>` (guarded — SSR no-op / idempotent).
 */
import { PinecallModal } from "./PinecallModal";

export { PinecallModal };

export function definePinecallModal(tagName = "pinecall-modal"): void {
  if (typeof window === "undefined" || typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) customElements.define(tagName, PinecallModal);
}

definePinecallModal();
