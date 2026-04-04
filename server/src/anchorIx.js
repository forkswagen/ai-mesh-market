/**
 * Raw Anchor instruction data for data_arbiter (discriminator + borsh args).
 * Discriminators: sha256("global:<name>")[0:8]
 */
import { Buffer } from "node:buffer";

export const PROGRAM_ID_STR = process.env.PROGRAM_ID || "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg";

const IX = {
  initialize_escrow: Buffer.from([0xf3, 0xa0, 0x4d, 0x99, 0x0b, 0x5c, 0x30, 0xd1]),
  deposit: Buffer.from([0xf2, 0x23, 0xc6, 0x89, 0x52, 0xe1, 0xf2, 0xb6]),
  submit_dataset_hash: Buffer.from([0x5c, 0x5b, 0x6b, 0x88, 0x30, 0x91, 0xeb, 0x92]),
  ai_judge: Buffer.from([0x9c, 0xd7, 0x12, 0x82, 0xba, 0x28, 0xd4, 0x81]),
};

function u64LE(n) {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(BigInt(n), 0);
  return b;
}

function hexTo32(hex) {
  const h = hex.replace(/^0x/i, "");
  if (h.length !== 64) throw new Error("expected_hash must be 64 hex chars");
  return Buffer.from(h, "hex");
}

/** @param {import('@solana/web3.js').PublicKey | null} judgeAuthority null = none */
export function encodeInitializeEscrow(dealId, amountLamports, expectedHashHex, judgeAuthority) {
  const expected = hexTo32(expectedHashHex);
  const parts = [IX.initialize_escrow, u64LE(dealId), u64LE(amountLamports), expected];
  if (!judgeAuthority) {
    parts.push(Buffer.from([0]));
  } else {
    parts.push(Buffer.from([1]));
    parts.push(Buffer.from(judgeAuthority.toBytes()));
  }
  return Buffer.concat(parts);
}

export function encodeDeposit() {
  return Buffer.from(IX.deposit);
}

export function encodeSubmitDatasetHash(hash32Hex) {
  const h = hexTo32(hash32Hex);
  return Buffer.concat([IX.submit_dataset_hash, h]);
}

export function encodeAiJudge(dealId, verdict, reason) {
  const u = Buffer.from(reason, "utf8");
  if (u.length > 256) throw new Error("reason max 256 bytes");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(u.length, 0);
  return Buffer.concat([IX.ai_judge, u64LE(dealId), Buffer.from([verdict ? 1 : 0]), len, u]);
}
