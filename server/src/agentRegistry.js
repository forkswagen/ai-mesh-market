/**
 * Agent registration (wallet + logicalId), outgoing webhooks on online/offline.
 */
import { randomUUID, createHmac } from "node:crypto";
import {
  upsertRegisteredAgent,
  listRegisteredAgents as dbListRegisteredAgents,
  touchWalletIdentity,
  getRegisteredAgentsByLogicalId,
} from "./db.js";
import { verifySolanaMessageSignature } from "./walletVerify.js";

/** Must match normalization in oracle-worker pool (?id=). */
export function sanitizeAgentLogicalId(raw) {
  const s = String(raw || "")
    .trim()
    .replace(/[^\w.\-]/g, "_")
    .slice(0, 64);
  return s || "worker";
}

/**
 * @param {string} event
 * @param {{ logicalId: string, sessionId?: string, walletPubkey?: string | null }} payload
 */
export async function emitAgentProviderWebhook(event, payload) {
  const secret = process.env.AGENT_WEBHOOK_SIGNING_SECRET?.trim();
  const rows = await getRegisteredAgentsByLogicalId(payload.logicalId);
  if (!rows.length) return;

  const bodyObj = {
    event,
    ts: Date.now(),
    logicalId: payload.logicalId,
    sessionId: payload.sessionId ?? null,
    walletPubkey: payload.walletPubkey ?? rows[0].wallet_pubkey,
  };
  const body = JSON.stringify(bodyObj);

  await Promise.all(
    rows
      .filter((r) => r.webhook_url)
      .map(async (r) => {
        try {
          const headers = { "Content-Type": "application/json", "X-Escora-Event": event };
          if (secret) {
            const sig = createHmac("sha256", secret).update(body).digest("hex");
            headers["X-Escora-Signature"] = `sha256=${sig}`;
          }
          const res = await fetch(r.webhook_url, { method: "POST", headers, body });
          if (!res.ok) console.warn("[webhook] agent event", event, res.status, r.webhook_url);
        } catch (e) {
          console.warn("[webhook] agent event failed", event, e?.message || e);
        }
      }),
  );
}

/**
 * @param {"agent.connected"|"agent.disconnected"} event
 * @param {{ logicalId: string, sessionId: string }} slot
 */
export async function onAgentWsLifecycle(event, slot) {
  await emitAgentProviderWebhook(event, {
    logicalId: slot.logicalId,
    sessionId: slot.sessionId,
  });
}

/**
 * @param {{
 *   wallet: string,
 *   logicalId: string,
 *   message: string,
 *   signatureBase64: string,
 *   displayName?: string,
 *   webhookUrl?: string,
 * }} input
 */
export async function registerAgentWithWallet(input) {
  const ok = verifySolanaMessageSignature(input.wallet, input.message, input.signatureBase64);
  if (!ok) throw new Error("Invalid wallet signature");
  const logicalId = sanitizeAgentLogicalId(input.logicalId);
  const expected = `escora:register-agent:${logicalId}:${input.wallet}`;
  if (input.message.trim() !== expected) {
    throw new Error("Message must match registration challenge");
  }
  await touchWalletIdentity({ wallet_pubkey: input.wallet });
  const row = await upsertRegisteredAgent({
    id: randomUUID(),
    wallet_pubkey: input.wallet,
    logical_id: logicalId,
    display_name: input.displayName?.trim().slice(0, 128) || null,
    webhook_url: input.webhookUrl?.trim() || null,
  });
  return row;
}

export async function listRegisteredAgentsPublic() {
  const rows = await dbListRegisteredAgents();
  return rows.map((r) => ({
    id: r.id,
    walletPubkey: r.wallet_pubkey,
    logicalId: r.logical_id,
    displayName: r.display_name,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  }));
}
