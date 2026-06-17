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
import { Pinecall, tool } from "@pinecall/sdk";
import { z } from "zod";
import { appendFileSync } from "node:fs";

const PORT = Number(process.env.PORT) || 5050;

// ── Debug logger → /tmp/debug.log (and stdout) ──
const dbg = (...a) => {
  const line = `${new Date().toISOString()} ${a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")}\n`;
  try { appendFileSync("/tmp/debug.log", line); } catch { /* ignore */ }
  console.log("[dbg]", ...a);
};
dbg("──── token-server boot ────");
const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), "..", "..")); // webrtc repo root

const apiKey = process.env.PINECALL_API_KEY;
if (!apiKey) {
  console.error("\n  ✗ PINECALL_API_KEY is not set.\n    Run:  PINECALL_API_KEY=sk_... npm start\n");
  process.exit(1);
}

const pc = new Pinecall({ apiKey });

const GREETING = "Hi! I'm the Pinecall weather demo. Ask me the weather in any city.";

// ── Weather tools (Open-Meteo, no API key) — ported from the landing's Pines agent ──

const WMO = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"], 61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "⛈️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"], 80: ["Rain showers", "🌦️"],
  81: ["Heavy showers", "⛈️"], 82: ["Violent showers", "⛈️"], 95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm + hail", "⛈️"], 99: ["Thunderstorm + heavy hail", "⛈️"],
};
const decodeWMO = (code) => { const m = WMO[code] ?? ["Unknown", "🌡️"]; return { condition: m[0], icon: m[1] }; };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function geocode(city) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
  const d = await r.json();
  return d.results?.[0] ?? null;
}

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city. ALWAYS call this when the user asks about weather — never guess.",
  schema: z.object({ city: z.string().describe("City name, e.g. 'Tokyo', 'Buenos Aires', 'London'") }),
  execute: async ({ city }, call) => {
    dbg("🔧 get_weather START city=", city, "transport=", call?.transport, "callId=", call?.id);
    try {
      const g = await geocode(city);
      if (!g) { dbg("🔧 get_weather no-geo", city); return { error: true, message: `Could not find city "${city}".` }; }
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius`);
      const c = (await r.json()).current;
      const { condition, icon } = decodeWMO(c.weather_code);
      const result = {
        city: g.name, country: g.country, temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature), condition, icon,
        humidity: c.relative_humidity_2m, windSpeed: Math.round(c.wind_speed_10m), unit: "°C",
      };
      dbg("🔧 get_weather DONE", result);
      return result;
    } catch (e) {
      dbg("🔧 get_weather ERROR", String(e?.message || e));
      return { error: true, message: "weather fetch failed" };
    }
  },
});

const getForecast = tool({
  name: "get_forecast",
  description: "Get a 5-day weather forecast for a city. Call this for upcoming weather or a specific future day.",
  schema: z.object({ city: z.string().describe("City name, e.g. 'Tokyo', 'Buenos Aires', 'London'") }),
  execute: async ({ city }, call) => {
    dbg("🔧 get_forecast START city=", city, "transport=", call?.transport);
    const g = await geocode(city);
    if (!g) return { error: true, message: `Could not find city "${city}".` };
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&forecast_days=5&timezone=auto`);
    const d = (await r.json()).daily;
    const days = d.time.map((date, i) => {
      const { condition, icon } = decodeWMO(d.weather_code[i]);
      return {
        day: DAY_NAMES[new Date(date + "T12:00:00").getDay()], date,
        high: Math.round(d.temperature_2m_max[i]), low: Math.round(d.temperature_2m_min[i]), condition, icon,
      };
    });
    return { city: g.name, country: g.country, days, unit: "°C" };
  },
});

// Weather demo agent (Pines-style). Tools let you actually test a real conversation.
const agent = pc.agent("web-orb-demo", {
  prompt: `You are the Pinecall weather demo assistant. Be warm and concise. Respond in whatever language the user speaks.

When the user asks about weather or a forecast:
1. FIRST say a short line like "Let me check the weather in [city]!" (no tool yet).
2. On your NEXT turn, call get_weather (current) or get_forecast (5-day).
Never call a tool and speak in the same turn. Never guess — always use a tool.

After results, report naturally like a TV weather presenter: temperature, feels-like, conditions, wind. Then offer another city or the forecast.

For spoken (voice) replies: write numbers and units as words ("thirty three degrees celsius", "eighty percent"), no symbols (°, %, *, #) or markdown.`,
  llm: "openai/gpt-5-chat-latest",
  voice: "elevenlabs/sarah",
  stt: "deepgram/flux",
  language: "en",
  greeting: GREETING, // declarative (server-side) greeting — voice only
  tools: [getWeather, getForecast],
  allowedOrigins: ["http://localhost:*"],
  config: {
    // real audio levels → the modal/chatbox waveform reacts to actual speech
    analysis: { send_audio_metrics: true, audio_metrics_interval_ms: 250 },
  },
});

// Belt-and-suspenders for WebRTC: if the declarative greeting didn't fire,
// speak it from our connected process on call.started. The log tells us
// whether the event reaches us at all.
agent.on("call.started", (call) => {
  dbg("▷ call.started", "transport=", call.transport, "dir=", call.direction, "id=", call.id);
});
// Text chat does NOT auto-greet (unlike voice) — greet on chat.started.
agent.on("chat.started", (call) => {
  dbg("▷ chat.started id=", call.id);
});
agent.on("call.ended", (call, reason) => {
  dbg("▷ call.ended", "reason=", reason, "id=", call?.id);
});
// Did the tool call reach our process at all?
agent.on("llm.toolCall", (event, call) => {
  dbg("▷ llm.toolCall", "tools=", (event?.toolCalls ?? []).map((t) => t.name), "callId=", call?.id, "transport=", call?.transport);
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

    // ── Token endpoints ──
    if (url.pathname === "/api/token") {
      const token = await agent.createToken("webrtc");
      return send(res, 200, JSON.stringify(token), "application/json");
    }
    if (url.pathname === "/api/chat-token") {
      const token = await agent.createToken("chat");
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
