/**
 * <pinecall-modal> — a glass call modal for Pinecall agents (Custom Element).
 *
 * Phase 2a: voice call screen (iOS-call style) wrapping VoiceSession —
 * header, big animated orb, waveform, status line, mute/hangup controls, and
 * a text input to type during the call (sendText → the bot replies in voice
 * and text). A launcher FAB opens the modal. No React.
 *
 * Channels picker, chat mode, and "call me" land in 2b/2c.
 *
 * @example
 * ```html
 * <pinecall-modal agent="mara" name="Mara"></pinecall-modal>
 * <script type="module">
 *   import "@pinecall/web/modal";
 *   document.querySelector("pinecall-modal").tokenProvider =
 *     async () => (await fetch("/api/token")).json();
 * </script>
 * ```
 */
import { VoiceSession } from "../core";
import type { VoiceSessionState, VoiceSessionOptions } from "../core";
import { PRESETS } from "../widget/presets";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";
import { MODAL_CSS } from "./styles";

const THEME_VAR_MAP: Partial<Record<keyof VoiceWidgetTheme, string>> = {
  orbFrom: "--vw-orb-from",
  orbMid: "--vw-orb-mid",
  orbTo: "--vw-orb-to",
  colorConnecting: "--vw-color-connecting",
  colorActive: "--vw-color-active",
  colorUserSpeaking: "--vw-color-user-speaking",
  colorSpeaking: "--vw-color-speaking",
  colorThinking: "--vw-color-thinking",
  colorWarning: "--vw-color-warning",
  colorAccent: "--vw-color-accent",
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const ICONS = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
  micOff: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
  hangup: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"/></svg>',
  keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>',
  voice: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>',
};

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

export class PinecallModal extends HTMLElementBase {
  static get observedAttributes() {
    return ["agent", "server", "name", "preset", "avatar", "open", "visual"];
  }

  private _config?: Record<string, unknown>;
  private _metadata?: Record<string, unknown>;
  private _tokenProvider?: VoiceSessionOptions["tokenProvider"];
  private _theme?: Partial<VoiceWidgetTheme>;

  private session: VoiceSession | null = null;
  private unsub: (() => void) | null = null;
  private prevStatus?: string;

  // nodes
  private fab!: HTMLButtonElement;
  private overlay!: HTMLDivElement;
  private orbEl!: HTMLDivElement;
  private waveEl!: HTMLDivElement;
  private statusEl!: HTMLDivElement;
  private timerEl!: HTMLDivElement;
  private subEl!: HTMLDivElement;
  private nameEl!: HTMLDivElement;
  private avatarEl!: HTMLDivElement;
  private micBtn!: HTMLButtonElement;
  private textbar!: HTMLDivElement;
  private input!: HTMLInputElement;
  private cardEl!: HTMLDivElement;
  private msgsEl!: HTMLDivElement;
  private chatStatusEl!: HTMLDivElement;
  private kbdBtn!: HTMLButtonElement;
  private captionEl!: HTMLDivElement;
  private actEl!: HTMLSpanElement;
  private provEl!: HTMLSpanElement;
  private stepEls: HTMLDivElement[] = [];
  private waveBars: HTMLSpanElement[] = [];
  private rms = 0;
  private rafId = 0;
  private onRaw?: (e: Event) => void;
  private msgEls = new Map<number, HTMLDivElement>();

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = MODAL_CSS;

    const wave = Array.from({ length: 21 }, () => "<span></span>").join("");
    const steps = ["Ring", "Listen", "Think", "Speak"]
      .map((s) => `<div class="pm-step"><span class="node"></span><span class="lbl">${s}</span></div>`)
      .join("");
    const container = document.createElement("div");
    container.innerHTML = `
      <button class="pm-fab" part="fab" aria-label="Open call"></button>
      <div class="pm-overlay" role="dialog" aria-modal="true">
        <div class="pm-card">
          <div class="pm-head">
            <div class="pm-avatar">${ICONS.phone}</div>
            <div class="pm-id">
              <div class="pm-name">Agent</div>
              <div class="pm-sub">webrtc</div>
            </div>
            <div class="pm-timer">0:00</div>
          </div>
          <div class="pm-stage">
            <div class="pm-orb"></div>
            <div class="pm-wave">${wave}</div>
            <div class="pm-status">Tap to start</div>
            <div class="pm-caption"></div>
            <div class="pm-substatus"><span class="dot"></span><span class="act"></span><span class="prov"></span></div>
            <div class="pm-steps">${steps}</div>
          </div>
          <div class="pm-chat">
            <div class="pm-msgs"></div>
            <div class="pm-chat-status"></div>
          </div>
          <div class="pm-textbar">
            <input class="pm-input" type="text" placeholder="Type a message…" />
            <button class="pm-send">Send</button>
          </div>
          <div class="pm-controls">
            <button class="pm-btn mic" aria-label="Mute">${ICONS.mic}</button>
            <button class="pm-btn hangup" aria-label="End call">${ICONS.hangup}</button>
            <button class="pm-btn kbd" aria-label="Type">${ICONS.keyboard}</button>
          </div>
        </div>
      </div>`;

    root.append(style, container);

    this.fab = container.querySelector(".pm-fab")!;
    this.overlay = container.querySelector(".pm-overlay")!;
    this.orbEl = container.querySelector(".pm-orb")!;
    this.waveEl = container.querySelector(".pm-wave")!;
    this.statusEl = container.querySelector(".pm-status")!;
    this.timerEl = container.querySelector(".pm-timer")!;
    this.subEl = container.querySelector(".pm-sub")!;
    this.nameEl = container.querySelector(".pm-name")!;
    this.avatarEl = container.querySelector(".pm-avatar")!;
    this.micBtn = container.querySelector(".pm-btn.mic")!;
    this.textbar = container.querySelector(".pm-textbar")!;
    this.input = container.querySelector(".pm-input")!;
    this.cardEl = container.querySelector(".pm-card")!;
    this.msgsEl = container.querySelector(".pm-msgs")!;
    this.chatStatusEl = container.querySelector(".pm-chat-status")!;
    this.captionEl = container.querySelector(".pm-caption")!;
    this.actEl = container.querySelector(".pm-substatus .act")!;
    this.provEl = container.querySelector(".pm-substatus .prov")!;
    this.stepEls = Array.from(container.querySelectorAll<HTMLDivElement>(".pm-step"));
    this.waveBars = Array.from(container.querySelectorAll<HTMLSpanElement>(".pm-wave span"));

    // events
    this.fab.addEventListener("click", () => this.open());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close(); // click backdrop
    });
    this.orbEl.addEventListener("click", () => this.toggleCall());
    this.micBtn.addEventListener("click", () => this.session?.toggleMute());
    container.querySelector(".pm-btn.hangup")!.addEventListener("click", () => this.close());
    this.kbdBtn = container.querySelector(".pm-btn.kbd")!;
    this.kbdBtn.addEventListener("click", () => this.toggleTextMode());
    const sendNow = () => {
      const t = this.input.value.trim();
      if (!t || !this.session) return;
      this.session.sendText(t);
      this.input.value = "";
    };
    container.querySelector(".pm-send")!.addEventListener("click", sendNow);
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); sendNow(); }
    });
  }

  // ── properties ──
  get config() { return this._config; }
  set config(v: Record<string, unknown> | undefined) { this._config = v; this.session?.updateOptions({ config: v }); }
  get metadata() { return this._metadata; }
  set metadata(v: Record<string, unknown> | undefined) { this._metadata = v; this.session?.updateOptions({ metadata: v }); }
  get tokenProvider() { return this._tokenProvider; }
  set tokenProvider(v: VoiceSessionOptions["tokenProvider"]) { this._tokenProvider = v; }
  get theme() { return this._theme; }
  set theme(v: Partial<VoiceWidgetTheme> | undefined) { this._theme = v; this.applyTheme(); }

  // ── lifecycle ──
  connectedCallback() {
    this.applyTheme();
    this.applyVisual();
    this.syncHeader();
    if (this.hasAttribute("no-fab")) this.fab.hidden = true;
    if (this.hasAttribute("open")) this.open();
  }
  disconnectedCallback() { this.stopWave(); this.teardown(); }
  attributeChangedCallback(name: string) {
    if (name === "preset") this.applyTheme();
    if (name === "visual") this.applyVisual();
    if (name === "name" || name === "avatar") this.syncHeader();
    if (name === "open") { this.hasAttribute("open") ? this.open() : this.close(); }
  }

  private applyVisual() {
    this.cardEl?.classList.toggle("visual-wave", this.getAttribute("visual") === "wave");
  }

  // ── public API ──
  open() {
    this.overlay.classList.add("open");
    this.fab.hidden = true;
    this.startWave();
    // auto-start the call when opening (voice channel)
    if (this.status() === "idle") void this.startCall();
    this.render();
    this.dispatchEvent(new CustomEvent("pinecall:open"));
  }
  close() {
    this.overlay.classList.remove("open");
    this.fab.hidden = this.hasAttribute("no-fab");
    this.stopWave();
    this.teardown();
    this.cardEl.classList.remove("text-mode");
    this.msgEls.clear();
    this.msgsEl.innerHTML = "";
    this.render();
    this.dispatchEvent(new CustomEvent("pinecall:close"));
  }

  /** Toggle between the voice (orb) view and the text/transcript view. */
  toggleTextMode() {
    const on = this.cardEl.classList.toggle("text-mode");
    this.kbdBtn.innerHTML = on ? ICONS.voice : ICONS.keyboard;
    this.kbdBtn.setAttribute("aria-label", on ? "Voice view" : "Text view");
    if (on) {
      this.render();
      this.input.focus();
    }
  }
  async startCall() { const s = this.ensureSession(); if (this.status() === "idle") await s.connect(); }

  private toggleCall() {
    const st = this.status();
    if (st === "connected") this.close();
    else if (st === "idle" || st === "error") void this.startCall();
  }

  private status(): VoiceSessionState["status"] { return this.session?.getState().status ?? "idle"; }

  private ensureSession(): VoiceSession {
    if (this.session) return this.session;
    const s = new VoiceSession({
      agent: this.getAttribute("agent") || "",
      server: this.getAttribute("server") || undefined,
      config: this._config,
      metadata: this._metadata,
      tokenProvider: this._tokenProvider,
    });
    this.session = s;
    this.unsub = s.subscribe(() => this.onState());
    // Raw event stream → capture audio.metrics for the waveform.
    this.onRaw = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.event === "audio.metrics") {
        let rms = d.rms || 0;
        if (d.source === "user") rms *= 3;
        rms = Math.sqrt(Math.min(rms, 1));
        this.rms = Math.max(this.rms * 0.3, rms);
      }
    };
    s.addEventListener("event", this.onRaw);
    return s;
  }
  private teardown() {
    this.unsub?.(); this.unsub = null;
    if (this.session && this.onRaw) this.session.removeEventListener("event", this.onRaw);
    this.onRaw = undefined;
    this.session?.destroy(); this.session = null;
    this.prevStatus = undefined;
    this.rms = 0;
  }

  // ── Waveform animation loop (real levels from audio.metrics) ──
  private startWave() {
    if (this.rafId) return;
    const tick = () => {
      const active = this.status() === "connected";
      const rms = this.rms;
      const now = Date.now();
      for (let i = 0; i < this.waveBars.length; i++) {
        const base = active ? 12 : 8;
        const energy = rms * 150;
        const phase = Math.sin(now * 0.004 + i * 0.7) * 0.3 + 0.7;
        const h = base + energy * phase * (0.5 + Math.random() * 0.5);
        this.waveBars[i]!.style.height = `${Math.min(100, Math.max(base, h))}%`;
      }
      this.rms *= 0.9; // decay between metric frames
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
  private stopWave() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private onState() {
    const st = this.session?.getState();
    if (st && st.status !== this.prevStatus) {
      this.dispatchEvent(new CustomEvent("pinecall:status", { detail: st.status }));
      this.prevStatus = st.status;
    }
    this.render();
  }

  private applyTheme() {
    const preset = (this.getAttribute("preset") as VoiceWidgetPreset) || "dark";
    const merged = { ...(PRESETS[preset] ?? PRESETS.dark), ...this._theme };
    for (const [k, cssVar] of Object.entries(THEME_VAR_MAP)) {
      const val = merged[k as keyof VoiceWidgetTheme];
      if (val && cssVar) this.style.setProperty(cssVar, val);
    }
    // Tint the card gradient from the theme accent so it adapts to every preset.
    const accent = (merged.colorAccent || "124, 58, 237").split(",").map((n) => +n.trim());
    const mul = (f: number) => accent.map((c) => Math.round(Math.min(255, c * f))).join(", ");
    this.style.setProperty("--pm-card-from", `rgb(${mul(0.78)})`);
    this.style.setProperty("--pm-card-to", `rgb(${mul(0.46)})`);
  }

  private syncHeader() {
    this.nameEl.textContent = this.getAttribute("name") || "Agent";
    const avatar = this.getAttribute("avatar");
    this.avatarEl.innerHTML = avatar ? `<img src="${avatar}" alt="" />` : ICONS.phone;
  }

  private render() {
    const st = this.session?.getState();
    const status = st?.status ?? "idle";
    const isActive = status === "connected";

    const orbState = st?.agentSpeaking ? "speaking"
      : st?.userSpeaking ? "user-speaking"
      : st?.phase === "thinking" ? "thinking"
      : st?.idleWarning != null ? "idle-warning"
      : isActive ? "active"
      : status === "connecting" ? "connecting" : "";
    this.orbEl.className = `pm-orb ${orbState}`.trim();

    // Tint the waveform by who's currently speaking.
    this.waveEl.style.setProperty(
      "--pm-wave-color",
      st?.agentSpeaking ? "var(--pm-bot)" : st?.userSpeaking ? "var(--pm-user)" : "",
    );

    this.subEl.textContent = isActive ? "webrtc · live" : "webrtc";
    this.timerEl.textContent = fmt(st?.duration ?? 0);

    this.statusEl.textContent =
      status === "connecting" ? "Connecting…"
      : status === "error" ? (st?.error || "Connection failed")
      : !isActive ? "Tap the orb to start"
      : st?.agentSpeaking ? `${this.getAttribute("name") || "Agent"} is speaking…`
      : st?.userSpeaking ? "Listening…"
      : st?.phase === "thinking" ? "Thinking…"
      : "Connected";

    this.micBtn.classList.toggle("on", !!st?.isMuted);
    this.micBtn.innerHTML = st?.isMuted ? ICONS.micOff : ICONS.mic;

    if (this.cardEl.classList.contains("text-mode")) {
      this.renderTranscript(st);
      this.captionEl.innerHTML = ""; // transcript view owns the text here
    } else {
      this.renderCaption(st, isActive);
      if (this.cardEl.classList.contains("visual-wave")) this.renderWaveExtras(st, status);
    }
  }

  /** Wave mode: phase stepper (Ring·Listen·Think·Speak) + activity sub-status. */
  private renderWaveExtras(st: Readonly<VoiceSessionState> | undefined, status: string) {
    let idx = 0; // Ring
    if (st?.agentSpeaking || st?.phase === "speaking") idx = 3;       // Speak
    else if (st?.phase === "thinking") idx = 2;                        // Think
    else if (status === "connected") idx = 1;                          // Listen
    this.stepEls.forEach((el, i) => {
      el.classList.toggle("done", status !== "idle" && i < idx);
      el.classList.toggle("active", status !== "idle" && i === idx);
    });

    this.actEl.textContent =
      status === "connecting" ? "ringing"
      : status === "error" ? "error"
      : st?.agentSpeaking ? "speaking"
      : st?.phase === "thinking" ? "thinking"
      : st?.userSpeaking ? "transcribing"
      : status === "connected" ? "listening"
      : "idle";
    this.provEl.textContent = this.sttProvider();
  }

  private sttProvider(): string {
    const stt = (this._config?.stt as string) || "";
    const name = stt.split("/")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  }

  /** One live caption line under the orb (latest turn), colored by speaker. */
  private renderCaption(st: Readonly<VoiceSessionState> | undefined, isActive: boolean) {
    const messages = st?.messages ?? [];
    const last = isActive
      ? [...messages].reverse().find((m) => (m.role === "user" || m.role === "bot") && m.text)
      : undefined;
    if (!last) {
      this.captionEl.innerHTML = "";
      return;
    }
    const who = last.role === "user" ? "you" : (this.getAttribute("name") || "agent").toLowerCase();
    this.captionEl.dataset.who = last.role;
    this.captionEl.innerHTML =
      `<span class="who">${escapeHtml(who)}</span><span class="txt">${escapeHtml(last.text)}</span>`;
  }

  /**
   * Render the live transcript as chat bubbles (text-mode view).
   *
   * Reconciles in place — each bubble is created once and only its text/classes
   * are patched on later renders. Rebuilding innerHTML every render() (which
   * fires per `bot.word`) re-triggered the entrance animation → flicker.
   */
  private renderTranscript(st?: Readonly<VoiceSessionState>) {
    const messages = (st?.messages ?? []).filter(
      (m) => m.role === "system" || m.text || m.isInterim,
    );

    if (!messages.length) {
      if (!this.msgsEl.querySelector(".pm-empty")) {
        this.msgsEl.innerHTML = '<div class="pm-empty">Say something, or type below…</div>';
        this.msgEls.clear();
      }
    } else {
      this.msgsEl.querySelector(".pm-empty")?.remove();
      let added = false;
      let lastChanged = false;
      const lastId = messages[messages.length - 1]!.id;
      for (const m of messages) {
        let el = this.msgEls.get(m.id);
        if (!el) {
          el = document.createElement("div");
          this.msgsEl.appendChild(el);
          this.msgEls.set(m.id, el);
          added = true;
        }
        const cls = ["pm-msg", m.role, m.isInterim ? "interim" : "", m.interrupted ? "interrupted" : ""]
          .filter(Boolean)
          .join(" ");
        if (el.className !== cls) el.className = cls;
        if (el.textContent !== m.text) {
          el.textContent = m.text;
          if (m.id === lastId) lastChanged = true;
        }
      }
      if (added || lastChanged) this.msgsEl.scrollTop = this.msgsEl.scrollHeight;
    }

    const name = this.getAttribute("name") || "Agent";
    this.chatStatusEl.textContent = st?.agentSpeaking
      ? `${name} is speaking…`
      : st?.userSpeaking
        ? "Listening…"
        : st?.phase === "thinking"
          ? "Thinking…"
          : st?.status === "connected"
            ? "Connected — talk or type"
            : "";
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
  );
}
