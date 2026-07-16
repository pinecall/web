/**
 * <pinecall-chat> — docked chatbox for Pinecall agents (Custom Element).
 *
 * A traditional web-chat: a launcher bubble (bottom-right) opens a panel with
 * message bubbles + a text input. It is **text-first** (ChatSession over
 * WebSocket) but can **escalate to a WebRTC voice call** via the call button —
 * talk and/or type in the same panel (the bot answers in voice + text).
 *
 * Attributes: agent, server, name, preset, avatar, voice (start in a call),
 *   no-call (hide the call button → pure text chat), no-fab, open.
 * Properties: config, metadata, theme, tokenProvider.
 *
 * `tokenProvider` is channel-aware: `(channel: "chat" | "webrtc") => {token, server}`.
 * The chatbox calls it with "chat" for text and "webrtc" for voice, so one
 * backend function can mint the right token for each.
 *
 * @example
 * ```html
 * <pinecall-chat agent="florencia" name="Florencia"></pinecall-chat>            <!-- text + call button -->
 * <pinecall-chat agent="florencia" name="Florencia" no-call></pinecall-chat>    <!-- pure text chat -->
 * <pinecall-chat agent="mara" name="Mara" voice></pinecall-chat>                <!-- starts as a call -->
 * ```
 *
 * Greeting: text chat does NOT auto-greet (unlike voice). Greet from the agent
 * with `agent.on("chat.started", c => c.say(text, { addToHistory: true }))`.
 */
import { VoiceSession } from "../core";
import { ChatSession } from "../chat";
import { LiveScribe } from "../scribe";
import { PRESETS } from "../widget/presets";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";
import { CHATBOX_CSS } from "./styles";
import { marked } from "marked";

type TokenProvider = (channel: "chat" | "webrtc") => Promise<{ token: string; server: string }>;

// Bot bubbles render markdown (same approach as the landing /ask + ChatView).
marked.setOptions({ breaks: true, gfm: true });
function renderMd(text: string): string {
  const html = marked.parse(text || "", { async: false }) as string;
  // strip <script> defensively (answers are model-generated)
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

const THEME_VAR_MAP: Partial<Record<keyof VoiceWidgetTheme, string>> = {
  colorAccent: "--vw-color-accent",
  colorUserSpeaking: "--vw-color-user-speaking",
  colorSpeaking: "--vw-color-speaking",
};

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
  micOff: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z"/></svg>',
  hangup: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"/></svg>',
  // solid square — shown while recording a voice message ("tap to stop")
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  close: "✕",
};

interface Msg { id: number; role: string; text: string; isInterim?: boolean; isStreaming?: boolean; speaking?: boolean; interrupted?: boolean; isHistory?: boolean; }
/** Local thread INDEX entry — titles/dates only; messages live server-side. */
interface StoredThread { id: string; title: string; at: number }
type AnySession = VoiceSession | ChatSession;

const MAX_THREADS = 10;

function genThreadId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch { /* ignore */ }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

export class PinecallChat extends HTMLElementBase {
  static get observedAttributes() {
    return ["agent", "server", "name", "preset", "avatar", "auto-call", "no-call", "greeting", "open"];
  }

  private _config?: Record<string, unknown>;
  private _metadata?: Record<string, unknown>;
  private _tokenProvider?: TokenProvider;
  private _theme?: Partial<VoiceWidgetTheme>;

  private mode: "text" | "voice" = "text";
  private session: AnySession | null = null;
  private unsub: (() => void) | null = null;
  private prevStatus?: string;
  private msgEls = new Map<number, HTMLDivElement>();
  private streamEl: (HTMLDivElement & { _target?: string; _shown?: number }) | null = null;
  private revealRaf = 0;
  private greetEl: HTMLDivElement | null = null;
  private fsActive = false;
  private fsPlaceholder: Comment | null = null;
  private fsScrollY = 0;

  private fab!: HTMLButtonElement;
  private screen!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private msgsEl!: HTMLDivElement;
  private input!: HTMLTextAreaElement;
  private micBtn!: HTMLButtonElement;
  private recBtn!: HTMLButtonElement;
  private callBtn!: HTMLButtonElement;

  // Voice-message (WhatsApp/OpenAI-style dictation) — real-time via LiveScribe.
  private scribe: LiveScribe | null = null;
  private recBase = "";
  private recState: "idle" | "recording" | "transcribing" = "idle";

  // Conversation threads — SERVER-side history (restored over the chat WS via
  // chat.history); localStorage keeps only the thread index (ids/titles/dates)
  // and the current pointer. Opt out with `no-history`.
  private threadId = "";
  private saveTimer = 0;
  private histMenu!: HTMLDivElement;
  private onDocClick: ((e: MouseEvent) => void) | null = null;
  private nameEl!: HTMLDivElement;
  private stateEl!: HTMLDivElement;
  private avatarEl!: HTMLDivElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CHATBOX_CSS;
    const c = document.createElement("div");
    c.innerHTML = `
      <button class="pc-fab" aria-label="Open chat">${ICONS.chat}</button>
      <div class="pc-screen">
      <div class="pc-panel" role="dialog" aria-modal="false">
        <div class="pc-head">
          <div class="pc-avatar">${ICONS.chat}</div>
          <div class="pc-id"><div class="pc-name">Agent</div><div class="pc-state"><span class="dot"></span><span class="lbl">Offline</span></div></div>
          <button class="pc-hbtn pc-new" aria-label="New conversation" title="New conversation">${ICONS.plus}</button>
          <div class="pc-histwrap">
            <button class="pc-hbtn pc-hist" aria-label="Past conversations" title="Past conversations">${ICONS.history}</button>
            <div class="pc-histmenu" hidden></div>
          </div>
          <button class="pc-close" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="pc-msgs"></div>
        <div class="pc-inputbar">
          <button class="pc-call" aria-label="Start call">${ICONS.phone}</button>
          <button class="pc-mic" aria-label="Mute" hidden>${ICONS.mic}</button>
          <textarea class="pc-input" rows="1" placeholder="Type a message…"></textarea>
          <button class="pc-rec" aria-label="Record voice message">${ICONS.mic}</button>
          <button class="pc-send" aria-label="Send">${ICONS.send}</button>
        </div>
      </div>
      </div>`;
    root.append(style, c);

    this.fab = c.querySelector(".pc-fab")!;
    this.screen = c.querySelector(".pc-screen")!;
    this.panel = c.querySelector(".pc-panel")!;
    this.msgsEl = c.querySelector(".pc-msgs")!;
    this.input = c.querySelector(".pc-input")!;
    this.micBtn = c.querySelector(".pc-mic")!;
    this.recBtn = c.querySelector(".pc-rec")!;
    this.callBtn = c.querySelector(".pc-call")!;
    this.nameEl = c.querySelector(".pc-name")!;
    this.stateEl = c.querySelector(".pc-state")!;
    this.avatarEl = c.querySelector(".pc-avatar")!;

    this.fab.addEventListener("click", () => this.open());
    c.querySelector(".pc-close")!.addEventListener("click", () => this.close());
    c.querySelector(".pc-send")!.addEventListener("click", () => this.sendInput());
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendInput(); }
    });
    this.input.addEventListener("input", () => this.autoGrow());
    this.micBtn.addEventListener("click", () => this.onMic());
    this.recBtn.addEventListener("click", () => this.toggleRecord());
    this.callBtn.addEventListener("click", () => this.toggleCall());
    this.histMenu = c.querySelector(".pc-histmenu")!;
    c.querySelector(".pc-new")!.addEventListener("click", () => this.newConversation());
    c.querySelector(".pc-hist")!.addEventListener("click", (e) => { e.stopPropagation(); this.toggleHistMenu(); });
  }

  // ── properties ──
  get config() { return this._config; }
  set config(v) { this._config = v; }
  get metadata() { return this._metadata; }
  set metadata(v) { this._metadata = v; }
  get tokenProvider() { return this._tokenProvider; }
  set tokenProvider(v: TokenProvider | undefined) { this._tokenProvider = v; }
  get theme() { return this._theme; }
  set theme(v: Partial<VoiceWidgetTheme> | undefined) { this._theme = v; this.applyTheme(); }

  // ── lifecycle ──
  connectedCallback() {
    this.applyTheme();
    this.syncHeader();
    this.callBtn.hidden = this.hasAttribute("no-call");
    if (this.hasAttribute("no-fab")) this.fab.hidden = true;
    if (this.hasAttribute("open")) this.open();
  }
  disconnectedCallback() { this.exitFullscreen(); this.teardown(); }
  attributeChangedCallback(name: string) {
    if (name === "preset") this.applyTheme();
    if (name === "name" || name === "avatar") this.syncHeader();
    if (name === "no-call") this.callBtn.hidden = this.hasAttribute("no-call");
    if (name === "open") { this.hasAttribute("open") ? this.open() : this.close(); }
  }

  // ── public API ──
  open() {
    this.screen.classList.add("open");
    this.panel.classList.add("open");
    this.fab.hidden = true;
    this.enterFullscreen();
    // text-first unless auto-call → start directly in a voice call
    this.mode = this.hasAttribute("auto-call") ? "voice" : "text";
    this.restoreHistory();
    const s = this.ensureSession();
    if (this.status() === "idle") void s.connect().catch(() => { /* surfaced via state */ });
    this.input.focus();
    this.render();
    this.dispatchEvent(new CustomEvent("pinecall:open"));
  }
  close() {
    this.hideHistMenu();
    this.screen.classList.remove("open");
    this.panel.classList.remove("open");
    this.fab.hidden = this.hasAttribute("no-fab");
    this.exitFullscreen();
    this.teardown();
    if (this.revealRaf) cancelAnimationFrame(this.revealRaf);
    this.revealRaf = 0; this.streamEl = null;
    this.msgEls.clear();
    this.msgsEl.innerHTML = "";
    this.greetEl = null;
    this.mode = "text";
    this.render();
    this.dispatchEvent(new CustomEvent("pinecall:close"));
  }

  private status(): string { return (this.session?.getState() as { status: string })?.status ?? "idle"; }

  private ensureSession(): AnySession {
    if (this.session) return this.session;
    const agent = this.getAttribute("agent") || "";
    const server = this.getAttribute("server") || undefined;
    const tp = this._tokenProvider;
    if (this.mode === "voice") {
      this.session = new VoiceSession({
        agent, server, config: this._config, metadata: this._metadata,
        tokenProvider: tp ? () => tp("webrtc") : undefined,
      });
    } else {
      this.session = new ChatSession({
        agent, server,
        tokenProvider: tp ? () => tp("chat") : undefined,
        thread: this.historyEnabled() ? this.threadId || undefined : undefined,
      });
    }
    this.unsub = this.session.subscribe(() => this.onState());
    return this.session;
  }
  private teardown() {
    if (this.scribe) { this.scribe.cancel(); this.scribe = null; this.setRecState("idle"); }
    if (this.historyEnabled()) { clearTimeout(this.saveTimer); this.persistNow(); }
    this.unsub?.(); this.unsub = null;
    this.session?.destroy(); this.session = null;
    this.prevStatus = undefined;
  }

  /**
   * Full-PAGE takeover on mobile — the ONLY way to match a dedicated full-page
   * chat (like the landing `/ask`): the chat must own the real document so iOS
   * handles the keyboard *natively* (it scrolls the focused input above the
   * keyboard with no jump). A position:fixed overlay can never do this, because
   * only the document scroll gets iOS's native keyboard avoidance.
   *
   * So on open we MOVE the host element into <body>, hide everything else on the
   * page (injected light-DOM style), and the shadow panel becomes a normal-flow
   * `min-height:100dvh` element with a sticky composer + sticky header. No fixed
   * positioning, no visualViewport JS — identical mechanics to `/ask`. A comment
   * placeholder remembers the original slot so close() puts it back exactly.
   */
  private enterFullscreen() {
    if (typeof document === "undefined" || this.fsActive) return;
    if (!window.matchMedia?.("(max-width: 640px)").matches) return;
    this.fsActive = true;
    this.fsScrollY = window.scrollY || 0;
    PinecallChat.injectFsStyle();
    this.fsPlaceholder = document.createComment("pinecall-chat");
    this.parentNode?.insertBefore(this.fsPlaceholder, this);
    document.body.appendChild(this);
    this.setAttribute("fs", "");
    document.documentElement.classList.add("pc-chat-fs");
    window.scrollTo(0, 0);
  }
  private exitFullscreen() {
    if (!this.fsActive) return;
    this.fsActive = false;
    this.removeAttribute("fs");
    document.documentElement.classList.remove("pc-chat-fs");
    // Put the element back exactly where it was (keeps React's tree valid).
    if (this.fsPlaceholder?.parentNode) {
      this.fsPlaceholder.parentNode.insertBefore(this, this.fsPlaceholder);
      this.fsPlaceholder.remove();
    }
    this.fsPlaceholder = null;
    window.scrollTo(0, this.fsScrollY);
  }

  /** One global light-DOM style that hides the host page during fullscreen chat. */
  private static fsStyleInjected = false;
  private static injectFsStyle() {
    if (PinecallChat.fsStyleInjected || typeof document === "undefined") return;
    PinecallChat.fsStyleInjected = true;
    const s = document.createElement("style");
    s.id = "pinecall-chat-fs";
    s.textContent =
      "html.pc-chat-fs,html.pc-chat-fs body{margin:0!important;padding:0!important;" +
      "height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;}" +
      "html.pc-chat-fs body>*:not(pinecall-chat){display:none!important;}" +
      "html.pc-chat-fs body>pinecall-chat{display:block!important;}";
    document.head.appendChild(s);
  }

  /** Switch between text chat (ChatSession) and a WebRTC voice call (VoiceSession). */
  private async switchMode(target: "text" | "voice") {
    if (this.mode === target && this.session) return;

    // Carry the conversation across the text↔voice switch. The two transports
    // are separate server sessions, so we (1) keep the visible bubbles as frozen
    // history and (2) inject the prior transcript as context into the new
    // session so the agent continues where it left off. Includes any messages
    // restored from server-side thread history (isHistory) plus the live session.
    const prev = this.collectMsgs()
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`);
    if (this.greetEl?.textContent) prev.unshift(`Assistant: ${this.greetEl.textContent}`);
    const transcript = prev.join("\n");

    this.teardown();
    if (this.revealRaf) cancelAnimationFrame(this.revealRaf);
    this.revealRaf = 0;
    this.streamEl = null;
    // freeze existing bubbles (keep them in the DOM as history), stop tracking
    this.msgEls.clear();
    this.greetEl = null;
    if (this.msgsEl.querySelector(".pc-msg")) {
      const sep = document.createElement("div");
      sep.className = "pc-msg system";
      sep.textContent = target === "voice" ? "— talking —" : "— back to chat —";
      this.msgsEl.appendChild(sep);
    }

    this.mode = target;
    const s = this.ensureSession();
    this.render();
    try {
      await s.connect();
      if (transcript) s.setContext("conversation", `Continue this conversation. Earlier:\n${transcript}`);
    } catch { /* surfaced via state */ }
  }

  private async toggleCall() {
    const inCall = this.mode === "voice" && (this.status() === "connected" || this.status() === "connecting");
    if (inCall) {
      // End the WebRTC call FIRST so audio + mic stop immediately, regardless
      // of whether the chat-side reconnect that follows succeeds. Without this,
      // a slow chat-token fetch made the hangup feel like "nothing happened".
      try { (this.session as VoiceSession)?.disconnect(); } catch { /* noop */ }
      this.render();
    }
    await this.switchMode(inCall ? "text" : "voice");
  }

  private async onMic() {
    if (this.mode !== "voice") return;
    const s = this.ensureSession() as VoiceSession;
    if (this.status() === "connected") s.toggleMute();
    else await s.connect();
  }

  // ── Voice message (WhatsApp/OpenAI-style dictation) ───────────────────
  // Tap to record → the server "scribe" streams the transcription live into the
  // input as you speak → tap again to stop. NOT a call; the text is editable.

  private toggleRecord() {
    if (this.recState === "recording") void this.stopRecording();
    else if (this.recState === "idle") void this.startRecording();
  }

  private setRecState(s: "idle" | "recording" | "transcribing") {
    this.recState = s;
    this.recBtn.classList.toggle("recording", s === "recording");
    this.recBtn.classList.toggle("busy", s === "transcribing");
    this.recBtn.disabled = s === "transcribing";
    this.recBtn.innerHTML = s === "recording" ? ICONS.stop : ICONS.mic;
    this.recBtn.setAttribute(
      "aria-label",
      s === "recording" ? "Stop recording" : s === "transcribing" ? "Transcribing…" : "Record voice message",
    );
  }

  /** Auto-height: grow the composer with its content (capped), keep the end visible. */
  private autoGrow() {
    const el = this.input;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    el.scrollTop = el.scrollHeight;
  }

  /** Live transcript → input: base text (pre-recording) + streamed transcript. */
  private applyScribeText(t: string) {
    this.input.value = this.recBase && t ? `${this.recBase} ${t}` : (t || this.recBase);
    this.autoGrow();
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private async startRecording() {
    this.recBase = this.input.value.trim();
    const tp = this._tokenProvider;
    const scribe = new LiveScribe({
      server: this.getAttribute("server") || undefined,
      language: (this._config?.language as string) || this.getAttribute("language") || undefined,
      tokenProvider: tp ? () => tp("chat") : undefined,
      onText: (t) => this.applyScribeText(t),
      onStateChange: (s) => {
        if (s === "connecting" || s === "finishing") this.setRecState("transcribing");
        else if (s === "recording") this.setRecState("recording");
      },
      onError: () => { this.scribe = null; this.setRecState("idle"); },
    });
    this.scribe = scribe;
    this.setRecState("transcribing");
    try {
      await scribe.start();
    } catch {
      this.scribe = null;
      this.setRecState("idle");
    }
  }

  private async stopRecording() {
    const s = this.scribe;
    if (!s) { this.setRecState("idle"); return; }
    this.setRecState("transcribing");
    try {
      const text = await s.stop();
      this.applyScribeText(text);
      this.input.focus();
    } catch { /* keep whatever streamed so far */ }
    this.scribe = null;
    this.setRecState("idle");
  }

  // ── Conversation threads (server-side history) ────────────────────────
  // The conversation survives a page refresh: the widget passes `thread` to
  // ChatSession, the SERVER restores the thread's prior messages on connect
  // (seeding the agent's real LLM memory AND emitting chat.history → the
  // bubbles land in state flagged isHistory). localStorage keeps only the
  // thread INDEX (ids/titles/dates) + current pointer — messages never touch
  // the browser storage.

  private historyEnabled(): boolean {
    if (this.hasAttribute("no-history")) return false;
    try { return typeof localStorage !== "undefined"; } catch { return false; }
  }
  private storeKey() { return `pc-chat:${this.getAttribute("agent") || "default"}`; }
  private loadThreads(): StoredThread[] {
    try {
      const ts = JSON.parse(localStorage.getItem(this.storeKey()) || "[]") as StoredThread[];
      return ts.map((t) => ({ id: t.id, title: t.title, at: t.at })); // drop legacy msgs field
    } catch { return []; }
  }
  private saveThreads(ts: StoredThread[]) {
    try { localStorage.setItem(this.storeKey(), JSON.stringify(ts)); } catch { /* quota */ }
  }

  /** user/bot messages currently in state (final text only, incl. restored). */
  private collectMsgs(): { role: string; text: string }[] {
    const st = this.session?.getState() as { messages?: Msg[] } | undefined;
    return (st?.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "bot") && m.text && !m.isInterim)
      .map((m) => ({ role: m.role, text: m.text }));
  }

  /** Update the local thread index (title = first user message, at = now). */
  private persistNow() {
    if (!this.historyEnabled() || !this.threadId) return;
    const st = this.session?.getState() as { messages?: Msg[] } | undefined;
    const msgs = st?.messages ?? [];
    if (!msgs.some((m) => m.role === "user" && !m.isHistory)) return; // no new activity
    const title = (msgs.find((m) => m.role === "user")?.text || "Conversation").slice(0, 60);
    const threads = this.loadThreads().filter((t) => t.id !== this.threadId);
    threads.unshift({ id: this.threadId, title, at: Date.now() });
    this.saveThreads(threads.slice(0, MAX_THREADS));
  }
  private schedulePersist() {
    if (!this.historyEnabled()) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.persistNow(), 600);
  }

  /** On open: adopt the stored current thread id (server restores its messages). */
  private restoreHistory() {
    if (!this.historyEnabled() || this.threadId) return;
    try {
      this.threadId = localStorage.getItem(`${this.storeKey()}:current`) || genThreadId();
      localStorage.setItem(`${this.storeKey()}:current`, this.threadId);
    } catch { this.threadId = genThreadId(); }
  }

  /** Reset the panel to an empty thread (keeps the session torn down). */
  private resetThreadUi() {
    this.teardown(); // persists the current thread index first
    if (this.revealRaf) cancelAnimationFrame(this.revealRaf);
    this.revealRaf = 0; this.streamEl = null;
    this.msgEls.clear();
    this.msgsEl.innerHTML = "";
    this.greetEl = null;
    this.mode = "text";
  }

  private newConversation() {
    this.hideHistMenu();
    this.resetThreadUi();
    this.threadId = genThreadId();
    try { localStorage.setItem(`${this.storeKey()}:current`, this.threadId); } catch { /* noop */ }
    const s = this.ensureSession();
    void s.connect().catch(() => { /* surfaced via state */ });
    this.render();
  }

  private openThread(id: string) {
    this.hideHistMenu();
    if (id === this.threadId) return;
    this.resetThreadUi();
    this.threadId = id;
    try { localStorage.setItem(`${this.storeKey()}:current`, id); } catch { /* noop */ }
    const s = this.ensureSession();
    void s.connect().catch(() => { /* surfaced via state */ });
    this.render();
  }

  private toggleHistMenu() {
    if (!this.histMenu.hidden) { this.hideHistMenu(); return; }
    this.histMenu.innerHTML = "";
    const threads = this.historyEnabled() ? this.loadThreads() : [];
    if (!threads.length) {
      const empty = document.createElement("div");
      empty.className = "pc-histempty";
      empty.textContent = "No past conversations";
      this.histMenu.appendChild(empty);
    }
    for (const t of threads) {
      const row = document.createElement("button");
      row.className = `pc-histrow${t.id === this.threadId ? " active" : ""}`;
      const t1 = document.createElement("span");
      t1.className = "t1";
      t1.textContent = t.title || "Conversation";
      const t2 = document.createElement("span");
      t2.className = "t2";
      const d = new Date(t.at);
      t2.textContent = d.toDateString() === new Date().toDateString()
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { day: "2-digit", month: "short" });
      row.append(t1, t2);
      row.addEventListener("click", () => this.openThread(t.id));
      this.histMenu.appendChild(row);
    }
    this.histMenu.hidden = false;
    this.onDocClick = () => this.hideHistMenu();
    document.addEventListener("click", this.onDocClick, { once: true });
  }
  private hideHistMenu() {
    this.histMenu.hidden = true;
    if (this.onDocClick) { document.removeEventListener("click", this.onDocClick); this.onDocClick = null; }
  }

  private async sendInput() {
    // Sending while dictating = "I'm done": cut the recording immediately and
    // send what already streamed in (don't wait for the final commit).
    if (this.scribe) { this.scribe.cancel(); this.scribe = null; this.setRecState("idle"); }
    const text = this.input.value.trim();
    if (!text) return;
    const s = this.ensureSession();
    // Don't accept input while the chat assistant is busy (streaming a reply or
    // running a tool). The send would no-op server-side; bail before clearing
    // the field so we don't silently eat the user's text.
    if (this.mode !== "voice" && (s as ChatSession).getState().typing) return;
    if (this.status() !== "connected") { try { await s.connect(); } catch { /* surfaced via state */ } }
    if (this.mode === "voice") (s as VoiceSession).sendText(text);
    else (s as ChatSession).send(text);
    this.input.value = "";
    this.autoGrow();
  }

  private onState() {
    const st = this.session?.getState() as { status: string; messages?: Msg[] } | undefined;
    if (st && st.status !== this.prevStatus) {
      this.dispatchEvent(new CustomEvent("pinecall:status", { detail: st.status }));
      this.prevStatus = st.status;
    }
    if (st?.messages) {
      this.dispatchEvent(new CustomEvent("pinecall:transcript", { detail: st.messages }));
      this.schedulePersist();
    }
    this.render();
  }

  private applyTheme() {
    const preset = (this.getAttribute("preset") as VoiceWidgetPreset) || "dark";
    const merged = { ...(PRESETS[preset] ?? PRESETS.dark), ...this._theme };
    // Don't overwrite CSS vars the consumer has already set inline (e.g. via
    // `style={{ "--pm-card-from": ... }}` in React). Inline overrides win.
    for (const [k, cssVar] of Object.entries(THEME_VAR_MAP)) {
      const val = merged[k as keyof VoiceWidgetTheme];
      if (val && cssVar && !this.style.getPropertyValue(cssVar)) {
        this.style.setProperty(cssVar, val);
      }
    }
    const accent = (merged.colorAccent || "124, 58, 237").split(",").map((n) => +n.trim());
    const mul = (f: number) => accent.map((c) => Math.round(Math.min(255, c * f))).join(", ");
    if (!this.style.getPropertyValue("--pm-card-from")) {
      this.style.setProperty("--pm-card-from", `rgb(${mul(0.78)})`);
    }
    if (!this.style.getPropertyValue("--pm-card-to")) {
      this.style.setProperty("--pm-card-to", `rgb(${mul(0.46)})`);
    }
  }

  private syncHeader() {
    this.nameEl.textContent = this.getAttribute("name") || "Agent";
    const avatar = this.getAttribute("avatar");
    this.avatarEl.innerHTML = avatar ? `<img src="${avatar}" alt="" />` : ICONS.chat;
  }

  private render() {
    const voice = this.mode === "voice";
    const st = this.session?.getState() as
      | { status: string; messages: Msg[]; typing?: boolean; agentSpeaking?: boolean; userSpeaking?: boolean; phase?: string; isMuted?: boolean }
      | undefined;
    const status = st?.status ?? "idle";
    const connected = status === "connected";

    // header state
    this.stateEl.classList.toggle("live", connected);
    this.stateEl.querySelector(".lbl")!.textContent =
      status === "connecting" ? "Connecting…"
      : status === "error" ? "Connection error"
      : connected ? (voice ? (st?.agentSpeaking ? "Speaking…" : st?.userSpeaking ? "Listening…" : "On call") : "Online")
      : "Offline";

    // call button — phone (start) vs hangup (in call)
    if (!this.hasAttribute("no-call")) {
      const inCall = voice && (connected || status === "connecting");
      this.callBtn.classList.toggle("hangup", inCall);
      this.callBtn.innerHTML = inCall ? ICONS.hangup : ICONS.phone;
      this.callBtn.setAttribute("aria-label", inCall ? "End call" : "Start call");
    }

    // mic button — only during a voice call (call-mute control)
    this.micBtn.hidden = !voice;
    if (voice) {
      this.micBtn.classList.toggle("live", connected && !st?.isMuted);
      this.micBtn.classList.toggle("muted", connected && !!st?.isMuted);
      this.micBtn.innerHTML = st?.isMuted ? ICONS.micOff : ICONS.mic;
    }

    // voice-message record button — only in text mode (opt out with `no-voice-message`)
    this.recBtn.hidden = voice || this.hasAttribute("no-voice-message");

    this.renderMessages(st, voice, connected);
  }

  private renderMessages(
    st: { messages?: Msg[]; typing?: boolean; phase?: string } | undefined,
    voice: boolean,
    connected: boolean,
  ) {
    const messages = (st?.messages ?? []).filter((m) => m.role === "system" || m.text || m.isInterim);
    const typing = voice ? st?.phase === "thinking" : !!st?.typing;
    const hasHistory = messages.some((m) => m.isHistory);

    // Client-side greeting bubble (text chat has no server say→client path).
    // Skipped when a past conversation was restored — don't re-greet mid-thread.
    const greetingText = !voice && !hasHistory ? this.getAttribute("greeting") : null;
    if (!greetingText && this.greetEl) { this.greetEl.remove(); this.greetEl = null; }
    else if (greetingText) {
      if (!this.greetEl) {
        this.greetEl = document.createElement("div");
        this.greetEl.className = "pc-msg bot";
        (this.greetEl as { _src?: string })._src = greetingText;
        this.greetEl.innerHTML = renderMd(greetingText);
        this.msgsEl.prepend(this.greetEl);
      } else if ((this.greetEl as { _src?: string })._src !== greetingText) {
        (this.greetEl as { _src?: string })._src = greetingText;
        this.greetEl.innerHTML = renderMd(greetingText);
      }
    }

    if (!messages.length && !typing) {
      // no placeholder if a greeting or any (frozen) bubble is already shown
      if (!greetingText && !this.msgsEl.querySelector(".pc-msg") && !this.msgsEl.querySelector(".pc-empty")) {
        const empty = document.createElement("div");
        empty.className = "pc-empty";
        empty.textContent = connected ? "Say hi 👋" : "Start the conversation…";
        this.msgsEl.appendChild(empty);
      }
      return;
    }
    this.msgsEl.querySelector(".pc-empty")?.remove();

    let added = false, lastChanged = false;
    const lastId = messages.length ? messages[messages.length - 1]!.id : -1;
    for (const m of messages) {
      let el = this.msgEls.get(m.id) as (HTMLDivElement & { _target?: string; _shown?: number }) | undefined;
      if (!el) { el = document.createElement("div"); this.msgsEl.appendChild(el); this.msgEls.set(m.id, el); added = true; }
      const streaming = !!(m.isStreaming || m.speaking) && !!m.text;
      const cls = ["pc-msg", m.role, m.isHistory ? "hist" : "", m.isInterim ? "interim" : "", streaming ? "streaming" : "", m.interrupted ? "interrupted" : ""]
        .filter(Boolean).join(" ");
      if (el.className !== cls) el.className = cls;

      if (streaming) {
        if ((el._shown ?? 0) > m.text.length) el._shown = 0;
        el._target = m.text;
        this.streamEl = el;
        this.startReveal();
      } else {
        el._target = undefined;
        if (this.setBubble(el, m.text, m.role) && m.id === lastId) lastChanged = true;
      }
    }

    // Divider between restored history and the live conversation.
    if (hasHistory && !this.msgsEl.querySelector(".pc-histsep")) {
      const sep = document.createElement("div");
      sep.className = "pc-msg system pc-histsep";
      sep.textContent = "— earlier —";
      const firstLive = messages.find((m) => !m.isHistory);
      const anchor = firstLive ? this.msgEls.get(firstLive.id) : null;
      if (anchor) this.msgsEl.insertBefore(sep, anchor);
      else this.msgsEl.appendChild(sep);
    }

    let dots = this.msgsEl.querySelector<HTMLDivElement>(".pc-typing");
    if (typing && !dots) {
      dots = document.createElement("div");
      dots.className = "pc-typing";
      dots.innerHTML = "<span></span><span></span><span></span>";
      this.msgsEl.appendChild(dots); added = true;
    } else if (!typing && dots) {
      dots.remove();
    } else if (typing && dots) {
      this.msgsEl.appendChild(dots);
    }

    if (added || lastChanged) this.msgsEl.scrollTop = this.msgsEl.scrollHeight;
  }

  /** Set a bubble's content: markdown for bot replies, literal text otherwise. */
  private setBubble(el: HTMLElement, text: string, role: string): boolean {
    if (role === "bot") {
      const html = renderMd(text);
      if ((el as { _html?: string })._html === html) return false;
      (el as { _html?: string })._html = html;
      el.innerHTML = html;
      return true;
    }
    if (el.textContent === text) return false;
    el.textContent = text;
    return true;
  }

  /** rAF character-by-character reveal of the streaming bot message. */
  private startReveal() {
    if (this.revealRaf) return;
    const CHARS_PER_FRAME = 2;
    const tick = () => {
      const el = this.streamEl;
      if (!el || el._target === undefined) { this.revealRaf = 0; return; }
      const shown = el._shown ?? 0;
      if (shown < el._target.length) {
        const next = Math.min(shown + CHARS_PER_FRAME, el._target.length);
        el._shown = next;
        el.innerHTML = renderMd(el._target.slice(0, next)); // streaming bubbles are always bot → markdown
        this.msgsEl.scrollTop = this.msgsEl.scrollHeight;
        this.revealRaf = requestAnimationFrame(tick);
      } else {
        this.revealRaf = 0;
      }
    };
    this.revealRaf = requestAnimationFrame(tick);
  }
}
