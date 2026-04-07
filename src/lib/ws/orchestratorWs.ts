import { apiBase } from "@/lib/api/env";

function wsUrlForPath(path: string): string {
  const base = apiBase();
  if (!base) {
    if (typeof window === "undefined") {
      return `ws://127.0.0.1:5173${path}`;
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}${path}`;
  }
  const u = new URL(base);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.href;
}

/** WebSocket к оркестратору: тот же хост, что REST (`VITE_API_BASE_URL`), путь `/ws`. */
export function orchestratorWsUrl(): string {
  return wsUrlForPath("/ws");
}

/** Канал agent (LM Studio): backend ↔ LM Studio; фронт только с backend. */
export function orchestratorAgentWsUrl(): string {
  return wsUrlForPath("/ws/agent");
}
