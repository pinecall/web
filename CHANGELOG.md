# Changelog

All notable changes to `@pinecall/web` are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
