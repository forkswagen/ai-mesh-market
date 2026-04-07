/**
 * LM Studio (OpenAI-compatible) — backend only; frontend calls orchestrator.
 */

export function getLmStudioBaseUrl() {
  const fromEnv = process.env.LM_STUDIO_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const chat = process.env.ORACLE_LLM_URL || "";
  try {
    if (chat.includes("/v1/")) {
      return new URL(chat).origin;
    }
  } catch {
    /* ignore */
  }
  return "http://127.0.0.1:1234";
}

export function getLmStudioChatCompletionsUrl() {
  if (process.env.ORACLE_LLM_URL) return process.env.ORACLE_LLM_URL;
  return `${getLmStudioBaseUrl()}/v1/chat/completions`;
}

/**
 * @returns {Promise<{ baseUrl: string, models: { id: string }[] }>}
 */
export async function fetchLmStudioModels() {
  const baseUrl = getLmStudioBaseUrl();
  const url = `${baseUrl}/v1/models`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`LM Studio ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const rows = Array.isArray(data.data) ? data.data : [];
  const models = rows
    .map((m) => (typeof m?.id === "string" ? { id: m.id } : null))
    .filter(Boolean);
  return { baseUrl, models };
}
