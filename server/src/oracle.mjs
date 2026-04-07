import { heuristicJudge } from "./heuristicJudge.js";
import { getLmStudioChatCompletionsUrl } from "./lmStudioClient.js";

/**
 * @param {string} deliverableText
 * @param {{ ORACLE_LLM_URL?: string, ORACLE_LLM_MODEL?: string, ORACLE_LLM_API_KEY?: string, LM_STUDIO_BASE_URL?: string }} env
 * @param {{ oracleLlmModel?: string }} [opts]
 */
export async function runOracle(deliverableText, env, opts = {}) {
  const useLlm = !!(env.ORACLE_LLM_URL || env.LM_STUDIO_BASE_URL);
  if (useLlm) {
    try {
      const r = await llmVerdict(deliverableText, env, opts);
      if (r) return { ...r, source: "llm" };
    } catch (e) {
      console.warn("LLM oracle failed, falling back to heuristic:", e.message);
    }
  }
  const h = heuristicJudge(deliverableText);
  return { ...h, source: "heuristic" };
}

function parseVerdictPayload(raw) {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("No JSON object in LLM output");
  }
}

async function llmVerdict(text, env, opts) {
  const url = getLmStudioChatCompletionsUrl();
  const model = opts.oracleLlmModel || env.ORACLE_LLM_MODEL || "gpt-4o-mini";
  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          'You judge task deliverables. Reply with ONLY this JSON, no other text: {"verdict":true|false,"reason":"short string max 200 chars"}',
      },
      {
        role: "user",
        content: `Deliverable sample (truncated):\n${text.slice(0, 12000)}`,
      },
    ],
    temperature: 0,
    // Reasoning models (e.g. Qwen in LM Studio) may fill `reasoning_content` first; need headroom.
    max_tokens: 1024,
  };
  const headers = { "Content-Type": "application/json" };
  if (env.ORACLE_LLM_API_KEY) headers.Authorization = `Bearer ${env.ORACLE_LLM_API_KEY}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  let rawText = (msg?.content && String(msg.content).trim()) || "";
  if (!rawText && typeof msg?.reasoning_content === "string") {
    rawText = msg.reasoning_content.trim();
  }
  if (!rawText) throw new Error("Empty LLM message content");
  const parsed = parseVerdictPayload(rawText);
  if (typeof parsed.verdict !== "boolean" || typeof parsed.reason !== "string") {
    throw new Error("Invalid LLM JSON shape");
  }
  return { verdict: parsed.verdict, reason: parsed.reason.slice(0, 256) };
}
