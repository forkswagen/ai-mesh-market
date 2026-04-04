import { heuristicJudge } from "./heuristicJudge.js";

/**
 * @param {string} deliverableText
 * @param {{ ORACLE_LLM_URL?: string, ORACLE_LLM_MODEL?: string, ORACLE_LLM_API_KEY?: string }} env
 */
export async function runOracle(deliverableText, env) {
  if (env.ORACLE_LLM_URL) {
    try {
      const r = await llmVerdict(deliverableText, env);
      if (r) return r;
    } catch (e) {
      console.warn("LLM oracle failed, falling back to heuristic:", e.message);
    }
  }
  return heuristicJudge(deliverableText);
}

async function llmVerdict(text, env) {
  const url = env.ORACLE_LLM_URL;
  const model = env.ORACLE_LLM_MODEL || "gpt-4o-mini";
  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          'You judge task deliverables. Reply JSON only: {"verdict":true|false,"reason":"short string max 200 chars"}',
      },
      {
        role: "user",
        content: `Deliverable sample (truncated):\n${text.slice(0, 12000)}`,
      },
    ],
    temperature: 0,
    max_tokens: 200,
  };
  const headers = { "Content-Type": "application/json" };
  if (env.ORACLE_LLM_API_KEY) headers.Authorization = `Bearer ${env.ORACLE_LLM_API_KEY}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  const json = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(json);
  if (typeof parsed.verdict !== "boolean" || typeof parsed.reason !== "string") {
    throw new Error("Invalid LLM JSON shape");
  }
  return { verdict: parsed.verdict, reason: parsed.reason.slice(0, 256) };
}
