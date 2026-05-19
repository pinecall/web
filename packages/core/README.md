# @pinecall/voice-core

Framework-agnostic WebRTC voice session client for Pinecall agents.

## Install

```bash
npm install @pinecall/voice-core
```

## Usage

```ts
import { VoiceSession } from "@pinecall/voice-core";

const session = new VoiceSession({
  agent: "mara",
  server: "https://mara.app.pinecall.io",
});

session.subscribe(() => {
  console.log(session.getState());
});

await session.connect();
```
