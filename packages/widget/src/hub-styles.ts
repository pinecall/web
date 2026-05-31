/**
 * ContactHub CSS — injected at runtime alongside WIDGET_CSS.
 *
 * Prefix: .vw-hub- for the popover, .vw-cm- for Call Me.
 * Uses CSS custom properties from the widget's theme system.
 */
export const HUB_CSS = /* css */ `

/* ═══════════════════════════════════════
   ContactHub — above-orb contact menu
   ═══════════════════════════════════════ */

/* ── Backdrop ── */
.vw-hub-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20px;
  animation: vwHubFade .2s ease;
}
@keyframes vwHubFade { from { opacity: 0; } to { opacity: 1; } }

/* ── Panel ── */
.vw-hub-panel {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: var(--vw-panel-bg, rgba(16, 14, 20, .92));
  border: 1px solid var(--vw-panel-border, rgba(255, 255, 255, .08));
  border-radius: 20px;
  padding: 26px 22px 22px;
  box-shadow: 0 24px 56px -12px rgba(0, 0, 0, 0.5);
  animation: vwHubUp .25s cubic-bezier(.2,.8,.2,1);
  margin-bottom: 70px;
}
.vw-hub-panel--chat {
  max-width: 400px;
  padding: 0;
  overflow: hidden;
}
@keyframes vwHubUp {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Close */
.vw-hub-close {
  position: absolute;
  top: 10px; right: 10px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, .4);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: color .2s, background .2s;
  line-height: 1;
}
.vw-hub-close:hover { color: #fff; background: rgba(255, 255, 255, .06); }

/* ── Header ── */
.vw-hub-header { text-align: center; margin-bottom: 16px; }
.vw-hub-avatar { font-size: 28px; margin-bottom: 6px; }
.vw-hub-header h3 {
  font-size: 17px;
  color: #fff;
  margin: 0 0 3px;
  font-weight: 500;
  font-family: inherit;
}
.vw-hub-header p { font-size: 12px; color: rgba(255, 255, 255, .5); margin: 0; }

/* ── Option Cards ── */
.vw-hub-options { display: flex; flex-direction: column; gap: 8px; }

.vw-hub-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .15s;
  font-family: inherit;
  text-align: left;
  width: 100%;
  font-size: 14px;
}
.vw-hub-opt:hover {
  background: rgba(255, 255, 255, .06);
  border-color: rgba(255, 255, 255, .1);
  transform: translateX(2px);
}

.vw-hub-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: grid; place-items: center;
  flex-shrink: 0;
}
.vw-hub-icon--voice { background: rgba(124, 58, 237, .15); color: rgba(139, 92, 246, 1); }
.vw-hub-icon--wa { background: rgba(34, 197, 94, .15); color: rgba(34, 197, 94, 1); }
.vw-hub-icon--call {
  background: rgba(var(--vw-accent, 124, 58, 237), .12);
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
}
.vw-hub-icon--chat { background: rgba(59, 130, 246, .15); color: rgba(96, 165, 250, 1); }

.vw-hub-body { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.vw-hub-title { font-weight: 600; font-size: 13px; }
.vw-hub-desc { font-size: 11px; color: rgba(255, 255, 255, .45); }
.vw-hub-arrow { color: rgba(255, 255, 255, .3); font-size: 14px; flex-shrink: 0; }

/* ═══════════════════════════════════════
   Call Me — form + transcript
   ═══════════════════════════════════════ */

/* ── Form View ── */
.vw-cm { text-align: center; }
.vw-cm-back {
  background: none; border: none; color: rgba(255, 255, 255, .4);
  cursor: pointer; font-size: 12px; margin-bottom: 14px;
  padding: 4px 8px; border-radius: 6px;
  transition: color .2s; font-family: inherit;
}
.vw-cm-back:hover { color: #fff; }

.vw-cm h3 {
  font-size: 18px;
  color: #fff; margin: 0 0 5px; font-weight: 500;
  font-family: inherit;
}
.vw-cm p {
  font-size: 12px; color: rgba(255, 255, 255, .45);
  line-height: 1.5; margin: 0 0 16px;
}

.vw-cm-phone-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(var(--vw-accent, 124, 58, 237), .12);
  border: 1.5px solid rgba(var(--vw-accent, 124, 58, 237), .3);
  display: grid; place-items: center;
  margin: 0 auto 12px;
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
}

.vw-cm-form { display: flex; flex-direction: column; gap: 8px; }
.vw-cm-form input {
  width: 100%; padding: 12px 14px; border-radius: 10px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .1);
  color: #fff; font-family: inherit; font-size: 16px;
  outline: none; transition: border-color .2s; box-sizing: border-box;
}
.vw-cm-form input:focus { border-color: rgba(var(--vw-accent, 124, 58, 237), .7); }
.vw-cm-form input::placeholder { color: rgba(255, 255, 255, .3); }
.vw-cm-form button {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px; border-radius: 10px;
  background: rgba(var(--vw-accent, 124, 58, 237), 1);
  color: #fff; font-family: inherit;
  font-weight: 600; font-size: 14px; border: none; cursor: pointer;
  transition: transform .2s, box-shadow .2s;
}
.vw-cm-form button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px -6px rgba(var(--vw-accent, 124, 58, 237), .5);
}
.vw-cm-form button:disabled { opacity: 0.5; cursor: not-allowed; }
.vw-cm-error { font-size: 11px; color: rgba(248, 113, 113, 1); }
.vw-cm-note {
  font-size: 10px; color: rgba(255, 255, 255, .3);
  line-height: 1.45; margin-top: 4px; opacity: 0.7;
}
.vw-cm-note a { color: rgba(var(--vw-accent, 124, 58, 237), 1); text-decoration: none; }

/* ── Transcript View ── */
.vw-cm-transcript { display: flex; flex-direction: column; gap: 0; }

.vw-cm-head {
  display: flex; align-items: center; gap: 10px;
  padding: 0 0 12px; border-bottom: 1px solid rgba(255, 255, 255, .06);
}
.vw-cm-head-icon {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(var(--vw-accent, 124, 58, 237), .12);
  display: grid; place-items: center;
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
  font-size: 14px;
}
.vw-cm-head-icon.vw-cm-live {
  animation: vwCmPulse 1.8s ease infinite;
}
@keyframes vwCmPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--vw-accent, 124, 58, 237), .4); }
  50% { box-shadow: 0 0 0 6px rgba(var(--vw-accent, 124, 58, 237), 0); }
}
.vw-cm-meta { flex: 1; min-width: 0; }
.vw-cm-phone { font-size: 13px; font-weight: 600; color: #fff; }
.vw-cm-status-line {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgba(255, 255, 255, .45);
}
.vw-cm-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(34, 197, 94, 1);
  animation: vwCmDot 1.2s ease infinite;
}
.vw-cm-dot--ended { background: rgba(255, 255, 255, .3); animation: none; }
@keyframes vwCmDot {
  0%, 100% { opacity: 1; } 50% { opacity: .3; }
}

.vw-cm-body {
  max-height: 260px; overflow-y: auto; padding: 12px 0;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
}

.vw-cm-msg {
  padding: 6px 0; font-size: 13px; line-height: 1.5;
  animation: vwCmMsgIn .2s ease;
}
@keyframes vwCmMsgIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.vw-cm-msg--bot { color: rgba(255, 255, 255, .85); }
.vw-cm-msg--user { color: rgba(var(--vw-accent, 124, 58, 237), .9); }
.vw-cm-sender {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .05em; margin-bottom: 2px; display: block;
  color: rgba(255, 255, 255, .35);
}
.vw-cm-msg--user .vw-cm-sender { color: rgba(var(--vw-accent, 124, 58, 237), .5); }

.vw-cm-cursor {
  display: inline-block; width: 6px; height: 14px;
  background: rgba(255, 255, 255, .5); margin-left: 2px;
  animation: vwCmBlink .8s step-end infinite; vertical-align: text-bottom;
}
@keyframes vwCmBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.vw-cm-tool {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px; margin: 4px 0; border-radius: 6px;
  background: rgba(255, 255, 255, .03); font-size: 11px;
  color: rgba(255, 255, 255, .4);
}
.vw-cm-tool-icon { font-size: 12px; }
.vw-cm-tool-name { font-weight: 600; }
.vw-cm-tool-args { font-style: italic; }

.vw-cm-dialing {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 24px 0;
}
.vw-cm-dialing-ring {
  width: 56px; height: 56px; border-radius: 50%;
  border: 2px solid rgba(var(--vw-accent, 124, 58, 237), .3);
  display: grid; place-items: center;
  animation: vwCmRing 1.5s ease infinite;
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
}
@keyframes vwCmRing {
  0%, 100% { transform: scale(1); border-color: rgba(var(--vw-accent, 124, 58, 237), .3); }
  50% { transform: scale(1.08); border-color: rgba(var(--vw-accent, 124, 58, 237), .6); }
}
.vw-cm-dialing-text { font-size: 13px; color: rgba(255, 255, 255, .5); }
.vw-cm-dialing-phone { font-size: 12px; color: rgba(255, 255, 255, .3); }

.vw-cm-ended {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 12px 0 0; border-top: 1px solid rgba(255, 255, 255, .06);
}
.vw-cm-ended-text { font-size: 12px; color: rgba(255, 255, 255, .4); }
.vw-cm-ended-text strong { color: #fff; }

.vw-cm-error-view {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 20px 0;
}
.vw-cm-error-text { font-size: 13px; color: rgba(248, 113, 113, .9); text-align: center; }

/* ── Mobile ── */
@media (max-width: 640px) {
  .vw-hub-backdrop { padding: 14px; }
  .vw-hub-panel { max-width: 100%; margin-bottom: 56px; border-radius: 16px; padding: 22px 18px 18px; }

  /* Chat: fullscreen takeover on mobile */
  .vw-hub-backdrop:has(.vw-hub-panel--chat) {
    padding: 0;
    background: var(--vw-panel-bg, rgba(16, 14, 20, .98));
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .vw-hub-panel--chat {
    max-width: 100%;
    height: 100%;
    margin-bottom: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }
  .vw-hub-panel--chat .vw-cv {
    height: 100%;
    max-height: 100%;
  }
}
`;
