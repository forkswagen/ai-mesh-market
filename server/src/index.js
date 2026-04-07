import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { randomUUID, createHash } from "node:crypto";
import { createDeal, patchDeal, getDeal, listDeals } from "./db.js";
import { attachDealsWebSocket, broadcastDealsUpdate } from "./dealsWs.js";
import { runOracle } from "./oracle.mjs";
import { fetchLmStudioModels, getLmStudioBaseUrl } from "./lmStudioClient.js";
import { Connection, loadKp, runFullChain } from "./solanaChain.js";
import { PublicKey } from "@solana/web3.js";

const app = express();
const PORT = Number(process.env.PORT) || 8787;

/** CORS: VITE_DEV_ORIGIN может быть несколько origin через запятую (локал + Vercel). */
function corsOrigins() {
  const raw = process.env.VITE_DEV_ORIGIN || "http://localhost:5173";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.includes("http://127.0.0.1:5173")) list.push("http://127.0.0.1:5173");
  return [...new Set(list)];
}

app.use(cors({ origin: corsOrigins(), credentials: true }));
app.use(express.json({ limit: "2mb" }));

function sha256hex(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
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

  createDeal({
    id,
    deal_id: dealId,
    buyer: buyerPublicKey,
    seller: sellerPublicKey,
    amount_lamports: amountLamports,
    expected_hash_hex: expectedHashHex,
    state: "created",
    created_at: Date.now(),
  });
  broadcastDealsUpdate();

  if (!runChain) {
    return res.status(201).json({ id, state: "created", expectedHashHex });
  }

  const buyerSec = process.env.BUYER_SECRET_JSON;
  const sellerSec = process.env.SELLER_SECRET_JSON;
  const oracleSec = process.env.ORACLE_SECRET_JSON;

  if (!buyerSec || !sellerSec || !oracleSec) {
    patchDeal(id, { state: "error", error: "Missing BUYER_SECRET_JSON / SELLER_SECRET_JSON / ORACLE_SECRET_JSON" });
    broadcastDealsUpdate();
    return res.status(503).json({
      id,
      error: "Server keys not configured; set secrets in server/.env (see .env.example)",
    });
  }

  const buyerKp = loadKp(buyerSec);
  const sellerKp = loadKp(sellerSec);
  const oracleKp = loadKp(oracleSec);

  if (buyerKp.publicKey.toBase58() !== buyerPublicKey || sellerKp.publicKey.toBase58() !== sellerPublicKey) {
    patchDeal(id, { state: "error", error: "Public keys do not match BUYER/SELLER secrets" });
    broadcastDealsUpdate();
    return res.status(400).json({ error: "buyer/seller pubkeys must match server keypair secrets" });
  }

  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  try {
    patchDeal(id, { state: "chain_in_progress" });
    broadcastDealsUpdate();
    const oracleResult = await runOracle(deliverableText, process.env, {
      oracleLlmModel: typeof oracleLlmModel === "string" ? oracleLlmModel : undefined,
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

    patchDeal(id, {
      state: "settled",
      init_sig: chain.sigInit,
      deposit_sig: chain.sigDep,
      submit_sig: chain.sigSub,
      judge_sig: chain.sigJudge,
      verdict: oracleResult.verdict ? 1 : 0,
      reason: oracleResult.reason,
      error: null,
    });
    broadcastDealsUpdate();

    return res.status(201).json({
      id,
      state: "settled",
      verdict: oracleResult.verdict,
      reason: oracleResult.reason,
      signatures: chain,
    });
  } catch (e) {
    console.error(e);
    patchDeal(id, { state: "error", error: String(e.message || e) });
    broadcastDealsUpdate();
    return res.status(500).json({ id, error: String(e.message || e) });
  }
}

/** Список моделей LM Studio (agent) — фронт не ходит в LM Studio напрямую. */
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

/** Только оракул (LM Studio / эвристика), без Solana — для Streamlit и отладки. */
app.post("/api/agent/oracle", async (req, res) => {
  const { deliverableText = "", oracleLlmModel } = req.body || {};
  try {
    const result = await runOracle(String(deliverableText), process.env, {
      oracleLlmModel: typeof oracleLlmModel === "string" ? oracleLlmModel : undefined,
    });
    res.json({ ok: true, verdict: result.verdict, reason: result.reason, source: result.source });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/health", (_req, res) => {
  const programId = process.env.PROGRAM_ID || "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg";
  res.json({
    status: "ok",
    app: "depai-orchestrator",
    env: process.env.NODE_ENV || "development",
    ok: true,
    programId,
  });
});

/** Совместимость с фронтом depaiAuth + depai-backend: локальный мок (подпись не проверяется). */
app.post("/api/v1/auth/challenge", (req, res) => {
  const wallet = req.body?.wallet || "unknown";
  res.json({ challenge: `nexus-local-challenge:${wallet}:${Date.now()}` });
});

app.post("/api/v1/auth/verify", (req, res) => {
  res.json({
    access_token: `local-orchestrator-token:${req.body?.wallet || "dev"}`,
    token_type: "Bearer",
  });
});

app.get("/api/deals", (_req, res) => {
  res.json({ deals: listDeals() });
});

app.get("/api/deals/:id", (req, res) => {
  const row = getDeal(req.params.id);
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
    },
    res,
  ).catch((e) => res.status(500).json({ error: String(e) }));
});

app.post("/api/deals/:id/oracle", (_req, res) => {
  res.status(501).json({ error: "Use POST /api/deals with runChain or POST /api/demo/seeded" });
});

const server = http.createServer(app);
attachDealsWebSocket(server);
server.listen(PORT, () => {
  console.log(
    `depai-orchestrator http://localhost:${PORT} (cors ${corsOrigins().join(", ")}) ws /ws /ws/agent`,
  );
});
