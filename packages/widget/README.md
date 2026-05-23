<h1 align="center">@pinecall/voice-widget</h1>

<p align="center">
  <strong>Drop-in React voice widget for Pinecall agents.</strong><br/>
  Animated orb UI with real-time transcript, interactive tool rendering, and full customization.<br/>
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
- [Tools API](#tools-api)
  - [`trackedTools` Prop](#trackedtools-prop)
  - [`ToolUI` Type](#toolui-type)
  - [`useVoice()` Context Hook](#usevoice-context-hook)
  - [`sendText(text)`](#sendtexttext)
  - [`setContext(key, value)`](#setcontextkey-value)
  - [`dismissTool(toolCallId)`](#dismisstooltoolcallid)
  - [Full Example: Booking + Contact Form](#full-example-booking--contact-form)
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
| `config` | `Record<string, unknown>` | — | Session config overrides (voice, STT, language, greeting) |
| `metadata` | `Record<string, unknown>` | — | Metadata passed to the agent (available in `call.metadata`) |
| `languages` | `Record<string, LanguagePreset>` | — | Multi-language presets (see [Multi-Language](#multi-language)) |
| `defaultLanguage` | `string` | first key | Initial language selection |
| `onLanguageChange` | `(lang, preset) => void` | — | Called when the user selects a language |
| `className` | `string` | — | Extra CSS class on the root wrapper |
| `onStatusChange` | `(status) => void` | — | Called when connection status changes |

---

## Multi-Language

The `languages` prop enables a language pill selector that appears on hover and stays visible during calls. Each language preset configures the voice, STT, turn detection, and greeting for that language.

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";
import type { LanguagePreset } from "@pinecall/voice-widget";

const LANGUAGES: Record<string, LanguagePreset> = {
  en: {
    label: "English",
    flag: "🇬🇧",
    voice: "elevenlabs:EXAVITQu4vr4xnSDxMaL",
    stt: "deepgram-flux",
    language: "en",
    greeting: "Hello! How can I help you?",
  },
  es: {
    label: "Español",
    flag: "🇪🇸",
    voice: "elevenlabs:h2cd3gvcqTp3m65Dysk7",
    stt: { provider: "deepgram", model: "nova-3", language: "es" },
    language: "es",
    greeting: "¡Hola! ¿En qué puedo ayudarte?",
  },
  ar: {
    label: "العربية",
    flag: "🇸🇦",
    voice: "elevenlabs:jAAHNNqlbAX9iWjJPEtE",
    stt: { provider: "deepgram", model: "nova-3", language: "ar" },
    language: "ar",
    turnDetection: "smart_turn",
    greeting: "مرحباً، كيف يمكنني مساعدتك؟",
  },
};

<VoiceWidget
  agent="mara"
  name="Mara"
  languages={LANGUAGES}
  defaultLanguage="en"
  onLanguageChange={(lang, preset) => console.log(`Switched to ${lang}`)}
/>
```

### LanguagePreset

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display name (e.g. "Español") |
| `flag` | `string` | Flag emoji (e.g. "🇪🇸") |
| `voice` | `string` | Voice ID in `provider:id` format (e.g. `"elevenlabs:abc123"`) |
| `stt` | `string \| object` | STT shortcut (`"deepgram-flux"`) or full config (`{ provider, model, language }`) |
| `language` | `string` | Language code for STT (e.g. `"es"`, `"ar"`) |
| `turnDetection` | `string \| object` | Turn detection mode (`"smart_turn"`, `"native"`) or full config |
| `greeting` | `string` | Custom greeting in this language, spoken when the call starts |

### Behavior

- **Pre-call**: Language pill bar appears on hover. Selecting a language updates the session config for the next `connect()`.
- **Mid-call**: Language pills are always visible. Selecting a language sends a `configure` message via DataChannel, hot-swapping voice/STT/turn detection without disconnecting.
- **Greeting**: Only applies at call start (sent in the offer body). Mid-call language changes don't re-trigger the greeting.

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
    colorWarning: "255, 160, 0",        // amber (idle warning blink)
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
| `colorWarning` | `--vw-color-warning` | RGB triplet | `255, 160, 0` | Idle warning blink |
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
    idleWarning,    // number | null — seconds until idle timeout (null = no warning)

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
| **Idle Warning** | **Orange blink** | `.idle-warning` | User silent too long — call will timeout soon |

The idle warning state is triggered by the server's `session.idle_warning` event and clears when the user speaks or the call ends.

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

## Tools API

The widget can render interactive UI for server-side LLM tool calls. This enables rich, bidirectional interactions: the agent calls tools → the UI renders components → the user interacts → the agent sees the result.

### How It Works

```
Agent calls tool (e.g. getAvailableSlots)
  ↓ DataChannel: llm.tool_call
Widget tracks it in state.toolCalls
  ↓ SDK executes tool handler
  ↓ DataChannel: llm.tool_result
Widget updates toolCalls[].result
  → Your component renders the result (e.g. slot picker)
  → User clicks a slot
  → sendText("I'd like the 10 AM slot")
  → Agent processes the selection
```

### `trackedTools` Prop

Tell the widget which tool names to track for UI rendering. Untracked tools are handled silently by the server-side agent.

```tsx
<VoiceWidget
  agent="booking-demo"
  trackedTools={["getAvailableSlots", "showContactForm", "fillField"]}
>
  <ToolPanel />
</VoiceWidget>
```

### `ToolUI` Type

Each tracked tool call is stored in `state.toolCalls` as a `ToolUI` object:

```typescript
interface ToolUI {
  toolCallId: string;                    // Correlation ID
  name: string;                          // Tool function name
  arguments: Record<string, unknown>;    // Parsed LLM arguments
  result?: unknown;                      // Result (undefined while pending)
  timestamp: number;                     // When the call was received
}
```

### `useVoice()` Context Hook

Access session state and actions from any component inside `<VoiceWidget>`:

```tsx
import { useVoice } from "@pinecall/voice-widget";

function ToolPanel() {
  const {
    // State
    toolCalls,     // ToolUI[] — active tracked tool calls
    messages,      // TranscriptMessage[] — full transcript
    status,        // SessionStatus
    phase,         // CallPhase

    // Actions
    sendText,      // (text: string) => void — inject text as if the user spoke
    dismissTool,   // (toolCallId: string) => void — remove a tool from state
    setContext,     // (key: string, value: string | null) => void — inject context into LLM prompt
  } = useVoice();

  const slots = toolCalls.find(
    (tc) => tc.name === "getAvailableSlots" && tc.result !== undefined,
  );

  if (!slots) return null;

  return (
    <div className="slot-picker">
      {slots.result.slots.map((slot) => (
        <button
          key={slot}
          onClick={() => {
            sendText(`I'd like the ${slot} slot`);
            dismissTool(slots.toolCallId);
          }}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
```

> **`useVoice()` vs `useVoiceSession()`**: `useVoice()` is a context hook for components *inside* `<VoiceWidget>`. `useVoiceSession()` is a standalone hook that creates its own session. Use `useVoice()` when building tool renderers.

### `sendText(text)`

Inject text into the conversation as if the user spoke it. Routes through the server's LLM pipeline. Useful for click-based interactions (button selections, form submissions).

```tsx
// User clicks a slot button
sendText("I'd like to book the 10:00 AM slot");

// User submits a form
sendText("Form submitted: name=John, email=john@example.com, phone=+1555000");
```

### `setContext(key, value)`

Inject dynamic context into the agent's LLM system prompt. The context is keyed — setting the same key replaces its value. Pass `null` to clear.

This is powerful for syncing UI state (form inputs, selections, page content) into the agent's awareness:

```tsx
// Sync form state on every keystroke
useEffect(() => {
  setContext("contact_form", JSON.stringify({
    name: formData.name || "(empty)",
    email: formData.email || "(empty)",
    phone: formData.phone || "(empty)",
  }));
}, [formData, setContext]);

// Clear when form is submitted
setContext("contact_form", null);
```

On the server, this appears in the system prompt as:

```
## UI Context
### contact_form
{"name":"John","email":"john@example.com","phone":"(empty)"}
```

### `dismissTool(toolCallId)`

Remove a tool call from `state.toolCalls`. Call this after the user interacts with a tool UI (e.g., selects a slot) to hide the rendered component.

### Full Example: Booking + Contact Form

This example shows the complete flow — slot picker, contact form with auto-fill, and confirmation:

**Agent (server-side):**

```javascript
const agent = pc.deploy("booking-demo", {
  prompt: `You are a booking assistant.
- Call getAvailableSlots when the user wants to book.
- After they pick a slot, call showContactForm.
- If they say their name/email/phone, call fillField to auto-fill.
- The form state is in "## UI Context" — you can see what they've typed.
- When the form is submitted, call confirmBooking.`,
  model: "gpt-4.1-mini",
  tools: [
    { name: "getAvailableSlots", ... },
    { name: "showContactForm", ... },
    { name: "fillField", parameters: { field: "name|email|phone", value: "string" } },
    { name: "confirmBooking", ... },
  ],
  channels: ["webrtc"],
});
```

**UI (browser-side):**

```tsx
import { VoiceWidget, useVoice } from "@pinecall/voice-widget";

function ContactForm({ tool }) {
  const { sendText, dismissTool, setContext, toolCalls } = useVoice();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  // Watch for agent auto-fill via fillField tool
  const fillTool = toolCalls.find(tc => tc.name === "fillField" && tc.result);
  useEffect(() => {
    if (fillTool?.result) {
      setForm(prev => ({ ...prev, [fillTool.result.field]: fillTool.result.value }));
      dismissTool(fillTool.toolCallId);
    }
  }, [fillTool]);

  // Sync form state → LLM prompt
  useEffect(() => {
    setContext("contact_form", JSON.stringify(form));
  }, [form, setContext]);

  return (
    <form onSubmit={() => {
      sendText(`Form submitted: ${JSON.stringify(form)}`);
      setContext("contact_form", null);
      dismissTool(tool.toolCallId);
    }}>
      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      <button type="submit">Confirm</button>
    </form>
  );
}

function App() {
  return (
    <VoiceWidget
      agent="booking-demo"
      trackedTools={["getAvailableSlots", "showContactForm", "fillField", "confirmBooking"]}
    >
      <ToolPanel />
    </VoiceWidget>
  );
}
```



## Exports

```ts
// Components & hooks
export { VoiceWidget } from "./VoiceWidget";
export { useVoiceSession } from "./useVoiceSession";
export { useVoice } from "./VoiceWidget";     // Context hook for tool renderers
export { PRESETS } from "./presets";

// Types
export type {
  VoiceWidgetProps,
  VoiceWidgetTheme,
  VoiceWidgetPreset,
  LanguagePreset,
} from "./types";

// Re-exported from @pinecall/voice-core
export type {
  SessionStatus,
  CallPhase,
  TranscriptMessage,
  ToolUI,             // Tool call state for tracked tools
  VoiceSessionState,
  VoiceSessionOptions,
} from "@pinecall/voice-core";
```

For framework-agnostic usage (vanilla JS, Vue, Svelte, etc.), use [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core) directly.
