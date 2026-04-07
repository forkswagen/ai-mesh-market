#!/usr/bin/env node
/** Печатает публичные ключи из server/.env для ручного пополнения faucet. */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "server", ".env");
if (!existsSync(envPath)) {
  console.error("Нет server/.env — сначала: npm run setup:devnet");
  process.exit(1);
}
const env = readFileSync(envPath, "utf8");
function kp(name) {
  const m = env.match(new RegExp(`^${name}=(\\[.+\\])$`, "m"));
  if (!m) throw new Error(`Нет ${name} в server/.env`);
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(m[1])));
}
for (const name of ["BUYER_SECRET_JSON", "SELLER_SECRET_JSON", "ORACLE_SECRET_JSON"]) {
  const label = name.replace("_SECRET_JSON", "").toLowerCase();
  const pub = kp(name).publicKey.toBase58();
  console.log(`${label}\t${pub}`);
}
console.log(`
Ручной faucet (если RPC airdrop даёт 429):
  https://faucet.solana.com  — выбери devnet, вставь каждый адрес, ~1–2 SOL.
Или CLI:
  solana airdrop 2 <PUBKEY> --url devnet
`);
