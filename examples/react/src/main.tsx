import React from "react";
import ReactDOM from "react-dom/client";
import { VoiceWidget } from "@pinecall/voice-widget";

function Demo() {
  return (
    <VoiceWidget
      agent="mara"
      server="https://mara.app.pinecall.io"
      name="Mara"
      label="Talk to Mara"
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
