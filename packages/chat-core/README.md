# @pinecall/chat-core

Text chat client for Pinecall agents. Framework-agnostic core + React hook.

```bash
npm install @pinecall/chat-core
```

## Quick start

```typescript
import { ChatSession } from "@pinecall/chat-core";

const chat = new ChatSession({ agent: "florencia" });
chat.addEventListener("message", (e) => console.log(e.detail.message));
await chat.connect();
chat.send("Hola!");
```

### React

```tsx
import { usePinecallChat } from "@pinecall/chat-core/react";

function Chat() {
  const { messages, send, connected, typing } = usePinecallChat({
    agent: "florencia",
  });
  // render messages...
}
```

## What it does

- WebSocket connection to Pinecall chat channel
- Token-based auth (short-lived, single-use)
- Streamed bot responses (token-by-token)
- Reactive message state + typing indicator
- Context injection (`setContext`)
- Same agent, same tools — text instead of voice

## Documentation

Full ChatSession API and React hook reference:

**[docs.pinecall.io/docs/chat-core/overview](https://docs.pinecall.io/docs/chat-core/overview)**

## Related

- [`@pinecall/voice-widget`](https://www.npmjs.com/package/@pinecall/voice-widget) — React voice widget
- [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) — WebRTC voice client
- [`@pinecall/sdk`](https://www.npmjs.com/package/@pinecall/sdk) — Node.js SDK for the backend
