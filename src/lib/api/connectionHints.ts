import { getBackendOrigin } from "@/lib/api/backendOrigin";
import { soltolokaOrigin, soltolokaUsesSameOriginProxy } from "@/lib/api/soltoloka";

/**
 * Прод-сборка без `VITE_API_BASE_URL` (и тот же текст в `apiUrl()`, чтобы не плодить копии).
 */
export function missingViteApiBaseUrlMessage(): string {
  return (
    "В этой сборке не задан VITE_API_BASE_URL. В Vercel: Settings → Environment Variables → " +
    "VITE_API_BASE_URL = публичный URL оркестратора (server/, например Railway), Production, затем Redeploy. " +
    "На server задайте CORS: VITE_DEV_ORIGIN = origin фронта (например https://ваш-проект.vercel.app)."
  );
}

/** Подсказка при ошибках к Node-оркестратору (escrow, tasks, health). */
export function orchestratorConnectionHint(): string {
  const base = getBackendOrigin();
  if (!base) {
    return (
      "Фронт собран без VITE_API_BASE_URL: укажите в Vercel URL деплоя server/ и выполните Redeploy. " +
      "На оркестраторе в CORS добавьте origin фронта (VITE_DEV_ORIGIN в server/.env)."
    );
  }
  return (
    `Проверьте оркестратор ${base} (GET /health). Локально: npm run dev в корне репозитория (Vite + API на :8787). ` +
      "На сервере в CORS укажите origin фронта (VITE_DEV_ORIGIN). " +
      "На Vercel в переменных сборки должен быть VITE_API_BASE_URL на URL деплоя server/."
  );
}

/** Страница SolToloka ходит в отдельный FastAPI (не оркестратор). */
export function soltolokaConnectionHint(): string {
  const base = soltolokaOrigin();
  const via = soltolokaUsesSameOriginProxy() ? " (запросы через /api/soltoloka-proxy на этом домене)" : "";
  return `Проверьте ${base}${via}. Свой инстанс: задайте VITE_SOLToloka_API_URL и Redeploy; upstream прокси: SOLTOLOKA_UPSTREAM_URL на Vercel (Functions). Оркестратор escrow: VITE_API_BASE_URL = URL server/, не Solana RPC.`;
}
