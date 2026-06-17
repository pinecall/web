/**
 * <pinecall-modal> CSS — injected into the element's Shadow DOM.
 *
 * A glass call card (à la iOS call screen): header pill, big animated orb,
 * waveform, status line, and a control bar. Theming reuses the same --vw-*
 * custom properties as the orb, declared on :host.
 */
export const MODAL_CSS = /* css */ `
:host {
  --vw-orb-from: 255, 255, 255;
  --vw-orb-mid: 240, 238, 231;
  --vw-orb-to: 184, 181, 168;
  --vw-color-connecting: 245, 158, 11;
  --vw-color-active: 76, 175, 80;
  --vw-color-user-speaking: 52, 211, 153;
  --vw-color-speaking: 248, 113, 113;
  --vw-color-thinking: 139, 92, 246;
  --vw-color-warning: 255, 160, 0;
  --vw-color-accent: 124, 58, 237;
  --pm-card-from: #2b6cb0;
  --pm-card-to: #1a4a86;
  --pm-text: #eaf2fb;
  --pm-text-dim: rgba(234, 242, 251, .6);
  /* Speaker colors — theme-driven defaults, override per element via CSS:
     pinecall-modal { --pm-user: #34d399; --pm-bot: #fff; } */
  --pm-user: rgb(var(--vw-color-user-speaking));
  --pm-bot: color-mix(in srgb, rgb(var(--vw-color-accent)) 60%, white);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ── Launcher FAB ── */
.pm-fab {
  position: fixed; right: 28px; bottom: 28px; z-index: 2147483000;
  width: 60px; height: 60px; border-radius: 999px; border: 0; cursor: pointer;
  background: radial-gradient(circle at 30% 30%, rgb(var(--vw-orb-from)), rgb(var(--vw-orb-mid)) 40%, rgb(var(--vw-orb-to)));
  box-shadow: 0 10px 30px -8px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.05);
  transition: transform .2s ease;
}
.pm-fab:hover { transform: scale(1.06); }
.pm-fab[hidden] { display: none; }

/* ── Overlay + card ── */
.pm-overlay {
  position: fixed; inset: 0; z-index: 2147483600; display: none;
  align-items: center; justify-content: center; padding: 20px;
  background: rgba(8, 10, 16, .45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.pm-overlay.open { display: flex; animation: pm-fade .18s ease-out; }
@keyframes pm-fade { from { opacity: 0; } to { opacity: 1; } }

.pm-card {
  width: min(560px, 96vw); border-radius: 28px; padding: 18px; color: var(--pm-text);
  background: linear-gradient(150deg, var(--pm-card-from), var(--pm-card-to));
  box-shadow: 0 40px 120px -30px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.12), 0 0 0 1px rgba(255,255,255,.06);
  display: flex; flex-direction: column; gap: 16px; animation: pm-pop .22s cubic-bezier(.2,.9,.3,1.2);
}
@keyframes pm-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }

/* ── Header pill ── */
.pm-head {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 18px;
  background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.10);
}
.pm-avatar {
  width: 44px; height: 44px; border-radius: 999px; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.18);
}
.pm-avatar svg { width: 20px; height: 20px; stroke: var(--pm-text); }
.pm-avatar img { width: 100%; height: 100%; border-radius: 999px; object-fit: cover; }
.pm-id { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.pm-name { font-weight: 600; font-size: 16px; line-height: 1.2; }
.pm-sub { font-size: 12.5px; color: var(--pm-text-dim); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.pm-timer { font-variant-numeric: tabular-nums; font-size: 15px; color: var(--pm-text-dim); font-family: ui-monospace, monospace; }

/* ── Stage (orb + waveform) ── */
.pm-stage { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 26px 0 10px; }

.pm-orb {
  width: 150px; height: 150px; border-radius: 999px; position: relative;
  background: radial-gradient(circle at 32% 30%, rgb(var(--vw-orb-from)), rgb(var(--vw-orb-mid)) 38%, rgba(var(--vw-orb-to), .85) 70%, rgb(var(--vw-orb-to)));
  box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 24px 60px -16px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.06);
}
.pm-orb::after { content:""; position:absolute; inset:-12px; border-radius:999px; border:1px solid rgba(255,255,255,.18); animation: pm-breathe 3.2s ease-in-out infinite; }
.pm-orb::before { content:""; position:absolute; inset:-26px; border-radius:999px; border:1px solid rgba(255,255,255,.08); animation: pm-breathe 3.2s ease-in-out .5s infinite; }
@keyframes pm-breathe { 0%,100% { transform: scale(1); opacity:.8; } 50% { transform: scale(1.06); opacity:.25; } }

.pm-orb.connecting { background: radial-gradient(circle at 32% 30%, #fff, rgba(var(--vw-color-connecting),.4) 40%, rgba(var(--vw-color-connecting),.9) 75%, rgb(var(--vw-color-connecting))); animation: pm-breathe 1s ease-in-out infinite; }
.pm-orb.active { box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 24px 60px -16px rgba(0,0,0,.45), 0 0 36px rgba(var(--vw-color-active),.25); }
.pm-orb.user-speaking { background: radial-gradient(circle at 32% 30%, #fff, rgba(var(--vw-color-user-speaking),.4) 40%, rgba(var(--vw-color-user-speaking),.85) 72%, rgb(var(--vw-color-user-speaking))); box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 24px 60px -16px rgba(0,0,0,.45), 0 0 44px rgba(var(--vw-color-user-speaking),.4); }
.pm-orb.speaking { background: radial-gradient(circle at 32% 30%, #fff, rgba(var(--vw-color-speaking),.4) 40%, rgba(var(--vw-color-speaking),.85) 72%, rgb(var(--vw-color-speaking))); box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 24px 60px -16px rgba(0,0,0,.45), 0 0 44px rgba(var(--vw-color-speaking),.4); animation: pm-speak .8s ease-in-out infinite; }
@keyframes pm-speak { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
.pm-orb.thinking { background: radial-gradient(circle at 32% 30%, #fff, rgba(var(--vw-color-thinking),.4) 40%, rgba(var(--vw-color-thinking),.85) 72%, rgb(var(--vw-color-thinking))); animation: pm-speak 1.6s ease-in-out infinite; }
.pm-orb.idle-warning { background: radial-gradient(circle at 32% 30%, #fff, rgba(var(--vw-color-warning),.4) 40%, rgba(var(--vw-color-warning),.85) 72%, rgb(var(--vw-color-warning))); animation: pm-blink .6s ease-in-out infinite; }
@keyframes pm-blink { 0%,100% { opacity:1; } 50% { opacity:.5; } }

/* ── Waveform (driven by real audio.metrics via JS) ── */
.pm-wave { display: flex; align-items: center; justify-content: center; gap: 3px; height: 30px; }
.pm-wave span {
  width: 3px; height: 10%; border-radius: 3px;
  background: var(--pm-wave-color, rgba(255,255,255,.6));
  transition: height .06s linear, background .2s ease;
}
.pm-status { font-size: 13px; color: var(--pm-text-dim); min-height: 16px; letter-spacing: .01em; }

/* ── Live caption (orb view) — one line, colored by speaker ── */
.pm-caption {
  font-size: 14.5px; line-height: 1.45; text-align: center; max-width: 90%;
  min-height: 21px; color: #eef4fb; display: flex; align-items: baseline; gap: 7px;
  justify-content: center; flex-wrap: wrap; animation: pm-cap-in .18s ease-out;
}
.pm-caption:empty { display: none; }
.pm-caption .who {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  flex: 0 0 auto; opacity: .95;
}
.pm-caption[data-who="user"] .who { color: var(--pm-user); }
.pm-caption[data-who="bot"] .who { color: var(--pm-bot); }
.pm-caption .txt { color: var(--pm-text); }
@keyframes pm-cap-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }

/* ── Sub-status (wave mode): "transcribing · Deepgram" ── */
.pm-substatus { display: none; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: var(--pm-text-dim); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.pm-substatus .dot { width: 8px; height: 8px; border-radius: 999px; background: rgb(var(--vw-color-user-speaking)); box-shadow: 0 0 8px rgba(var(--vw-color-user-speaking), .7); }
.pm-substatus .prov:not(:empty)::before { content: "· "; opacity: .7; }

/* ── Phase stepper (wave mode): Ring · Listen · Think · Speak ── */
.pm-steps { display: none; align-items: flex-start; justify-content: space-between; gap: 6px; padding: 14px 10px 4px; position: relative; }
.pm-steps::before { content: ""; position: absolute; left: 30px; right: 30px; top: 22px; height: 2px; background: rgba(255,255,255,.16); }
.pm-step { display: flex; flex-direction: column; align-items: center; gap: 9px; flex: 1; z-index: 1; }
.pm-step .node { width: 16px; height: 16px; border-radius: 999px; background: rgba(255,255,255,.18); transition: all .2s ease; }
.pm-step .lbl { font-size: 13px; color: var(--pm-text-dim); }
.pm-step.done .node { background: #fff; }
.pm-step.active .node { background: #fff; box-shadow: 0 0 0 6px rgba(255,255,255,.18); }
.pm-step.done .lbl, .pm-step.active .lbl { color: var(--pm-text); }

/* ── Wave visual mode ── */
.pm-card.visual-wave .pm-orb { display: none; }
.pm-card.visual-wave .pm-status { display: none; }
.pm-card.visual-wave .pm-substatus { display: flex; }
.pm-card.visual-wave .pm-steps { display: flex; }
.pm-card.visual-wave .pm-stage { gap: 22px; padding: 18px 0 6px; }
.pm-card.visual-wave .pm-wave { height: 96px; gap: 5px; }
.pm-card.visual-wave .pm-wave span { width: 4px; background: var(--pm-wave-color, rgba(255,255,255,.85)); }
.pm-card.visual-wave .pm-caption { font-size: 22px; font-weight: 500; line-height: 1.35; }
.pm-card.visual-wave .pm-caption .who { display: none; }
.pm-card.visual-wave .pm-caption .txt::before { content: "\\201C"; }
.pm-card.visual-wave .pm-caption .txt::after { content: "\\201D"; }
.pm-card.visual-wave .pm-caption[data-who="user"] .txt { color: var(--pm-user); }
.pm-card.visual-wave .pm-caption[data-who="bot"] .txt { color: var(--pm-bot); }

/* ── Controls ── */
.pm-controls { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 6px 0 8px; }
.pm-btn {
  width: 56px; height: 56px; border-radius: 999px; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.12); color: var(--pm-text); transition: background .15s, transform .1s;
}
.pm-btn:hover { background: rgba(255,255,255,.20); }
.pm-btn:active { transform: scale(.94); }
.pm-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
.pm-btn.on { background: #fff; color: #1a4a86; }
.pm-btn.hangup { background: #ef4444; color: #fff; }
.pm-btn.hangup:hover { background: #dc2626; }

/* ── Chat / transcript view (toggled by the keyboard button) ── */
.pm-chat { display: none; flex-direction: column; gap: 6px; padding: 2px 2px 0; }
.pm-card.text-mode .pm-stage { display: none; }
.pm-card.text-mode .pm-chat { display: flex; }
.pm-card.text-mode .pm-textbar { display: flex; }

.pm-msgs {
  display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto; max-height: 46vh; min-height: 160px; padding: 8px 6px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent;
}
.pm-msgs::-webkit-scrollbar { width: 6px; }
.pm-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,.25); border-radius: 999px; }
.pm-empty { color: var(--pm-text-dim); font-size: 13px; text-align: center; padding: 30px 0; }

.pm-msg {
  max-width: 80%; padding: 9px 14px; border-radius: 16px; font-size: 14px; line-height: 1.45;
  word-break: break-word; animation: pm-msg-in .16s ease-out;
}
@keyframes pm-msg-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.pm-msg.user { align-self: flex-end; background: rgba(255,255,255,.94); color: #14304f; border-bottom-right-radius: 5px; }
.pm-msg.bot { align-self: flex-start; background: rgba(255,255,255,.13); color: var(--pm-text); border: 1px solid rgba(255,255,255,.12); border-bottom-left-radius: 5px; }
.pm-msg.system { align-self: center; background: none; color: var(--pm-text-dim); font-size: 12px; padding: 2px 8px; }
.pm-msg.interim { opacity: .6; }
.pm-msg.interrupted { opacity: .5; text-decoration: line-through; }

.pm-chat-status { font-size: 12.5px; color: var(--pm-text-dim); min-height: 16px; padding: 0 6px 2px; text-align: center; }

/* ── Text input ── */
.pm-textbar { display: none; gap: 8px; padding: 6px 4px 8px; }
.pm-input {
  flex: 1; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px; padding: 11px 16px; color: var(--pm-text); font-size: 14px; outline: none;
}
.pm-input::placeholder { color: var(--pm-text-dim); }
.pm-send { border:0; border-radius: 999px; padding: 0 18px; background: #fff; color: #1a4a86; font-weight: 600; cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
  .pm-orb, .pm-orb::before, .pm-orb::after, .pm-wave span { animation: none !important; }
}
`;
