# @pinecall/voice-core

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
