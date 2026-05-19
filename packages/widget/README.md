<h1 align="center">@pinecall/voice-widget</h1>

<p align="center">
  <strong>Drop-in React voice widget for Pinecall agents.</strong><br/>
  Animated orb UI with real-time transcript, theme presets, and full customization.<br/>
  Built on <a href="https://www.npmjs.com/package/@pinecall/voice-core"><code>@pinecall/voice-core</code></a>.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#props">Props</a> ·
  <a href="#theme-presets">Presets</a> ·
  <a href="#theme-customization">Theming</a> ·
  <a href="#usevoicesession-hook">Hook</a> ·
  <a href="#advanced-usage">Advanced</a>
</p>

---

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Props](#props)
- [Theme Presets](#theme-presets)
- [Theme Customization](#theme-customization)
  - [VoiceWidgetTheme Reference](#voicewidgettheme-reference)
  - [CSS Override (No JavaScript)](#css-override-no-javascript)
- [`useVoiceSession` Hook](#usevoicesession-hook)
- [Transcript Messages](#transcript-messages)
  - [User Messages](#user-messages)
  - [Bot Messages (Word-by-Word)](#bot-messages-word-by-word)
- [Orb Visual States](#orb-visual-states)
- [Advanced Usage](#advanced-usage)
  - [Status Change Callback](#status-change-callback)
  - [Accessing Raw Events (Core Session)](#accessing-raw-events-core-session)
  - [Creating Custom Presets](#creating-custom-presets)
- [Exports](#exports)

---

## Install

```bash
npm install @pinecall/voice-widget react react-dom
```

> `react` and `react-dom` (≥18) are peer dependencies.

---

## Quick Start

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";

function App() {
  return (
    <VoiceWidget
      agent="mara"
      name="Mara"
    />
  );
}
```

That's it. The widget renders a floating orb in the bottom-right corner. Click to start a voice call. Click again to end it.

---

## Props

### `<VoiceWidget />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agent` | `string` | **required** | Agent ID to connect to |
| `server` | `string` | `"https://voice.pinecall.io"` | Pinecall API base URL (override for self-hosted) |
| `name` | `string` | `"Agent"` | Display name shown in status label during calls |
| `label` | `string` | `"Talk to {name}"` | Tooltip shown on hover when idle |
| `preset` | `VoiceWidgetPreset` | `"dark"` | Theme preset name (see [Presets](#theme-presets)) |
| `theme` | `Partial<VoiceWidgetTheme>` | — | Custom theme overrides, merged on top of preset |
| `className` | `string` | — | Extra CSS class on the root wrapper |
| `onStatusChange` | `(status) => void` | — | Called when connection status changes |

---

## Theme Presets

Five built-in presets, each setting all 17 CSS custom properties:

| Preset | Orb | Rings | Panels | Best for |
|--------|-----|-------|--------|----------|
| `"dark"` | Pearl white | Warm red | Dark purple glass | Dark-themed sites (default) |
| `"midnight"` | Deep sapphire | Ice blue | Navy glass | Corporate / professional |
| `"aurora"` | Emerald / teal | Green | Forest dark | Nature / wellness brands |
| `"sunset"` | Warm coral | Golden amber | Warm dark | Hospitality / warm brands |
| `"light"` | Clean white | Soft blue | White glass | Light-themed sites |

```tsx
// Use a preset
<VoiceWidget preset="midnight" agent="mara" />

// Preset + individual override
<VoiceWidget preset="aurora" theme={{ ringColor: "255, 100, 50" }} agent="mara" />

// Access preset values programmatically
import { PRESETS } from "@pinecall/voice-widget";
console.log(PRESETS.midnight); // full theme object
```

---

## Theme Customization

Every visual aspect is controlled by CSS custom properties. Pass a `theme` object to override any value:

```tsx
<VoiceWidget
  agent="mara"
  theme={{
    // Orb idle gradient (RGB triplets)
    orbFrom: "200, 150, 255",   // highlight center
    orbMid: "140, 80, 220",     // mid gradient
    orbTo: "80, 30, 160",       // outer edge

    // State colors (RGB triplets for alpha blending)
    colorConnecting: "245, 158, 11",    // amber
    colorActive: "76, 175, 80",         // green
    colorUserSpeaking: "52, 211, 153",  // emerald
    colorSpeaking: "248, 113, 113",     // rose
    colorThinking: "139, 92, 246",      // violet
    colorAccent: "124, 58, 237",        // violet (user bubbles)
    ringColor: "216, 65, 44",           // idle ring glow

    // Panel & bubble colors (full CSS values)
    panelBg: "rgba(16, 14, 20, .92)",
    panelBorder: "rgba(255, 255, 255, .08)",
    bubbleBotBg: "rgba(18, 16, 22, .9)",
    bubbleBotColor: "#e8e4f0",
    bubbleUserColor: "#e0d4f7",

    // Label tooltip
    labelBg: "#181818",
    labelColor: "#fff",
  }}
/>
```

### VoiceWidgetTheme Reference

| Field | CSS Variable | Type | Default | What it controls |
|-------|-------------|------|---------|-----------------|
| `orbFrom` | `--vw-orb-from` | RGB triplet | `255, 255, 255` | Idle orb gradient center |
| `orbMid` | `--vw-orb-mid` | RGB triplet | `240, 238, 231` | Idle orb gradient midtone |
| `orbTo` | `--vw-orb-to` | RGB triplet | `184, 181, 168` | Idle orb gradient edge |
| `colorConnecting` | `--vw-color-connecting` | RGB triplet | `245, 158, 11` | Connecting state orb |
| `colorActive` | `--vw-color-active` | RGB triplet | `76, 175, 80` | Connected/listening orb |
| `colorUserSpeaking` | `--vw-color-user-speaking` | RGB triplet | `52, 211, 153` | User speaking orb |
| `colorSpeaking` | `--vw-color-speaking` | RGB triplet | `248, 113, 113` | Agent speaking orb |
| `colorThinking` | `--vw-color-thinking` | RGB triplet | `139, 92, 246` | Thinking/processing orb |
| `colorAccent` | `--vw-color-accent` | RGB triplet | `124, 58, 237` | User bubble accent |
| `ringColor` | `--vw-ring-color` | RGB triplet | `216, 65, 44` | Idle ring glow |
| `panelBg` | `--vw-panel-bg` | CSS color | `rgba(16,14,20,.92)` | Transcript panel bg |
| `panelBorder` | `--vw-panel-border` | CSS color | `rgba(255,255,255,.08)` | Transcript panel border |
| `bubbleBotBg` | `--vw-bubble-bot-bg` | CSS color | `rgba(18,16,22,.9)` | Bot bubble bg |
| `bubbleBotColor` | `--vw-bubble-bot-color` | CSS color | `#e8e4f0` | Bot bubble text |
| `bubbleUserColor` | `--vw-bubble-user-color` | CSS color | `#e0d4f7` | User bubble text |
| `labelBg` | `--vw-label-bg` | CSS color | `#181818` | Label tooltip bg |
| `labelColor` | `--vw-label-color` | CSS color | `#fff` | Label tooltip text |

> **RGB triplets** are used for colors that need alpha variants (the CSS uses `rgba(var(--vw-color-x), 0.3)` etc). Pass them as `"R, G, B"` strings, e.g. `"124, 58, 237"`.

### CSS Override (No JavaScript)

You can also override theme variables with pure CSS — no `theme` prop needed:

```css
.vw-wrap {
  --vw-orb-from: 200, 150, 255;
  --vw-ring-color: 100, 80, 200;
  --vw-panel-bg: rgba(20, 10, 40, .95);
}
```

---

## `useVoiceSession` Hook

If you need custom UI instead of the built-in orb, use the hook directly:

```tsx
import { useVoiceSession } from "@pinecall/voice-widget";

function CustomVoice() {
  const {
    // State
    status,         // "idle" | "connecting" | "connected" | "error"
    error,          // string | null
    isMuted,        // boolean
    phase,          // "idle" | "listening" | "speaking" | "pause" | "thinking"
    userSpeaking,   // boolean — user is physically talking
    agentSpeaking,  // boolean — TTS is playing
    duration,       // number — seconds since connected
    messages,       // TranscriptMessage[] — full transcript

    // Actions
    connect,        // () => Promise<void>
    disconnect,     // () => void
    toggleMute,     // () => void
    setMuted,       // (muted: boolean) => void
  } = useVoiceSession({
    agent: "mara",
  });

  return (
    <div>
      <p>Status: {status} | Phase: {phase}</p>
      <p>Duration: {duration}s | Muted: {isMuted ? "Yes" : "No"}</p>

      {status === "idle" && <button onClick={connect}>Start Call</button>}
      {status === "connected" && (
        <>
          <button onClick={disconnect}>End Call</button>
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
        </>
      )}

      <div>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role}>
            <strong>{msg.role}:</strong> {msg.text}
            {msg.isInterim && " (typing...)"}
            {msg.speaking && " 🔊"}
            {msg.interrupted && " ⚡ interrupted"}
          </div>
        ))}
      </div>
    </div>
  );
}
```

The hook wraps `VoiceSession` from `@pinecall/voice-core` with `useSyncExternalStore` for efficient React rendering. The session is created once and destroyed on unmount.

---

## Transcript Messages

The `messages` array contains the full conversation history. Messages update in real-time:

### User Messages

```
user.speaking → TranscriptMessage { role: "user", text: "Hello", isInterim: true }
                                   text updates as STT refines...
user.message  → TranscriptMessage { role: "user", text: "Hello there", isInterim: false }
```

### Bot Messages (Word-by-Word)

```
bot.speaking  → TranscriptMessage { role: "bot", text: "", speaking: true, messageId: "abc" }
bot.word      → text: "Hello"
bot.word      → text: "Hello there"
bot.word      → text: "Hello there how"
bot.word      → text: "Hello there how are"
bot.word      → text: "Hello there how are you"
bot.finished  → TranscriptMessage { speaking: false, text: "Hello there, how are you?" }
```

If the user interrupts (barge-in):

```
bot.word      → text: "Hello there how"
bot.interrupted → TranscriptMessage { speaking: false, interrupted: true }
```

---

## Orb Visual States

The orb changes color and animation based on the call phase:

| State | Visual | CSS Class | When |
|-------|--------|-----------|------|
| Idle | Pearl gradient, breathing rings | (default) | Not connected |
| Connecting | Amber pulse | `.connecting` | Establishing WebRTC |
| Active | Soft green glow | `.active` | Connected, listening |
| User Speaking | Emerald glow | `.user-speaking` | User is talking |
| Agent Speaking | Rose pulse | `.speaking` | Bot TTS playing |
| Thinking | Violet pulse | `.thinking` | Waiting for LLM response |

---

## Advanced Usage

### Status Change Callback

```tsx
<VoiceWidget
  agent="mara"
  onStatusChange={(status) => {
    if (status === "connected") analytics.track("call_started");
    if (status === "idle") analytics.track("call_ended");
    if (status === "error") analytics.track("call_error");
  }}
/>
```

### Accessing Raw Events (Core Session)

For advanced use cases (monitoring tool calls, custom analytics), access the core `VoiceSession` directly:

```tsx
import { useState, useEffect } from "react";
import { VoiceSession } from "@pinecall/voice-core";

function AdvancedVoice() {
  const [session] = useState(() => new VoiceSession({
    agent: "mara",
  }));

  useEffect(() => {
    // Listen to raw DataChannel events
    session.addEventListener("event", (e: CustomEvent) => {
      const { event, tool_name, arguments: args } = e.detail;

      if (event === "llm.tool_call") {
        console.log(`Tool call: ${tool_name}`, args);
      }
      if (event === "bot.word") {
        // Real-time word-by-word tracking
      }
    });

    return () => session.destroy();
  }, [session]);

  // ... render UI using session.getState()
}
```

### Creating Custom Presets

```tsx
import { PRESETS } from "@pinecall/voice-widget";
import type { VoiceWidgetTheme } from "@pinecall/voice-widget";

// Start from an existing preset and modify
const brandTheme: Partial<VoiceWidgetTheme> = {
  ...PRESETS.midnight,
  colorAccent: "255, 87, 34",      // brand orange
  ringColor: "255, 87, 34",
  bubbleUserColor: "#ffccbc",
};

<VoiceWidget
  agent="mara"
  preset="midnight"
  theme={brandTheme}
/>
```

---

## Exports

```ts
// Components & hooks
export { VoiceWidget } from "./VoiceWidget";
export { useVoiceSession } from "./useVoiceSession";
export { PRESETS } from "./presets";

// Types
export type { VoiceWidgetProps, VoiceWidgetTheme, VoiceWidgetPreset } from "./types";

// Re-exported from @pinecall/voice-core
export type {
  SessionStatus,
  CallPhase,
  TranscriptMessage,
  VoiceSessionState,
  VoiceSessionOptions,
} from "@pinecall/voice-core";
```

For framework-agnostic usage (vanilla JS, Vue, Svelte, etc.), use [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) directly.
