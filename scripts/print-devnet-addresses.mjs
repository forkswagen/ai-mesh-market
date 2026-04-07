#!/usr/bin/env node
/** Prints public keys from server/.env for manual faucet funding. */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "server", ".env");
if (!existsSync(envPath)) {
  console.error("No server/.env — run: npm run setup:devnet");
  process.exit(1);
}
const env = readFileSync(envPath, "utf8");
function kp(name) {
  const m = env.match(new RegExp(`^${name}=(\\[.+\\])$`, "m"));
  if (!m) throw new Error(`Missing ${name} in server/.env`);
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(m[1])));
}
for (const name of ["BUYER_SECRET_JSON", "SELLER_SECRET_JSON", "ORACLE_SECRET_JSON"]) {
  const label = name.replace("_SECRET_JSON", "").toLowerCase();
  const pub = kp(name).publicKey.toBase58();
  console.log(`${label}\t${pub}`);
}
console.log(`
Manual faucet (if RPC airdrop returns 429):
  https://faucet.solana.com  — select devnet, paste each address, ~1–2 SOL.
Or CLI:
  solana airdrop 2 <PUBKEY> --url devnet
`);
