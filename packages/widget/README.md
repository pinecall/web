# @pinecall/voice-widget

React voice widget for Pinecall agents.

## Install

```bash
npm install @pinecall/voice-widget react react-dom
```

## Usage

```tsx
import { VoiceWidget } from "@pinecall/voice-widget";

export default function App() {
  return (
    <VoiceWidget
      agent="mara"
      server="https://mara.app.pinecall.io"
      name="Mara"
    />
  );
}
```

For framework-agnostic usage, see [`@pinecall/voice-core`](https://www.npmjs.com/package/@pinecall/voice-core).
