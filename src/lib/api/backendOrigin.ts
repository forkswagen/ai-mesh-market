/**
 * Основной бэкенд фронта — Node-оркестратор (`server/`: escrow, задачи, LM, WebSocket).
 *
 * - `vite` dev: без `VITE_API_BASE_URL` → `http://127.0.0.1:8787`.
 * - `vite build` + открытие с localhost / 127.0.0.1 (в т.ч. preview): тот же localhost-оркестратор.
 * - Продакшен-деплой (Vercel и т.д.) без переменной: **пустая строка** — нельзя молча слать браузер на loopback.
 *   Задайте `VITE_API_BASE_URL` на публичный URL `server/` и пересоберите фронт.
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

  if (import.meta.env.DEV) {
    return LOCAL_NODE_ORCHESTRATOR;
  }

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return LOCAL_NODE_ORCHESTRATOR;
    }
  }

  return "";
}

/** false на прод-версии сайта без VITE_API_BASE_URL — нужен Redeploy с env. */
export function isOrchestratorOriginConfigured(): boolean {
  return Boolean(getBackendOrigin());
}

/** Отдельный хост SolToloka FastAPI (compute nodes, `/docs`). Не смешиваем с оркестратором. */
export function getSoltolokaApiOrigin(): string {
  const explicit = normalizeOrigin(String(import.meta.env.VITE_SOLToloka_API_URL || ""));
  if (explicit) return explicit;
  return DEFAULT_SOLToloka_ORIGIN;
}
