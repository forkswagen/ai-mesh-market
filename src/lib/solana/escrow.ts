/**
 * Client helpers for the NexusAI Solana escrow program (`data_arbiter`).
 * IDL: `anchor build` → `target/idl/data_arbiter.json`.
 */
import { PublicKey } from "@solana/web3.js";

export const AI_JUDGE_MAX_REASON_BYTES = 256;

/** On-chain `NO_JUDGE_AUTHORITY` when init passes no arbiter */
export const NO_JUDGE_AUTHORITY = new PublicKey(Buffer.alloc(32, 0));

export const DATA_ARBITER_PROGRAM_ID = new PublicKey(
  "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg",
);

export function escrowPda(
  buyer: PublicKey,
  seller: PublicKey,
  dealId: bigint,
  programId: PublicKey = DATA_ARBITER_PROGRAM_ID,
): [PublicKey, number] {
  const dealIdBuf = Buffer.allocUnsafe(8);
  dealIdBuf.writeBigUInt64LE(dealId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), dealIdBuf],
    programId,
  );
}

export const EscrowState = {
  AwaitingDeposit: 0,
  Funded: 1,
  Submitted: 2,
  Released: 3,
  Refunded: 4,
} as const;
