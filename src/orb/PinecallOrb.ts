/**
 * <pinecall-orb> — framework-agnostic WebRTC voice orb (Custom Element).
 *
 * Wraps the vanilla VoiceSession from @pinecall/web/core in a Shadow-DOM
 * custom element: a pearl orb you click to start/stop a call, with state
 * colors, a status label, and a single live speech bubble. No React.
 *
 * Simple calls only — no transcript panel, tools UI, or multi-channel hub.
 *
 * @example
 * ```html
 * <pinecall-orb agent="mara" name="Mara" preset="midnight"></pinecall-orb>
 * <script type="module">
 *   import "@pinecall/web/orb";
 *   const orb = document.querySelector("pinecall-orb");
 *   orb.tokenProvider = async () => (await fetch("/api/token")).json();
 *   orb.addEventListener("pinecall:status", (e) => console.log(e.detail));
 * </script>
 * ```
 */
import { VoiceSession } from "../core";
import type { TranscriptMessage, VoiceSessionState, VoiceSessionOptions } from "../core";
import { PRESETS } from "../widget/presets";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";
import { ORB_CSS } from "./styles";

/** Map theme keys → CSS custom property names (mirrors VoiceWidget). */
const THEME_VAR_MAP: Record<keyof VoiceWidgetTheme, string> = {
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
  ringColor: "--vw-ring-color",
  panelBg: "--vw-panel-bg",
  panelBorder: "--vw-panel-border",
  bubbleBotBg: "--vw-bubble-bot-bg",
  bubbleBotColor: "--vw-bubble-bot-color",
  bubbleUserColor: "--vw-bubble-user-color",
  labelBg: "--vw-label-bg",
  labelColor: "--vw-label-color",
};

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/**
 * Base class. Falls back to a dummy on the server so importing this module
 * during SSR doesn't throw (`HTMLElement` is undefined in Node). The class
 * is only ever instantiated in the browser, where the real base is used.
 */
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

export class PinecallOrb extends HTMLElementBase {
  static get observedAttributes() {
    return ["agent", "server", "name", "label", "preset", "opens"];
  }

  /** What the orb opens on click: "inline" (captions beside the orb, default),
   * "modal" (a <pinecall-modal>), or "chat" (a <pinecall-chat> chatbox). */
  private launcher: HTMLElement | null = null;

  // ── Properties (objects/functions — cannot be HTML attributes) ──
  private _config?: Record<string, unknown>;
  private _metadata?: Record<string, unknown>;
  private _tokenProvider?: VoiceSessionOptions["tokenProvider"];
  private _theme?: Partial<VoiceWidgetTheme>;

  private session: VoiceSession | null = null;
  private unsubscribe: (() => void) | null = null;
  private prev: Partial<VoiceSessionState> = {};
  private bubbleKey = -1;

  // Shadow DOM nodes
  private wrapEl!: HTMLDivElement;
  private orbEl!: HTMLDivElement;
  private labelEl!: HTMLDivElement;
  private bubbleEl!: HTMLDivElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = ORB_CSS;

    this.wrapEl = document.createElement("div");
    this.wrapEl.className = "vw-wrap";

    this.labelEl = document.createElement("div");
    this.labelEl.className = "vw-label";

    this.bubbleEl = document.createElement("div");
    this.bubbleEl.className = "vw-bubble";
    this.bubbleEl.hidden = true;

    this.orbEl = document.createElement("div");
    this.orbEl.className = "vw-orb";
    this.orbEl.setAttribute("role", "button");
    this.orbEl.setAttribute("tabindex", "0");
    this.orbEl.addEventListener("click", () => this.toggle());
    this.orbEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
    });

    this.wrapEl.append(this.labelEl, this.bubbleEl, this.orbEl);
    root.append(style, this.wrapEl);
  }

  // ── Property accessors ──
  get config() { return this._config; }
  set config(v: Record<string, unknown> | undefined) {
    this._config = v;
    if (this.session) this.session.updateOptions({ config: v });
  }

  get metadata() { return this._metadata; }
  set metadata(v: Record<string, unknown> | undefined) {
    this._metadata = v;
    if (this.session) this.session.updateOptions({ metadata: v });
  }

  get tokenProvider() { return this._tokenProvider; }
  set tokenProvider(v: VoiceSessionOptions["tokenProvider"]) {
    this._tokenProvider = v;
    // tokenProvider is read at connect() time from a fresh session; rebuild if idle
    if (this.session && this.statusOf() === "idle") this.teardownSession();
  }

  get theme() { return this._theme; }
  set theme(v: Partial<VoiceWidgetTheme> | undefined) {
    this._theme = v;
    this.applyTheme();
  }

  // ── Lifecycle ──
  connectedCallback() {
    this.applyTheme();
    this.render(); // initial paint (idle)
  }

  disconnectedCallback() {
    this.teardownSession();
  }

  attributeChangedCallback(name: string, _old: string | null, _val: string | null) {
    if (name === "preset") this.applyTheme();
    if ((name === "agent" || name === "server") && this.session && this.statusOf() === "idle") {
      this.teardownSession();
    }
    this.render();
  }

  // ── Public imperative API (delegates to the session) ──
  async connect(): Promise<void> {
    const s = this.ensureSession();
    if (this.statusOf() === "connected" || this.statusOf() === "connecting") return;
    await s.connect();
  }
  disconnect(): void { this.session?.disconnect(); }
  toggleMute(): void { this.session?.toggleMute(); }
  setMuted(m: boolean): void { this.session?.setMuted(m); }
  configure(cfg: Record<string, unknown>): void { this.session?.configure(cfg); }
  sendText(text: string): void { this.session?.sendText(text); }
  /** Current session state (or null if no session yet). */
  getState(): Readonly<VoiceSessionState> | null { return this.session?.getState() ?? null; }

  private toggle() {
    const opens = this.getAttribute("opens");
    if (opens === "modal" || opens === "chat") return void this.openLauncher(opens);
    const st = this.statusOf();
    if (st === "connected") this.disconnect();
    else if (st === "idle" || st === "error") void this.connect();
  }

  /**
   * opens="modal" | "chat" — the orb becomes a launcher button that opens a
   * <pinecall-modal> / <pinecall-chat> (created once, FAB suppressed so the orb
   * is the only launcher) instead of starting an inline call.
   */
  private async openLauncher(kind: "modal" | "chat") {
    if (!this.launcher) {
      if (kind === "chat") await import("../chatbox/index");
      else await import("../modal/index");
      const tag = kind === "chat" ? "pinecall-chat" : "pinecall-modal";
      const el = document.createElement(tag) as HTMLElement & {
        config?: unknown; metadata?: unknown; tokenProvider?: unknown; theme?: unknown;
      };
      el.setAttribute("no-fab", "");
      for (const a of ["agent", "server", "name", "preset"]) {
        const v = this.getAttribute(a);
        if (v != null) el.setAttribute(a, v);
      }
      // pass through function/object props
      el.config = this._config;
      el.metadata = this._metadata;
      el.tokenProvider = this._tokenProvider;
      el.theme = this._theme;
      // hide the orb while the launcher is open; restore when it closes
      el.addEventListener("pinecall:close", () => { this.style.removeProperty("display"); });
      document.body.appendChild(el);
      this.launcher = el;
    }
    this.style.display = "none";
    (this.launcher as unknown as { open(): void }).open();
  }

  // ── Session management ──
  private ensureSession(): VoiceSession {
    if (this.session) return this.session;
    const agent = this.getAttribute("agent") || "";
    const server = this.getAttribute("server") || undefined;
    const s = new VoiceSession({
      agent,
      server,
      config: this._config,
      metadata: this._metadata,
      tokenProvider: this._tokenProvider,
    });
    this.session = s;
    this.unsubscribe = s.subscribe(() => this.onState());
    return s;
  }

  private teardownSession() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.session?.destroy();
    this.session = null;
    this.prev = {};
    this.render();
  }

  private statusOf(): VoiceSessionState["status"] {
    return this.session?.getState().status ?? "idle";
  }

  // ── State → DOM + events ──
  private onState() {
    const st = this.session?.getState();
    if (!st) return;
    // Emit events on meaningful transitions
    if (st.status !== this.prev.status) {
      this.dispatchEvent(new CustomEvent("pinecall:status", { detail: st.status }));
    }
    if (st.error && st.error !== this.prev.error) {
      this.dispatchEvent(new CustomEvent("pinecall:error", { detail: st.error }));
    }
    if (st.messages !== this.prev.messages) {
      this.dispatchEvent(new CustomEvent("pinecall:transcript", { detail: st.messages }));
    }
    this.prev = st;
    this.render();
  }

  private applyTheme() {
    const presetName = (this.getAttribute("preset") as VoiceWidgetPreset) || "dark";
    const base = PRESETS[presetName] ?? PRESETS.dark;
    const merged = { ...base, ...this._theme };
    // Don't overwrite CSS vars the consumer has already set inline (e.g. via
    // `style={{ "--vw-orb-from": ... }}` in React). Inline overrides win.
    for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
      const val = merged[key as keyof VoiceWidgetTheme];
      if (val !== undefined && !this.style.getPropertyValue(cssVar)) {
        this.style.setProperty(cssVar, val);
      }
    }
  }

  private render() {
    const st = this.session?.getState();
    const status = st?.status ?? "idle";
    const isActive = status === "connected";
    const name = this.getAttribute("name") || "Agent";
    const idleLabel = this.getAttribute("label") || `Talk to ${name}`;

    // Orb state class
    const orbState = st?.agentSpeaking
      ? "speaking"
      : st?.userSpeaking
        ? "user-speaking"
        : st?.phase === "thinking"
          ? "thinking"
          : st?.idleWarning != null
            ? "idle-warning"
            : isActive
              ? "active"
              : status === "connecting"
                ? "connecting"
                : "";
    this.orbEl.className = `vw-orb ${orbState}`.trim();
    this.orbEl.setAttribute("aria-label", isActive ? "End call" : idleLabel);

    this.wrapEl.className = `vw-wrap ${isActive ? "is-live" : ""}`.trim();

    // Label
    this.labelEl.textContent =
      status === "connecting"
        ? "Connecting"
        : status === "error"
          ? st?.error || "Connection failed"
          : !isActive
            ? idleLabel
            : `${name} · ${fmt(st?.duration ?? 0)}`;

    // Active bubble — most recent meaningful message
    const messages = st?.messages ?? [];
    const activeBubble = isActive
      ? [...messages].reverse().find((m) => m.role === "user" || (m.role === "bot" && !!m.text))
      : undefined;

    if (!activeBubble) {
      this.bubbleEl.hidden = true;
      this.bubbleKey = -1;
      return;
    }
    this.renderBubble(activeBubble);
  }

  private renderBubble(msg: TranscriptMessage) {
    const cls = [
      "vw-bubble",
      msg.role === "user" ? "vw-bubble--user" : "vw-bubble--bot",
      msg.isInterim ? "vw-interim" : "",
      msg.speaking ? "vw-speaking" : "",
      msg.interrupted ? "vw-interrupted" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Re-trigger the entrance animation only when the message changes
    const isNew = msg.id !== this.bubbleKey;
    if (isNew) {
      this.bubbleKey = msg.id;
      this.bubbleEl.style.animation = "none";
      // force reflow so the animation restarts
      void this.bubbleEl.offsetWidth;
      this.bubbleEl.style.animation = "";
    }
    this.bubbleEl.className = cls;
    this.bubbleEl.hidden = false;

    if (msg.text) {
      this.bubbleEl.textContent = msg.text;
    } else {
      this.bubbleEl.innerHTML =
        '<span class="vw-dots"><span></span><span></span><span></span></span>';
    }
  }
}
