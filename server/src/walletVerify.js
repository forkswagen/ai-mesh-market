/**
 * Verify Phantom / Solana wallet signature (ed25519, UTF-8 message, Base64 signature, 64 bytes).
 */
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

/** DER SPKI prefix for raw 32-byte Ed25519 public key (Node verify compatible). */
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
