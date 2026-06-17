/**
 * Token provider demo for <pinecall-orb>.
 *
 * One tiny Node server that:
 *   1. registers a Pinecall agent (config only — no serve() needed for WebRTC)
 *   2. GET /api/token  → mints a short-lived WebRTC token (agent.createToken)
 *   3. serves the demo page + the built package from the webrtc repo root,
 *      so everything is same-origin (no CORS).
 *
 * Run:
 *   cd examples/token-server && npm install
 *   PINECALL_API_KEY=sk_... npm start
 *   → open http://localhost:5050
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";
import { Pinecall } from "@pinecall/sdk";

const PORT = Number(process.env.PORT) || 5050;
const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), "..", "..")); // webrtc repo root

const apiKey = process.env.PINECALL_API_KEY;
if (!apiKey) {
  console.error("\n  ✗ PINECALL_API_KEY is not set.\n    Run:  PINECALL_API_KEY=sk_... npm start\n");
  process.exit(1);
}

const pc = new Pinecall({ apiKey });

const GREETING = "Hi! I'm the Pinecall demo. How can I help?";

// A simple voice-only demo agent. allowedOrigins is a dev fallback; the real
// security here is the token minted server-side below.
const agent = pc.agent("web-orb-demo", {
  prompt: "You are the Pinecall web demo agent. Be warm, brief, and helpful.",
  llm: "openai/gpt-5-chat-latest",
  voice: "elevenlabs/sarah",
  stt: "deepgram/flux",
  language: "en",
  greeting: GREETING, // declarative (server-side) greeting
  allowedOrigins: ["http://localhost:*"],
});

// Belt-and-suspenders for WebRTC: if the declarative greeting didn't fire,
// speak it from our connected process on call.started. The log tells us
// whether the event reaches us at all.
agent.on("call.started", (call) => {
  console.log(`  ▷ call.started — transport=${call.transport} direction=${call.direction} id=${call.id}`);
});
agent.on("call.ended", (call, reason) => {
  console.log(`  ▷ call.ended — ${reason}`);
});

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function send(res, status, body, type = "text/plain") {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── Token endpoint ──
    if (url.pathname === "/api/token") {
      const token = await agent.createToken("webrtc");
      return send(res, 200, JSON.stringify(token), "application/json");
    }

    // ── Static files (rooted at the webrtc repo) ──
    let pathname = url.pathname === "/" ? "/examples/orb.html" : url.pathname;
    const filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden"); // path traversal guard

    const data = await readFile(filePath);
    return send(res, 200, data, TYPES[extname(filePath)] || "application/octet-stream");
  } catch (err) {
    if (err && err.code === "ENOENT") return send(res, 404, "Not found");
    console.error("server error:", err);
    return send(res, 500, "Token error: " + (err?.message || String(err)));
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✓ Token server + demo on  http://localhost:${PORT}`);
  console.log(`    agent:        web-orb-demo`);
  console.log(`    token:        GET http://localhost:${PORT}/api/token`);
  console.log(`    open the demo and click the orb.\n`);
});
