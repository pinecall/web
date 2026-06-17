# Changelog

All notable changes to `@pinecall/web` are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-06-17

### Added — **`<pinecall-chat>` docked chatbox** (`@pinecall/web/chatbox` + `/chatbox/react`)

A traditional web-chat Custom Element (launcher bubble → panel with bubbles + input):

- **Text-first** (`ChatSession`) with a **call button to escalate to a WebRTC voice call** (`VoiceSession`) — talk and/or type in one panel.
- **Conversation continuity** across the text↔voice switch: the visible history is kept (frozen) and the prior transcript is injected into the new session via `setContext`.
- **Channel-aware `tokenProvider`**: `(channel: "chat" | "webrtc") => {token, server}` — one function mints the right token per transport.
- `greeting` attribute (client-side first bot bubble — text chat has no server greeting path), `auto-call` (start in a call), `no-call` (pure text).
- rAF character-by-character reveal of streaming bot text; reconciled bubbles (no flicker); speaker-colored, theme-derived.

### Added — Orb `opens` + lifecycle events

- `<pinecall-orb>` gains `opens="inline" | "modal" | "chat"` — the orb is a launcher that can show inline captions, open a `<pinecall-modal>`, or open a `<pinecall-chat>`. The launched element's FAB is suppressed (`no-fab`) so the orb is the sole launcher.
- `<pinecall-modal>` / `<pinecall-chat>` dispatch `pinecall:open` / `pinecall:close` and honor a `no-fab` attribute.

## [0.2.0] - 2026-06-17

### Added — **Framework-agnostic Web Components**

Native Custom Elements so the voice UI works in any framework (React, Vue, Svelte, Angular, vanilla) with **zero new deps** and SSR-safe imports. The existing React widget is unchanged.

- **`@pinecall/web/orb`** — `<pinecall-orb>`: simple WebRTC voice orb (Shadow DOM, orb states, status label, live caption, click to connect/disconnect). `@pinecall/web/orb/react` ships a thin `<Orb>` wrapper.
- **`@pinecall/web/modal`** — `<pinecall-modal>`: a glass call modal with a launcher FAB. `@pinecall/web/modal/react` ships `<CallModal>`. Features:
  - Two visuals via `visual="orb" | "wave"` — the wave is a **real `audio.metrics`-driven** waveform.
  - Live caption + full transcript view (text-during-call via `sendText`), toggled by the keyboard button.
  - Speaker-colored captions/waveform — theme-driven, configurable via `--pm-user` / `--pm-bot`.
  - Card gradient derived from the theme accent; controls (mute/hangup/keyboard).
  - Events: `pinecall:status`, `pinecall:transcript`, `pinecall:error`.

## [0.1.0] - 2026-06-17

### Changed — **Unified package**

`@pinecall/web` replaces the three previous packages, collapsing the monorepo into a single flat package with subpath exports:

| Old package | New import |
|-------------|-----------|
| `@pinecall/voice-widget` | `@pinecall/web` |
| `@pinecall/voice-core` | `@pinecall/web/core` |
| `@pinecall/chat-core` | `@pinecall/web/chat` |
| `@pinecall/chat-core/react` | `@pinecall/web/chat/react` |

No runtime/API changes — same `VoiceWidget`, `VoiceSession`, `ChatSession`, `usePinecallChat` and types. Only the package name and import paths change. The old packages are deprecated on npm.

Legacy per-package changelogs preserved under `docs/legacy-changelogs/`.
