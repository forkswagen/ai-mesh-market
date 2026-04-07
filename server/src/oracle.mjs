import { heuristicJudge } from "./heuristicJudge.js";
import { getLmStudioChatCompletionsUrl } from "./lmStudioClient.js";
import { runOracleThroughWorkers } from "./oracleWorkerPool.js";
import { ORACLE_SYSTEM_PROMPT, oracleUserContent } from "./oraclePrompt.mjs";
import { parseVerdictPayload } from "./oracleParse.mjs";

/**
 * @param {string} deliverableText
 * @param {{ ORACLE_LLM_URL?: string, ORACLE_LLM_MODEL?: string, ORACLE_LLM_API_KEY?: string, LM_STUDIO_BASE_URL?: string, ORACLE_USE_AGENT_WORKERS?: string, ORACLE_WORKER_TIMEOUT_MS?: string }} env
 * @param {{ oracleLlmModel?: string, oracleWorkerLogicalId?: string }} [opts]
 */
export async function runOracle(deliverableText, env, opts = {}) {
  const useWorkers = env.ORACLE_USE_AGENT_WORKERS !== "0";
  if (useWorkers) {
    try {
      const r = await runOracleThroughWorkers(deliverableText, opts, env);
      if (r) {
        return {
          verdict: r.verdict,
          reason: r.reason,
          source: "agent_worker",
          workerId: r.workerId,
        };
      }
    } catch (e) {
      console.warn("Oracle via agent workers failed:", e?.message || e);
    }
  }

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

async function llmVerdict(text, env, opts) {
  const url = getLmStudioChatCompletionsUrl();
  const model = opts.oracleLlmModel || env.ORACLE_LLM_MODEL || "gpt-4o-mini";
  const body = {
    model,
    messages: [
      { role: "system", content: ORACLE_SYSTEM_PROMPT },
      { role: "user", content: oracleUserContent(text) },
    ],
    temperature: 0,
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
