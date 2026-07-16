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

/* ── Screen wrapper ──
   Desktop: transparent passthrough (display:contents) so .pc-panel keeps its
   original fixed bottom-right docking. Mobile (see @media below): becomes a
   fixed, opaque, full-screen clip layer that the absolute .pc-panel rides
   inside — the absolute-in-fixed trick that stops the iOS keyboard jump. */
.pc-screen { display: contents; }

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

/* ── Header actions: new conversation + past conversations ── */
.pc-hbtn { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 8px; border: 0; cursor: pointer; background: transparent; color: var(--pm-text-dim); display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
.pc-hbtn:hover { color: var(--pm-text); background: var(--pm-btn-bg); }
.pc-hbtn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
.pc-histwrap { position: relative; flex: 0 0 auto; }
.pc-histmenu { position: absolute; top: 36px; right: 0; min-width: 220px; max-width: 280px; max-height: 260px; overflow-y: auto; background: var(--pm-card-from); border: 1px solid var(--pm-divider); border-radius: 12px; box-shadow: var(--pm-panel-shadow); padding: 4px; z-index: 6; }
.pc-histmenu[hidden] { display: none; }
.pc-histrow { display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; background: transparent; border: 0; color: var(--pm-text); padding: 8px 10px; border-radius: 8px; cursor: pointer; font: inherit; font-size: 12.5px; }
.pc-histrow:hover { background: var(--pm-btn-bg); }
.pc-histrow.active { background: var(--pm-btn-bg); }
.pc-histrow .t1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-histrow .t2 { color: var(--pm-text-dim); font-size: 10.5px; }
.pc-histempty { padding: 10px 12px; color: var(--pm-text-dim); font-size: 12px; }

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
.pc-msg.hist { opacity: .82; }

/* Markdown inside bot bubbles (user bubbles stay literal text). */
.pc-msg > :first-child { margin-top: 0; }
.pc-msg > :last-child { margin-bottom: 0; }
.pc-msg p { margin: 0 0 6px; }
.pc-msg ul, .pc-msg ol { margin: 4px 0; padding-left: 18px; }
.pc-msg li { margin: 2px 0; }
.pc-msg a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.pc-msg strong { font-weight: 700; }
.pc-msg em { font-style: italic; }
.pc-msg h1, .pc-msg h2, .pc-msg h3 { font-size: 1.02em; font-weight: 700; margin: 7px 0 3px; line-height: 1.3; }
.pc-msg code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em;
  background: rgba(0, 0, 0, .2); padding: .08em .36em; border-radius: 5px; }
.pc-msg pre { background: rgba(0, 0, 0, .24); border-radius: 9px; padding: 9px 11px;
  overflow-x: auto; margin: 6px 0; }
.pc-msg pre code { background: none; padding: 0; font-size: .85em; line-height: 1.5; }
.pc-msg blockquote { margin: 5px 0; padding-left: 9px; border-left: 2px solid currentColor; opacity: .8; }
.pc-msg table { border-collapse: collapse; margin: 5px 0; font-size: .95em; }
.pc-msg th, .pc-msg td { border: 1px solid var(--pm-divider); padding: 3px 7px; text-align: left; }
.pc-typing { align-self: flex-start; display: inline-flex; gap: 4px; padding: 10px 12px; }
.pc-typing span { width: 6px; height: 6px; border-radius: 999px; background: var(--pm-typing-dot); animation: pc-bounce .6s ease-in-out infinite; }
.pc-typing span:nth-child(2) { animation-delay: .12s; }
.pc-typing span:nth-child(3) { animation-delay: .24s; }
@keyframes pc-bounce { 0%,100% { transform: translateY(0); opacity: .3; } 50% { transform: translateY(-4px); opacity: 1; } }

/* ── Input ── */
.pc-inputbar { display: flex; align-items: flex-end; gap: 8px; padding: 12px; border-top: 1px solid var(--pm-divider); }
.pc-input { flex: 1; background: var(--pm-input-bg); border: 1px solid var(--pm-input-border); border-radius: 21px; padding: 11px 16px; color: var(--pm-text); font-size: 14px; outline: none; resize: none; font-family: inherit; line-height: 1.4; max-height: 120px; overflow-y: auto; box-sizing: border-box; }
.pc-input::placeholder { color: var(--pm-text-dim); }
.pc-mic, .pc-rec, .pc-send, .pc-call { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 999px; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--pm-btn-bg); color: var(--pm-text); transition: background .15s, transform .1s; }
.pc-mic:hover, .pc-rec:hover, .pc-send:hover, .pc-call:hover { background: var(--pm-btn-bg-hover); }
.pc-mic:active, .pc-rec:active, .pc-send:active, .pc-call:active { transform: scale(.93); }
.pc-mic svg, .pc-rec svg, .pc-send svg, .pc-call svg { width: 19px; height: 19px; stroke: currentColor; fill: none; stroke-width: 2; }
.pc-send { background: var(--pm-send-bg); color: var(--pm-send-text); }
.pc-mic.live { background: rgb(var(--vw-color-user-speaking)); color: #06301f; }
.pc-mic.muted { background: rgb(var(--vw-color-speaking)); color: #3a0d0d; }
.pc-mic[hidden], .pc-rec[hidden], .pc-call[hidden] { display: none; }
.pc-call.hangup { background: rgb(var(--vw-color-speaking)); color: #fff; }
/* Voice-message record button — pulsing red while recording, spinner while transcribing. */
.pc-rec.recording { background: rgb(var(--vw-color-speaking)); color: #fff; animation: pc-recpulse 1.3s ease-in-out infinite; }
.pc-rec.recording svg { fill: currentColor; stroke: none; }
.pc-rec.busy { cursor: default; }
.pc-rec.busy svg { display: none; }
.pc-rec.busy::after { content: ""; width: 16px; height: 16px; border-radius: 999px; border: 2px solid currentColor; border-top-color: transparent; animation: pc-spin .7s linear infinite; opacity: .8; }
@keyframes pc-recpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(var(--vw-color-speaking), .55); } 50% { box-shadow: 0 0 0 6px rgba(var(--vw-color-speaking), 0); } }
@keyframes pc-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) { .pc-msg, .pc-typing span { animation: none !important; } }

/* Mobile launcher: respect the safe-area when docked (closed state). */
@media (max-width: 640px) {
  .pc-fab {
    right: max(20px, env(safe-area-inset-right));
    bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* ── Mobile fullscreen takeover ([fs]) — document-flow, like /ask ──────
   PinecallChat moves the host into <body> and sets [fs] on open (mobile only),
   hiding the rest of the page. The host then IS a normal-flow full-page element
   and the DOCUMENT scrolls — so iOS handles the keyboard natively (it lifts the
   focused input above the keyboard with no jump), exactly like a dedicated
   full-page chat. No position:fixed, no visualViewport JS. The composer is
   sticky to the bottom, the header sticky to the top, messages flow between. */
:host([fs]) { display: block; position: static; min-height: 100svh; min-height: 100dvh; }
:host([fs]) .pc-screen { display: block; position: static; inset: auto; background: none; }
:host([fs]) .pc-panel {
  position: static; inset: auto;
  width: 100%; height: auto;
  min-height: 100svh; min-height: 100dvh;
  max-height: none; border-radius: 0; transform: none; animation: none;
}
:host([fs]) .pc-msgs { overflow: visible; flex: 1 0 auto; }
:host([fs]) .pc-head {
  position: sticky; top: 0; z-index: 5;
  padding-top: max(14px, env(safe-area-inset-top));
  background: var(--pm-card-from);
}
:host([fs]) .pc-inputbar {
  position: sticky; bottom: 0; z-index: 5;
  background: var(--pm-card-to);
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
/* 16px keeps iOS Safari from zooming the page when the input is focused. */
:host([fs]) .pc-input { font-size: 16px; padding: 12px 16px; }
:host([fs]) .pc-mic, :host([fs]) .pc-send, :host([fs]) .pc-call { width: 44px; height: 44px; }
`;
