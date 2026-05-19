# Pinecall Voice SDK

Monorepo for [Pinecall](https://pinecall.io) voice client libraries — real-time WebRTC voice sessions with AI agents.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@pinecall/voice-core`](./packages/core) | Framework-agnostic WebRTC voice session client. `VoiceSession` class with EventTarget. Works with any framework or vanilla JS. | [![npm](https://img.shields.io/npm/v/@pinecall/voice-core)](https://www.npmjs.com/package/@pinecall/voice-core) |
| [`@pinecall/voice-widget`](./packages/widget) | Drop-in React voice widget. Animated orb UI with real-time transcript, theme presets, and full customization. | [![npm](https://img.shields.io/npm/v/@pinecall/voice-widget)](https://www.npmjs.com/package/@pinecall/voice-widget) |

## Quick Start

### React (Widget)

```bash
npm install @pinecall/voice-widget
```

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";

<VoiceWidget
  agent="mara"
  server="https://mara.app.pinecall.io"
  name="Mara"
  preset="midnight"
/>
```

### Any Framework (Core)

```bash
npm install @pinecall/voice-core
```

```ts
import { VoiceSession } from "@pinecall/voice-core";

const session = new VoiceSession({ agent: "mara", server: "https://mara.app.pinecall.io" });
session.subscribe(() => console.log(session.getState()));
await session.connect();
```

## Structure

```
pinecall-voice/
├── packages/
│   ├── core/           @pinecall/voice-core — VoiceSession class, types, events
│   └── widget/         @pinecall/voice-widget — React component, hook, presets, CSS
├── examples/
│   └── react/          Demo app with preset switcher
├── .changeset/         Versioning & changelog
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Development

```bash
# Install everything
pnpm install

# Build all packages
pnpm build

# Typecheck all packages
pnpm typecheck

# Run the example app
pnpm dev:example

# Watch mode (per-package)
cd packages/core && pnpm dev
cd packages/widget && pnpm dev
```

## Publishing

Uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
# 1. Create a changeset describing your change
pnpm changeset

# 2. Apply versions + generate changelogs
pnpm version-packages

# 3. Build + publish
pnpm release
```

## License

MIT
