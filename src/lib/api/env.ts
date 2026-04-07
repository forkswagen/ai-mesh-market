import { getBackendOrigin } from "@/lib/api/backendOrigin";

/** Базовый URL бэкенда (тот же, что SolToloka FastAPI на Vercel). */
export function apiBase(): string {
  return getBackendOrigin();
}

/**
 * Абсолютный URL для fetch (REST, /health и т.д.).
 * Всегда хостится на `getBackendOrigin()`, без зависимости от прокси Vite.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getBackendOrigin();
  try {
    return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
  } catch {
    throw new Error(`Не удалось собрать URL для пути ${path}. Проверь VITE_API_BASE_URL / VITE_SOLToloka_API_URL.`);
  }
}
