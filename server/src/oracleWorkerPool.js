/**
 * Пул WebSocket-воркеров (локальные агенты с LM Studio): round-robin для escrow oracle.
 */
import { randomUUID } from "node:crypto";

/** @typedef {{ ws: import("ws").WebSocket, workerId: string, busy: boolean }} WorkerSlot */

/** @type {WorkerSlot[]} */
const slots = [];
let roundRobin = 0;

/** @type {Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout; slot: WorkerSlot }>} */
const pending = new Map();

export function getOracleWorkerCount() {
  return slots.filter((s) => s.ws.readyState === 1).length;
}

export function getOracleWorkerStats() {
  const open = slots.filter((s) => s.ws.readyState === 1);
  return {
    connected: open.length,
    busy: open.filter((s) => s.busy).length,
    workerIds: open.map((s) => s.workerId),
  };
}

/**
 * @param {import("ws").WebSocket} ws
 * @param {string} [workerId]
 */
export function registerOracleWorker(ws, workerId = "worker") {
  const id = `${workerId}-${randomUUID().slice(0, 8)}`;
  const slot = { ws, workerId: id, busy: false };
  slots.push(slot);

  const onClose = () => {
    const i = slots.indexOf(slot);
    if (i >= 0) slots.splice(i, 1);
    for (const [jobId, p] of pending.entries()) {
      if (p.slot === slot) {
        clearTimeout(p.timeout);
        pending.delete(jobId);
        p.reject(new Error("Oracle worker disconnected"));
      }
    }
  };
  ws.on("close", onClose);
  ws.on("error", onClose);

  return slot;
}

/**
 * @param {import("ws").WebSocket} ws
 * @param {unknown} raw
 */
export function handleOracleWorkerMessage(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());
  } catch {
    return;
  }
  if (msg?.type !== "oracle_result") return;
  const jobId = msg.jobId;
  if (!jobId || !pending.has(jobId)) return;

  const p = pending.get(jobId);
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
    workerId: p.slot.workerId,
  });
}

/**
 * Round-robin среди подключённых незанятых воркеров.
 * @param {string} deliverableText
 * @param {{ oracleLlmModel?: string }} opts
 * @param {{ ORACLE_WORKER_TIMEOUT_MS?: string }} env
 * @returns {Promise<{ verdict: boolean, reason: string, workerId: string } | null>}
 */
export function runOracleThroughWorkers(deliverableText, opts = {}, env = process.env) {
  const available = slots.filter((s) => s.ws.readyState === 1 && !s.busy);
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

    pending.set(jobId, { resolve, reject, timeout, slot });
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
