import { getOrchestratorHttpBase } from "@/lib/api/backendOrigin";

/**
 * WebSocket к оркестратору. Явно: VITE_ORCHESTRATOR_WS_URL.
 * Иначе — из HTTP-базы (локальный :8787, отдельный хост или same-origin с rewrites на `/ws`).
 * На классическом Vercel Serverless upgrade может не работать — задайте внешний wss или polling.
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

/** WebSocket к оркестратору: путь `/ws`. */
export function orchestratorWsUrl(): string {
  return wsUrlForPath("/ws");
}

/** Канал agent (LM Studio): `/ws/agent`. */
export function orchestratorAgentWsUrl(): string {
  return wsUrlForPath("/ws/agent");
}
