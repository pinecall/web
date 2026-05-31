import { useState, useEffect, useRef } from "react";
import type { AgentInfo } from "./types.js";

const cache = new Map<string, AgentInfo>();

/**
 * Fetch agent channel info from the server for auto-discovery.
 * Caches results per agent+server combo to avoid re-fetching.
 */
export function useAgentInfo(
  agentId: string,
  server: string = "https://voice.pinecall.io",
): { info: AgentInfo | null; loading: boolean } {
  const key = `${server}|${agentId}`;
  const [info, setInfo] = useState<AgentInfo | null>(cache.get(key) ?? null);
  const [loading, setLoading] = useState(!cache.has(key));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (cache.has(key)) {
      setInfo(cache.get(key)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const baseUrl = server.replace(/\/$/, "");
    fetch(`${baseUrl}/api/sdk/agent-info/${encodeURIComponent(agentId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: AgentInfo) => {
        if (!cancelled && mountedRef.current) {
          cache.set(key, data);
          setInfo(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Failed to fetch — not critical, widget still works without auto-discovery
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [key]);

  return { info, loading };
}
