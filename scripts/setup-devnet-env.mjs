#!/usr/bin/env node
/**
 * Генерирует server/.env с тремя devnet keypair и запрашивает airdrop.
 * Запуск из корня: node scripts/setup-devnet-env.mjs
 * Перезаписать существующий: node scripts/setup-devnet-env.mjs --force
 */
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, "..", "server");
const envPath = resolve(serverDir, ".env");

const force = process.argv.includes("--force");
if (existsSync(envPath) && !force) {
  console.error(`Уже есть ${envPath}. Для пересоздания: node scripts/setup-devnet-env.mjs --force`);
  process.exit(1);
}

const RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg";

function line(name, kp) {
  return `${name}=${JSON.stringify(Array.from(kp.secretKey))}`;
}

const buyer = Keypair.generate();
const seller = Keypair.generate();
const oracle = Keypair.generate();

const conn = new Connection(RPC, "confirmed");

async function airdrop(label, kp) {
  const lamports = 2 * LAMPORTS_PER_SOL;
  const sig = await conn.requestAirdrop(kp.publicKey, lamports);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  console.log(`✓ airdrop 2 SOL ${label}: ${kp.publicKey.toBase58()}`);
}

console.log("Запрос airdrop на devnet (может занять 10–20 с)…");
for (const [label, kp] of [
  ["buyer", buyer],
  ["seller", seller],
  ["oracle", oracle],
]) {
  try {
    await airdrop(label, kp);
  } catch (e) {
    console.warn(`⚠ airdrop ${label} не удался: ${e.message}`);
    console.warn("  Пополни вручную: solana airdrop 2 <PUBKEY> --url devnet");
    console.warn(`  ${label} pubkey: ${kp.publicKey.toBase58()}`);
  }
}

const env = `# Сгенерировано scripts/setup-devnet-env.mjs — только для локального devnet demo
SOLANA_RPC_URL=${RPC}
PROGRAM_ID=${PROGRAM_ID}
${line("BUYER_SECRET_JSON", buyer)}
${line("SELLER_SECRET_JSON", seller)}
${line("ORACLE_SECRET_JSON", oracle)}

# LM Studio (раскомментируй для LLM-oracle на записи демо)
# ORACLE_LLM_URL=http://127.0.0.1:1234/v1/chat/completions
# ORACLE_LLM_MODEL=

PORT=8787
VITE_DEV_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
`;

writeFileSync(envPath, env, { mode: 0o600 });
console.log(`\n✓ Записан ${envPath}`);
console.log("Перезапусти стек: npm run dev из корня (или только API: npm run server:dev)");
