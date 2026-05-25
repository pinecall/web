# @pinecall/voice-core

Low-level WebRTC voice client for Pinecall agents. Framework-agnostic — works with React, Vue, Svelte, or vanilla JS.

```bash
npm install @pinecall/voice-core
```

## Quick start

```typescript
import { VoiceSession } from "@pinecall/voice-core";

const session = new VoiceSession({ agent: "mara" });
session.connect();
```

## What it does

- WebRTC peer connection + DataChannel lifecycle
- Microphone capture with echo cancellation
- Server audio playback
- State machine: `idle` → `connecting` → `awaiting_media` → `connected`
- Tool call routing via DataChannel
- Context injection (`setContext`)
- Text injection (`sendText`)

## Documentation

Full API reference, state machine docs, and DataChannel protocol:

**[docs.pinecall.io/docs/voice-core/overview](https://docs.pinecall.io/docs/voice-core/overview)**

## Related

- [`@pinecall/voice-widget`](https://www.npmjs.com/package/@pinecall/voice-widget) — React component built on voice-core
- [`@pinecall/sdk`](https://www.npmjs.com/package/@pinecall/sdk) — Node.js SDK for the backend
