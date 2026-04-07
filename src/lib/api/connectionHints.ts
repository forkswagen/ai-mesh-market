import { getBackendOrigin, getSoltolokaApiOrigin } from "@/lib/api/backendOrigin";

/** Подсказка при ошибках к Node-оркестратору (escrow, tasks, health). */
export function orchestratorConnectionHint(): string {
  const base = getBackendOrigin();
  return `Проверьте оркестратор ${base} (GET /health). На сервере в CORS укажите origin фронта (VITE_DEV_ORIGIN). В проде задайте VITE_API_BASE_URL на URL деплоя server/ и пересоберите фронт.`;
}

/** Страница SolToloka ходит в отдельный FastAPI (не оркестратор). */
export function soltolokaConnectionHint(): string {
  const base = getSoltolokaApiOrigin();
  return `Проверьте ${base}. Свой инстанс: VITE_SOLToloka_API_URL в env сборки. Оркестратор escrow: VITE_API_BASE_URL.`;
}
