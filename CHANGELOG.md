# Changelog

All notable changes to `@pinecall/web` are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.5] - 2026-06-17

### Fixed — `<pinecall-chat>` hangup now stops audio immediately

When clicking the hangup button mid-call, the chatbox went straight into
`switchMode("text")` which tears the voice session down *and* awaits a new
ChatSession `connect()`. If the chat-token fetch was slow or failed, the
button looked like it did nothing — the WebRTC actually died inside
`teardown()`, but with no UI feedback in between.

`toggleCall()` now calls `VoiceSession.disconnect()` synchronously first
(killing audio + mic tracks immediately) and re-renders, then performs the
mode switch. The hangup feels instant regardless of the chat re-connect.

## [0.3.4] - 2026-06-17

### Fixed — Inline CSS vars now win over `applyTheme()`

`<pinecall-orb>`, `<pinecall-modal>` and `<pinecall-chat>` re-ran their
`applyTheme()` on connect and on every `preset` / `theme` attribute change,
which unconditionally called `this.style.setProperty(...)` for every theme
CSS var — including auto-deriving `--pm-card-from` / `--pm-card-to` from
`colorAccent`. That **overwrote inline CSS vars set by the consumer**
(e.g. `style={{ "--pm-card-from": "oklch(...)" }}` in React), so brand-
re-skinning only "kicked in" after a later interaction triggered a React
re-render of the inline style.

`applyTheme()` now skips any CSS var that the consumer has already set
inline on the host. The auto-tint from `colorAccent` likewise only fills in
`--pm-card-from` / `--pm-card-to` if the consumer didn't provide them.

## [0.3.3] - 2026-06-17

### Added — Chatbox light/alt-palette theming tokens

`<pinecall-chat>` now exposes surface tokens so it can be re-skinned for light or
non-blue palettes without forking the internals. Previously, user/bot bubbles,
input field, send button and dividers had hardcoded white-on-dark values that
broke any non-dark card. Defaults preserve the original look.

New `:host` CSS custom properties:
- `--pm-divider` — head/inputbar separator
- `--pm-user-bg` / `--pm-user-text` — user bubble
- `--pm-bot-bg` / `--pm-bot-text` / `--pm-bot-border` — bot bubble
- `--pm-input-bg` / `--pm-input-border` — text input
- `--pm-btn-bg` / `--pm-btn-bg-hover` — mic / call buttons + avatar
- `--pm-send-bg` / `--pm-send-text` — send button
- `--pm-typing-dot` — typing indicator dots
- `--pm-scrollbar` — messages scrollbar
- `--pm-fab-inset` / `--pm-fab-shadow` / `--pm-panel-shadow` — FAB + panel shadows

## [0.3.2] - 2026-06-17

### Changed — Compact, modern redesign of orb + modal

CSS-only refinement. **No API changes** — same props, attributes, events, theming tokens (`--vw-*` / `--pm-*`).

- **`<pinecall-orb>` launcher** — 64→52px orb, tighter breathing rings, subtler shadow, smaller label/bubble/typing dots, anchor 28→20px (14px on mobile).
- **`<pinecall-modal>` call card** — narrower card (560→420px, radius 28→22px), smaller header (avatar 44→32px), orb 150→96px, idle waveform 30→22px, wave-mode waveform 96→64px, controls 56→44px, FAB 60→52px, tighter paddings throughout while keeping the wave-mode stepper (`Ring · Listen · Think · Speak`) well-spaced.

## [0.3.1] - 2026-06-17

### Added
- **`ChatSession` tool indicator** — handles `llm.chat.tool_call` / `llm.chat.tool_result`, adding a minimalist `system` message (`🔧 Using <tool>…` → `✓ <tool>`) to the transcript, matching `VoiceSession`. The chatbox now shows the tool being called in text mode, like voice.
- **`pinecall:transcript`** event is now dispatched by `<pinecall-modal>` and `<pinecall-chat>` too (previously only `<pinecall-orb>`).

> Note: chat tool **execution** also required a fix in `@pinecall/sdk` (chat tool calls now auto-execute registered tools, like voice).

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
