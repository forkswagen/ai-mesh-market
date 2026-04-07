#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "server", ".env");

async function getLamports(rpcUrl, pubkeyBase58) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [pubkeyBase58],
    }),
  });
  const j = await res.json();
  return j.result?.value ?? 0;
}

let ok = true;
let rpcUrl = "https://api.devnet.solana.com";
if (!existsSync(envPath)) {
  console.error("❌ Missing server/.env — npm run setup:devnet");
  ok = false;
} else {
  const raw = readFileSync(envPath, "utf8");
  const rpcM = raw.match(/^SOLANA_RPC_URL=(.+)$/m);
  if (rpcM) rpcUrl = rpcM[1].trim();
  for (const key of ["BUYER_SECRET_JSON", "SELLER_SECRET_JSON", "ORACLE_SECRET_JSON"]) {
    const m = raw.match(new RegExp(`^${key}=(\\[.+\\])$`, "m"));
    if (!m || m[1].length < 100) {
      console.error(`❌ Invalid ${key} in server/.env`);
      ok = false;
    }
  }
  if (ok) {
    const buyerJ = raw.match(/^BUYER_SECRET_JSON=(\[[\s\S]*?\])$/m)?.[1];
    const sellerJ = raw.match(/^SELLER_SECRET_JSON=(\[[\s\S]*?\])$/m)?.[1];
    const oracleJ = raw.match(/^ORACLE_SECRET_JSON=(\[[\s\S]*?\])$/m)?.[1];
    const minLamports = 10_000_000;
    for (const [label, json] of [
      ["buyer", buyerJ],
      ["seller", sellerJ],
      ["oracle", oracleJ],
    ]) {
      if (!json) continue;
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json)));
      const lamports = await getLamports(rpcUrl, kp.publicKey.toBase58());
      if (lamports < minLamports) {
        console.error(
          `❌ ${label} ${kp.publicKey.toBase58()} on devnet: ${(lamports / 1e9).toFixed(4)} SOL (need ≥ ${minLamports / 1e9} SOL; faucet https://faucet.solana.com )`,
        );
        ok = false;
      } else {
        console.log(`✓ ${label} devnet ${(lamports / 1e9).toFixed(4)} SOL`);
      }
    }
  }
}

const base = process.env.DEMO_ORCHESTRATOR_URL || "http://127.0.0.1:8787";
try {
  const r = await fetch(`${base}/health`);
  const j = await r.json();
  if (!r.ok) throw new Error(String(r.status));
  console.log(`✓ ${base}/health`, j.app || j.status || j);
} catch (e) {
  console.error(`❌ Orchestrator ${base}:`, e.message);
  ok = false;
}

process.exit(ok ? 0 : 1);
