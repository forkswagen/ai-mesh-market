/** База URL API: пусто = тот же origin (dev: прокси Vite → :8787). */
export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || !String(raw).trim()) return "";
  const trimmed = String(raw).trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      console.warn("[NexusAI] VITE_API_BASE_URL должен быть http:// или https:// — очищено");
      return "";
    }
    return trimmed;
  } catch {
    console.warn("[NexusAI] VITE_API_BASE_URL не похож на URL — очищено:", trimmed);
    return "";
  }
}

/**
 * Абсолютный URL для fetch. Так Safari/WebKit не спотыкаются о относительные пути;
 * некорректный внешний base даёт понятную ошибку вместо "did not match the expected pattern".
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = apiBase();
  if (!base) {
    if (typeof window === "undefined") {
      return `http://127.0.0.1:5173${normalized}`;
    }
    return new URL(normalized, window.location.origin).href;
  }
  try {
    return new URL(normalized, `${base.replace(/\/$/, "")}/`).href;
  } catch {
    throw new Error(`Некорректный VITE_API_BASE_URL (не удаётся собрать URL). Проверь .env.local / Vercel env.`);
  }
}
