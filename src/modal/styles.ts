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

/* ── Waveform ── */
.pm-wave { display: flex; align-items: center; gap: 3px; height: 28px; }
.pm-wave span { width: 3px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.55); }
.pm-wave.on span { animation: pm-bar .9s ease-in-out infinite; }
.pm-wave.on span:nth-child(2n) { animation-duration: .7s; }
.pm-wave.on span:nth-child(3n) { animation-duration: 1.1s; }
.pm-wave.on span:nth-child(4n) { animation-duration: .8s; }
@keyframes pm-bar { 0%,100% { height: 6px; } 50% { height: 26px; } }
.pm-status { font-size: 14px; color: var(--pm-text-dim); min-height: 18px; }

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

/* ── Text input during call ── */
.pm-textbar { display: none; gap: 8px; padding: 4px 4px 6px; }
.pm-textbar.show { display: flex; }
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
