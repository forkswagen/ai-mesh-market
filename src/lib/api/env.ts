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
  if (!base) {
    throw new Error(
      "В этой сборке не задан VITE_API_BASE_URL. В Vercel: Settings → Environment Variables → " +
        "VITE_API_BASE_URL = публичный URL оркестратора (server/, например Railway), Production, затем Redeploy. " +
        "На server задайте CORS: VITE_DEV_ORIGIN = origin фронта (например https://ваш-проект.vercel.app).",
    );
  }
  try {
    return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
  } catch {
    throw new Error(`Не удалось собрать URL для пути ${path}. Проверьте VITE_API_BASE_URL.`);
  }
}
