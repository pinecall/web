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

## Multi-channel

```tsx
<VoiceWidget
  agent="florencia"
  name="Florencia"
  avatar="🌸"
  locale="es"
  channels={[
    { type: "webrtc" },
    { type: "chat" },
    { type: "whatsapp", phone: "+51987654321" },
    { type: "phone", numbers: ["+13186330963"] },
  ]}
  callMeEndpoint="/api/call-me"
  chat={{
    greeting: "¡Hola! Soy Florencia. ¿En qué puedo ayudarte?",
    quickOptions: [
      { label: "💇 Servicios", query: "¿Qué servicios ofrecen?" },
    ],
    tokenProvider: async () => {
      const res = await fetch("/api/chat-token");
      return res.json();
    },
  }}
  tokenProvider={async () => {
    const res = await fetch("/api/token");
    return res.json();
  }}
/>
```

## What it does

- **ContactHub popover** — voice, chat, WhatsApp, Call Me in one widget
- **Embedded LLM chat** — streaming markdown, quick replies, fullscreen on mobile
- **Animated orb UI** with breathing rings and per-phase colors
- **5 theme presets** (`dark`, `midnight`, `aurora`, `sunset`, `light`) + full CSS overrides
- **Multi-language pills** with hot-swap mid-call
- **Tool call tracking** (`tools` prop or `trackedTools` + `useVoice()`)
- **Context injection** from React state (`setContext`)
- **Token-based auth** (`tokenProvider`) — API keys stay server-side
- **Localization** — built-in strings for `en`, `es`, `de`, `pt`
- **Mobile optimized** — fullscreen chat, no iOS zoom on input focus

## Documentation

Full props reference, theming guide, and Tools API:

**[docs.pinecall.io/docs/voice-widget/overview](https://docs.pinecall.io/docs/voice-widget/overview)**

## Related

- [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) — framework-agnostic core
- [`@pinecall/chat-core`](https://www.npmjs.com/package/@pinecall/chat-core) — text chat client
- [`@pinecall/sdk`](https://www.npmjs.com/package/@pinecall/sdk) — Node.js SDK for the backend
