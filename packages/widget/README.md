# @pinecall/voice-widget

Drop-in React voice widget for Pinecall agents. Built on `@pinecall/voice-core`.

```bash
npm install @pinecall/voice-widget
```

## Quick start

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";

function App() {
  return <VoiceWidget agent="mara" name="Mara" />;
}
```

Click the orb → voice call starts. Click again → call ends.

## With token security

```tsx
<VoiceWidget
  agent="florencia"
  name="Florencia"
  tokenProvider={async () => {
    const res = await fetch("/api/token");
    return res.json();
  }}
/>
```

## What it does

- **Animated orb UI** with breathing rings and per-phase colors
- **Live transcript** rendered as chat bubbles
- **5 theme presets** (`dark`, `midnight`, `aurora`, `sunset`, `light`) + full CSS overrides
- **Multi-language pills** with hot-swap mid-call
- **Tool call tracking** (`tools` prop or `trackedTools` + `useVoice()`)
- **Context injection** from React state (`setContext`)
- **Token-based auth** (`tokenProvider`) — API keys stay server-side

## Standalone exports

For building custom multi-channel experiences:

- `ContactHub` — multi-channel contact menu (voice, chat, WhatsApp, Call Me)
- `ChatView` — embedded LLM text chat with streaming markdown
- `useVoiceSession()` — headless hook for fully custom UIs

## Documentation

Full props reference, theming guide, and Tools API:

**[docs.pinecall.io/docs/voice-widget/overview](https://docs.pinecall.io/docs/voice-widget/overview)**

## Related

- [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) — framework-agnostic core
- [`@pinecall/chat-core`](https://www.npmjs.com/package/@pinecall/chat-core) — text chat client
- [`@pinecall/sdk`](https://www.npmjs.com/package/@pinecall/sdk) — Node.js SDK for the backend
