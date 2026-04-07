import { apiBase } from "./env";

/** Подсказка при ошибке /health или /api к Node-оркестратору (server/). */
export function orchestratorConnectionHint(): string {
  const base = apiBase();
  if (import.meta.env.PROD && !base) {
    return "Прод: в Vercel → Environment Variables укажи VITE_API_BASE_URL (https://… оркестратора, без / в конце) и сделай Redeploy.";
  }
  if (base) {
    return "Проверь, что оркестратор по VITE_API_BASE_URL отвечает и в CORS (VITE_DEV_ORIGIN на сервере) есть origin этого фронта.";
  }
  return "Локально: npm run dev:demo или npm run server:dev (:8787) плюс npm run dev — Vite проксирует /api, /health, /ws и /ws/agent (канал agent ↔ LM Studio через backend).";
}

/** Подсказка при ошибке запросов к SolToloka FastAPI. */
export function soltolokaConnectionHint(): string {
  return "Проверь доступность хоста и CORS. Другой инстанс — VITE_SOLToloka_API_URL в env сборки и Redeploy.";
}
