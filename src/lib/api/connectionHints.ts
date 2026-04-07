import { getBackendOrigin, getSoltolokaApiOrigin } from "@/lib/api/backendOrigin";

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
    `Проверьте оркестратор ${base} (GET /health). Локально: npm run server:dev (:8787). ` +
      "На сервере в CORS укажите origin фронта (VITE_DEV_ORIGIN). " +
      "На Vercel в переменных сборки должен быть VITE_API_BASE_URL на URL деплоя server/."
  );
}

/** Страница SolToloka ходит в отдельный FastAPI (не оркестратор). */
export function soltolokaConnectionHint(): string {
  const base = getSoltolokaApiOrigin();
  return `Проверьте ${base}. Свой инстанс: VITE_SOLToloka_API_URL в env сборки. Оркестратор escrow: VITE_API_BASE_URL.`;
}
