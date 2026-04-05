import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { orchestratorWsUrl } from "@/lib/ws/orchestratorWs";

function invalidateDeals(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["orchestrator", "deals"] });
}

/**
 * Подписка на пуш обновлений списка сделок с оркестратора (см. `server/src/dealsWs.js`).
 */
export function useOrchestratorDealsWs(queryClient: QueryClient, enabled = true) {
  const qcRef = useRef(queryClient);
  qcRef.current = queryClient;

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket | null = null;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearReconnect = () => {
      if (reconnectTimer != null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer != null) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 3000);
    };

    const connect = () => {
      if (disposed) return;
      clearReconnect();
      try {
        ws = new WebSocket(orchestratorWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onmessage = () => {
        invalidateDeals(qcRef.current);
      };
      ws.onclose = () => {
        ws = null;
        if (!disposed) scheduleReconnect();
      };
      ws.onerror = () => {
        try {
          ws?.close();
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
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);
}
