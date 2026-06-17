import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { VoiceSession } from "../core";
import type { VoiceSessionOptions } from "../core";

/**
 * React hook wrapping VoiceSession. Re-exports the entire state plus
 * bound action methods. The underlying session is created once and
 * destroyed on unmount.
 */
export function useVoiceSession(opts: VoiceSessionOptions) {
  const [session] = useState(() => new VoiceSession(opts));

  const state = useSyncExternalStore(
    useCallback((cb) => session.subscribe(cb), [session]),
    () => session.getState(),
    () => session.getState(),
  );

  useEffect(() => {
    return () => {
      session.destroy();
    };
  }, [session]);

  const connect = useCallback(() => session.connect(), [session]);
  const disconnect = useCallback(() => session.disconnect(), [session]);
  const toggleMute = useCallback(() => session.toggleMute(), [session]);
  const setMuted = useCallback(
    (muted: boolean) => session.setMuted(muted),
    [session],
  );
  const configure = useCallback(
    (config: Record<string, unknown>) => session.configure(config),
    [session],
  );
  const updateOptions = useCallback(
    (patch: Partial<Pick<VoiceSessionOptions, "config" | "metadata">>) =>
      session.updateOptions(patch),
    [session],
  );
  const sendText = useCallback(
    (text: string) => session.sendText(text),
    [session],
  );
  const dismissTool = useCallback(
    (toolCallId: string) => session.dismissTool(toolCallId),
    [session],
  );
  const setContext = useCallback(
    (key: string, value: string | null) => session.setContext(key, value),
    [session],
  );

  return {
    ...state,
    connect,
    disconnect,
    toggleMute,
    setMuted,
    configure,
    updateOptions,
    sendText,
    dismissTool,
    setContext,
  };
}
