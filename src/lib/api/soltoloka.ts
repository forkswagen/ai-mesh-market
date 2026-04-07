/**
 * Опциональный SolToloka FastAPI — только страница `/soltoloka`.
 * Основное приложение (escrow, tasks) живёт на Node-оркестраторе (`getBackendOrigin`).
 *
 * Если VITE_SOLToloka_API_URL не задан — запросы идут через `/api/soltoloka-proxy` (Vercel Function
 * или прокси Vite в dev), чтобы обойти CORS к публичному soltoloka-backend.
 */
import { DEFAULT_SOLToloka_ORIGIN, normalizeOrigin } from "@/lib/api/backendOrigin";

/** @deprecated используйте DEFAULT_SOLToloka_ORIGIN */
export const SOLToloka_DEFAULT_ORIGIN = DEFAULT_SOLToloka_ORIGIN;

const PROXY_PREFIX = "/api/soltoloka-proxy";

function explicitSoltolokaOrigin(): string | null {
  return normalizeOrigin(String(import.meta.env.VITE_SOLToloka_API_URL || ""));
}

/** Прямой URL FastAPI или пусто → тогда используется прокси + дефолтный upstream. */
export function soltolokaOrigin(): string {
  return explicitSoltolokaOrigin() ?? DEFAULT_SOLToloka_ORIGIN;
}

/** true = запросы на тот же origin через прокси (нет VITE_SOLToloka_API_URL). */
export function soltolokaUsesSameOriginProxy(): boolean {
  return !explicitSoltolokaOrigin();
}

export function soltolokaApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const direct = explicitSoltolokaOrigin();
  if (direct) return `${direct}${normalized}`;
  return `${PROXY_PREFIX}${normalized}`;
}

export function soltolokaDocsUrl(): string {
  return `${soltolokaApiUrl("/docs")}`;
}
