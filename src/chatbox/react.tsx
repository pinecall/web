/**
 * @pinecall/web/chatbox/react
 *
 * Thin React wrapper around <pinecall-chat>.
 *
 * IMPORTANT: `open` triggers connectedCallback → ensureSession → connect
 * immediately. Object/function props (tokenProvider etc.) must be set BEFORE
 * the element enters the DOM, otherwise ensureSession() reads undefined. We
 * use a callback ref to eagerly set them at attach time, and defer `open` to
 * a useLayoutEffect so the properties are guaranteed set first.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { definePinecallChat, type PinecallChat } from "./index";
import type { SessionStatus } from "../core";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";

export interface ChatBoxProps {
  agent: string;
  server?: string;
  name?: string;
  preset?: VoiceWidgetPreset;
  avatar?: string;
  /** Start directly in a WebRTC voice call instead of text chat. */
  autoCall?: boolean;
  /** Hide the call button (pure text chat, no voice escalation). */
  noCall?: boolean;
  /** First bot bubble shown on open (client-side — text chat has no server greeting). */
  greeting?: string;
  open?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  theme?: Partial<VoiceWidgetTheme>;
  /** Channel-aware: called with "chat" for text and "webrtc" for voice. */
  tokenProvider?: (channel: "chat" | "webrtc") => Promise<{ token: string; server: string }>;
  onStatus?: (status: SessionStatus | string) => void;
}

export function ChatBox({
  agent, server, name, preset, avatar, autoCall, noCall, greeting, open,
  config, metadata, theme, tokenProvider, onStatus,
}: ChatBoxProps) {
  const elRef = useRef<PinecallChat | null>(null);

  useEffect(() => { definePinecallChat(); }, []);

  // Callback ref: set function/object properties eagerly when the element is
  // first attached — BEFORE connectedCallback fires. This prevents the race
  // where `open` → ensureSession() → connect() reads tokenProvider as undefined.
  const setRef = useCallback((el: HTMLElement | null) => {
    const chat = el as PinecallChat | null;
    elRef.current = chat;
    if (chat) {
      chat.tokenProvider = tokenProvider;
      chat.config = config;
      chat.metadata = metadata;
      chat.theme = theme;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — initial set only; useEffects handle updates

  // Subsequent updates (after mount) go through useEffect as before.
  useEffect(() => { if (elRef.current) elRef.current.config = config; }, [config]);
  useEffect(() => { if (elRef.current) elRef.current.metadata = metadata; }, [metadata]);
  useEffect(() => { if (elRef.current) elRef.current.theme = theme; }, [theme]);
  useEffect(() => { if (elRef.current) elRef.current.tokenProvider = tokenProvider; }, [tokenProvider]);

  // Defer `open` so it runs after the callback ref has set properties.
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (open) el.open();
  }, [open]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onS = (e: Event) => onStatus?.((e as CustomEvent).detail);
    el.addEventListener("pinecall:status", onS);
    return () => el.removeEventListener("pinecall:status", onS);
  }, [onStatus]);

  // Render WITHOUT the `open` attribute — we call .open() imperatively above.
  return (
    <pinecall-chat
      ref={setRef as React.Ref<HTMLElement>}
      agent={agent}
      server={server}
      name={name}
      preset={preset}
      avatar={avatar}
      greeting={greeting}
      {...(autoCall ? { "auto-call": "" } : {})}
      {...(noCall ? { "no-call": "" } : {})}
    />
  );
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "pinecall-chat": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        agent?: string; server?: string; name?: string; preset?: string; avatar?: string; greeting?: string; "auto-call"?: string; "no-call"?: string; open?: string;
      };
    }
  }
}

