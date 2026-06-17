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
import { PRESETS } from "../widget/presets";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";
import { CHATBOX_CSS } from "./styles";

type TokenProvider = (channel: "chat" | "webrtc") => Promise<{ token: string; server: string }>;

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
  close: "✕",
};

interface Msg { id: number; role: string; text: string; isInterim?: boolean; isStreaming?: boolean; speaking?: boolean; interrupted?: boolean; }
type AnySession = VoiceSession | ChatSession;

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

  private fab!: HTMLButtonElement;
  private panel!: HTMLDivElement;
  private msgsEl!: HTMLDivElement;
  private input!: HTMLInputElement;
  private micBtn!: HTMLButtonElement;
  private callBtn!: HTMLButtonElement;
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
      <div class="pc-panel" role="dialog" aria-modal="false">
        <div class="pc-head">
          <div class="pc-avatar">${ICONS.chat}</div>
          <div class="pc-id"><div class="pc-name">Agent</div><div class="pc-state"><span class="dot"></span><span class="lbl">Offline</span></div></div>
          <button class="pc-close" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="pc-msgs"></div>
        <div class="pc-inputbar">
          <button class="pc-call" aria-label="Start call">${ICONS.phone}</button>
          <button class="pc-mic" aria-label="Mute" hidden>${ICONS.mic}</button>
          <input class="pc-input" type="text" placeholder="Type a message…" />
          <button class="pc-send" aria-label="Send">${ICONS.send}</button>
        </div>
      </div>`;
    root.append(style, c);

    this.fab = c.querySelector(".pc-fab")!;
    this.panel = c.querySelector(".pc-panel")!;
    this.msgsEl = c.querySelector(".pc-msgs")!;
    this.input = c.querySelector(".pc-input")!;
    this.micBtn = c.querySelector(".pc-mic")!;
    this.callBtn = c.querySelector(".pc-call")!;
    this.nameEl = c.querySelector(".pc-name")!;
    this.stateEl = c.querySelector(".pc-state")!;
    this.avatarEl = c.querySelector(".pc-avatar")!;

    this.fab.addEventListener("click", () => this.open());
    c.querySelector(".pc-close")!.addEventListener("click", () => this.close());
    c.querySelector(".pc-send")!.addEventListener("click", () => this.sendInput());
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); this.sendInput(); }
    });
    this.micBtn.addEventListener("click", () => this.onMic());
    this.callBtn.addEventListener("click", () => this.toggleCall());
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
  disconnectedCallback() { this.teardown(); }
  attributeChangedCallback(name: string) {
    if (name === "preset") this.applyTheme();
    if (name === "name" || name === "avatar") this.syncHeader();
    if (name === "no-call") this.callBtn.hidden = this.hasAttribute("no-call");
    if (name === "open") { this.hasAttribute("open") ? this.open() : this.close(); }
  }

  // ── public API ──
  open() {
    this.panel.classList.add("open");
    this.fab.hidden = true;
    // text-first unless auto-call → start directly in a voice call
    this.mode = this.hasAttribute("auto-call") ? "voice" : "text";
    const s = this.ensureSession();
    if (this.status() === "idle") void s.connect();
    this.input.focus();
    this.render();
    this.dispatchEvent(new CustomEvent("pinecall:open"));
  }
  close() {
    this.panel.classList.remove("open");
    this.fab.hidden = this.hasAttribute("no-fab");
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
      });
    }
    this.unsub = this.session.subscribe(() => this.onState());
    return this.session;
  }
  private teardown() {
    this.unsub?.(); this.unsub = null;
    this.session?.destroy(); this.session = null;
    this.prevStatus = undefined;
  }

  /** Switch between text chat (ChatSession) and a WebRTC voice call (VoiceSession). */
  private async switchMode(target: "text" | "voice") {
    if (this.mode === target && this.session) return;

    // Carry the conversation across the text↔voice switch. The two transports
    // are separate server sessions, so we (1) keep the visible bubbles as frozen
    // history and (2) inject the prior transcript as context into the new
    // session so the agent continues where it left off.
    const prev = ((this.session?.getState() as { messages?: Msg[] })?.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "bot") && m.text)
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
    await this.switchMode(inCall ? "text" : "voice");
  }

  private async onMic() {
    if (this.mode !== "voice") return;
    const s = this.ensureSession() as VoiceSession;
    if (this.status() === "connected") s.toggleMute();
    else await s.connect();
  }

  private async sendInput() {
    const text = this.input.value.trim();
    if (!text) return;
    const s = this.ensureSession();
    if (this.status() !== "connected") { try { await s.connect(); } catch { /* surfaced via state */ } }
    if (this.mode === "voice") (s as VoiceSession).sendText(text);
    else (s as ChatSession).send(text);
    this.input.value = "";
  }

  private onState() {
    const st = this.session?.getState() as { status: string; messages?: Msg[] } | undefined;
    if (st && st.status !== this.prevStatus) {
      this.dispatchEvent(new CustomEvent("pinecall:status", { detail: st.status }));
      this.prevStatus = st.status;
    }
    if (st?.messages) this.dispatchEvent(new CustomEvent("pinecall:transcript", { detail: st.messages }));
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

    // mic button — only during a voice call
    this.micBtn.hidden = !voice;
    if (voice) {
      this.micBtn.classList.toggle("live", connected && !st?.isMuted);
      this.micBtn.classList.toggle("muted", connected && !!st?.isMuted);
      this.micBtn.innerHTML = st?.isMuted ? ICONS.micOff : ICONS.mic;
    }

    this.renderMessages(st, voice, connected);
  }

  private renderMessages(
    st: { messages?: Msg[]; typing?: boolean; phase?: string } | undefined,
    voice: boolean,
    connected: boolean,
  ) {
    const messages = (st?.messages ?? []).filter((m) => m.role === "system" || m.text || m.isInterim);
    const typing = voice ? st?.phase === "thinking" : !!st?.typing;

    // Client-side greeting bubble (text chat has no server say→client path).
    const greetingText = !voice ? this.getAttribute("greeting") : null;
    if (!greetingText && this.greetEl) { this.greetEl.remove(); this.greetEl = null; }
    else if (greetingText) {
      if (!this.greetEl) {
        this.greetEl = document.createElement("div");
        this.greetEl.className = "pc-msg bot";
        this.greetEl.textContent = greetingText;
        this.msgsEl.prepend(this.greetEl);
      } else if (this.greetEl.textContent !== greetingText) {
        this.greetEl.textContent = greetingText;
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
      const cls = ["pc-msg", m.role, m.isInterim ? "interim" : "", streaming ? "streaming" : "", m.interrupted ? "interrupted" : ""]
        .filter(Boolean).join(" ");
      if (el.className !== cls) el.className = cls;

      if (streaming) {
        if ((el._shown ?? 0) > m.text.length) el._shown = 0;
        el._target = m.text;
        this.streamEl = el;
        this.startReveal();
      } else {
        el._target = undefined;
        if (el.textContent !== m.text) { el.textContent = m.text; if (m.id === lastId) lastChanged = true; }
      }
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
        el.textContent = el._target.slice(0, next);
        this.msgsEl.scrollTop = this.msgsEl.scrollHeight;
        this.revealRaf = requestAnimationFrame(tick);
      } else {
        this.revealRaf = 0;
      }
    };
    this.revealRaf = requestAnimationFrame(tick);
  }
}
