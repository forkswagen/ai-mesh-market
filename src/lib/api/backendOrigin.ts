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
 * Node `server/`: задачи (`/api/tasks`), escrow, LM и т.д. Не SolToloka FastAPI.
 * Приоритет: `VITE_ORCHESTRATOR_URL` → устар. `VITE_VERBITTO_API_URL`. В dev без них — localhost:8787.
 */
export function getOrchestratorApiOrigin(): string | null {
  for (const key of ["VITE_ORCHESTRATOR_URL", "VITE_VERBITTO_API_URL"] as const) {
    const raw = import.meta.env[key];
    if (raw == null || !String(raw).trim()) continue;
    const n = normalizeOrigin(String(raw));
    if (n) return n;
    console.warn(`[Escora] ${key} не похож на URL.`);
  }
  if (import.meta.env.DEV) return LOCAL_NODE_ORCHESTRATOR;
  return null;
}

/** Абсолютный URL к Node-оркестратору. */
export function orchestratorApiUrl(path: string): string {
  const base = getOrchestratorApiOrigin();
  if (!base) {
    throw new Error(
      "Задай VITE_ORCHESTRATOR_URL — URL Node server/ с DATABASE_URL (или в dev подними npm run server:dev на :8787).",
    );
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
}

/** WebSocket base (wss/https, ws/http) для того же хоста, что SolToloka FastAPI. */
export function getBackendWsBaseUrl(): string {
  const base = getBackendOrigin();
  if (base.startsWith("https://")) return `wss://${base.slice("https://".length)}`;
  if (base.startsWith("http://")) return `ws://${base.slice("http://".length)}`;
  return base;
}
