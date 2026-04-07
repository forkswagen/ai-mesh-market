import {
  getOrchestratorHttpBase,
  wrongOrchestratorUrlMessage,
} from "@/lib/api/backendOrigin";
import { frontendUrlAsOrchestratorApiMessage, missingViteApiBaseUrlMessage } from "@/lib/api/connectionHints";

function joinHttpPath(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

/** REST base: `VITE_API_BASE_URL`, same-origin `api/escora`, or legacy `/api/orchestrator-proxy` with `VITE_ORCHESTRATOR_VIA_PROXY=1`. */
export function apiBase(): string {
  return getOrchestratorHttpBase();
}

/**
 * Absolute URL for fetch (REST, /health, /api/deals, …).
 * In dev defaults to `http://127.0.0.1:8787` with no env vars.
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
    throw new Error(`Could not build URL for path ${path}. Check VITE_API_BASE_URL.`);
  }
}
