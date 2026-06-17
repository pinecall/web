import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts", // @pinecall/web        — React widgets
    "core/index": "src/core/index.ts", // @pinecall/web/core   — vanilla VoiceSession
    "chat/index": "src/chat/index.ts", // @pinecall/web/chat   — vanilla ChatSession
    "chat/react": "src/chat/react.tsx", // @pinecall/web/chat/react — usePinecallChat
    "orb/index": "src/orb/index.ts", // @pinecall/web/orb    — <pinecall-orb> custom element
    "orb/react": "src/orb/react.tsx", // @pinecall/web/orb/react — React <Orb> wrapper
    "modal/index": "src/modal/index.ts", // @pinecall/web/modal  — <pinecall-modal> call modal
    "modal/react": "src/modal/react.tsx", // @pinecall/web/modal/react — React <CallModal>
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  external: ["react", "react-dom", "react/jsx-runtime"],
  noExternal: ["marked"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
