import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID, createHash } from "node:crypto";
import { createDeal, patchDeal, getDeal, listDeals } from "./db.js";
import { runOracle } from "./oracle.mjs";
import { Connection, loadKp, runFullChain } from "./solanaChain.js";
import { PublicKey } from "@solana/web3.js";

const app = express();
const PORT = Number(process.env.PORT) || 8787;
const origin = process.env.VITE_DEV_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: [origin, "http://127.0.0.1:5173"], credentials: true }));
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

  if (!runChain) {
    return res.status(201).json({ id, state: "created", expectedHashHex });
  }

  const buyerSec = process.env.BUYER_SECRET_JSON;
  const sellerSec = process.env.SELLER_SECRET_JSON;
  const oracleSec = process.env.ORACLE_SECRET_JSON;

  if (!buyerSec || !sellerSec || !oracleSec) {
    patchDeal(id, { state: "error", error: "Missing BUYER_SECRET_JSON / SELLER_SECRET_JSON / ORACLE_SECRET_JSON" });
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
    return res.status(400).json({ error: "buyer/seller pubkeys must match server keypair secrets" });
  }

  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  try {
    patchDeal(id, { state: "chain_in_progress" });
    const oracleResult = await runOracle(deliverableText, process.env);

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
    return res.status(500).json({ id, error: String(e.message || e) });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, programId: process.env.PROGRAM_ID || "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg" });
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
    },
    res,
  ).catch((e) => res.status(500).json({ error: String(e) }));
});

app.post("/api/deals/:id/oracle", (_req, res) => {
  res.status(501).json({ error: "Use POST /api/deals with runChain or POST /api/demo/seeded" });
});

app.listen(PORT, () => {
  console.log(`depai-orchestrator http://localhost:${PORT} (cors ${origin})`);
});
