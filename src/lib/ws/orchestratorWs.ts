import { getOrchestratorHttpBase } from "@/lib/api/backendOrigin";

/**
 * WebSocket to the orchestrator. Explicit: VITE_ORCHESTRATOR_WS_URL.
 * Otherwise derived from HTTP base (local :8787, separate host, or same-origin with `/ws` rewrites).
 * Classic Vercel Serverless upgrades may fail — set external wss or use polling.
 */
function wsUrlForPath(path: string): string {
  const wsExplicit = import.meta.env.VITE_ORCHESTRATOR_WS_URL?.trim();
  if (wsExplicit) {
    const root = wsExplicit.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${root}${p}`;
  }

  const httpBase = getOrchestratorHttpBase();
  if (!httpBase) {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.host}${path}`;
    }
    return "";
  }

  const u = new URL(httpBase);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.href;
}

/** Deals WebSocket path `/ws`. */
export function orchestratorWsUrl(): string {
  return wsUrlForPath("/ws");
}

/** Agent channel (LM Studio): `/ws/agent`. */
export function orchestratorAgentWsUrl(): string {
  return wsUrlForPath("/ws/agent");
}
