<h1 align="center">@pinecall/chat-core</h1>

<p align="center">
  <strong>Text chat client for Pinecall voice agents.</strong><br/>
  Framework-agnostic core + React hook. Zero dependencies.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#vanilla-js">Vanilla JS</a> ·
  <a href="#react">React</a> ·
  <a href="#api-reference">API</a>
</p>

---

## Install

```bash
npm install @pinecall/chat-core
```

> **Browser-only.** Uses the native `WebSocket` and `EventTarget` APIs. Works in any modern browser, bundler, or SSR-hydrated app.

---

## Vanilla JS

`ChatSession` is framework-agnostic — no React, no dependencies. Works in vanilla JS, Vue, Svelte, Angular, or any framework.

```javascript
import { ChatSession } from "@pinecall/chat-core";

const chat = new ChatSession({ agent: "florencia" });

// Listen to events via standard EventTarget
chat.addEventListener("message", (e) => {
  const msg = e.detail.message;
  console.log(`${msg.role}: ${msg.text}`);
});

chat.addEventListener("status", (e) => {
  console.log("Status:", e.detail.status);
});

// Connect and send
await chat.connect();
chat.send("Hola, quiero reservar un turno");
```

### Subscribe pattern (for reactive UI)

```javascript
// Works with any reactive system (MobX, signals, stores)
const unsubscribe = chat.subscribe(() => {
  const state = chat.getState();
  console.log("Messages:", state.messages.length);
  console.log("Typing:", state.typing);
  console.log("Status:", state.status);
});

// Clean up
unsubscribe();
```

### Dynamic context injection

Inject live context into the LLM system prompt — form state, user selections, page data:

```javascript
chat.setContext("cart", JSON.stringify({
  items: ["Corte de cabello", "Tinte"],
  total: 85.00,
}));

// Clear a context key
chat.setContext("cart", null);
```

---

## React

The `@pinecall/chat-core/react` subpath export provides a `usePinecallChat` hook. React is an **optional** peer dependency.

```tsx
import { usePinecallChat } from "@pinecall/chat-core/react";

function Chat() {
  const { messages, send, connected, typing, streamingText } = usePinecallChat({
    agent: "florencia",
  });

  if (!connected) return <p>Connecting...</p>;

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>
          <strong>{m.role}:</strong> {m.text}
          {m.isStreaming && "▊"}
        </p>
      ))}
      {typing && <p>Bot is typing: {streamingText}▊</p>}
      <input
        placeholder="Type a message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            send(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
```

### Hook options

```typescript
usePinecallChat({
  agent: "florencia",           // Agent ID (required)
  server: "https://voice.pinecall.io",  // Voice server URL (default)
  autoConnect: true,            // Connect on mount (default: true)
});
```

### Hook return

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `ChatMessage[]` | All messages in the conversation |
| `send` | `(text: string) => void` | Send a text message |
| `connected` | `boolean` | `true` when connected to the server |
| `typing` | `boolean` | `true` while the bot is streaming |
| `streamingText` | `string` | Partial text of the current bot response |
| `error` | `string \| null` | Current error, if any |
| `setContext` | `(key, value) => void` | Inject dynamic context into the LLM prompt |
| `connect` | `() => void` | Manually connect |
| `disconnect` | `() => void` | Manually disconnect |

---

## API Reference

### `ChatSession`

```typescript
import { ChatSession } from "@pinecall/chat-core";

const chat = new ChatSession(options);
```

#### Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | `string` | ✅ | Agent slug (e.g. `"florencia"`, `"dev-berna-florencia"`) |
| `server` | `string` | — | Voice server URL (default: `https://voice.pinecall.io`) |

#### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to the chat server (fetches token → opens WebSocket) |
| `disconnect()` | Close the WebSocket connection |
| `destroy()` | Disconnect + clear all subscribers. Do not reuse. |
| `send(text)` | Send a text message to the agent |
| `setContext(key, value)` | Inject/update/clear keyed context in the LLM prompt |
| `getState()` | Read-only snapshot of current state |
| `subscribe(cb)` | Subscribe to state changes (for React `useSyncExternalStore`) |

#### Events (via `EventTarget`)

| Event | `detail` | When |
|-------|----------|------|
| `status` | `{ status }` | Connection status changed |
| `message` | `{ message }` | New or updated message |
| `error` | `{ error }` | Error occurred |
| `change` | `{ state }` | Any state mutation (most general) |
| `event` | raw server payload | Every raw server event |

#### State shape

```typescript
interface ChatSessionState {
  status: "idle" | "connecting" | "connected" | "error";
  error: string | null;
  messages: ChatMessage[];
  typing: boolean;
  streamingText: string;
  sessionId: string | null;
}

interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  messageId?: string;    // server-assigned ID (bot messages)
  isStreaming?: boolean;  // true while bot is still streaming
}
```

---

## Protocol

```
Browser                         Voice Server
  │                                 │
  ├─ GET /chat/token?agent_id=X ──→│  (fetch short-lived token)
  │←── { token: "cht_xxx" } ──────│
  │                                 │
  ├─ WS /chat/ws?token=cht_xxx ──→│  (open WebSocket)
  │←── { event: "chat.connected" }│
  │                                 │
  ├─→ { event: "message", text }   │  (user sends message)
  │←── { event: "chat.token", … } │  (streaming tokens)
  │←── { event: "chat.token", … } │
  │←── { event: "chat.done", … }  │  (stream complete)
  │                                 │
  ├─→ { event: "set_context", … } │  (inject LLM context)
```

---

## Related Packages

| Package | Description |
|---------|-------------|
| [`@pinecall/sdk`](https://npmjs.com/package/@pinecall/sdk) | Server-side SDK — agent, call, tools, channels |
| [`@pinecall/voice-core`](https://npmjs.com/package/@pinecall/voice-core) | WebRTC voice session (framework-agnostic) |
| [`@pinecall/voice-widget`](https://npmjs.com/package/@pinecall/voice-widget) | React voice widget with animated orb UI |

---

## License

MIT
