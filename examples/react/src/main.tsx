import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { VoiceWidget } from "@pinecall/voice-widget";
import type { VoiceWidgetPreset, LanguagePreset } from "@pinecall/voice-widget";

const PRESETS: VoiceWidgetPreset[] = ["dark", "midnight", "aurora", "sunset", "light"];

const LANGUAGES: Record<string, LanguagePreset> = {
  en: { label: "English", flag: "🇬🇧", voice: "elevenlabs:EXAVITQu4vr4xnSDxMaL", stt: { provider: "deepgram-flux" }, language: "en" },
  es: { label: "Español", flag: "🇪🇸", voice: "elevenlabs:h2cd3gvcqTp3m65Dysk7", stt: { provider: "deepgram-flux" }, language: "es" },
  ar: { label: "العربية", flag: "🇸🇦", voice: "elevenlabs:jAAHNNqlbAX9iWjJPEtE", stt: { provider: "deepgram-flux" }, language: "ar" },
};

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
        server="https://mara.app.pinecall.io"
        name="Mara"
        label="Talk to Mara"
        preset={preset}
        languages={LANGUAGES}
        defaultLanguage="en"
        onLanguageChange={(lang, preset) =>
          console.log(`🌐 Language changed: ${lang}`, preset)
        }
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
