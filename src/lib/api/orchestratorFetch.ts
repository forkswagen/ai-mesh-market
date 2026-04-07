import { apiUrl } from "./env";
import { orchestratorConnectionHint } from "./connectionHints";

/**
 * Fetch к оркестратору с сообщением при сетевых ошибках (CORS, mixed content, недоступный хост).
 */
export async function orchestratorFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  try {
    return await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isNetwork =
      /failed to fetch/i.test(msg) ||
      /networkerror|load failed|network request failed/i.test(msg) ||
      msg === "FetchEvent.respondWith received an error: Returned response is null.";
    if (!isNetwork) throw e;

    const origin =
      typeof window !== "undefined" ? window.location.origin : "(не браузер)";
    const extra = [
      orchestratorConnectionHint(),
      `Запрос шёл на: ${url}.`,
      `Origin страницы: ${origin} — этот origin должен быть в списке VITE_DEV_ORIGIN на server (через запятую, без слэша в конце).`,
      "Если фронт на HTTPS, а VITE_API_BASE_URL с http:// — браузер заблокирует (mixed content): нужен https:// у оркестратора.",
    ].join(" ");

    throw new Error(`${msg}. ${extra}`);
  }
}
