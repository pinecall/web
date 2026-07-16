# Changelog

All notable changes to `@pinecall/web` are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.17] - 2026-07-02

### Changed — conversation history moved SERVER-side (threads)

History is no longer stored in `localStorage` (0.3.16 stored full messages
client-side). Now the thread lives in the Pinecall platform:

- `ChatSession` gained a **`thread`** option: the id rides the chat WS
  (`?thread=`) — or, for backends that bind threads to their own users, sealed
  **token metadata `threadId`** (takes precedence server-side, LumiCRM-style).
- On connect the **server restores the thread**: prior turns seed the agent's
  REAL LLM history (not a system-prompt blob) and come back over the WS as a
  `chat.history` event → they land in `state.messages` flagged **`isHistory`**,
  so every consumer (widget, React hook, custom UIs) re-renders them for free.
- `<pinecall-chat>` keeps only a thread INDEX locally (ids/titles/dates +
  current pointer); message content never touches browser storage. Same UI:
  new-conversation (+), past conversations (clock), restore on refresh.
- Requires sdk-server + playground with thread support deployed; without it the
  chat simply starts fresh (graceful).

## [0.3.16] - 2026-07-02

### Added — `<pinecall-chat>`: conversation history (survives refresh)

The conversation now **persists across page refreshes** and the header gained
two actions: **new conversation** (+) and **past conversations** (clock menu).

- Messages are saved per-thread in `localStorage`, keyed by agent
  (`pc-chat:<agent>`); the current thread restores on open with its bubbles
  rendered as frozen history and the transcript injected as context
  (`setContext("conversation", …)`) so the agent **continues where it left
  off** — same mechanism the text↔voice switch already used.
- "New conversation" starts a fresh thread; the clock menu lists the last 10
  threads (title = first user message, date) and reopens any of them.
- Greeting-only threads aren't saved; restored threads don't re-greet.
- Caps: 10 threads × 80 messages. Opt out entirely with the `no-history`
  attribute (also the automatic fallback when `localStorage` is unavailable).

## [0.3.15] - 2026-07-01

### Fixed — `<pinecall-chat>` composer: auto-height + send cuts the recording

- The composer is now an **auto-growing textarea** (was a single-line `<input>`):
  it grows with the content up to ~5 lines and keeps the end visible while the
  live transcription streams in — no more text disappearing off to the right.
  Enter sends; Shift+Enter inserts a newline.
- **Sending while dictating stops the recording**: the send button (or Enter)
  cancels the live scribe immediately and sends what already streamed into the
  input, instead of leaving the mic running.

## [0.3.14] - 2026-07-01

### Added — real-time (streaming) dictation + `LiveScribe`

Voice messages now transcribe **live as you speak** instead of after you stop.

- New **`LiveScribe`** client, exported at **`@pinecall/web/scribe`** — captures
  the mic, streams PCM16 @ 16 kHz to the server's streaming scribe gateway
  (`/api/scribe/ws`, ElevenLabs `scribe_v2_realtime`), and emits partial/final
  transcripts via `onText`/`onFinal`. Reusable by any app (LumiCRM's internal
  chat uses it too).
- **Multi-language**: auto-detected by default (Scribe v2 realtime handles 90+
  languages *and* mid-utterance code-switching). Pin one with the `language`
  option / `<pinecall-chat language="es">` attribute for best accuracy.
- `<pinecall-chat>`'s record button now streams the transcript into the input in
  real time (was: record → stop → batch transcribe in 0.3.13). Authorized with
  the same chat `tokenProvider` token — no API key in the browser.

> The batch endpoint (`POST /api/scribe`) remains for one-shot use. Requires
> sdk-server with the `/api/scribe/ws` endpoint deployed.

## [0.3.13] - 2026-07-01

### Added — `<pinecall-chat>`: WhatsApp-style voice messages (dictation)

The chat composer now has a **record button** next to send (text mode only). Tap
to record a voice message, tap again to stop; the clip is transcribed by the
server "scribe" gateway (`POST /api/scribe`, ElevenLabs batch Scribe) and the
text lands **in the input** (editable) — OpenAI-dictation style, *not* a call.

- Reuses the widget's chat `tokenProvider` to authorize the upload, so the raw
  Pinecall API key never reaches the browser (same signed `cht_` token the chat
  WebSocket uses).
- Picks a `MediaRecorder` mime the browser supports (webm/opus → mp4/ogg on
  Safari). Multiple dictations append to the current input.
- On by default; opt out with the `no-voice-message` attribute. Recording stops
  automatically when the chat closes/unmounts.

> Requires sdk-server with the `/api/scribe` endpoint deployed and
> `ELEVENLABS_API_KEY` set on the box.

## [0.3.10] - 2026-06-20

### Fixed — chat: block sending while the assistant is busy (streaming or running a tool)

Sending a message mid-turn — most visibly *while a tool call was running* —
broke the chat: the new user message slotted between the assistant's
`tool_calls` message and its tool results in the server-side history, which the
LLM provider rejects with a 400. (Seen in `blossom-landing-app`, which embeds
the widget.)

- `ChatSession.send()` now no-ops while `state.typing` is true and flips
  `typing` to `true` **synchronously** on send (instead of waiting for the
  server's first token/tool_call event) — closing the window where the input
  was briefly re-enabled between send and the first streamed event. This guards
  every caller, including `VoiceWidget` quick options and `<pinecall-chat>`.
- `<pinecall-chat>` (`PinecallChat.sendInput`) bails before clearing the field
  when busy, so a blocked send no longer silently discards typed text.

> Pairs with a server-side safety net: sdk-server now serializes chat turns so a
> mid-turn message waits for the current turn (and all its tool rounds) instead
> of running concurrently against shared history.

## [0.3.9] - 2026-06-19

### Changed — `<pinecall-chat>` mobile is now a true full-page chat (document-flow)

0.3.8's visualViewport sizing of the fixed panel still jittered on iOS (a
fixed overlay never gets iOS's *native* keyboard avoidance — only the document
scroll does). On mobile the chatbox now does a full-page takeover: the host is
moved into `<body>`, the rest of the page is hidden, and the panel becomes a
normal-flow `min-height:100dvh` element with a `position:sticky` composer +
header. The document scrolls, so iOS lifts the focused input natively with no
jump — identical mechanics to a dedicated full-page chat. Restored exactly on
close. No more visualViewport JS / fixed-overlay sizing.

## [0.3.8] - 2026-06-19

### Fixed — `<pinecall-chat>` mobile keyboard handling (iOS + Android)

The docked chatbox is a `position:fixed` overlay, so on iOS Safari the
on-screen keyboard (which does **not** shrink the layout viewport) covered the
input, and the `14px` input triggered focus-zoom.

On mobile the panel now goes full-screen and tracks `window.visualViewport`
while open — `PinecallChat` sets `--pc-vh` / `--pc-vtop` on the host (height +
offsetTop; "keyboard open" only when `innerHeight - vv.height > 120`, which also
dodges the iOS 26 offsetTop-reset bug), and the mobile CSS reads them so the
input always clears the keyboard with no jump. Plus `16px` input (no zoom),
safe-area insets on header/input, and bigger touch targets.

## [0.3.7] - 2026-06-18

### Added — `--pc-position` for inline-embeddable widgets

`<pinecall-chat>` / `<pinecall-modal>` FAB + panel/overlay now read
`position: var(--pc-position, fixed)`, so a host can set `--pc-position: absolute`
to embed the widget inside a positioned container instead of floating it over the
whole viewport (React wrappers expose the corresponding wiring).

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
