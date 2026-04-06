/**
 * SolToloka FastAPI: браузер ходит на абсолютный URL (CORS на бэке).
 * По умолчанию — публичный деплой; переопределение: VITE_SOLToloka_API_URL (без слэша в конце).
 */
export const SOLToloka_DEFAULT_ORIGIN = "https://soltoloka-backend.vercel.app";

export function soltolokaOrigin(): string {
  const raw = import.meta.env.VITE_SOLToloka_API_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") return SOLToloka_DEFAULT_ORIGIN;
    } catch {
      return SOLToloka_DEFAULT_ORIGIN;
    }
    return raw.replace(/\/$/, "");
  }
  return SOLToloka_DEFAULT_ORIGIN;
}

export function soltolokaApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${soltolokaOrigin()}${normalized}`;
}

export function soltolokaDocsUrl(): string {
  return `${soltolokaOrigin()}/docs`;
}
