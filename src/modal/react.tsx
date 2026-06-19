/**
 * @pinecall/web/modal/react
 *
 * Thin React wrapper around <pinecall-modal>. Sets object/function props
 * (config, metadata, tokenProvider, theme) as element properties and maps
 * CustomEvents to callbacks.
 *
 * IMPORTANT: `open` triggers connectedCallback → startCall immediately.
 * Object/function props (tokenProvider, config, etc.) must be set BEFORE the
 * element enters the DOM, otherwise ensureSession() reads undefined. We use a
 * callback ref to eagerly set them at attach time, and defer `open` to a
 * useLayoutEffect so the properties are guaranteed set first.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { definePinecallModal, type PinecallModal } from "./index";
import type { SessionStatus } from "../core";
import type { VoiceWidgetTheme, VoiceWidgetPreset } from "../widget/types";

export interface CallModalProps {
  agent: string;
  server?: string;
  name?: string;
  preset?: VoiceWidgetPreset;
  visual?: "orb" | "wave";
  avatar?: string;
  open?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  theme?: Partial<VoiceWidgetTheme>;
  tokenProvider?: () => Promise<{ token: string; server: string; expires_in?: number }>;
  onStatus?: (status: SessionStatus) => void;
}

export function CallModal({
  agent, server, name, preset, visual, avatar, open,
  config, metadata, theme, tokenProvider, onStatus,
}: CallModalProps) {
  const elRef = useRef<PinecallModal | null>(null);

  useEffect(() => { definePinecallModal(); }, []);

  // Callback ref: set function/object properties eagerly when the element is
  // first attached — BEFORE connectedCallback fires. This prevents the race
  // where `open` → startCall() reads tokenProvider as undefined.
  const setRef = useCallback((el: HTMLElement | null) => {
    const modal = el as PinecallModal | null;
    elRef.current = modal;
    if (modal) {
      modal.tokenProvider = tokenProvider;
      modal.config = config;
      modal.metadata = metadata;
      modal.theme = theme;
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
    <pinecall-modal
      ref={setRef as React.Ref<HTMLElement>}
      agent={agent}
      server={server}
      name={name}
      preset={preset}
      visual={visual}
      avatar={avatar}
    />
  );
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "pinecall-modal": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        agent?: string; server?: string; name?: string; preset?: string; visual?: string; avatar?: string; open?: string;
      };
    }
  }
}
