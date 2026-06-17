# NEXT — @pinecall/web

Working notes + what's next. (Local folder is `~/pinecall/webrtc`; the package/repo are `@pinecall/web` / `pinecall/web`.)

## What we did (context)

Collapsed the old 3-package monorepo (`@pinecall/voice-core` + `voice-widget` + `chat-core`) into a **single package `@pinecall/web`** with subpath exports, then added **framework-agnostic Web Components** (Custom Elements, Shadow DOM, SSR-safe, zero new deps) that wrap the vanilla `VoiceSession` / `ChatSession`. The original React widget still ships unchanged.

Entry points:
- `@pinecall/web` — React widgets (`VoiceWidget`, …)
- `@pinecall/web/core` — `VoiceSession` (vanilla)
- `@pinecall/web/chat` · `/chat/react` — `ChatSession` / `usePinecallChat`
- `@pinecall/web/orb` · `/orb/react` — **`<pinecall-orb>`** (voice orb launcher)
- `@pinecall/web/modal` · `/modal/react` — **`<pinecall-modal>`** (glass call modal; `visual="orb" | "wave"`)
- `@pinecall/web/chatbox` · `/chatbox/react` — **`<pinecall-chat>`** (docked chatbox; text ↔ voice escalation)

Highlights shipped:
- **Orb** with `opens="inline" | "modal" | "chat"` (it's the single launcher; opens the others with their FAB suppressed via `no-fab`).
- **Modal** with two visuals: orb, and **wave** (real `audio.metrics`-driven waveform). Keyboard button → live transcript + text-during-call. Phase stepper Ring→Listen→Think→Speak, speaker-colored captions (`--pm-user`/`--pm-bot`), card tinted from `colorAccent`.
- **Chatbox** text-first; call button escalates to WebRTC; conversation continuity across the switch (history kept + prior transcript injected via `setContext`); channel-aware `tokenProvider`; rAF char reveal; tool indicator (`🔧 Using X…` → `✓ X`).
- Events: `pinecall:status` / `:transcript` / `:error` / `:open` / `:close`.

### SDK bug found & fixed (separate package)
Chat tool calls never auto-executed in `@pinecall/sdk` (the `ToolHandler` skips `chat-` ids; the `ChatHandler` only emitted the event). Fixed via a shared `autoExecuteTools()` in `sdk/src/dispatch/handlers/{tool,chat}.ts` — **commit `6523279`, NOT yet published** (the sdk repo has unrelated WIP). The demo token-server uses the **local sdk** (`file:../../../sdk`) so chat tools work.

## Status
- **Published:** `@pinecall/web@0.3.1` (npm). Repo `pinecall/web` up to date.
- **Pending publish:** `@pinecall/sdk` chat-tools fix (commit 6523279) — publish once the sdk's other WIP is ready, then point the token-server back to `@pinecall/sdk@<version>` (remove the `file:` link).
- **Uncommitted (this last step):** the unified demo `examples/index.html` (+ removal of the old `orb/modal/chatbox.html`, token-server `/` → index). Review & commit when happy.
- **Demo logging:** `examples/token-server/server.mjs` still writes to `/tmp/debug.log` (the chat-tools debugging) — remove before final.

## How to run the demo
```bash
cd ~/pinecall/webrtc/examples/token-server
npm install                      # uses the local sdk via file:
PINECALL_API_KEY=sk_... npm start
# open http://localhost:5050  → unified demo (orb / modal[wave|orb] / chatbox)
```
Weather agent (`web-orb-demo`, Open-Meteo tools) makes it a real conversation. Hard-reload (Cmd+Shift+R) after rebuilding `dist` — browsers cache ES modules.

## NEXT — redesign: more modern & compact

The **orb modal** and the **wave modal** (and the launcher orb) currently feel **too big / take up too much space**. Goal: a **more modern, compact** design.

Targets:
1. **Orb launcher** — rethink the floating orb (size, rings, idle vs live states). Smaller footprint, cleaner.
2. **Call modal (`visual="orb"`)** — shrink the card; tighten header, orb size, controls. Less padding, more refined glass.
3. **Wave modal (`visual="wave"`)** — same: smaller card, more compact waveform + stepper + caption. Keep the real audio-metrics waveform.

Constraints / keep:
- Keep theming via `--vw-*` / `--pm-*` (card derives from `colorAccent`; speaker colors `--pm-user`/`--pm-bot`).
- Keep the feature set (text-during-call, transcript view, captions, stepper, mute/hangup/keyboard, continuity).
- Stay framework-agnostic (Shadow DOM, no new deps).

Files:
- Orb: `src/orb/PinecallOrb.ts` + `src/orb/styles.ts`
- Modal (orb + wave): `src/modal/PinecallModal.ts` + `src/modal/styles.ts`
- Chatbox (for reference / consistency): `src/chatbox/PinecallChat.ts` + `src/chatbox/styles.ts`

After the redesign: bump `@pinecall/web`, update README/CHANGELOG/skill + `sdk/docs/web/components/overview.md`, publish, redeploy docs-web.

## Docs kept in sync
- `README.md`, `CHANGELOG.md` (this repo)
- Skill `.claude/skills/webrtc/SKILL.md` (entry points, web-components section, gotchas incl. chat-tools fix + Offer 401)
- `sdk/docs/web/components/overview.md` (public site, slugs under `/web/...`) → rendered at docs.pinecall.io
- `AGENTS.md` / `CLAUDE.md` reference `@pinecall/web` (no stale old names)
