/**
 * Orb web-component CSS — injected into the element's Shadow DOM.
 *
 * Theming is driven by CSS custom properties (--vw-*) declared on :host.
 * They inherit through the shadow boundary, so consumers can override them
 * from outside with plain CSS on the `pinecall-orb` element, or via the
 * `preset` attribute / `theme` property (which set inline vars on :host).
 */
export const ORB_CSS = /* css */ `
:host {
  /* Orb idle gradient (RGB triplets) */
  --vw-orb-from: 255, 255, 255;
  --vw-orb-mid: 240, 238, 231;
  --vw-orb-to: 184, 181, 168;

  /* State colors (RGB triplets) */
  --vw-color-connecting: 245, 158, 11;
  --vw-color-active: 76, 175, 80;
  --vw-color-user-speaking: 52, 211, 153;
  --vw-color-speaking: 248, 113, 113;
  --vw-color-thinking: 139, 92, 246;
  --vw-color-warning: 255, 160, 0;
  --vw-color-accent: 124, 58, 237;
  --vw-ring-color: 216, 65, 44;

  /* Bubble / label (full CSS values) */
  --vw-bubble-bot-bg: rgba(18, 16, 22, .9);
  --vw-bubble-bot-color: #e8e4f0;
  --vw-bubble-user-color: #e0d4f7;
  --vw-label-bg: #181818;
  --vw-label-color: #fff;

  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  display: block;
}

.vw-wrap { position: relative; width: 52px; height: 52px; }

/* ── Orb ── */
.vw-orb {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 28%,
      rgb(var(--vw-orb-from)),
      rgb(var(--vw-orb-mid)) 38%,
      rgba(var(--vw-orb-to), .85) 72%,
      rgb(var(--vw-orb-to)));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .85) inset,
    0 -8px 18px rgba(var(--vw-ring-color), .12) inset,
    0 10px 28px -8px rgba(0, 0, 0, .22),
    0 0 0 1px rgba(0, 0, 0, .05);
  cursor: pointer;
  position: relative;
  transition: transform .2s ease;
}
.vw-orb:hover { transform: scale(1.05); }
.vw-orb:focus-visible { outline: 2px solid rgba(var(--vw-color-accent), .8); outline-offset: 3px; }

.vw-orb::after {
  content: ""; position: absolute; inset: -5px; border-radius: 999px;
  border: 1px solid rgba(var(--vw-ring-color), .18);
  animation: vw-breathe 3.2s ease-in-out infinite;
}
.vw-orb::before {
  content: ""; position: absolute; inset: -11px; border-radius: 999px;
  border: 1px solid rgba(var(--vw-ring-color), .07);
  animation: vw-breathe 3.2s ease-in-out .5s infinite;
}
@keyframes vw-breathe {
  0%, 100% { transform: scale(1); opacity: .9; }
  50% { transform: scale(1.07); opacity: .25; }
}

/* ── Label tooltip ── */
.vw-label {
  position: absolute; right: 62px; top: 50%; transform: translateY(-50%);
  background: var(--vw-label-bg); color: var(--vw-label-color);
  padding: 6px 10px; border-radius: 999px; font-size: 11.5px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  white-space: nowrap; opacity: 0; pointer-events: none;
  transition: opacity .2s, transform .2s; font-variant-numeric: tabular-nums;
}
.vw-wrap:hover .vw-label { opacity: 1; transform: translateY(-50%) translateX(-2px); }
.vw-wrap.is-live .vw-label { display: none; }

/* ── States ── */
.vw-orb.connecting {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-connecting), .35) 38%, rgba(var(--vw-color-connecting), .7) 72%, rgba(var(--vw-color-connecting), 1));
  animation: vw-breathe 1s ease-in-out infinite;
}
.vw-orb.connecting::after, .vw-orb.connecting::before { border-color: rgba(var(--vw-color-connecting), .25); }

.vw-orb.active {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-active), .15) 38%, rgba(var(--vw-color-active), .3) 72%, rgba(var(--vw-color-active), .5));
  box-shadow: 0 1px 0 rgba(255,255,255,.85) inset, 0 10px 28px -8px rgba(0,0,0,.2), 0 0 16px rgba(var(--vw-color-active), .15);
}
.vw-orb.active::after, .vw-orb.active::before { border-color: rgba(var(--vw-color-active), .2); }

.vw-orb.user-speaking {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-user-speaking), .35) 38%, rgba(var(--vw-color-user-speaking), .7) 72%, rgba(var(--vw-color-user-speaking), 1));
  box-shadow: 0 1px 0 rgba(255,255,255,.85) inset, 0 10px 28px -8px rgba(0,0,0,.2), 0 0 24px rgba(var(--vw-color-user-speaking), .3);
}
.vw-orb.user-speaking::after, .vw-orb.user-speaking::before { border-color: rgba(var(--vw-color-user-speaking), .3); }

.vw-orb.speaking {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-speaking), .35) 38%, rgba(var(--vw-color-speaking), .7) 72%, rgba(var(--vw-color-speaking), 1));
  box-shadow: 0 1px 0 rgba(255,255,255,.85) inset, 0 10px 28px -8px rgba(0,0,0,.2), 0 0 24px rgba(var(--vw-color-speaking), .3);
  animation: vw-speak-pulse .8s ease-in-out infinite;
}
.vw-orb.speaking::after, .vw-orb.speaking::before { border-color: rgba(var(--vw-color-speaking), .3); }
@keyframes vw-speak-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }

.vw-orb.thinking {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-thinking), .35) 38%, rgba(var(--vw-color-thinking), .7) 72%, rgba(var(--vw-color-thinking), 1));
  box-shadow: 0 1px 0 rgba(255,255,255,.85) inset, 0 10px 28px -8px rgba(0,0,0,.2), 0 0 20px rgba(var(--vw-color-thinking), .25);
  animation: vw-think-pulse 1.6s ease-in-out infinite;
}
.vw-orb.thinking::after, .vw-orb.thinking::before { border-color: rgba(var(--vw-color-thinking), .25); }
@keyframes vw-think-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.03); opacity: .85; } }

.vw-orb.idle-warning {
  background: radial-gradient(circle at 30% 28%, #fff,
    rgba(var(--vw-color-warning), .35) 38%, rgba(var(--vw-color-warning), .7) 72%, rgba(var(--vw-color-warning), 1));
  box-shadow: 0 1px 0 rgba(255,255,255,.85) inset, 0 10px 28px -8px rgba(0,0,0,.2), 0 0 24px rgba(var(--vw-color-warning), .35);
  animation: vw-warning-blink .6s ease-in-out infinite;
}
.vw-orb.idle-warning::after, .vw-orb.idle-warning::before { border-color: rgba(var(--vw-color-warning), .4); }
@keyframes vw-warning-blink { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(.96); } }

/* ── Speech bubble ── */
.vw-bubble {
  position: absolute; bottom: 10px; right: 62px; width: max-content;
  max-width: 280px; min-width: 110px; padding: 9px 14px; font-size: 13px; line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  word-break: break-word; animation: vw-bubble-in .2s ease-out; pointer-events: none; z-index: 1;
}
.vw-bubble[hidden] { display: none; }
.vw-bubble::after {
  content: ""; position: absolute; top: 50%; right: -5px; margin-top: -5px;
  width: 10px; height: 10px; transform: rotate(45deg); border-radius: 0 3px 0 0;
}
@keyframes vw-bubble-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.vw-bubble.vw-bubble--user {
  background: rgba(var(--vw-color-accent), .15); border: 1px solid rgba(var(--vw-color-accent), .25);
  color: var(--vw-bubble-user-color); border-radius: 13px 13px 4px 13px;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 6px 24px -8px rgba(var(--vw-color-accent), .2);
}
.vw-bubble.vw-bubble--user::after {
  background: rgba(var(--vw-color-accent), .15);
  border-top: 1px solid rgba(var(--vw-color-accent), .25); border-right: 1px solid rgba(var(--vw-color-accent), .25);
}
.vw-bubble.vw-bubble--user.vw-interim { opacity: .5; border-style: dashed; }
.vw-bubble.vw-bubble--user.vw-interim::after { border-style: dashed; }

.vw-bubble.vw-bubble--bot {
  background: var(--vw-bubble-bot-bg); border: 1px solid rgba(255,255,255,.1);
  color: var(--vw-bubble-bot-color); border-radius: 13px 13px 13px 4px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 6px 24px -8px rgba(0,0,0,.4);
}
.vw-bubble.vw-bubble--bot::after {
  background: var(--vw-bubble-bot-bg);
  border-top: 1px solid rgba(255,255,255,.1); border-right: 1px solid rgba(255,255,255,.1);
}
.vw-bubble.vw-bubble--bot.vw-speaking { border-color: rgba(var(--vw-color-speaking), .25); box-shadow: 0 6px 24px -8px rgba(var(--vw-color-speaking), .15); }
.vw-bubble.vw-bubble--bot.vw-speaking::after { border-color: rgba(var(--vw-color-speaking), .25); }
.vw-bubble.vw-bubble--bot.vw-interrupted { opacity: .45; text-decoration: line-through; text-decoration-color: rgba(255,107,178,.4); }

/* Typing dots */
.vw-dots { display: inline-flex; gap: 4px; align-items: center; height: 16px; }
.vw-dots span { width: 4px; height: 4px; border-radius: 999px; background: rgba(255,255,255,.35); animation: vw-dot-bounce .6s ease-in-out infinite; }
.vw-dots span:nth-child(2) { animation-delay: .12s; }
.vw-dots span:nth-child(3) { animation-delay: .24s; }
@keyframes vw-dot-bounce { 0%,100% { transform: translateY(0); opacity: .3; } 50% { transform: translateY(-3px); opacity: 1; } }

@media (max-width: 640px) { :host { right: 14px; bottom: 14px; } }
@media (prefers-reduced-motion: reduce) {
  .vw-orb, .vw-orb::before, .vw-orb::after, .vw-bubble, .vw-dots span { animation: none !important; }
}
`;
