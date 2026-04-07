/**
 * WebSocket-агенты с локальным LM Studio (/ws/oracle-worker):
 * escrow oracle_eval, общий чат lm_chat, round-robin или выбор по logicalId.
 */
import { randomUUID } from "node:crypto";

/** @typedef {import("ws").WebSocket} Ws */

/**
 * @typedef {object} AgentSlot
 * @property {Ws} ws
 * @property {string} sessionId
 * @property {string} logicalId
 * @property {string} name
 * @property {boolean} accepting
 * @property {boolean} busy
 */

/** @type {AgentSlot[]} */
const slots = [];
let roundRobin = 0;

/** @type {Map<string, { kind: 'oracle' | 'chat', resolve: (v: any) => void, reject: (e: Error) => void, timeout: NodeJS.Timeout, slot: AgentSlot }>} */
const pending = new Map();

/** Хуки: регистрация агента в БД / вебхуки провайдеру (без импорт-циклов из index). */
/** @type {{ onConnected?: (s: AgentSlot) => void, onDisconnected?: (p: { logicalId: string, sessionId: string, name: string }) => void }} */
let lifecycleHooks = {};

export function setAgentLifecycleHooks(hooks) {
  lifecycleHooks = hooks || {};
}

function sanitizeLogicalId(raw) {
  const s = String(raw || "worker")
    .trim()
    .replace(/[^\w.\-]/g, "_")
    .slice(0, 64);
  return s || "worker";
}

export function getOracleWorkerCount() {
  return slots.filter((s) => s.ws.readyState === 1).length;
}

export function getOracleWorkerStats() {
  const open = slots.filter((s) => s.ws.readyState === 1);
  return {
    connected: open.length,
    busy: open.filter((s) => s.busy).length,
    workerIds: open.map((s) => s.sessionId),
    agents: open.map((s) => ({
      logicalId: s.logicalId,
      sessionId: s.sessionId,
      name: s.name,
      accepting: s.accepting,
      busy: s.busy,
    })),
  };
}

/** Агенты с открытым WebSocket (для выбора на фронте). */
export function listLiveAgents() {
  return getOracleWorkerStats().agents;
}

/**
 * @param {string} logicalId
 * @param {boolean} accepting
 */
export function setAgentAccepting(logicalId, accepting) {
  const id = sanitizeLogicalId(logicalId);
  let updated = 0;
  for (const s of slots) {
    if (s.logicalId === id) {
      s.accepting = !!accepting;
      updated++;
    }
  }
  return { updated, logicalId: id };
}

/**
 * @param {Ws} ws
 * @param {string} [logicalIdFromQuery]
 */
export function registerOracleWorker(ws, logicalIdFromQuery = "worker") {
  const logicalId = sanitizeLogicalId(logicalIdFromQuery);
  const sessionId = randomUUID();
  const slot = {
    ws,
    sessionId,
    logicalId,
    name: logicalId,
    accepting: true,
    busy: false,
  };
  slots.push(slot);
  queueMicrotask(() => lifecycleHooks.onConnected?.(slot));

  const onClose = () => {
    lifecycleHooks.onDisconnected?.({
      logicalId: slot.logicalId,
      sessionId: slot.sessionId,
      name: slot.name,
    });
    const i = slots.indexOf(slot);
    if (i >= 0) slots.splice(i, 1);
    for (const [jobId, p] of pending.entries()) {
      if (p.slot === slot) {
        clearTimeout(p.timeout);
        pending.delete(jobId);
        p.reject(new Error("Agent disconnected"));
      }
    }
  };
  ws.on("close", onClose);
  ws.on("error", onClose);

  return slot;
}

function findSlotByWs(ws) {
  return slots.find((s) => s.ws === ws) || null;
}

/**
 * @param {Ws} ws
 * @param {unknown} raw
 */
export function handleOracleWorkerMessage(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());
  } catch {
    return;
  }

  if (msg?.type === "agent_hello") {
    const slot = findSlotByWs(ws);
    if (slot && typeof msg.name === "string" && msg.name.trim()) {
      slot.name = msg.name.trim().slice(0, 128);
    }
    return;
  }

  if (msg?.type === "oracle_result") {
    const jobId = msg.jobId;
    if (!jobId || !pending.has(jobId)) return;
    const p = pending.get(jobId);
    if (p.kind !== "oracle") return;
    pending.delete(jobId);
    clearTimeout(p.timeout);
    p.slot.busy = false;

    if (!msg.ok) {
      p.reject(new Error(msg.error || "Worker reported error"));
      return;
    }
    if (typeof msg.verdict !== "boolean" || typeof msg.reason !== "string") {
      p.reject(new Error("Invalid oracle_result shape"));
      return;
    }
    p.resolve({
      verdict: msg.verdict,
      reason: String(msg.reason).slice(0, 256),
      workerId: p.slot.sessionId,
      agentLogicalId: p.slot.logicalId,
    });
    return;
  }

  if (msg?.type === "lm_chat_result") {
    const jobId = msg.jobId;
    if (!jobId || !pending.has(jobId)) return;
    const p = pending.get(jobId);
    if (p.kind !== "chat") return;
    pending.delete(jobId);
    clearTimeout(p.timeout);
    p.slot.busy = false;

    if (!msg.ok) {
      p.reject(new Error(msg.error || "Chat failed"));
      return;
    }
    p.resolve({
      text: String(msg.text ?? ""),
      agentLogicalId: p.slot.logicalId,
      sessionId: p.slot.sessionId,
    });
  }
}

/**
 * @param {string} deliverableText
 * @param {{ oracleLlmModel?: string, oracleWorkerLogicalId?: string }} opts
 * @param {{ ORACLE_WORKER_TIMEOUT_MS?: string, ORACLE_WORKER_STRATEGY?: string }} env
 */
export function runOracleThroughWorkers(deliverableText, opts = {}, env = process.env) {
  const preferred =
    typeof opts.oracleWorkerLogicalId === "string" ? sanitizeLogicalId(opts.oracleWorkerLogicalId) : "";
  let available = slots.filter((s) => s.ws.readyState === 1 && !s.busy && s.accepting);
  if (preferred) {
    const subset = available.filter((s) => s.logicalId === preferred);
    if (subset.length) available = subset;
    else return Promise.resolve(null);
  }
  if (!available.length) return Promise.resolve(null);

  const strategy = String(env.ORACLE_WORKER_STRATEGY || "round_robin").toLowerCase();
  let slot;
  if (strategy === "random") {
    slot = available[Math.floor(Math.random() * available.length)];
  } else {
    const idx = roundRobin % available.length;
    roundRobin++;
    slot = available[idx];
  }

  const jobId = randomUUID();
  const timeoutMs = Math.min(Math.max(Number(env.ORACLE_WORKER_TIMEOUT_MS) || 120_000, 5000), 600_000);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.has(jobId)) {
        pending.delete(jobId);
        slot.busy = false;
        reject(new Error(`Oracle worker timeout ${timeoutMs}ms`));
      }
    }, timeoutMs);

    pending.set(jobId, { kind: "oracle", resolve, reject, timeout, slot });
    slot.busy = true;

    const payload = JSON.stringify({
      type: "oracle_eval",
      jobId,
      deliverableText: String(deliverableText),
      model: typeof opts.oracleLlmModel === "string" ? opts.oracleLlmModel : "",
      temperature: 0,
    });

    try {
      slot.ws.send(payload);
    } catch (e) {
      pending.delete(jobId);
      clearTimeout(timeout);
      slot.busy = false;
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

/**
 * Произвольный чат через выбранного агента → LM Studio.
 * @param {{ agentLogicalId: string, messages: unknown[], model?: string, temperature?: number }} input
 * @param {{ ORACLE_WORKER_TIMEOUT_MS?: string }} env
 */
export function runChatThroughAgent(input, env = process.env) {
  const logicalId = sanitizeLogicalId(input.agentLogicalId);
  const messages = Array.isArray(input.messages) ? input.messages : [];
  if (!logicalId) return Promise.reject(new Error("agentLogicalId required"));

  const available = slots.filter(
    (s) => s.ws.readyState === 1 && !s.busy && s.accepting && s.logicalId === logicalId,
  );
  if (!available.length) {
    return Promise.reject(
      new Error(`Нет агента "${logicalId}" в статусе live и accepting — проверьте oracle-worker и тумблер хоста.`),
    );
  }
  const slot = available[0];
  const jobId = randomUUID();
  const timeoutMs = Math.min(Math.max(Number(env.ORACLE_WORKER_TIMEOUT_MS) || 120_000, 5000), 600_000);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.has(jobId)) {
        pending.delete(jobId);
        slot.busy = false;
        reject(new Error(`Agent chat timeout ${timeoutMs}ms`));
      }
    }, timeoutMs);

    pending.set(jobId, { kind: "chat", resolve, reject, timeout, slot });
    slot.busy = true;

    try {
      slot.ws.send(
        JSON.stringify({
          type: "lm_chat",
          jobId,
          messages,
          model: typeof input.model === "string" ? input.model : "",
          temperature: typeof input.temperature === "number" ? input.temperature : 0.7,
        }),
      );
    } catch (e) {
      pending.delete(jobId);
      clearTimeout(timeout);
      slot.busy = false;
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
