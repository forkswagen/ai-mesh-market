/**
 * Единый бэкенд для фронта: SolToloka FastAPI — [forkswagen/soltoloka-backend](https://github.com/forkswagen/soltoloka-backend),
 * прод: https://soltoloka-backend.vercel.app
 *
 * Приоритет URL: `VITE_API_BASE_URL` → `VITE_SOLToloka_API_URL` → дефолт Vercel.
 */
export const DEFAULT_BACKEND_ORIGIN = "https://soltoloka-backend.vercel.app";

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

/** Базовый origin API без завершающего слэша. */
export function getBackendOrigin(): string {
  for (const key of ["VITE_API_BASE_URL", "VITE_SOLToloka_API_URL"] as const) {
    const raw = import.meta.env[key];
    if (raw == null || !String(raw).trim()) continue;
    const n = normalizeOrigin(String(raw));
    if (n) return n;
    console.warn(`[Escora] ${key} не похож на URL — пробуем следующий / дефолт.`);
  }
  return DEFAULT_BACKEND_ORIGIN;
}

/** Локальный Node-оркестратор (`npm run server:dev`, порт по умолчанию из `server/`). */
const LOCAL_NODE_ORCHESTRATOR = "http://127.0.0.1:8787";

/**
 * Verbitto офчейн-задачи (`/api/verbitto/*`, PostgreSQL) реализованы в **Node `server/`**, не в SolToloka FastAPI.
 * В проде задай `VITE_VERBITTO_API_URL` (деплой `server/` с `DATABASE_URL`).
 * В dev без переменной используется локальный оркестратор.
 */
export function getVerbittoApiOrigin(): string | null {
  const raw = import.meta.env.VITE_VERBITTO_API_URL;
  if (raw != null && String(raw).trim()) {
    const n = normalizeOrigin(String(raw));
    if (n) return n;
    console.warn("[Escora] VITE_VERBITTO_API_URL не похож на URL.");
  }
  if (import.meta.env.DEV) return LOCAL_NODE_ORCHESTRATOR;
  return null;
}

/** Абсолютный URL к Node-оркестратору для Verbitto. */
export function verbittoApiUrl(path: string): string {
  const base = getVerbittoApiOrigin();
  if (!base) {
    throw new Error(
      "Verbitto: задай VITE_VERBITTO_API_URL (Node server/ с DATABASE_URL и /api/verbitto). SolToloka FastAPI эти маршруты не отдаёт.",
    );
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
}
