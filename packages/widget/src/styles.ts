/**
 * Voice Widget CSS — injected once at runtime.
 *
 * All colors are driven by CSS custom properties (--vw-*) defined
 * on `.vw-wrap`.  Consumers override them via the `theme` prop or
 * external CSS.
 *
 * RGB-triplet vars (e.g. --vw-color-accent: 124, 58, 237) are used
 * with rgba() for flexible alpha control.
 *
 * Classes: .vw-wrap, .vw-orb, .vw-label, .vw-bubble-*, .vw-tp-*
 * States:  .connecting, .active, .user-speaking, .speaking, .thinking
 */
export const WIDGET_CSS = /* css */ `
/* ── Container + CSS custom-property defaults ── */
.vw-wrap {
  /* ── State colors (RGB triplets) ── */
  --vw-color-connecting: 245, 158, 11;
  --vw-color-active: 76, 175, 80;
  --vw-color-user-speaking: 52, 211, 153;
  --vw-color-speaking: 248, 113, 113;
  --vw-color-thinking: 139, 92, 246;
  --vw-color-accent: 124, 58, 237;
  --vw-ring-color: 216, 65, 44;

  /* ── Panel / bubble (full CSS values) ── */
  --vw-panel-bg: rgba(16, 14, 20, .92);
  --vw-panel-border: rgba(255, 255, 255, .08);
  --vw-bubble-bot-bg: rgba(18, 16, 22, .9);
  --vw-bubble-bot-color: #e8e4f0;
  --vw-label-bg: #181818;
  --vw-label-color: #fff;

  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 100;
  overflow: visible;
}

/* ── Orb ── */
.vw-orb {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, #fff, #f0eee7 35%, #d9d6cb 70%, #b8b5a8);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .9) inset,
    0 -10px 24px rgba(var(--vw-ring-color), .15) inset,
    0 14px 40px -10px rgba(0, 0, 0, .25),
    0 0 0 1px rgba(0, 0, 0, .06);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s ease;
}

.vw-orb:hover { transform: scale(1.04); }

.vw-orb::after {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 999px;
  border: 1px solid rgba(var(--vw-ring-color), .2);
  animation: vw-breathe 3.2s ease-in-out infinite;
}

.vw-orb::before {
  content: "";
  position: absolute;
  inset: -16px;
  border-radius: 999px;
  border: 1px solid rgba(var(--vw-ring-color), .08);
  animation: vw-breathe 3.2s ease-in-out .5s infinite;
}

@keyframes vw-breathe {
  0%, 100% { transform: scale(1); opacity: .9; }
  50% { transform: scale(1.08); opacity: .3; }
}

/* ── Label tooltip ── */
.vw-label {
  position: absolute;
  right: 76px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--vw-label-bg);
  color: var(--vw-label-color);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s, transform .2s;
  font-variant-numeric: tabular-nums;
}

.vw-wrap:hover .vw-label { opacity: 1; transform: translateY(-50%) translateX(-2px); }
.vw-wrap.is-live .vw-label { display: none; }

/* ── State: connecting ── */
.vw-orb.connecting {
  background: radial-gradient(circle at 30% 30%, #fff,
    rgba(var(--vw-color-connecting), .35) 35%,
    rgba(var(--vw-color-connecting), .7) 70%,
    rgba(var(--vw-color-connecting), 1));
  animation: vw-breathe 1s ease-in-out infinite;
}
.vw-orb.connecting::after,
.vw-orb.connecting::before { border-color: rgba(var(--vw-color-connecting), .25); }

/* ── State: active ── */
.vw-orb.active {
  background: radial-gradient(circle at 30% 30%, #fff,
    rgba(var(--vw-color-active), .15) 35%,
    rgba(var(--vw-color-active), .3) 70%,
    rgba(var(--vw-color-active), .5));
  box-shadow: 0 1px 0 rgba(255, 255, 255, .9) inset,
    0 14px 40px -10px rgba(0, 0, 0, .2),
    0 0 20px rgba(var(--vw-color-active), .15);
}
.vw-orb.active::after,
.vw-orb.active::before { border-color: rgba(var(--vw-color-active), .2); }

/* ── State: user speaking ── */
.vw-orb.user-speaking {
  background: radial-gradient(circle at 30% 30%, #fff,
    rgba(var(--vw-color-user-speaking), .35) 35%,
    rgba(var(--vw-color-user-speaking), .7) 70%,
    rgba(var(--vw-color-user-speaking), 1));
  box-shadow: 0 1px 0 rgba(255, 255, 255, .9) inset,
    0 14px 40px -10px rgba(0, 0, 0, .2),
    0 0 30px rgba(var(--vw-color-user-speaking), .3);
}
.vw-orb.user-speaking::after,
.vw-orb.user-speaking::before { border-color: rgba(var(--vw-color-user-speaking), .3); }

/* ── State: agent speaking ── */
.vw-orb.speaking {
  background: radial-gradient(circle at 30% 30%, #fff,
    rgba(var(--vw-color-speaking), .35) 35%,
    rgba(var(--vw-color-speaking), .7) 70%,
    rgba(var(--vw-color-speaking), 1));
  box-shadow: 0 1px 0 rgba(255, 255, 255, .9) inset,
    0 14px 40px -10px rgba(0, 0, 0, .2),
    0 0 30px rgba(var(--vw-color-speaking), .3);
  animation: vw-speak-pulse .8s ease-in-out infinite;
}
.vw-orb.speaking::after,
.vw-orb.speaking::before { border-color: rgba(var(--vw-color-speaking), .3); }

@keyframes vw-speak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

/* ── State: thinking ── */
.vw-orb.thinking {
  background: radial-gradient(circle at 30% 30%, #fff,
    rgba(var(--vw-color-thinking), .35) 35%,
    rgba(var(--vw-color-thinking), .7) 70%,
    rgba(var(--vw-color-thinking), 1));
  box-shadow: 0 1px 0 rgba(255, 255, 255, .9) inset,
    0 14px 40px -10px rgba(0, 0, 0, .2),
    0 0 24px rgba(var(--vw-color-thinking), .25);
  animation: vw-think-pulse 1.6s ease-in-out infinite;
}
.vw-orb.thinking::after,
.vw-orb.thinking::before { border-color: rgba(var(--vw-color-thinking), .25); }

@keyframes vw-think-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.03); opacity: .85; }
}

/* ══════════════════════════════════════════════════
   SPEECH BUBBLE — single bubble floating above orb
   Like Apple notification banners — floats to the left
   ══════════════════════════════════════════════════ */

.vw-bubble {
  position: absolute;
  bottom: 12px;
  right: 76px;
  width: max-content;
  max-width: 300px;
  min-width: 120px;
  padding: 10px 16px;
  font-size: 13.5px;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  word-break: break-word;
  animation: vw-bubble-in .2s ease-out;
  pointer-events: none;
  z-index: 1;
}

/* Tail pointer → points right toward the orb */
.vw-bubble::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -6px;
  margin-top: -6px;
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  border-radius: 0 3px 0 0;
}

@keyframes vw-bubble-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* User bubble — accent glass */
.vw-bubble.vw-bubble--user {
  background: rgba(var(--vw-color-accent), .15);
  border: 1px solid rgba(var(--vw-color-accent), .25);
  color: #e0d4f7;
  border-radius: 14px 14px 4px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px -8px rgba(var(--vw-color-accent), .2);
}
.vw-bubble.vw-bubble--user::after {
  background: rgba(var(--vw-color-accent), .15);
  border-top: 1px solid rgba(var(--vw-color-accent), .25);
  border-right: 1px solid rgba(var(--vw-color-accent), .25);
}

.vw-bubble.vw-bubble--user.vw-interim {
  opacity: .5;
  border-style: dashed;
}
.vw-bubble.vw-bubble--user.vw-interim::after {
  border-style: dashed;
}

/* Bot bubble — dark frosted glass */
.vw-bubble.vw-bubble--bot {
  background: var(--vw-bubble-bot-bg);
  border: 1px solid rgba(255, 255, 255, .1);
  color: var(--vw-bubble-bot-color);
  border-radius: 14px 14px 14px 4px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px -8px rgba(0, 0, 0, .4);
}
.vw-bubble.vw-bubble--bot::after {
  background: var(--vw-bubble-bot-bg);
  border-top: 1px solid rgba(255, 255, 255, .1);
  border-right: 1px solid rgba(255, 255, 255, .1);
}

.vw-bubble.vw-bubble--bot.vw-speaking {
  border-color: rgba(var(--vw-color-speaking), .25);
  box-shadow: 0 8px 32px -8px rgba(var(--vw-color-speaking), .15);
}
.vw-bubble.vw-bubble--bot.vw-speaking::after {
  border-color: rgba(var(--vw-color-speaking), .25);
}

.vw-bubble.vw-bubble--bot.vw-interrupted {
  opacity: .45;
  text-decoration: line-through;
  text-decoration-color: rgba(255, 107, 178, .4);
}

/* Typing dots */
.vw-dots { display: inline-flex; gap: 4px; align-items: center; height: 18px; }
.vw-dots span {
  width: 5px; height: 5px; border-radius: 999px;
  background: rgba(255, 255, 255, .35);
  animation: vw-dot-bounce .6s ease-in-out infinite;
}
.vw-dots span:nth-child(2) { animation-delay: .12s; }
.vw-dots span:nth-child(3) { animation-delay: .24s; }

@keyframes vw-dot-bounce {
  0%, 100% { transform: translateY(0); opacity: .3; }
  50% { transform: translateY(-4px); opacity: 1; }
}

/* ══════════════════════════════════════════════════
   TRANSCRIPT PANEL — expandable conversation view
   ══════════════════════════════════════════════════ */

.vw-tp-btn {
  position: absolute;
  right: 72px;
  bottom: 16px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .1);
  background: rgba(24, 24, 24, .8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, .6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  font-size: 14px;
  z-index: 2;
}

.vw-tp-btn:hover {
  border-color: rgba(255, 255, 255, .25);
  color: #fff;
  transform: scale(1.08);
}

/* Panel */
.vw-tp {
  position: absolute;
  right: 0;
  bottom: 80px;
  width: 320px;
  max-height: 400px;
  background: var(--vw-panel-bg);
  border: 1px solid var(--vw-panel-border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px -15px rgba(0, 0, 0, .5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: vw-panel-in .2s ease-out;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 3;
}

@keyframes vw-panel-in {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Panel header */
.vw-tp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.vw-tp-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .5);
}

.vw-tp-close {
  width: 22px; height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .1);
  background: transparent;
  color: rgba(255, 255, 255, .4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all .15s;
}
.vw-tp-close:hover { border-color: rgba(255, 255, 255, .3); color: #fff; }

/* Panel body — scrollable */
.vw-tp-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.08) transparent;
}
.vw-tp-body::-webkit-scrollbar { width: 4px; }
.vw-tp-body::-webkit-scrollbar-track { background: transparent; }
.vw-tp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

/* Message in panel */
.vw-tp-msg {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.45;
  animation: vw-bubble-in .15s ease-out;
}

.vw-tp-msg--user {
  align-self: flex-end;
  background: rgba(var(--vw-color-accent), .15);
  border: 1px solid rgba(var(--vw-color-accent), .2);
  color: #d4c4f0;
  border-radius: 12px 12px 4px 12px;
}

.vw-tp-msg--user.vw-interim {
  opacity: .5;
  border-style: dashed;
}

.vw-tp-msg--bot {
  align-self: flex-start;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .06);
  color: #d4d0e0;
  border-radius: 12px 12px 12px 4px;
}

.vw-tp-msg--bot.vw-speaking {
  border-color: rgba(var(--vw-color-speaking), .15);
}

.vw-tp-msg--bot.vw-interrupted {
  opacity: .45;
}

/* Empty state */
.vw-tp-empty {
  text-align: center;
  color: rgba(255, 255, 255, .25);
  font-size: 12px;
  padding: 40px 20px;
  letter-spacing: .02em;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .vw-wrap { right: 16px; bottom: 16px; }
  .vw-orb { width: 52px; height: 52px; }
  .vw-label { display: none; }
  .vw-bubble { bottom: 68px; max-width: 220px; font-size: 12px; }
  .vw-tp { width: 280px; max-height: 320px; bottom: 68px; }
  .vw-tp-btn { right: 60px; }
}
`;
