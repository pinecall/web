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

<VoiceWidget agent="mara" name="Mara" preset="midnight" />
```

### Any Framework (Core)

```bash
npm install @pinecall/voice-core
```

```ts
import { VoiceSession } from "@pinecall/voice-core";

const session = new VoiceSession({ agent: "mara" });
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

## Widget Theme & Orb States

The `<VoiceWidget>` orb cycles through visual states as the session progresses. Each state has a configurable color (RGB triplet):

| Orb State | CSS Class | Theme Property | Default Color | When |
|-----------|-----------|---------------|---------------|------|
| Idle | — | `orbFrom`/`orbMid`/`orbTo` | Pearl gradient | Not connected |
| Connecting | `.connecting` | `colorConnecting` | `245, 158, 11` (amber) | Establishing WebRTC |
| Active | `.active` | `colorActive` | `76, 175, 80` (green) | Connected, waiting |
| User speaking | `.user-speaking` | `colorUserSpeaking` | `52, 211, 153` (emerald) | User talking |
| Agent speaking | `.speaking` | `colorSpeaking` | `248, 113, 113` (rose) | Agent talking |
| Thinking | `.thinking` | `colorThinking` | `139, 92, 246` (violet) | Processing |
| **Idle warning** | `.idle-warning` | `colorWarning` | `255, 160, 0` (orange) | User silent too long, call will timeout |

### Idle Warning

When the server emits `session.idle_warning`, the orb switches to the `idle-warning` state — a blinking amber/orange animation. This warns the user that the call will end due to inactivity.

```tsx
// Customize the warning color via theme
<VoiceWidget
  agent="mara"
  theme={{ colorWarning: "255, 60, 60" }}  // red warning
/>
```

The idle warning is cleared when:
- The user starts speaking
- The session disconnects
- `session.timeout` fires (auto-disconnect)

### Theme Presets

5 built-in presets: `dark` (default), `midnight`, `aurora`, `sunset`, `light`.

```tsx
<VoiceWidget agent="mara" preset="midnight" />
```

### Custom Theme

Override individual colors on top of any preset:

```tsx
<VoiceWidget
  agent="mara"
  preset="dark"
  theme={{
    colorActive: "0, 200, 100",
    colorWarning: "255, 80, 0",
    ringColor: "100, 100, 200",
  }}
/>
```

All theme properties accept **RGB triplets** (e.g. `"255, 160, 0"`) for use with CSS `rgba()`.

## Session Limits (via `@pinecall/sdk`)

Session limits are configured on the agent (server-side SDK) and flow through to the WebRTC widget automatically:

```typescript
// Server-side (agent.js)
const agent = pc.deploy("my-agent", {
  // ...voice, stt, llm config...
  session_limits: {
    idle_timeout_seconds: 20,   // hang up after 20s of silence
    idle_warning_seconds: 10,   // warn 10s before timeout
    max_duration_seconds: 600,  // hard cap at 10 minutes
  },
});

agent.on("session.idle_warning", (event, call) => {
  call.say("Are you still there?");
});
```

The widget receives `session.idle_warning` via DataChannel and:
1. Switches the orb to the **idle-warning** state (blinking `colorWarning`)
2. On `session.timeout`, auto-disconnects and resets to idle

## License

MIT
