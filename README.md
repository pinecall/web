# @pinecall/web

[![npm](https://img.shields.io/npm/v/@pinecall/web)](https://www.npmjs.com/package/@pinecall/web)

The web client for [Pinecall](https://pinecall.io) agents — real-time WebRTC **voice**, text **chat**, and drop-in **React** widgets, in one package.

> **Migrating from `@pinecall/voice-core` / `@pinecall/voice-widget` / `@pinecall/chat-core`?** They are now a single package. See [Entry points](#entry-points) below — the React widget moves to the package root, vanilla voice to `/core`, and chat to `/chat` + `/chat/react`.

## Install

```bash
npm install @pinecall/web
# React is a peer dep — only needed for the widget + chat/react entries
npm install react react-dom
```

## Entry points

| Import | What | Needs React |
|--------|------|-------------|
| `@pinecall/web` | React widgets — `VoiceWidget`, `ContactHub`, `ChatView`, `useVoice`, `useVoiceSession`, presets | ✅ |
| `@pinecall/web/core` | `VoiceSession` — framework-agnostic WebRTC voice client | ❌ |
| `@pinecall/web/chat` | `ChatSession` — framework-agnostic text chat client | ❌ |
| `@pinecall/web/chat/react` | `usePinecallChat` — React hook over `ChatSession` | ✅ |
| `@pinecall/web/orb` | `<pinecall-orb>` — framework-agnostic voice orb (Custom Element) | ❌ |
| `@pinecall/web/orb/react` | `<Orb>` — thin React wrapper for `<pinecall-orb>` | ✅ |
| `@pinecall/web/modal` | `<pinecall-modal>` — glass call modal (Custom Element): orb **or** wave visual, live captions, text-during-call, transcript view | ❌ |
| `@pinecall/web/modal/react` | `<CallModal>` — thin React wrapper for `<pinecall-modal>` | ✅ |
| `@pinecall/web/chatbox` | `<pinecall-chat>` — docked chatbox (Custom Element): text chat that can escalate to a WebRTC voice call, with conversation continuity | ❌ |
| `@pinecall/web/chatbox/react` | `<ChatBox>` — thin React wrapper for `<pinecall-chat>` | ✅ |

> **Web Components vs React widget:** the `/orb`, `/modal` and `/chatbox` entries are native Custom Elements — they work in **any** framework (React, Vue, Svelte, Angular, vanilla) and need no React. The original `@pinecall/web` React widget stays available unchanged.

## Quick Start

### React widget

```tsx
import { VoiceWidget } from "@pinecall/web";

<VoiceWidget agent="mara" name="Mara" preset="midnight" />
```

### Vanilla voice (any framework)

```ts
import { VoiceSession } from "@pinecall/web/core";

const session = new VoiceSession({ agent: "mara" });
session.subscribe(() => console.log(session.getState()));
await session.connect();
```

### Chat hook

```tsx
import { usePinecallChat } from "@pinecall/web/chat/react";

const chat = usePinecallChat({ agent: "florencia" });
```

### Web Components (any framework)

```html
<!-- voice orb -->
<pinecall-orb agent="mara" name="Mara" preset="midnight"></pinecall-orb>

<!-- call modal: orb or wave visual, captions, text-during-call -->
<pinecall-modal agent="mara" name="Mara" visual="wave"></pinecall-modal>

<!-- docked chatbox: text chat + a call button to escalate to voice -->
<pinecall-chat agent="mara" name="Mara" greeting="Hi! How can I help?"></pinecall-chat>

<script type="module">
  import "@pinecall/web/orb";
  import "@pinecall/web/modal";
  import "@pinecall/web/chatbox";
  // function/object props are set as PROPERTIES (not attributes):
  const modal = document.querySelector("pinecall-modal");
  modal.tokenProvider = async () => (await fetch("/api/token")).json();
  // the chatbox tokenProvider is channel-aware (text vs voice):
  document.querySelector("pinecall-chat").tokenProvider =
    async (channel) => (await fetch(`/api/token?channel=${channel}`)).json();
</script>
```

**Orb** — `opens` attribute: `"inline"` (captions beside the orb, default), `"modal"` (opens a `<pinecall-modal>`), or `"chat"` (opens a `<pinecall-chat>`). One orb, any presentation.

**Chatbox** — text-first; a call button escalates to a WebRTC voice call and the conversation continues (prior transcript carried over). Attributes: `greeting` (first bot bubble, client-side), `auto-call` (start in a call), `no-call` (pure text). Its `tokenProvider` is **channel-aware**: `(channel: "chat" | "webrtc") => {token, server}`.

Common attributes: `agent`, `server`, `name`, `label`, `preset`, `avatar`, `visual` (`orb` | `wave`). Properties: `config`, `metadata`, `tokenProvider`, `theme`. Events: `pinecall:status`, `pinecall:transcript`, `pinecall:error`, `pinecall:open`, `pinecall:close`. Theme via the `--vw-*` / `--pm-*` CSS custom properties (e.g. `--pm-user` / `--pm-bot` for speaker colors).

In React, prefer the wrappers so object/function props bind cleanly:

```tsx
import { CallModal } from "@pinecall/web/modal/react";

<CallModal agent="mara" name="Mara" visual="wave"
           tokenProvider={async () => (await fetch("/api/token")).json()} />
```

## Structure

```
web/
├── src/
│   ├── index.ts        @pinecall/web        — React widgets barrel
│   ├── core/           @pinecall/web/core   — VoiceSession (vanilla)
│   ├── chat/           @pinecall/web/chat[/react] — ChatSession + React hook
│   ├── orb/            @pinecall/web/orb[/react]  — <pinecall-orb> custom element
│   ├── modal/          @pinecall/web/modal[/react] — <pinecall-modal> call modal
│   ├── chatbox/        @pinecall/web/chatbox[/react] — <pinecall-chat> chatbox
│   └── widget/         React components (VoiceWidget, ContactHub, ChatView…)
├── docs/               diagrams + legacy changelogs
├── examples/           demo pages (orb/modal/chatbox.html) + token-server + react app
├── tsup.config.ts      Build (10 entries → ESM + CJS + DTS)
└── tsconfig.json
```

## Development

```bash
pnpm install
pnpm build       # build all 4 entries (ESM + CJS + DTS)
pnpm dev         # tsup watch
pnpm typecheck
```

## Publishing

```bash
npm version <patch|minor|major>
pnpm release     # build + npm publish
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
  sessionLimits: {
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
