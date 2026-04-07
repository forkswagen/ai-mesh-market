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
    console.warn(`[NexusAI] ${key} не похож на URL — пробуем следующий / дефолт.`);
  }
  return DEFAULT_BACKEND_ORIGIN;
}
