# @pinecall/chat-core

## 0.1.2

### Changed

- Replaced README with concise npm-facing version pointing to [docs.pinecall.io](https://docs.pinecall.io/docs/chat-core/overview).

## 0.1.1

### Fixed

- Fixed React hook export path for `@pinecall/chat-core/react` subpath.

## 0.1.0

### Added

- Initial release.
- `ChatSession` class — WebSocket text chat client for Pinecall agents.
- `usePinecallChat` React hook — reactive messages, send, typing, connected state.
- Token-based auth (short-lived, single-use).
- Streamed bot responses (token-by-token).
- Context injection via `setContext()`.
