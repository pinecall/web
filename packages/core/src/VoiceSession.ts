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

  constructor(private readonly opts: VoiceSessionOptions) {
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

      const tRes = await fetch(
        `${base}/webrtc/token?agent_id=${encodeURIComponent(this.opts.agent)}`,
      );
      if (!tRes.ok) throw new Error(`Token: ${tRes.status}`);
      const { token, server: voiceServer } = await tRes.json();
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

      const res = await fetch(`${voiceServer}/webrtc/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription!.sdp,
          type: pc.localDescription!.type,
          token,
        }),
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
        this.setState({ userSpeaking: true });
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
          this.setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: "bot",
              text: "",
              messageId: d.message_id,
              speaking: true,
            },
          ]);
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
          this.setMessages((prev) =>
            prev.map((m) =>
              m.messageId === d.message_id
                ? { ...m, speaking: false, ...(d.text ? { text: d.text } : {}) }
                : m,
            ),
          );
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

  /** Tear down the session and clear subscribers. After this, do not reuse. */
  destroy(): void {
    this.cleanup();
    this.setState({ status: "idle" });
    this.listeners.clear();
  }
}
