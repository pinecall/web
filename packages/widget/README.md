# @pinecall/voice-widget

Drop-in React voice widget for Pinecall agents. Built on `@pinecall/voice-core`.

```bash
npm install @pinecall/voice-widget
```

## Quick start

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";

function App() {
  return <VoiceWidget agent="mara" />;
}
```

## What it does

- Animated orb UI with multiple display modes (`orb`, `pill`, `panel`, `inline`)
- Full theming via CSS custom properties
- Tool call tracking (`trackedTools` + `useVoice()`)
- Context injection from React state (`setContext`)
- Token-based auth (`tokenProvider`)
- Status indicators, transcript display, error states

## Documentation

Full props reference, theming guide, and Tools API:

**[docs.pinecall.io/docs/voice-widget/overview](https://docs.pinecall.io/docs/voice-widget/overview)**

## Related

- [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) — framework-agnostic core
- [`@pinecall/chat-core`](https://www.npmjs.com/package/@pinecall/chat-core) — text chat client
- [`@pinecall/sdk`](https://www.npmjs.com/package/@pinecall/sdk) — Node.js SDK for the backend
