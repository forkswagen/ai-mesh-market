import {
  getOrchestratorHttpBase,
  wrongOrchestratorUrlMessage,
} from "@/lib/api/backendOrigin";
import { frontendUrlAsOrchestratorApiMessage, missingViteApiBaseUrlMessage } from "@/lib/api/connectionHints";

function joinHttpPath(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

/** База REST: `VITE_API_BASE_URL`, same-origin с `api/escora`, или legacy `/api/orchestrator-proxy` при `VITE_ORCHESTRATOR_VIA_PROXY=1`. */
export function apiBase(): string {
  return getOrchestratorHttpBase();
}

/**
 * Абсолютный URL для fetch (REST, /health, /api/deals, …).
 * В dev по умолчанию `http://127.0.0.1:8787` без переменных.
 */
export function apiUrl(path: string): string {
  const wrong = wrongOrchestratorUrlMessage();
  if (wrong) throw new Error(wrong);

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getOrchestratorHttpBase();
  if (!base) {
    const fe = frontendUrlAsOrchestratorApiMessage();
    if (fe) throw new Error(fe);
    throw new Error(missingViteApiBaseUrlMessage());
  }
  try {
    return joinHttpPath(base, normalized);
  } catch {
    throw new Error(`Не удалось собрать URL для пути ${path}. Проверьте VITE_API_BASE_URL.`);
  }
}
