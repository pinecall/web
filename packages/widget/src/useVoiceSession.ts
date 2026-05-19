import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { VoiceSession } from "@pinecall/voice-core";
import type { VoiceSessionOptions } from "@pinecall/voice-core";

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

  return {
    ...state,
    connect,
    disconnect,
    toggleMute,
    setMuted,
  };
}
