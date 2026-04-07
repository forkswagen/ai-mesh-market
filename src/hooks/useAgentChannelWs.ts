import { useCallback, useEffect, useRef, useState } from "react";
import { orchestratorAgentWsUrl } from "@/lib/ws/orchestratorWs";

export type LmModelRow = { id: string };

export type AgentLmModelsMessage = {
  type: "lm_models";
  baseUrl: string;
  models: LmModelRow[];
  error: string | null;
  fetchedAt: number;
};

/**
 * WebSocket «agent»: оркестратор проксирует LM Studio (/v1/models).
 * Архитектура: frontend ↔ backend ↔ LM Studio.
 */
export function useAgentChannelWs(enabled = true) {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<AgentLmModelsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const refresh = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "refresh" }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout> | null = null;
    const clearReconnect = () => {
      if (reconnect != null) {
        clearTimeout(reconnect);
        reconnect = null;
      }
    };

    const connect = () => {
      if (disposed) return;
      clearReconnect();
      let ws: WebSocket;
      try {
        ws = new WebSocket(orchestratorAgentWsUrl());
      } catch {
        reconnect = setTimeout(connect, 3000);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) setConnected(true);
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (!disposed) setConnected(false);
        if (!disposed) reconnect = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as AgentLmModelsMessage;
          if (msg.type === "lm_models") setSnapshot(msg);
        } catch {
          /* ignore */
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      clearReconnect();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [enabled]);

  return { connected, snapshot, refresh };
}
