import { getOrchestratorHttpBase } from "@/lib/api/backendOrigin";
import { soltolokaOrigin, soltolokaUsesSameOriginProxy } from "@/lib/api/soltoloka";

/**
 * Прод-сборка без `VITE_API_BASE_URL` (и тот же текст в `apiUrl()`, чтобы не плодить копии).
 */
export function missingViteApiBaseUrlMessage(): string {
  return (
    "Нет базового URL для REST к оркестратору. Варианты: " +
    "(1) Vercel: без VITE_API_BASE_URL фронт ходит на тот же домен (`api/escora` через rewrites) — в env проекта для Functions задайте DATABASE_URL, BUYER_SECRET_JSON и т.д. (см. server/.env.example), Redeploy; " +
    "(2) либо VITE_API_BASE_URL на отдельный деплой server/, Production, Redeploy. " +
    "CORS на отдельном server/: VITE_DEV_ORIGIN = origin фронта. WebSocket на Vercel может потребовать VITE_ORCHESTRATOR_WS_URL=wss://… на живой long-lived server/."
  );
}

/**
 * Раньше: VITE_API_BASE_URL = URL фронта считалось ошибкой. При `api/escora` на том же проекте Vercel
 * такой URL избыточен: `getBackendOrigin` его игнорирует, REST попадает на тот же origin.
 */
export function frontendUrlAsOrchestratorApiMessage(): string {
  return "";
}

/** Подсказка при ошибках к Node-оркестратору (escrow, tasks, health). */
export function orchestratorConnectionHint(): string {
  const base = getOrchestratorHttpBase();
  if (!base) {
    return (
      "Задайте путь к оркестратору: VITE_API_BASE_URL на отдельный server/ или деплой с api/escora и env для Functions (см. .env.example). " +
      "Устаревший вариант: ORCHESTRATOR_UPSTREAM_URL + VITE_ORCHESTRATOR_VIA_PROXY=1 и /api/orchestrator-proxy."
    );
  }
  return (
    `Проверьте оркестратор ${base} (GET /health). Локально: npm run dev в корне (Vite + server на :8787). ` +
      "Отдельный server/: в CORS VITE_DEV_ORIGIN = origin фронта. Монолит Vercel: секреты в env функций, не в VITE_*."
  );
}

/** Страница SolToloka ходит в отдельный FastAPI (не оркестратор). */
export function soltolokaConnectionHint(): string {
  const base = soltolokaOrigin();
  const via = soltolokaUsesSameOriginProxy() ? " (запросы через /api/soltoloka-proxy на этом домене)" : "";
  return `Проверьте ${base}${via}. Свой инстанс: задайте VITE_SOLToloka_API_URL и Redeploy; upstream прокси: SOLTOLOKA_UPSTREAM_URL на Vercel (Functions). Оркестратор escrow: при монолите Vercel отдельный VITE_API_BASE_URL не нужен; иначе URL server/, не Solana RPC.`;
}
