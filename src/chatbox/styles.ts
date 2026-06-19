/**
 * <pinecall-chat> CSS — docked chatbox (traditional web-chat style).
 * Theming reuses the same --vw-* / --pm-* custom properties as the orb/modal,
 * plus chat-specific tokens (--pm-user-bg/text, --pm-bot-bg/text/border,
 * --pm-input-*, --pm-send-*, --pm-divider, --pm-typing-dot) so the panel can
 * be re-skinned for light or alternate palettes without rewriting the
 * internals.
 */
export const CHATBOX_CSS = /* css */ `
:host {
  --vw-color-accent: 124, 58, 237;
  --vw-color-user-speaking: 52, 211, 153;
  --vw-color-speaking: 248, 113, 113;
  --pm-card-from: #2b6cb0;
  --pm-card-to: #1a4a86;
  --pm-text: #eaf2fb;
  --pm-text-dim: rgba(234, 242, 251, .6);
  --pm-user: rgb(var(--vw-color-user-speaking));
  --pm-bot: color-mix(in srgb, rgb(var(--vw-color-accent)) 60%, white);

  /* Re-skinnable surface tokens (chat). Defaults preserve original look. */
  --pm-divider: rgba(255, 255, 255, .10);
  --pm-user-bg: rgba(255, 255, 255, .94);
  --pm-user-text: #14304f;
  --pm-bot-bg: rgba(255, 255, 255, .13);
  --pm-bot-text: var(--pm-text);
  --pm-bot-border: rgba(255, 255, 255, .12);
  --pm-input-bg: rgba(255, 255, 255, .12);
  --pm-input-border: rgba(255, 255, 255, .14);
  --pm-btn-bg: rgba(255, 255, 255, .14);
  --pm-btn-bg-hover: rgba(255, 255, 255, .24);
  --pm-send-bg: #fff;
  --pm-send-text: #1a4a86;
  --pm-typing-dot: rgba(255, 255, 255, .4);
  --pm-scrollbar: rgba(255, 255, 255, .25);
  --pm-fab-inset: rgba(255, 255, 255, .15);
  --pm-fab-shadow: 0 10px 30px -8px rgba(0, 0, 0, .45);
  --pm-panel-shadow: 0 30px 90px -25px rgba(0, 0, 0, .6),
                     inset 0 1px 0 rgba(255, 255, 255, .12),
                     0 0 0 1px rgba(255, 255, 255, .06);

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ── Launcher bubble ── */
.pc-fab {
  position: var(--pc-position, fixed); right: 28px; bottom: 28px; z-index: 2147483000;
  width: 60px; height: 60px; border-radius: 999px; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: linear-gradient(150deg, var(--pm-card-from), var(--pm-card-to));
  box-shadow: var(--pm-fab-shadow), inset 0 1px 0 var(--pm-fab-inset);
  transition: transform .2s ease;
}
.pc-fab:hover { transform: scale(1.06); }
.pc-fab svg { width: 26px; height: 26px; stroke: currentColor; fill: none; stroke-width: 2; }
.pc-fab[hidden] { display: none; }

/* ── Panel ── */
.pc-panel {
  position: var(--pc-position, fixed); right: 28px; bottom: 28px; z-index: 2147483400;
  width: min(380px, calc(100vw - 32px)); height: min(var(--pc-max-height, 560px), calc(100vh - 48px));
  display: none; flex-direction: column; overflow: hidden;
  border-radius: 22px; color: var(--pm-text);
  background: linear-gradient(160deg, var(--pm-card-from), var(--pm-card-to));
  box-shadow: var(--pm-panel-shadow);
}
.pc-panel.open { display: flex; animation: pc-pop .2s cubic-bezier(.2,.9,.3,1.2); }
@keyframes pc-pop { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: none; } }

/* ── Header ── */
.pc-head { display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-bottom: 1px solid var(--pm-divider); }
.pc-avatar { width: 38px; height: 38px; border-radius: 999px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; background: var(--pm-btn-bg); border: 1px solid var(--pm-input-border); }
.pc-avatar svg { width: 18px; height: 18px; stroke: var(--pm-text); fill: none; stroke-width: 2; }
.pc-avatar img { width: 100%; height: 100%; border-radius: 999px; object-fit: cover; }
.pc-id { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.pc-name { font-weight: 600; font-size: 15px; }
.pc-state { font-size: 12px; color: var(--pm-text-dim); display: flex; align-items: center; gap: 6px; }
.pc-state .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--pm-typing-dot); }
.pc-state.live .dot { background: rgb(var(--vw-color-user-speaking)); box-shadow: 0 0 7px rgba(var(--vw-color-user-speaking),.7); }
.pc-close { background: none; border: 0; color: var(--pm-text-dim); cursor: pointer; font-size: 20px; line-height: 1; padding: 4px; border-radius: 8px; }
.pc-close:hover { color: var(--pm-text); background: var(--pm-btn-bg); }

/* ── Messages ── */
.pc-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 14px; scrollbar-width: thin; scrollbar-color: var(--pm-scrollbar) transparent; }
.pc-msgs::-webkit-scrollbar { width: 6px; }
.pc-msgs::-webkit-scrollbar-thumb { background: var(--pm-scrollbar); border-radius: 999px; }
.pc-empty { margin: auto; color: var(--pm-text-dim); font-size: 13px; text-align: center; padding: 0 24px; }
.pc-msg { max-width: 82%; padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.45; word-break: break-word; animation: pc-msg-in .15s ease-out; }
@keyframes pc-msg-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.pc-msg.user { align-self: flex-end; background: var(--pm-user-bg); color: var(--pm-user-text); border-bottom-right-radius: 5px; }
.pc-msg.bot { align-self: flex-start; background: var(--pm-bot-bg); color: var(--pm-bot-text); border: 1px solid var(--pm-bot-border); border-bottom-left-radius: 5px; }
.pc-msg.system { align-self: center; background: none; color: var(--pm-text-dim); font-size: 12px; }
.pc-msg.interim, .pc-msg.streaming { opacity: .75; }
.pc-typing { align-self: flex-start; display: inline-flex; gap: 4px; padding: 10px 12px; }
.pc-typing span { width: 6px; height: 6px; border-radius: 999px; background: var(--pm-typing-dot); animation: pc-bounce .6s ease-in-out infinite; }
.pc-typing span:nth-child(2) { animation-delay: .12s; }
.pc-typing span:nth-child(3) { animation-delay: .24s; }
@keyframes pc-bounce { 0%,100% { transform: translateY(0); opacity: .3; } 50% { transform: translateY(-4px); opacity: 1; } }

/* ── Input ── */
.pc-inputbar { display: flex; align-items: center; gap: 8px; padding: 12px; border-top: 1px solid var(--pm-divider); }
.pc-input { flex: 1; background: var(--pm-input-bg); border: 1px solid var(--pm-input-border); border-radius: 999px; padding: 11px 16px; color: var(--pm-text); font-size: 14px; outline: none; }
.pc-input::placeholder { color: var(--pm-text-dim); }
.pc-mic, .pc-send, .pc-call { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 999px; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--pm-btn-bg); color: var(--pm-text); transition: background .15s, transform .1s; }
.pc-mic:hover, .pc-send:hover, .pc-call:hover { background: var(--pm-btn-bg-hover); }
.pc-mic:active, .pc-send:active, .pc-call:active { transform: scale(.93); }
.pc-mic svg, .pc-send svg, .pc-call svg { width: 19px; height: 19px; stroke: currentColor; fill: none; stroke-width: 2; }
.pc-send { background: var(--pm-send-bg); color: var(--pm-send-text); }
.pc-mic.live { background: rgb(var(--vw-color-user-speaking)); color: #06301f; }
.pc-mic.muted { background: rgb(var(--vw-color-speaking)); color: #3a0d0d; }
.pc-mic[hidden], .pc-call[hidden] { display: none; }
.pc-call.hangup { background: rgb(var(--vw-color-speaking)); color: #fff; }

@media (prefers-reduced-motion: reduce) { .pc-msg, .pc-typing span { animation: none !important; } }

/* ── Mobile: full-screen, keyboard-aware ──────────────────────────────
   A floating widget is a fixed overlay on someone else's page, so we can't
   use document-flow like a full-page chat. Instead the panel is sized to the
   *visible* viewport via --pc-vh / --pc-vtop, which <pinecall-chat> drives
   from window.visualViewport — so the input always clears the iOS keyboard
   with no jump. Defaults (no JS / no keyboard) = full screen. */
@media (max-width: 640px) {
  .pc-panel {
    top: var(--pc-vtop, 0px);
    right: 0; bottom: auto; left: 0;
    width: 100vw;
    height: var(--pc-vh, 100dvh);
    max-height: none;
    border-radius: 0;
  }
  .pc-head { padding-top: max(14px, env(safe-area-inset-top)); }
  /* 16px keeps iOS Safari from zooming the page when the input is focused. */
  .pc-input { font-size: 16px; padding: 12px 16px; }
  .pc-inputbar { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
  .pc-mic, .pc-send, .pc-call { width: 44px; height: 44px; }
  .pc-fab {
    right: max(20px, env(safe-area-inset-right));
    bottom: max(20px, env(safe-area-inset-bottom));
  }
}
`;
