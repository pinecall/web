/**
 * @pinecall/web/modal/react
 *
 * Thin React wrapper around <pinecall-modal>. Sets object/function props
 * (config, metadata, tokenProvider, theme) as element properties and maps
 * CustomEvents to callbacks.
 */
import { useEffect, useRef } from "react";
import { definePinecallModal, type PinecallModal } from "./index";
import type { SessionStatus } from "../core";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";

export interface CallModalProps {
  agent: string;
  server?: string;
  name?: string;
  preset?: VoiceWidgetPreset;
  avatar?: string;
  open?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  theme?: Partial<VoiceWidgetTheme>;
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
  onStatus?: (status: SessionStatus) => void;
}

export function CallModal({
  agent, server, name, preset, avatar, open,
  config, metadata, theme, tokenProvider, onStatus,
}: CallModalProps) {
  const ref = useRef<PinecallModal | null>(null);

  useEffect(() => { definePinecallModal(); }, []);

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
    <pinecall-modal
      ref={ref as React.Ref<HTMLElement>}
      agent={agent}
      server={server}
      name={name}
      preset={preset}
      avatar={avatar}
      {...(open ? { open: "" } : {})}
    />
  );
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "pinecall-modal": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        agent?: string; server?: string; name?: string; preset?: string; avatar?: string; open?: string;
      };
    }
  }
}
