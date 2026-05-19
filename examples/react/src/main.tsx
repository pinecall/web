import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { VoiceWidget } from "@pinecall/voice-widget";
import type { VoiceWidgetPreset } from "@pinecall/voice-widget";

const PRESETS: VoiceWidgetPreset[] = ["dark", "midnight", "aurora", "sunset", "light"];

function Demo() {
  const [preset, setPreset] = useState<VoiceWidgetPreset>("midnight");

  return (
    <>
      <div className="preset-bar">
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`preset-chip ${p === preset ? "active" : ""}`}
            onClick={() => setPreset(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <VoiceWidget
        agent="mara"
        name="Mara"
        label="Talk to Mara"
        preset={preset}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
