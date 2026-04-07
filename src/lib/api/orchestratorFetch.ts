import { apiUrl } from "./env";
import { orchestratorConnectionHint } from "./connectionHints";

/**
 * Fetch to the orchestrator with clearer errors on network failures (CORS, mixed content, down host).
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
      typeof window !== "undefined" ? window.location.origin : "(not browser)";
    const extra = [
      orchestratorConnectionHint(),
      `Request went to: ${url}.`,
      `Page origin: ${origin} — it must be listed in VITE_DEV_ORIGIN on server (comma-separated, no trailing slash).`,
      "If the frontend is HTTPS but VITE_API_BASE_URL is http:// — the browser blocks mixed content; orchestrator needs https://.",
    ].join(" ");

    throw new Error(`${msg}. ${extra}`);
  }
}
