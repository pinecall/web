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
.vw-cm { text-align: center; padding: 4px 0; }
.vw-cm-back {
  background: none; border: none; color: rgba(255, 255, 255, .4);
  cursor: pointer; font-size: 12px; margin-bottom: 16px;
  padding: 4px 8px; border-radius: 6px;
  transition: color .2s; font-family: inherit;
}
.vw-cm-back:hover { color: #fff; }

.vw-cm h3 {
  font-size: 19px;
  color: #fff; margin: 0 0 6px; font-weight: 500;
  font-family: inherit;
}
.vw-cm p {
  font-size: 12.5px; color: rgba(255, 255, 255, .5);
  line-height: 1.55; margin: 0 0 18px;
}

.vw-cm-phone-icon {
  width: 54px; height: 54px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--vw-accent, 124, 58, 237), .15), rgba(var(--vw-accent, 124, 58, 237), .06));
  border: 1.5px solid rgba(var(--vw-accent, 124, 58, 237), .3);
  display: grid; place-items: center;
  margin: 0 auto 14px;
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
  position: relative;
}
.vw-cm-phone-icon::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--vw-accent, 124, 58, 237), .15);
  animation: vwCmIconPulse 2.5s ease-in-out infinite;
}
@keyframes vwCmIconPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 0; transform: scale(1.25); }
}

.vw-cm-form { display: flex; flex-direction: column; gap: 10px; }
.vw-cm-form input {
  width: 100%; padding: 14px 16px; border-radius: 12px;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .1);
  color: #fff; font-family: inherit; font-size: 16px;
  outline: none; transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
  letter-spacing: 0.04em;
}
.vw-cm-form input:focus {
  border-color: rgba(var(--vw-accent, 124, 58, 237), .7);
  box-shadow: 0 0 0 3px rgba(var(--vw-accent, 124, 58, 237), .12);
}
.vw-cm-form input::placeholder { color: rgba(255, 255, 255, .25); letter-spacing: 0.02em; }
.vw-cm-form button {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--vw-accent, 124, 58, 237), 1), rgba(var(--vw-accent, 124, 58, 237), .8));
  color: #fff; font-family: inherit;
  font-weight: 600; font-size: 14px; border: none; cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  letter-spacing: 0.01em;
}
.vw-cm-form button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px -6px rgba(var(--vw-accent, 124, 58, 237), .5);
}
.vw-cm-form button:disabled { opacity: 0.4; cursor: not-allowed; }
.vw-cm-error {
  font-size: 11px; color: rgba(248, 113, 113, 1);
  padding: 6px 0; line-height: 1.4;
}
.vw-cm-note {
  font-size: 10px; color: rgba(255, 255, 255, .3);
  line-height: 1.45; margin-top: 4px; opacity: 0.7;
}
.vw-cm-note a { color: rgba(var(--vw-accent, 124, 58, 237), 1); text-decoration: none; }

/* ── Dialing Animation (used inside hub before call connects) ── */

.vw-cm-dialing {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 28px 0;
}
.vw-cm-dialing-ring {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--vw-accent, 124, 58, 237), .12), rgba(var(--vw-accent, 124, 58, 237), .04));
  border: 2px solid rgba(var(--vw-accent, 124, 58, 237), .3);
  display: grid; place-items: center;
  animation: vwCmRing 1.5s ease infinite;
  color: rgba(var(--vw-accent, 124, 58, 237), 1);
  position: relative;
}
.vw-cm-dialing-ring::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(var(--vw-accent, 124, 58, 237), .2);
  animation: vwCmDialPulse 1.4s ease-out infinite;
}
.vw-cm-dialing-ring::before {
  content: '';
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--vw-accent, 124, 58, 237), .1);
  animation: vwCmDialPulse 1.4s ease-out 0.3s infinite;
}
@keyframes vwCmRing {
  0%, 100% { transform: scale(1); border-color: rgba(var(--vw-accent, 124, 58, 237), .3); }
  50% { transform: scale(1.06); border-color: rgba(var(--vw-accent, 124, 58, 237), .6); }
}
@keyframes vwCmDialPulse {
  0%   { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}
.vw-cm-dialing-text { font-size: 13px; color: rgba(255, 255, 255, .55); font-weight: 500; }
.vw-cm-dialing-phone { font-size: 12px; color: rgba(255, 255, 255, .35); letter-spacing: 0.06em; }

.vw-cm-error-view {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 24px 0;
}
.vw-cm-error-text { font-size: 13px; color: rgba(248, 113, 113, .9); text-align: center; line-height: 1.5; }

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
