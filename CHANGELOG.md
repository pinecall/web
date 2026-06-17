# Changelog

All notable changes to `@pinecall/web` are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
