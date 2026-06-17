/**
 * @pinecall/web/chatbox/react
 *
 * Thin React wrapper around <pinecall-chat>.
 */
import { useEffect, useRef } from "react";
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
  const ref = useRef<PinecallChat | null>(null);

  useEffect(() => { definePinecallChat(); }, []);
  useEffect(() => { if (ref.current) ref.current.config = config; }, [config]);
  useEffect(() => { if (ref.current) ref.current.metadata = metadata; }, [metadata]);
  useEffect(() => { if (ref.current) ref.current.theme = theme; }, [theme]);
  useEffect(() => { if (ref.current) ref.current.tokenProvider = tokenProvider; }, [tokenProvider]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onS = (e: Event) => onStatus?.((e as CustomEvent).detail);
    el.addEventListener("pinecall:status", onS);
    return () => el.removeEventListener("pinecall:status", onS);
  }, [onStatus]);

  return (
    <pinecall-chat
      ref={ref as React.Ref<HTMLElement>}
      agent={agent}
      server={server}
      name={name}
      preset={preset}
      avatar={avatar}
      greeting={greeting}
      {...(autoCall ? { "auto-call": "" } : {})}
      {...(noCall ? { "no-call": "" } : {})}
      {...(open ? { open: "" } : {})}
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
