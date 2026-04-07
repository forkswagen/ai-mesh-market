import { apiUrl } from "./env";

/** Express-оркестратор и FastAPI могут отличаться полями — разбираем мягко. */
export type HealthResponse = { status?: string; app?: string; env?: string; ok?: boolean };

export async function fetchApiHealth(): Promise<HealthResponse> {
  const url = apiUrl("/health");
  let r: Response;
  try {
    r = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("expected pattern") || msg.includes("Failed to fetch")) {
      throw new Error(
        "Не удалось достучаться до бэкенда (SolToloka). Сеть, CORS или неверный VITE_API_BASE_URL / VITE_SOLToloka_API_URL.",
      );
    }
    throw e;
  }

  if (!r.ok) throw new Error(`API ${r.status}`);

  const text = await r.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      "Ответ не JSON (HTML?). Проверь URL бэкенда (по умолчанию soltoloka-backend.vercel.app) и путь /health.",
    );
  }

  try {
    return JSON.parse(text) as HealthResponse;
  } catch {
    throw new Error("Ответ /health не JSON — убедись, что FastAPI бэкенд поднят и отдаёт JSON на /health.");
  }
}
