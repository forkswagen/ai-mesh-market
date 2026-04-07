#!/usr/bin/env node
/**
 * Локальный воркер оракула escrow: WebSocket к оркестратору + LM Studio на этой машине.
 * Запуск (рядом с работающим npm run server:dev):
 *   ORACLE_WORKER_WS_URL=ws://127.0.0.1:8787/ws/oracle-worker node scripts/oracle-lm-worker.mjs
 *
 * Несколько процессов → round-robin на сервере.
 */
import "dotenv/config";
import WebSocket from "ws";
import { getLmStudioChatCompletionsUrl } from "../src/lmStudioClient.js";
import { ORACLE_SYSTEM_PROMPT, oracleUserContent } from "../src/oraclePrompt.mjs";
import { parseVerdictPayload } from "../src/oracleParse.mjs";

const WS_URL = process.env.ORACLE_WORKER_WS_URL || "ws://127.0.0.1:8787/ws/oracle-worker";
const WORKER_ID = (process.env.ORACLE_WORKER_ID || "lm-local").slice(0, 64);

function connect() {
  const sep = WS_URL.includes("?") ? "&" : "?";
  const url = `${WS_URL}${sep}id=${encodeURIComponent(WORKER_ID)}`;
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.error(`[oracle-worker] connected ${url}`);
  });

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type !== "oracle_eval" || !msg.jobId) return;

    const reply = (payload) => {
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    };

    try {
      const text = String(msg.deliverableText || "");
      const model =
        (typeof msg.model === "string" && msg.model.trim()) ||
        process.env.ORACLE_LLM_MODEL ||
        "local-model";
      const urlChat = getLmStudioChatCompletionsUrl();
      const body = {
        model,
        messages: [
          { role: "system", content: ORACLE_SYSTEM_PROMPT },
          { role: "user", content: oracleUserContent(text) },
        ],
        temperature: typeof msg.temperature === "number" ? msg.temperature : 0,
        max_tokens: 1024,
      };
      const res = await fetch(urlChat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        reply({ type: "oracle_result", jobId: msg.jobId, ok: false, error: `LM HTTP ${res.status}` });
        return;
      }
      const data = await res.json();
      const m = data.choices?.[0]?.message;
      let rawText = (m?.content && String(m.content).trim()) || "";
      if (!rawText && typeof m?.reasoning_content === "string") rawText = m.reasoning_content.trim();
      if (!rawText) {
        reply({ type: "oracle_result", jobId: msg.jobId, ok: false, error: "Empty LLM content" });
        return;
      }
      const parsed = parseVerdictPayload(rawText);
      if (typeof parsed.verdict !== "boolean" || typeof parsed.reason !== "string") {
        reply({ type: "oracle_result", jobId: msg.jobId, ok: false, error: "Invalid LLM JSON shape" });
        return;
      }
      reply({
        type: "oracle_result",
        jobId: msg.jobId,
        ok: true,
        verdict: parsed.verdict,
        reason: String(parsed.reason).slice(0, 256),
      });
    } catch (e) {
      reply({
        type: "oracle_result",
        jobId: msg.jobId,
        ok: false,
        error: String(e?.message || e),
      });
    }
  });

  ws.on("close", () => {
    console.error("[oracle-worker] disconnected, reconnect in 3s");
    setTimeout(connect, 3000);
  });
  ws.on("error", (err) => {
    console.error("[oracle-worker] error", err.message);
  });
}

connect();
