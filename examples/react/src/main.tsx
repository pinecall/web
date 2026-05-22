import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { VoiceWidget } from "@pinecall/voice-widget";
import type { VoiceWidgetPreset, LanguagePreset } from "@pinecall/voice-widget";

const PRESETS: VoiceWidgetPreset[] = ["dark", "midnight", "aurora", "sunset", "light"];

const LANGUAGES: Record<string, LanguagePreset> = {
  en: { label: "English", flag: "🇬🇧", voice: "elevenlabs:EXAVITQu4vr4xnSDxMaL", stt: { provider: "deepgram", model: "nova-3", language: "en" }, language: "en", greeting: "Hey, I'm Mara from DeutschePolska. How can I help you today?" },
  es: { label: "Español", flag: "🇪🇸", voice: "elevenlabs:h2cd3gvcqTp3m65Dysk7", stt: { provider: "deepgram", model: "nova-3", language: "es" }, language: "es", greeting: "¡Hola! Soy Mara de DeutschePolska. ¿En qué puedo ayudarte?" },
  ar: { label: "العربية", flag: "🇸🇦", voice: "elevenlabs:jAAHNNqlbAX9iWjJPEtE", stt: { provider: "deepgram", model: "nova-3", language: "ar" }, language: "ar", turnDetection: "smart_turn", greeting: "مرحباً، أنا مارا من دويتشه بولسكا. كيف يمكنني مساعدتك؟" },
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
