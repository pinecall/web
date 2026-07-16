/**
 * LiveScribe — real-time (streaming) voice-message dictation.
 *
 * Captures the mic, streams PCM16 @ 16 kHz to the Pinecall server's streaming
 * scribe gateway (`/api/scribe/ws`), and emits transcripts as they arrive:
 * partials (the in-progress segment) update live, finals commit. The running
 * transcript is delivered via `onText` — drop it straight into a chat input for
 * a WhatsApp/OpenAI-style dictation experience (not a call).
 *
 * Shared by `<pinecall-chat>` and any app on `@pinecall/web` (e.g. LumiCRM's
 * internal chat) so there's a single implementation of the capture + protocol.
 *
 * Language: auto-detected by default (Scribe v2 realtime handles 90+ languages
 * and mid-utterance code-switching). Pass `language` (ISO code, e.g. "es") to
 * pin one — better accuracy when you know the language up front.
 */

export type LiveScribeState = "idle" | "connecting" | "recording" | "finishing" | "stopped" | "error";

export interface LiveScribeOptions {
  /** Pinecall server base. Default `"https://voice.pinecall.io"`. */
  server?: string;
  /** A signed chat token (`cht_…`). Provide this or `tokenProvider`. */
  token?: string;
  /** Mints a fresh chat token (and optional server) — used if `token` is absent. */
  tokenProvider?: () => Promise<{ token: string; server?: string }>;
  /** ISO language code to pin (e.g. "es"). Omit for auto-detect. */
  language?: string;
  /** Fired on every update with the full running transcript for this session. */
  onText?: (text: string) => void;
  /** Fired when a segment is committed (final), with the full committed text. */
  onFinal?: (text: string) => void;
  onStateChange?: (state: LiveScribeState) => void;
  onError?: (err: Error) => void;
}

// Inline AudioWorklet: forwards each render quantum of mono Float32 to the main
// thread. Kept as a Blob URL so the package ships no separate worklet file.
const WORKLET_SRC =
  "class PCScribe extends AudioWorkletProcessor{" +
  "process(inputs){const ch=inputs[0]&&inputs[0][0];" +
  "if(ch&&ch.length)this.port.postMessage(ch.slice(0));return true}}" +
  "registerProcessor('pc-scribe',PCScribe)";

let workletUrl: string | null = null;
function getWorkletUrl(): string {
  if (!workletUrl) workletUrl = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
  return workletUrl;
}

const TARGET_RATE = 16000;
const FLUSH_SAMPLES = 1600; // ~100 ms per WS frame at 16 kHz

export class LiveScribe {
  private opts: LiveScribeOptions;
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private sink: GainNode | null = null;
  private pending: number[] = [];
  private committed: string[] = [];
  private partial = "";
  private _state: LiveScribeState = "idle";
  private donePromise: Promise<void> | null = null;
  private resolveDone: (() => void) | null = null;

  constructor(opts: LiveScribeOptions) {
    this.opts = opts;
  }

  get state(): LiveScribeState {
    return this._state;
  }

  /** Full running transcript for this session (committed + current partial). */
  get text(): string {
    return [...this.committed, this.partial].filter(Boolean).join(" ").trim();
  }

  private setState(s: LiveScribeState) {
    this._state = s;
    this.opts.onStateChange?.(s);
  }

  private fail(err: Error) {
    this.setState("error");
    this.opts.onError?.(err);
    this.cleanupAudio();
    try { this.ws?.close(); } catch { /* noop */ }
    this.ws = null;
    this.resolveDone?.();
  }

  /** Begin recording + streaming. Resolves once the mic is live. */
  async start(): Promise<void> {
    if (this._state !== "idle" && this._state !== "stopped" && this._state !== "error") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone not available");
    }
    this.committed = [];
    this.partial = "";
    this.pending = [];
    this.setState("connecting");

    // Resolve auth + server.
    let server = this.opts.server || "https://voice.pinecall.io";
    let token = this.opts.token || "";
    if (this.opts.tokenProvider) {
      const t = await this.opts.tokenProvider();
      token = t.token;
      if (t.server) server = t.server;
    }
    const wsBase = server.replace(/\/$/, "").replace(/^http/, "ws");
    const qs = new URLSearchParams({ token });
    if (this.opts.language) qs.set("lang", this.opts.language);

    // Open the WS and wait for it (and the server's "ready").
    await new Promise<void>((resolve, reject) => {
      let opened = false;
      const ws = new WebSocket(`${wsBase}/api/scribe/ws?${qs.toString()}`);
      ws.binaryType = "arraybuffer";
      this.ws = ws;
      ws.onmessage = (e) => {
        if (typeof e.data !== "string") return;
        let d: { event?: string; text?: string; error?: string };
        try { d = JSON.parse(e.data); } catch { return; }
        if (d.event === "ready") {
          opened = true;
          resolve();
        } else if (d.event === "partial") {
          this.partial = d.text || "";
          this.opts.onText?.(this.text);
        } else if (d.event === "final") {
          if (d.text) { this.committed.push(d.text); this.opts.onFinal?.(this.text); }
          this.partial = "";
          this.opts.onText?.(this.text);
        } else if (d.event === "done") {
          this.finishClose();
        } else if (d.event === "error") {
          if (!opened) reject(new Error(d.error || "scribe error"));
          else this.fail(new Error(d.error || "scribe error"));
        }
      };
      ws.onerror = () => { if (!opened) reject(new Error("Could not connect to transcription")); };
      ws.onclose = () => { if (!opened) reject(new Error("Transcription closed")); this.finishClose(); };
    });

    // Mic → PCM16 @ 16k → WS. Request a 16 kHz context so no resampling is
    // usually needed; we resample defensively if the browser ignores the hint.
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    this.ctx = new Ctx({ sampleRate: TARGET_RATE });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    // Silent sink so the graph is pulled without echoing the mic back out.
    this.sink = this.ctx.createGain();
    this.sink.gain.value = 0;
    this.sink.connect(this.ctx.destination);

    const onSamples = (buf: Float32Array) => this.pushSamples(buf);
    try {
      await this.ctx.audioWorklet.addModule(getWorkletUrl());
      const node = new AudioWorkletNode(this.ctx, "pc-scribe");
      node.port.onmessage = (e) => onSamples(e.data as Float32Array);
      this.source.connect(node);
      node.connect(this.sink);
      this.node = node;
    } catch {
      // Fallback for environments without AudioWorklet.
      const sp = this.ctx.createScriptProcessor(4096, 1, 1);
      sp.onaudioprocess = (e) => onSamples(new Float32Array(e.inputBuffer.getChannelData(0)));
      this.source.connect(sp);
      sp.connect(this.sink);
      this.node = sp;
    }

    this.donePromise = new Promise<void>((res) => { this.resolveDone = res; });
    this.setState("recording");
  }

  /** Stop recording; flush the last segment; resolve with the final transcript. */
  async stop(): Promise<string> {
    if (this._state !== "recording") return this.text;
    this.setState("finishing");
    this.cleanupAudio();
    // Ask the server to finalize; it replies "done", which closes the WS.
    try { this.ws?.send(JSON.stringify({ event: "stop" })); } catch { /* noop */ }
    // Bail out after a short grace period even if "done" never lands.
    const timeout = new Promise<void>((res) => setTimeout(res, 2500));
    await Promise.race([this.donePromise ?? Promise.resolve(), timeout]);
    this.finishClose();
    return this.text;
  }

  /** Abort without waiting for a final transcript. */
  cancel(): void {
    this.cleanupAudio();
    try { this.ws?.close(); } catch { /* noop */ }
    this.ws = null;
    this.setState("stopped");
    this.resolveDone?.();
  }

  private pushSamples(buf: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const rate = this.ctx?.sampleRate || TARGET_RATE;
    const resampled = rate === TARGET_RATE ? buf : downsample(buf, rate, TARGET_RATE);
    for (let i = 0; i < resampled.length; i++) this.pending.push(resampled[i]!);
    while (this.pending.length >= FLUSH_SAMPLES) {
      const frame = this.pending.splice(0, FLUSH_SAMPLES);
      const pcm = new Int16Array(frame.length);
      for (let i = 0; i < frame.length; i++) {
        const s = Math.max(-1, Math.min(1, frame[i]!));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      try { this.ws.send(pcm.buffer); } catch { /* noop */ }
    }
  }

  private cleanupAudio() {
    try { this.node?.disconnect(); } catch { /* noop */ }
    try { this.source?.disconnect(); } catch { /* noop */ }
    try { this.sink?.disconnect(); } catch { /* noop */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    try { void this.ctx?.close(); } catch { /* noop */ }
    this.node = null; this.source = null; this.sink = null; this.stream = null; this.ctx = null;
  }

  private finishClose() {
    if (this.ws) { try { this.ws.close(); } catch { /* noop */ } this.ws = null; }
    if (this._state !== "error") this.setState("stopped");
    this.resolveDone?.();
  }
}

/** Linear-interpolation downsample of mono Float32 audio. */
function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (inRate <= outRate) return input;
  const ratio = inRate / outRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = idx - i0;
    out[i] = input[i0]! * (1 - frac) + input[i1]! * frac;
  }
  return out;
}
