/**
 * Проверка подписи Phantom / Solana wallet (ed25519, UTF-8 сообщение, подпись Base64, 64 байта).
 */
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

/** DER SPKI prefix для сырого 32-byte Ed25519 public key (совместимо с Node verify). */
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * @param {string} walletBase58
 * @param {string} messageUtf8
 * @param {string} signatureBase64
 */
export function verifySolanaMessageSignature(walletBase58, messageUtf8, signatureBase64) {
  try {
    const pkBytes = new PublicKey(walletBase58).toBytes();
    const msg = Buffer.from(messageUtf8, "utf8");
    const sig = Buffer.from(String(signatureBase64 || ""), "base64");
    if (sig.length !== 64) return false;
    const spki = Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(pkBytes)]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    return cryptoVerify(null, msg, key, sig);
  } catch {
    return false;
  }
}
