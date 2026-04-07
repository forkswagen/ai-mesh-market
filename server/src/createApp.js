import express from "express";
import cors from "cors";
import { randomUUID, createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createDeal, patchDeal, getDeal, listDeals, dbDriver, touchWalletIdentity } from "./db.js";
import { broadcastDealsUpdate } from "./dealsWs.js";
import {
  getOracleWorkerStats,
  listLiveAgents,
  runChatThroughAgent,
  setAgentAccepting,
  setAgentLifecycleHooks,
} from "./oracleWorkerPool.js";
import {
  onAgentWsLifecycle,
  registerAgentWithWallet,
  listRegisteredAgentsPublic,
  sanitizeAgentLogicalId,
} from "./agentRegistry.js";
import { runOracle } from "./oracle.mjs";
import { fetchLmStudioModels, getLmStudioBaseUrl } from "./lmStudioClient.js";
import { Connection, loadKp, runFullChain } from "./solanaChain.js";
import { PublicKey } from "@solana/web3.js";
import { attachPlatformTaskRoutes } from "./platformTasks.js";
import { fetchHuggingFaceDatasets, fetchKaggleDatasets } from "./datasetsHub.js";

const SERVER_SRC_DIR = dirname(fileURLToPath(import.meta.url));
const API_REVISION = 4;

/** CORS: VITE_DEV_ORIGIN may list multiple comma-separated origins (local + Vercel). */
function corsOrigins() {
  const raw = process.env.VITE_DEV_ORIGIN || "http://localhost:5173";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.includes("http://127.0.0.1:5173")) list.push("http://127.0.0.1:5173");
  return [...new Set(list)];
}

function sha256hex(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function checkAgentControlAuth(req) {
  const required = process.env.AGENT_CONTROL_SECRET?.trim();
  const secret = (req.headers["x-agent-control-secret"] || req.body?.secret || "").toString().trim();
  if (required) {
    if (secret !== required) return { ok: false, status: 401, error: "invalid or missing agent control secret" };
    return { ok: true };
  }
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return { ok: false, status: 503, error: "AGENT_CONTROL_SECRET must be set in production" };
  }
  return { ok: true };
}

async function processDeal(body, res) {
  const {
    dealId,
    buyerPublicKey,
    sellerPublicKey,
    amountLamports,
    deliverableText = "",
    runChain = false,
    expectedHashHex: expectedOverride,
    oracleLlmModel,
    oracleWorkerAgentId,
  } = body || {};

  if (!dealId || !buyerPublicKey || !sellerPublicKey || !amountLamports) {
    return res.status(400).json({ error: "dealId, buyerPublicKey, sellerPublicKey, amountLamports required" });
  }

  try {
    new PublicKey(buyerPublicKey);
    new PublicKey(sellerPublicKey);
  } catch {
    return res.status(400).json({ error: "invalid public key" });
  }

  const id = randomUUID();
  const expectedHashHex = expectedOverride || sha256hex(deliverableText || "demo");
  const submittedHashHex = expectedHashHex;

  await createDeal({
    id,
    deal_id: dealId,
    buyer: buyerPublicKey,
    seller: sellerPublicKey,
    amount_lamports: amountLamports,
    expected_hash_hex: expectedHashHex,
    state: "created",
    created_at: Date.now(),
  });
  await broadcastDealsUpdate();

  if (!runChain) {
    return res.status(201).json({ id, state: "created", expectedHashHex });
  }

  const buyerSec = process.env.BUYER_SECRET_JSON;
  const sellerSec = process.env.SELLER_SECRET_JSON;
  const oracleSec = process.env.ORACLE_SECRET_JSON;

  if (!buyerSec || !sellerSec || !oracleSec) {
    await patchDeal(id, { state: "error", error: "Missing BUYER_SECRET_JSON / SELLER_SECRET_JSON / ORACLE_SECRET_JSON" });
    await broadcastDealsUpdate();
    return res.status(503).json({
      id,
      error: "Server keys not configured; set secrets in server/.env (see .env.example)",
    });
  }

  const buyerKp = loadKp(buyerSec);
  const sellerKp = loadKp(sellerSec);
  const oracleKp = loadKp(oracleSec);

  if (buyerKp.publicKey.toBase58() !== buyerPublicKey || sellerKp.publicKey.toBase58() !== sellerPublicKey) {
    await patchDeal(id, { state: "error", error: "Public keys do not match BUYER/SELLER secrets" });
    await broadcastDealsUpdate();
    return res.status(400).json({ error: "buyer/seller pubkeys must match server keypair secrets" });
  }

  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  try {
    await patchDeal(id, { state: "chain_in_progress" });
    await broadcastDealsUpdate();
    const oracleResult = await runOracle(deliverableText, process.env, {
      oracleLlmModel: typeof oracleLlmModel === "string" ? oracleLlmModel : undefined,
      oracleWorkerLogicalId:
        typeof oracleWorkerAgentId === "string" && oracleWorkerAgentId.trim()
          ? oracleWorkerAgentId.trim()
          : undefined,
    });

    const chain = await runFullChain({
      connection,
      buyerKp,
      sellerKp,
      oracleKp,
      dealId,
      amountLamports,
      expectedHashHex,
      submittedHashHex,
      verdict: oracleResult.verdict,
      reason: oracleResult.reason,
    });

    await patchDeal(id, {
      state: "settled",
      init_sig: chain.sigInit,
      deposit_sig: chain.sigDep,
      submit_sig: chain.sigSub,
      judge_sig: chain.sigJudge,
      verdict: oracleResult.verdict ? 1 : 0,
      reason: oracleResult.reason,
      error: null,
    });
    await broadcastDealsUpdate();

    return res.status(201).json({
      id,
      state: "settled",
      verdict: oracleResult.verdict,
      reason: oracleResult.reason,
      signatures: chain,
    });
  } catch (e) {
    console.error(e);
    await patchDeal(id, { state: "error", error: String(e.message || e) });
    await broadcastDealsUpdate();
    return res.status(500).json({ id, error: String(e.message || e) });
  }
}

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: corsOrigins(),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Agent-Control-Secret"],
      exposedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  attachPlatformTaskRoutes(app);

  app.get("/api/datasets/hub/huggingface", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limit = req.query.limit;
    try {
      const items = await fetchHuggingFaceDatasets({ search: q, limit: Number(limit) || 24 });
      res.json({ ok: true, source: "huggingface", items });
    } catch (e) {
      console.error(e);
      res.status(502).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.get("/api/datasets/hub/kaggle", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const page = req.query.page;
    const pageSize = req.query.pageSize;
    try {
      const items = await fetchKaggleDatasets({
        search: q,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
      });
      res.json({ ok: true, source: "kaggle", items });
    } catch (e) {
      console.error(e);
      res.status(502).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.get("/api/agent/oracle-workers", (_req, res) => {
    res.json({ ok: true, ...getOracleWorkerStats() });
  });

  app.get("/api/meta", (_req, res) => {
    res.json({
      ok: true,
      apiRevision: API_REVISION,
      app: "depai-orchestrator",
      serverSrcDir: process.env.NODE_ENV !== "production" ? SERVER_SRC_DIR : undefined,
      db: dbDriver(),
      agentEndpoints: [
        "GET /api/agent/live",
        "GET /api/agent/oracle-workers",
        "POST /api/agent/infer",
        "POST /api/agent/control/accepting",
        "GET /api/agent/models",
        "POST /api/v1/agents/challenge",
        "POST /api/v1/agents/register",
        "GET /api/v1/agents/registry",
      ],
      vercel: process.env.VERCEL === "1",
    });
  });

  app.get("/api/agent/live", (_req, res) => {
    res.json({ ok: true, agents: listLiveAgents() });
  });

  app.post("/api/agent/infer", async (req, res) => {
    const { agentId, messages, model, temperature } = req.body || {};
    if (typeof agentId !== "string" || !agentId.trim()) {
      return res.status(400).json({ ok: false, error: "agentId (agent logicalId) is required" });
    }
    try {
      const out = await runChatThroughAgent(
        {
          agentLogicalId: agentId.trim(),
          messages,
          model: typeof model === "string" ? model : "",
          temperature: typeof temperature === "number" ? temperature : 0.7,
        },
        process.env,
      );
      res.json({ ok: true, text: out.text, agentLogicalId: out.agentLogicalId, sessionId: out.sessionId });
    } catch (e) {
      res.status(502).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.post("/api/agent/control/accepting", (req, res) => {
    const auth = checkAgentControlAuth(req);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
    const logicalId = req.body?.logicalId;
    const accepting = !!req.body?.accepting;
    if (typeof logicalId !== "string" || !logicalId.trim()) {
      return res.status(400).json({ ok: false, error: "logicalId required" });
    }
    const { updated, logicalId: id } = setAgentAccepting(logicalId.trim(), accepting);
    res.json({ ok: true, logicalId: id, accepting, updated });
  });

  app.get("/api/agent/models", async (_req, res) => {
    try {
      const { baseUrl, models } = await fetchLmStudioModels();
      res.json({ ok: true, baseUrl, models });
    } catch (e) {
      res.status(503).json({
        ok: false,
        baseUrl: getLmStudioBaseUrl(),
        models: [],
        error: String(e.message || e),
      });
    }
  });

  app.post("/api/agent/oracle", async (req, res) => {
    const { deliverableText = "", oracleLlmModel, oracleWorkerAgentId } = req.body || {};
    try {
      const result = await runOracle(String(deliverableText), process.env, {
        oracleLlmModel: typeof oracleLlmModel === "string" ? oracleLlmModel : undefined,
        oracleWorkerLogicalId:
          typeof oracleWorkerAgentId === "string" && oracleWorkerAgentId.trim()
            ? oracleWorkerAgentId.trim()
            : undefined,
      });
      res.json({ ok: true, verdict: result.verdict, reason: result.reason, source: result.source });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  });

  app.get("/health", (_req, res) => {
    const programId = process.env.PROGRAM_ID || "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg";
    const payload = {
      status: "ok",
      app: "depai-orchestrator",
      env: process.env.NODE_ENV || "development",
      ok: true,
      programId,
      db: dbDriver(),
      apiRevision: API_REVISION,
      hasOracleWorkerStatsRoute: true,
      vercel: process.env.VERCEL === "1",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.serverSrcDir = SERVER_SRC_DIR;
    }
    res.json(payload);
  });

  app.post("/api/v1/auth/challenge", (req, res) => {
    const wallet = String(req.body?.wallet || "unknown").trim() || "unknown";
    const message = `escora:sign-in:${wallet}:${Date.now()}`;
    res.json({ challenge: message, message });
  });

  app.post("/api/v1/auth/verify", async (req, res) => {
    const wallet = String(req.body?.wallet || "").trim();
    const message = req.body?.message ?? req.body?.challenge;
    const signatureBase64 = req.body?.signatureBase64;
    if (wallet && message && signatureBase64) {
      const { verifySolanaMessageSignature } = await import("./walletVerify.js");
      if (!verifySolanaMessageSignature(wallet, String(message), String(signatureBase64))) {
        return res.status(401).json({ error: "invalid signature" });
      }
      await touchWalletIdentity({ wallet_pubkey: wallet, last_challenge: String(message).slice(0, 500) });
      return res.json({
        access_token: `siws:${wallet}:${Date.now()}`,
        token_type: "Bearer",
        wallet,
      });
    }
    res.json({
      access_token: `local-orchestrator-token:${req.body?.wallet || "dev"}`,
      token_type: "Bearer",
    });
  });

  app.post("/api/v1/agents/challenge", (req, res) => {
    const wallet = String(req.body?.wallet || "").trim();
    const rawId = String(req.body?.logicalId || "").trim();
    if (!wallet || !rawId) {
      return res.status(400).json({ error: "wallet and logicalId required" });
    }
    const logicalId = sanitizeAgentLogicalId(rawId);
    const message = `escora:register-agent:${logicalId}:${wallet}`;
    res.json({ message, logicalId });
  });

  app.post("/api/v1/agents/register", async (req, res) => {
    try {
      const row = await registerAgentWithWallet({
        wallet: String(req.body?.wallet || "").trim(),
        logicalId: String(req.body?.logicalId || "").trim(),
        message: String(req.body?.message || ""),
        signatureBase64: String(req.body?.signatureBase64 || ""),
        displayName: typeof req.body?.displayName === "string" ? req.body.displayName : undefined,
        webhookUrl: typeof req.body?.webhookUrl === "string" ? req.body.webhookUrl : undefined,
      });
      res.json({
        ok: true,
        agent: {
          id: row.id,
          walletPubkey: row.wallet_pubkey,
          logicalId: row.logical_id,
          displayName: row.display_name,
        },
      });
    } catch (e) {
      res.status(400).json({ ok: false, error: String(e.message || e) });
    }
  });

  app.get("/api/v1/agents/registry", async (_req, res) => {
    const agents = await listRegisteredAgentsPublic();
    res.json({ ok: true, agents });
  });

  app.get("/api/deals", async (_req, res) => {
    res.json({ deals: await listDeals() });
  });

  app.get("/api/deals/:id", async (req, res) => {
    const row = await getDeal(req.params.id);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  app.post("/api/deals", (req, res) => {
    processDeal(req.body, res).catch((e) => res.status(500).json({ error: String(e) }));
  });

  app.post("/api/demo/seeded", (req, res) => {
    const buyerSec = process.env.BUYER_SECRET_JSON;
    const sellerSec = process.env.SELLER_SECRET_JSON;
    const oracleSec = process.env.ORACLE_SECRET_JSON;
    if (!buyerSec || !sellerSec || !oracleSec) {
      return res.status(503).json({ error: "Configure server/.env keypairs (see .env.example)" });
    }
    const buyerKp = loadKp(buyerSec);
    const sellerKp = loadKp(sellerSec);

    const dealId = Number(req.body?.dealId) || Math.floor(Date.now() / 1000) % 1_000_000_000;
    const amountLamports = Number(req.body?.amountLamports) || 50_000;
    const deliverableText =
      req.body?.deliverableText ||
      ['{"text":"a","label":1}', '{"text":"b","label":0}', '{"text":"c","label":1}'].join("\n");

    return processDeal(
      {
        dealId,
        buyerPublicKey: buyerKp.publicKey.toBase58(),
        sellerPublicKey: sellerKp.publicKey.toBase58(),
        amountLamports,
        deliverableText,
        runChain: true,
        oracleLlmModel: req.body?.oracleLlmModel,
        oracleWorkerAgentId: req.body?.oracleWorkerAgentId,
      },
      res,
    ).catch((e) => res.status(500).json({ error: String(e) }));
  });

  app.post("/api/deals/:id/oracle", (_req, res) => {
    res.status(501).json({ error: "Use POST /api/deals with runChain or POST /api/demo/seeded" });
  });

  setAgentLifecycleHooks({
    onConnected: (s) => {
      void onAgentWsLifecycle("agent.connected", { logicalId: s.logicalId, sessionId: s.sessionId });
    },
    onDisconnected: (p) => {
      void onAgentWsLifecycle("agent.disconnected", p);
    },
  });

  return app;
}
