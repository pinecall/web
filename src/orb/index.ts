/**
 * @pinecall/web/orb
 *
 * Framework-agnostic WebRTC voice orb as a Custom Element. Importing this
 * module registers `<pinecall-orb>` (guarded — no-op during SSR or if
 * already defined).
 */
import { PinecallOrb } from "./PinecallOrb";

export { PinecallOrb };

/** Register `<pinecall-orb>`. Safe to call multiple times; SSR no-op. */
export function definePinecallOrb(tagName = "pinecall-orb"): void {
  if (typeof window === "undefined" || typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, PinecallOrb);
  }
}

// Auto-register on import in the browser.
definePinecallOrb();
