/**
 * @pinecall/web/orb/react
 *
 * Thin React wrapper around the `<pinecall-orb>` custom element. Handles the
 * one thing that's awkward in React <19: passing object/function props
 * (config, metadata, tokenProvider, theme) as element *properties* rather
 * than attributes, plus wiring CustomEvents to callback props.
 *
 * @example
 * ```tsx
 * import { Orb } from "@pinecall/web/orb/react";
 * <Orb agent="mara" name="Mara" preset="midnight"
 *      tokenProvider={async () => (await fetch("/api/token")).json()}
 *      onStatus={(s) => console.log(s)} />
 * ```
 */
import { useEffect, useRef } from "react";
import { definePinecallOrb, type PinecallOrb } from "./index";
import type { TranscriptMessage, SessionStatus } from "../core";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";

export interface OrbProps {
  agent: string;
  server?: string;
  name?: string;
  label?: string;
  preset?: VoiceWidgetPreset;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  theme?: Partial<VoiceWidgetTheme>;
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
  onStatus?: (status: SessionStatus) => void;
  onTranscript?: (messages: TranscriptMessage[]) => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Orb({
  agent,
  server,
  name,
  label,
  preset,
  config,
  metadata,
  theme,
  tokenProvider,
  onStatus,
  onTranscript,
  onError,
  className,
  style,
}: OrbProps) {
  const ref = useRef<PinecallOrb | null>(null);

  // Ensure the element is registered before first render (client only).
  useEffect(() => {
    definePinecallOrb();
  }, []);

  // Object/function props → element properties.
  useEffect(() => { if (ref.current) ref.current.config = config; }, [config]);
  useEffect(() => { if (ref.current) ref.current.metadata = metadata; }, [metadata]);
  useEffect(() => { if (ref.current) ref.current.theme = theme; }, [theme]);
  useEffect(() => { if (ref.current) ref.current.tokenProvider = tokenProvider; }, [tokenProvider]);

  // CustomEvents → callbacks.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onS = (e: Event) => onStatus?.((e as CustomEvent).detail);
    const onT = (e: Event) => onTranscript?.((e as CustomEvent).detail);
    const onE = (e: Event) => onError?.((e as CustomEvent).detail);
    el.addEventListener("pinecall:status", onS);
    el.addEventListener("pinecall:transcript", onT);
    el.addEventListener("pinecall:error", onE);
    return () => {
      el.removeEventListener("pinecall:status", onS);
      el.removeEventListener("pinecall:transcript", onT);
      el.removeEventListener("pinecall:error", onE);
    };
  }, [onStatus, onTranscript, onError]);

  // Primitive props go as attributes (React renders them fine).
  return (
    <pinecall-orb
      ref={ref as React.Ref<HTMLElement>}
      agent={agent}
      server={server}
      name={name}
      label={label}
      preset={preset}
      class={className}
      style={style}
    />
  );
}

// JSX typing for the custom element.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "pinecall-orb": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        agent?: string;
        server?: string;
        name?: string;
        label?: string;
        preset?: string;
        class?: string;
      };
    }
  }
}
