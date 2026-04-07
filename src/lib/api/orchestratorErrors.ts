import { getBackendOrigin } from "./backendOrigin";

/** Разбор типичного Express 404 HTML («Cannot GET …») при устаревшем server/. */
export function formatOrchestratorHttpError(path: string, status: number, body: string): string {
  const snippet = body.replace(/\s+/g, " ").trim().slice(0, 400);
  const looksHtml = /<!DOCTYPE|<html/i.test(body) || body.includes("Cannot GET");
  if (looksHtml || status === 404) {
    const base = getBackendOrigin() || "(задайте VITE_API_BASE_URL при сборке фронта)";
    const meta = `${base}/api/meta`;
    return (
      `HTTP ${status} для ${path}. Сервер отдал HTML — чаще всего это старая сборка оркестратора без этого маршрута или неверный хост.\n\n` +
      `Что сделать:\n` +
      `1) Redeploy Node-оркестратора из репозитория (корень сервиса = папка server/, не весь монорепо).\n` +
      `2) В браузере откройте ${meta} — должны быть apiRevision и в agentEndpoints строка «GET ${path}».\n` +
      `3) На Vercel у фронта VITE_API_BASE_URL должен совпадать с этим же origin (без слэша в конце).\n\n` +
      (snippet ? `Фрагмент ответа: ${snippet}` : "")
    );
  }
  return snippet || `HTTP ${status}`;
}
