/**
 * ChatSession — Framework-agnostic text chat client for Pinecall agents.
 *
 * Mirrors VoiceSession's API patterns:
 *   - session.subscribe(cb) + session.getState() — for React useSyncExternalStore
 *   - session.addEventListener('status' | 'message' | 'error' | 'change', cb)
 *
 * Flow: GET /chat/token → WS /chat/ws?token=cht_xxx → bidirectional text chat
 */
import type {
  ChatSessionState,
  ChatSessionOptions,
  ChatMessage,
} from "./types";

const INITIAL_STATE: ChatSessionState = {
  status: "idle",
  error: null,
  messages: [],
  typing: false,
  streamingText: "",
  sessionId: null,
};

export class ChatSession extends EventTarget {
  private state: ChatSessionState = { ...INITIAL_STATE };
  private listeners = new Set<() => void>();

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private msgCounter = 0;

  constructor(private opts: ChatSessionOptions) {
    super();
  }

  /** Read-only snapshot of current state (stable ref until next mutation). */
  getState(): Readonly<ChatSessionState> {
    return this.state;
  }

  /** Subscribe to ANY state change (for React useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(patch: Partial<ChatSessionState>): void {
    const prev = this.state;
    this.state = { ...prev, ...patch };
    for (const l of this.listeners) l();

    if (patch.status !== undefined && patch.status !== prev.status) {
      this.dispatchEvent(
        new CustomEvent("status", { detail: { status: this.state.status } }),
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
    updater: (prev: ChatMessage[]) => ChatMessage[],
  ): void {
    const next = updater(this.state.messages);
    this.setState({ messages: next });
    const last = next[next.length - 1];
    if (last) {
      this.dispatchEvent(
        new CustomEvent("message", { detail: { message: last } }),
      );
    }
  }

  // ── Connection ──────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.ws) return;

    try {
      this.setState({
        status: "connecting",
        error: null,
      });

      const base = (this.opts.server ?? "https://voice.pinecall.io").replace(
        /\/$/,
        "",
      );

      // 1. Fetch chat token — use tokenProvider (backend proxy) or direct fetch
      let token: string;
      let chatServer: string;
      if (this.opts.tokenProvider) {
        const t = await this.opts.tokenProvider();
        token = t.token;
        chatServer = t.server;
      } else {
        const tRes = await fetch(
          `${base}/chat/token?agent_id=${encodeURIComponent(this.opts.agent)}`,
        );
        if (!tRes.ok) {
          const body = await tRes.text();
          throw new Error(`Token: ${tRes.status} ${body}`);
        }
        const t = await tRes.json();
        token = t.token;
        chatServer = t.server;
      }
      const wsBase = (chatServer || base)
        .replace(/^http:/, "ws:")
        .replace(/^https:/, "wss:");

      // 2. Open WebSocket
      const ws = new WebSocket(`${wsBase}/chat/ws?token=${token}`);
      this.ws = ws;

      ws.onopen = () => {
        // Wait for chat.connected event before setting status
      };

      ws.onmessage = (evt) => this.handleMessage(evt);

      ws.onerror = () => {
        this.setState({ error: "WebSocket error", status: "error" });
      };

      ws.onclose = (evt) => {
        this.ws = null;
        if (this.state.status === "connected") {
          // Unexpected disconnect
          this.setState({ status: "idle" });
        }
      };
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : String(err),
        status: "error",
      });
      this.ws = null;
    }
  }

  private handleMessage(evt: MessageEvent): void {
    let d: any;
    try {
      d = JSON.parse(evt.data);
    } catch {
      return;
    }

    switch (d.event) {
      case "chat.connected":
        this.setState({
          status: "connected",
          sessionId: d.session_id ?? null,
        });
        break;

      case "chat.token":
      case "llm.chat.token":
        // Streaming token from LLM
        this.setState({
          typing: true,
          streamingText: d.text ?? "",
        });

        // Update or create bot message
        this.setMessages((prev) => {
          const idx = prev.findIndex(
            (m) => m.messageId === d.message_id && m.isStreaming,
          );
          if (idx >= 0) {
            return prev.map((m, i) =>
              i === idx ? { ...m, text: d.text ?? "" } : m,
            );
          }
          return [
            ...prev,
            {
              id: ++this.msgCounter,
              role: "bot",
              text: d.text ?? "",
              messageId: d.message_id,
              isStreaming: true,
            },
          ];
        });
        break;

      case "chat.done":
      case "llm.chat.done":
        // LLM finished streaming
        this.setState({
          typing: false,
          streamingText: "",
        });

        this.setMessages((prev) => {
          const idx = prev.findIndex(
            (m) => m.messageId === d.message_id && m.isStreaming,
          );
          if (idx >= 0) {
            return prev.map((m, i) =>
              i === idx
                ? { ...m, text: d.text ?? m.text, isStreaming: false }
                : m,
            );
          }
          // If we missed the streaming, add the final message
          return [
            ...prev,
            {
              id: ++this.msgCounter,
              role: "bot",
              text: d.text ?? "",
              messageId: d.message_id,
              isStreaming: false,
            },
          ];
        });
        break;

      case "chat.tool_call":
      case "llm.chat.tool_call": {
        // Show a minimalist tool indicator (parity with VoiceSession).
        const calls = (d.tool_calls ?? []) as Array<{ id: string; name: string }>;
        if (calls.length) {
          this.setState({ typing: true });
          this.setMessages((prev) => [
            ...prev,
            ...calls.map((tc) => ({
              id: ++this.msgCounter,
              role: "system" as const,
              text: `🔧 Using ${tc.name}…`,
              toolCallId: tc.id,
            })),
          ]);
        }
        break;
      }

      case "chat.tool_result":
      case "llm.chat.tool_result": {
        if (d.tool_call_id) {
          this.setMessages((prev) =>
            prev.map((m) => {
              if (m.toolCallId !== d.tool_call_id) return m;
              const name = (d.name || m.text.match(/Using (\S+)/)?.[1] || "Tool").replace(/…$/, "");
              return { ...m, text: `✓ ${name}` };
            }),
          );
        }
        break;
      }

      case "chat.error":
      case "llm.chat.error":
        this.setState({
          typing: false,
          error: d.error ?? "Unknown error",
        });
        break;

      case "error":
        this.setState({
          error: d.error ?? "Unknown error",
          status: "error",
        });
        break;
    }

    // Emit raw event for power users
    this.dispatchEvent(new CustomEvent("event", { detail: d }));
  }

  // ── Actions ─────────────────────────────────────────────────────────

  /** Send a text message to the agent. */
  send(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message to local state immediately
    this.setMessages((prev) => [
      ...prev,
      {
        id: ++this.msgCounter,
        role: "user",
        text: trimmed,
      },
    ]);

    // Send to server
    this.ws.send(JSON.stringify({ event: "message", text: trimmed }));
  }

  /**
   * Set or clear a keyed context block in the LLM system prompt.
   *
   * @example
   * ```ts
   * session.setContext("form", JSON.stringify({ name: "Juan" }));
   * session.setContext("form", null); // clear
   * ```
   */
  setContext(key: string, value: string | null): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ event: "set_context", key, value }));
  }

  /** Disconnect the chat session. */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState({ status: "idle", typing: false, streamingText: "" });
  }

  /** Tear down the session and clear subscribers. Do not reuse after this. */
  destroy(): void {
    this.disconnect();
    this.setState({ status: "destroyed" });
    this.listeners.clear();
  }
}
