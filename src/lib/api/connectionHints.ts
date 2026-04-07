import { getBackendOrigin } from "@/lib/api/backendOrigin";

/** Подсказка при ошибках REST к бэкенду (SolToloka FastAPI). */
export function orchestratorConnectionHint(): string {
  const base = getBackendOrigin();
  return `Проверь ${base} (GET /health, маршруты /api/…). На бэкенде в CORS разрешите origin фронта. Другой хост: VITE_API_BASE_URL или VITE_SOLToloka_API_URL в env сборки и Redeploy.`;
}

/** @deprecated то же назначение — единый бэкенд SolToloka. */
export function soltolokaConnectionHint(): string {
  return orchestratorConnectionHint();
}
