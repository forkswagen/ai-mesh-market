/**
 * Client helpers for the NexusAI Solana escrow program (`data_arbiter`).
 * IDL: `anchor build` → `target/idl/data_arbiter.json`.
 *
 * Avoid Node's `Buffer` here — it is not defined in the browser unless polyfilled,
 * which would crash the whole app on load (blank screen).
 */
import { PublicKey } from "@solana/web3.js";

export const AI_JUDGE_MAX_REASON_BYTES = 256;

function u64LeBytes(n: bigint): Uint8Array {
  const arr = new Uint8Array(8);
  new DataView(arr.buffer).setBigUint64(0, n, true);
  return arr;
}

/** On-chain `NO_JUDGE_AUTHORITY` when init passes no arbiter */
export const NO_JUDGE_AUTHORITY = new PublicKey(new Uint8Array(32));

export const DATA_ARBITER_PROGRAM_ID = new PublicKey(
  "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg",
);

export function escrowPda(
  buyer: PublicKey,
  seller: PublicKey,
  dealId: bigint,
  programId: PublicKey = DATA_ARBITER_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("escrow"), buyer.toBytes(), seller.toBytes(), u64LeBytes(dealId)],
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
