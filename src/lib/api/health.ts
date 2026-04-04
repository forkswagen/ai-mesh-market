import { apiUrl } from "./env";

export type HealthResponse = { status: string; app: string; env: string };

export async function fetchApiHealth(): Promise<HealthResponse> {
  const url = apiUrl("/health");
  let r: Response;
  try {
    r = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("expected pattern") || msg.includes("Failed to fetch")) {
      throw new Error(
        "Не удалось запросить оркестратор. Локально: npm run dev:demo. Прод: проверь VITE_API_BASE_URL (полный https://… без ошибок).",
      );
    }
    throw e;
  }

  if (!r.ok) throw new Error(`API ${r.status}`);

  const text = await r.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      "Ответ не JSON (скорее HTML страницы). На Vercel задай VITE_API_BASE_URL на оркестратор или запусти server/ локально.",
    );
  }

  try {
    return JSON.parse(text) as HealthResponse;
  } catch {
    throw new Error("Ответ /health не JSON — проверь, что поднят оркестратор server/ и endpoint /health.");
  }
}
