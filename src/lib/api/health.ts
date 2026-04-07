import { apiUrl } from "./env";

/** Express-оркестратор отдаёт поля status, app, programId — разбираем мягко. */
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
        "Не удалось достучаться до оркестратора. Поднимите server/ (npm run server:dev), проверьте VITE_API_BASE_URL и CORS.",
      );
    }
    throw e;
  }

  if (!r.ok) throw new Error(`API ${r.status}`);

  const text = await r.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      "Ответ не JSON (HTML?). Укажите URL Node-оркестратора в VITE_API_BASE_URL (путь /health).",
    );
  }

  try {
    return JSON.parse(text) as HealthResponse;
  } catch {
    throw new Error("Ответ /health не JSON — ожидается depai-orchestrator (server/).");
  }
}
