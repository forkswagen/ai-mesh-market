/**
 * Основной бэкенд фронта — Node-оркестратор (`server/`: escrow, задачи, LM, WebSocket).
 *
 * В dev без `VITE_API_BASE_URL` используется `http://127.0.0.1:8787`.
 * В проде задайте `VITE_API_BASE_URL` на URL деплоя `server/`.
 */

const LOCAL_NODE_ORCHESTRATOR = "http://127.0.0.1:8787";

/** Публичный SolToloka FastAPI только для страницы `/soltoloka` (опционально). */
export const DEFAULT_SOLToloka_ORIGIN = "https://soltoloka-backend.vercel.app";

function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

/** Базовый origin Node-оркестратора (REST, `/health`, `/ws`, `/api/deals`, …). */
export function getBackendOrigin(): string {
  const explicit = normalizeOrigin(String(import.meta.env.VITE_API_BASE_URL || ""));
  if (explicit) return explicit;
  if (import.meta.env.DEV) return LOCAL_NODE_ORCHESTRATOR;
  /* prod: без явного URL браузер не достучится до localhost — задайте VITE_API_BASE_URL */
  return LOCAL_NODE_ORCHESTRATOR;
}

/** Отдельный хост SolToloka FastAPI (compute nodes, `/docs`). Не смешиваем с оркестратором. */
export function getSoltolokaApiOrigin(): string {
  const explicit = normalizeOrigin(String(import.meta.env.VITE_SOLToloka_API_URL || ""));
  if (explicit) return explicit;
  return DEFAULT_SOLToloka_ORIGIN;
}
