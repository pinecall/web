# @pinecall/voice-widget

## 0.3.2 — 2026-06-09

### Fixed
- Fixed persistent typing dots when the LLM calls a tool without generating text first. Empty bot bubbles are now hidden once speaking ends.

## 0.3.1 — 2026-06-09

### Fixed
- Fixed module resolution issue by explicitly depending on `voice-core` and `chat-core` versions instead of `workspace:*`.
- Tool calls now display inline in the transcript panel automatically without needing `trackedTools` configuration.
- System messages now use centered, muted CSS styling to distinguish them from user and bot bubbles.

## 0.3.0 — 2026-06-05

### ⚠️ Breaking Changes

- **VoiceWidget is now voice-only.** Removed the following props:
  - `channels` — no longer drives a built-in ContactHub menu
  - `callMeEndpoint` — Call Me flow removed from widget
  - `chat` — LLM text chat removed from widget
  - `onIdleClick` — orb always connects/disconnects directly
  - `locale` / `labels` — hub i18n strings no longer needed
  - `avatar` — hub header avatar removed
- Clicking the orb now **always** starts/stops a WebRTC voice session. No more multi-channel menu.
- Removed `blossom:open-chat` event listener.

### Added

- `ContactHub` is now a **standalone export** — use it to build your own multi-channel UI outside VoiceWidget. Requires explicit `connect` prop instead of `useVoice()`.
- `ChatView` is now exported for standalone use.

### Migration

If you were using `channels`, `callMeEndpoint`, or `chat` props, remove them from `<VoiceWidget>`. If you need multi-channel UI, import and compose `ContactHub` or `ChatView` separately.


## 0.2.11 — 2026-06-01

### Fixed

- ContactHub "Call Me" SSE: moved dial trigger from useEffect to callback to prevent React StrictMode double-dial.
- Call Me floating bubbles: word-by-word transcript display with pulse ring animations.

## 0.2.6

### Changed

- Replaced README with concise npm-facing version pointing to [docs.pinecall.io](https://docs.pinecall.io/docs/voice-widget/overview).

## 0.2.0

### Minor Changes

- ### Multi-language support

  **@pinecall/voice-core**

  - Added `config` and `metadata` fields to `VoiceSessionOptions` — sent in the WebRTC offer body for per-session overrides (voice, STT, language, greeting).
  - Added `configure(config)` method for mid-call config changes via DataChannel (language/voice/STT hot-swap).
  - Added `updateOptions(patch)` method for pre-connect config updates.

  **@pinecall/voice-widget**

  - Added `languages` prop — a `Record<string, LanguagePreset>` defining per-language voice, STT, turn detection, and greeting presets.
  - Added `defaultLanguage` prop to set the initial language selection.
  - Added `config` and `metadata` props for session-level overrides.
  - Added `onLanguageChange` callback fired when the user selects a language.
  - New language pill bar UI: hidden by default, appears on hover, always visible during active calls.
  - Glassmorphic pill design with smooth fade/slide transitions.
  - Language changes pre-call update the session config; mid-call changes are sent via DataChannel.
  - `LanguagePreset.stt` and `turnDetection` now accept string shortcuts or full config objects.
  - Widget dependency on `@pinecall/voice-core` changed from `^0.1.2` to `workspace:*`.
  - Exported `LanguagePreset` type from package index.

### Patch Changes

- Updated dependencies
  - @pinecall/voice-core@0.2.0
