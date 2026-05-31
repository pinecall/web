/**
 * hub-chat-styles.ts — CSS for the ChatView inside ContactHub.
 * Dark theme matching the hub panel aesthetic.
 */
export const CHAT_VIEW_CSS = `
/* ── ChatView container ───────────────────────────────────── */
.vw-cv {
  display: flex;
  flex-direction: column;
  height: 480px;
  max-height: 70vh;
}

/* ── Header ───────────────────────────────────────────────── */
.vw-cv-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.vw-cv-back {
  background: none;
  border: none;
  color: rgba(255,255,255,.5);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color .2s, background .2s;
}
.vw-cv-back:hover {
  color: #fff;
  background: rgba(255,255,255,.08);
}

.vw-cv-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--vw-color-accent, 197,140,95), .3), rgba(var(--vw-color-accent, 197,140,95), .1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--vw-color-accent, 197,140,95));
  flex-shrink: 0;
}

.vw-cv-who {
  flex: 1;
  min-width: 0;
}
.vw-cv-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}
.vw-cv-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(255,255,255,.45);
}

.vw-cv-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74,222,128,.5);
  flex-shrink: 0;
}
.vw-cv-dot--off {
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245,158,11,.5);
}

.vw-cv-actions {
  display: flex;
  gap: 4px;
}

.vw-cv-action {
  background: none;
  border: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.45);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all .2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vw-cv-action:hover {
  color: #fff;
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.15);
}
.vw-cv-action--voice {
  color: rgb(var(--vw-color-accent, 197,140,95));
  border-color: rgba(var(--vw-color-accent, 197,140,95), .25);
}
.vw-cv-action--voice:hover {
  background: rgba(var(--vw-color-accent, 197,140,95), .12);
  color: rgb(var(--vw-color-accent, 197,140,95));
  border-color: rgba(var(--vw-color-accent, 197,140,95), .4);
}

/* ── Messages body ────────────────────────────────────────── */
.vw-cv-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.1) transparent;
}

.vw-cv-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
}

.vw-cv-msg--user {
  align-self: flex-end;
  background: rgba(var(--vw-color-accent, 197,140,95), .18);
  color: rgba(255,255,255,.92);
  border-bottom-right-radius: 4px;
}

.vw-cv-msg--bot {
  align-self: flex-start;
  background: rgba(255,255,255,.05);
  color: rgba(255,255,255,.85);
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255,255,255,.06);
}

/* Markdown inside bot messages */
.vw-cv-md p { margin: 0 0 6px; }
.vw-cv-md p:last-child { margin-bottom: 0; }
.vw-cv-md strong { color: #fff; font-weight: 600; }
.vw-cv-md em { font-style: italic; }
.vw-cv-md code {
  background: rgba(255,255,255,.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}
.vw-cv-md a {
  color: rgb(var(--vw-color-accent, 197,140,95));
  text-decoration: underline;
  text-underline-offset: 2px;
}
.vw-cv-md ul, .vw-cv-md ol {
  margin: 4px 0;
  padding-left: 18px;
}
.vw-cv-md li { margin-bottom: 2px; }

/* Streaming cursor */
.vw-cv-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: rgb(var(--vw-color-accent, 197,140,95));
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: vw-cv-blink .8s infinite;
}

@keyframes vw-cv-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Typing skeleton */
.vw-cv-skeleton {
  display: flex;
  gap: 4px;
  padding: 14px 18px;
}
.vw-cv-sk-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255,255,255,.25);
  animation: vw-cv-bounce 1.4s infinite ease-in-out;
}
.vw-cv-sk-dot:nth-child(2) { animation-delay: .16s; }
.vw-cv-sk-dot:nth-child(3) { animation-delay: .32s; }

@keyframes vw-cv-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}

/* Tool calls */
.vw-cv-tool {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 2px 0;
  border-radius: 10px;
  font-size: 11px;
  font-family: monospace;
  background: rgba(167,139,250,.06);
  border: 1px solid rgba(167,139,250,.15);
  align-self: center;
  max-width: 90%;
}
.vw-cv-tool-icon { font-size: 12px; }
.vw-cv-tool-name { color: rgb(167,139,250); font-weight: 600; }
.vw-cv-tool-args { color: rgba(255,255,255,.4); font-size: 10px; word-break: break-all; }

/* ── Quick options ────────────────────────────────────────── */
.vw-cv-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid rgba(255,255,255,.04);
}
.vw-cv-quick button {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.7);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.vw-cv-quick button:hover:not(:disabled) {
  background: rgba(var(--vw-color-accent, 197,140,95), .12);
  border-color: rgba(var(--vw-color-accent, 197,140,95), .3);
  color: rgb(var(--vw-color-accent, 197,140,95));
}
.vw-cv-quick button:disabled {
  opacity: .4;
  cursor: default;
}

/* ── Input bar ────────────────────────────────────────────── */
.vw-cv-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,.06);
}
.vw-cv-input input {
  flex: 1;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 16px; /* ≥16px prevents iOS Safari auto-zoom on focus */
  outline: none;
  transition: border-color .2s;
}
.vw-cv-input input::placeholder {
  color: rgba(255,255,255,.3);
}
.vw-cv-input input:focus {
  border-color: rgba(var(--vw-color-accent, 197,140,95), .4);
}

.vw-cv-send {
  background: rgb(var(--vw-color-accent, 197,140,95));
  border: none;
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .2s, transform .15s;
  flex-shrink: 0;
}
.vw-cv-send:hover:not(:disabled) {
  transform: scale(1.05);
}
.vw-cv-send:disabled {
  opacity: .3;
  cursor: default;
}
`;
