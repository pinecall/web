/**
 * VoiceSession — Framework-agnostic WebRTC voice client for Pinecall agents.
 *
 * Extends EventTarget. Two ways to consume:
 *   1. session.subscribe(cb) + session.getState() — for React useSyncExternalStore
 *   2. session.addEventListener('status' | 'phase' | 'message' | 'error' | 'event' | 'change', cb)
 *
 * WebRTC flow: token → ICE → mic → PeerConnection → DataChannel → SDP offer/answer
 */
import type {
  VoiceSessionState,
  VoiceSessionOptions,
  TranscriptMessage,
  ToolUI,
} from "./types";

const INITIAL_STATE: VoiceSessionState = {
  status: "idle",
  error: null,
  isMuted: false,
  phase: "idle",
  userSpeaking: false,
  agentSpeaking: false,
  duration: 0,
  messages: [],
  toolCalls: [],
  idleWarning: null,
};

export class VoiceSession extends EventTarget {
  private state: VoiceSessionState = { ...INITIAL_STATE };
  private listeners = new Set<() => void>();

  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private dc: RTCDataChannel | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private ping: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private botWords: Record<string, string[]> = {};

  constructor(private opts: VoiceSessionOptions) {
    super();
  }

  /** Read-only snapshot of current state (stable reference until next mutation). */
  getState(): Readonly<VoiceSessionState> {
    return this.state;
  }

  /** Subscribe to ANY state change (for React useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(patch: Partial<VoiceSessionState>): void {
    const prev = this.state;
    this.state = { ...prev, ...patch };
    for (const l of this.listeners) l();

    if (patch.status !== undefined && patch.status !== prev.status) {
      this.dispatchEvent(
        new CustomEvent("status", { detail: { status: this.state.status } }),
      );
    }
    if (patch.phase !== undefined && patch.phase !== prev.phase) {
      this.dispatchEvent(
        new CustomEvent("phase", { detail: { phase: this.state.phase } }),
      );
    }
    if (
      patch.error !== undefined &&
      patch.error !== null &&
      patch.error !== prev.error
    ) {
      this.dispatchEvent(
        new CustomEvent("error", { detail: { error: this.state.error } }),
      );
    }
    this.dispatchEvent(
      new CustomEvent("change", { detail: { state: this.state } }),
    );
  }

  private setMessages(
    updater: (prev: TranscriptMessage[]) => TranscriptMessage[],
  ): void {
    const next = updater(this.state.messages);
    this.setState({ messages: next });
    // Emit message-level event for the last touched message (best effort).
    const last = next[next.length - 1];
    if (last) {
      this.dispatchEvent(
        new CustomEvent("message", { detail: { message: last } }),
      );
    }
  }

  private cleanup(): void {
    if (this.ping) {
      clearInterval(this.ping);
      this.ping = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.dc = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
      this.audio = null;
    }
    this.botWords = {};
    this.setState({
      isMuted: false,
      phase: "idle",
      userSpeaking: false,
      agentSpeaking: false,
      idleWarning: null,
    });
  }

  async connect(): Promise<void> {
    if (this.pc) return;
    try {
      this.setState({
        status: "connecting",
        error: null,
        duration: 0,
        messages: [],
      });
      this.botWords = {};
      const base = (this.opts.server ?? "https://voice.pinecall.io").replace(
        /\/$/,
        "",
      );

      // Fetch token — use tokenProvider (backend proxy) or direct fetch (allowedOrigins)
      let token: string;
      let voiceServer: string;
      if (this.opts.tokenProvider) {
        const t = await this.opts.tokenProvider();
        token = t.token;
        voiceServer = t.server;
      } else {
        const tRes = await fetch(
          `${base}/webrtc/token?agent_id=${encodeURIComponent(this.opts.agent)}`,
        );
        if (!tRes.ok) throw new Error(`Token: ${tRes.status}`);
        const t = await tRes.json();
        token = t.token;
        voiceServer = t.server;
      }
      if (!voiceServer) throw new Error("Token response missing server URL");

      let ice: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
      try {
        const r = await fetch(`${voiceServer}/webrtc/ice-servers`);
        if (r.ok) {
          const d = await r.json();
          ice = d.iceServers || d.ice_servers || ice;
        }
      } catch {
        /* stun fallback */
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const pc = new RTCPeerConnection({ iceServers: ice });
      this.pc = pc;
      this.stream.getTracks().forEach((t) => pc.addTrack(t, this.stream!));

      pc.ontrack = (e) => {
        if (!this.audio) {
          this.audio = new Audio();
          this.audio.autoplay = true;
        }
        this.audio.srcObject = e.streams[0];
      };

      const dc = pc.createDataChannel("events", { ordered: true });
      this.dc = dc;
      dc.onopen = () => {
        this.ping = setInterval(() => {
          if (dc.readyState === "open") dc.send("ping");
        }, 1000);
      };
      dc.onmessage = (msg) => this.handleDataChannelMessage(msg);

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          this.setState({ status: "connected", phase: "listening" });
          this.startedAt = Date.now();
          this.timer = setInterval(() => {
            this.setState({
              duration: Math.floor((Date.now() - this.startedAt) / 1000),
            });
          }, 1000);
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          this.cleanup();
          this.setState({ status: "idle" });
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        const t = setTimeout(resolve, 2000);
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(t);
            resolve();
          }
        };
      });

      const offerBody: Record<string, unknown> = {
        sdp: pc.localDescription!.sdp,
        type: pc.localDescription!.type,
        token,
      };
      if (this.opts.config && Object.keys(this.opts.config).length > 0) {
        offerBody.config = this.opts.config;
      }
      if (this.opts.metadata && Object.keys(this.opts.metadata).length > 0) {
        offerBody.metadata = this.opts.metadata;
      }

      const res = await fetch(`${voiceServer}/webrtc/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerBody),
      });
      if (!res.ok) throw new Error(`Offer: ${res.status}`);
      const answer = await res.json();
      await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp });
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : String(err),
        status: "error",
      });
      this.cleanup();
    }
  }

  private handleDataChannelMessage(msg: MessageEvent): void {
    let d: any;
    try {
      d = JSON.parse(msg.data);
    } catch {
      return; // ignore non-JSON
    }

    switch (d.event) {
      // ── User speech (STT) ──
      case "speech.started":
        this.setState({ userSpeaking: true, idleWarning: null });
        break;
      case "speech.ended":
        this.setState({ userSpeaking: false });
        break;

      case "user.speaking":
        if (d.text) {
          this.setMessages((prev) => {
            const idx = prev.findLastIndex(
              (m) => m.role === "user" && m.isInterim,
            );
            if (idx >= 0) {
              return prev.map((m, i) =>
                i === idx ? { ...m, text: d.text } : m,
              );
            }
            return [
              ...prev,
              {
                id: Date.now(),
                role: "user",
                text: d.text,
                isInterim: true,
              },
            ];
          });
        }
        this.setState({ phase: "listening", userSpeaking: true });
        break;

      case "user.message":
        if (d.text) {
          this.setMessages((prev) => {
            const idx = prev.findLastIndex(
              (m) => m.role === "user" && m.isInterim,
            );
            if (idx >= 0) {
              return prev.map((m, i) =>
                i === idx ? { ...m, text: d.text, isInterim: false } : m,
              );
            }
            return [
              ...prev,
              {
                id: Date.now(),
                role: "user",
                text: d.text,
                isInterim: false,
              },
            ];
          });
        }
        this.setState({ userSpeaking: false, phase: "thinking" });
        break;

      // ── Turn detection ──
      case "turn.pause":
        this.setState({ phase: "pause" });
        break;
      case "turn.end":
        this.setState({ phase: "thinking", userSpeaking: false });
        break;
      case "turn.resumed":
        this.setState({ phase: "listening" });
        break;

      // ── Bot speech (TTS word-by-word) ──
      case "bot.speaking":
        if (d.message_id) {
          this.botWords[d.message_id] = [];
          // Don't create empty bot message here — bot.word creates it on first word.
          // This prevents phantom dots when LLM goes straight to tool calls.
        }
        break;

      case "bot.word":
        if (d.message_id && d.word) {
          const ref = this.botWords;
          if (!ref[d.message_id]) ref[d.message_id] = [];
          const idx = d.word_index ?? ref[d.message_id].length;
          ref[d.message_id][idx] = d.word;
          const newText = ref[d.message_id].filter(Boolean).join(" ");
          this.setMessages((prev) => {
            const mi = prev.findIndex((m) => m.messageId === d.message_id);
            if (mi >= 0)
              return prev.map((m, i) =>
                i === mi ? { ...m, text: newText } : m,
              );
            return [
              ...prev,
              {
                id: Date.now(),
                role: "bot",
                text: newText,
                messageId: d.message_id,
                speaking: true,
              },
            ];
          });
          this.setState({ agentSpeaking: true, phase: "speaking" });
        }
        break;

      case "bot.finished":
        if (d.message_id) {
          this.setMessages((prev) => {
            const msg = prev.find((m) => m.messageId === d.message_id);
            // Remove empty bot messages entirely (LLM went straight to tool call)
            if (msg && !msg.text && !d.text) {
              return prev.filter((m) => m.messageId !== d.message_id);
            }
            return prev.map((m) =>
              m.messageId === d.message_id
                ? { ...m, speaking: false, ...(d.text ? { text: d.text } : {}) }
                : m,
            );
          });
        }
        this.setState({ agentSpeaking: false, phase: "listening" });
        break;

      case "bot.interrupted":
        if (d.message_id) {
          this.setMessages((prev) =>
            prev.map((m) =>
              m.messageId === d.message_id
                ? { ...m, speaking: false, interrupted: true }
                : m,
            ),
          );
        }
        this.setState({ agentSpeaking: false, phase: "listening" });
        break;

      // ── Audio metrics ──
      case "audio.metrics":
        if (d.source === "user" && d.is_speech !== undefined) {
          this.setState({ userSpeaking: d.is_speech });
        }
        break;

      // ── Session limits ──
      case "session.idle_warning":
        this.setState({ idleWarning: d.remaining_seconds ?? 0 });
        break;
      case "session.timeout":
        // Server will hang up — disconnect immediately
        this.disconnect();
        break;

      // ── Tool events (server-side LLM) ──
      case "llm.tool_call": {
        if (d.tool_calls?.length) {
          // Inline system messages in transcript
          this.setMessages((prev) => [
            ...prev,
            ...d.tool_calls.map((tc: any) => ({
              id: Date.now() + Math.random(),
              role: "system" as const,
              text: `🔧 Using ${tc.name}…`,
              toolCallId: tc.id,
            })),
          ]);

          // Always track in toolCalls state (for ThinkingIndicator + trackedTools UI)
          const tracked = this.opts.trackedTools;
          const newEntries: ToolUI[] = d.tool_calls
            .filter((tc: any) => !tracked || tracked.includes(tc.name))
            .map((tc: any) => {
              let args: Record<string, unknown> = {};
              try {
                args =
                  typeof tc.arguments === "string"
                    ? JSON.parse(tc.arguments)
                    : tc.arguments ?? {};
              } catch {
                /* leave empty */
              }
              return {
                toolCallId: tc.id,
                name: tc.name,
                arguments: args,
                timestamp: Date.now(),
              };
            });
          if (newEntries.length) {
            this.setState({
              toolCalls: [...this.state.toolCalls, ...newEntries],
            });
          }
        }
        break;
      }

      case "llm.tool_result": {
        if (d.tool_call_id) {
          // Recover tool name from the system message we added on llm.tool_call
          const sysMsg = this.state.messages.find(
            (m) => m.toolCallId === d.tool_call_id,
          );
          const toolName = (d.name || sysMsg?.text?.match(/Using (\S+)/)?.[1] || "Tool").replace(/…$/, "");
          this.setMessages((prev) =>
            prev.map((m) =>
              m.toolCallId === d.tool_call_id
                ? { ...m, text: `✓ ${toolName}` }
                : m,
            ),
          );

          // Update tracked tool state
          const prev = this.state.toolCalls;
          const idx = prev.findIndex(
            (t) => t.toolCallId === d.tool_call_id,
          );
          if (idx >= 0) {
            let parsed: unknown = d.result;
            if (typeof parsed === "string") {
              try {
                parsed = JSON.parse(parsed);
              } catch {
                /* keep as string */
              }
            }
            const updated = prev.map((t, i) =>
              i === idx ? { ...t, result: parsed } : t,
            );
            this.setState({ toolCalls: updated });
          }
        }
        break;
      }
    }

    // Emit raw event for power users (does not affect state mutations above).
    this.dispatchEvent(new CustomEvent("event", { detail: d }));
  }

  disconnect(): void {
    this.cleanup();
    this.setState({ status: "idle" });
  }

  toggleMute(): void {
    this.setMuted(!this.state.isMuted);
  }

  setMuted(muted: boolean): void {
    const stream = this.stream;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
    const dc = this.dc;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify({ action: muted ? "mute" : "unmute" }));
    }
    this.setState({ isMuted: muted });
  }

  /**
   * Send a configuration update via DataChannel during an active call.
   * Use this for mid-call language/voice/STT switching.
   *
   * @example
   * ```ts
   * session.configure({ voice: "coral", stt: "deepgram", language: "es" });
   * ```
   */
  configure(config: Record<string, unknown>): void {
    const dc = this.dc;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify({ action: "configure", ...config }));
    }
  }

  /**
   * Inject text into the conversation as if the user spoke it.
   *
   * Use this for click-based interactions in tool UIs (e.g., selecting a
   * calendar slot). The server routes the text to the LLM, producing the
   * same effect as the user speaking.
   *
   * @example
   * ```ts
   * session.sendText("I'd like the 10:00 AM slot");
   * ```
   */
  sendText(text: string): void {
    const dc = this.dc;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify({ action: "inject_text", text }));
    }
  }

  /**
   * Remove a tool UI entry from state.
   *
   * Call this after the user interacts with a tool UI (e.g., selects a slot)
   * to dismiss the rendered component from the transcript.
   */
  dismissTool(toolCallId: string): void {
    this.setState({
      toolCalls: this.state.toolCalls.filter(
        (t) => t.toolCallId !== toolCallId,
      ),
    });
  }

  /**
   * Set or clear a keyed context block in the LLM system prompt.
   *
   * Use this to inject dynamic UI state (form data, selections, etc.)
   * into the agent's prompt so it can see what the user is doing on screen.
   * Each key is a named section — setting the same key replaces its value.
   * Pass `null` to remove a context key.
   *
   * @example
   * ```ts
   * // Inject form state so the agent sees what's filled
   * session.setContext("contact_form", JSON.stringify({
   *   name: "John",
   *   email: "john@example.com",
   *   phone: "",
   * }));
   *
   * // Clear when form is submitted
   * session.setContext("contact_form", null);
   * ```
   */
  setContext(key: string, value: string | null): void {
    const dc = this.dc;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify({ action: "set_context", key, value }));
    }
  }

  /**
   * Update session options before the next `connect()` call.
   * Has no effect on an already-connected session — use `configure()` for that.
   */
  updateOptions(
    patch: Partial<Pick<VoiceSessionOptions, "config" | "metadata">>,
  ): void {
    if (patch.config !== undefined) {
      this.opts = { ...this.opts, config: patch.config };
    }
    if (patch.metadata !== undefined) {
      this.opts = { ...this.opts, metadata: patch.metadata };
    }
  }

  /** Tear down the session and clear subscribers. After this, do not reuse. */
  destroy(): void {
    this.cleanup();
    this.setState({ status: "idle" });
    this.listeners.clear();
  }
}
