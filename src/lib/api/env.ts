import { getBackendOrigin } from "@/lib/api/backendOrigin";

/** Базовый URL Node-оркестратор (`server/`). */
export function apiBase(): string {
  return getBackendOrigin();
}

/**
 * Абсолютный URL для fetch (REST, /health, /api/deals, …).
 * В dev по умолчанию `http://127.0.0.1:8787` без переменных.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getBackendOrigin();
  try {
    return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
  } catch {
    throw new Error(`Не удалось собрать URL для пути ${path}. Проверьте VITE_API_BASE_URL.`);
  }
}
