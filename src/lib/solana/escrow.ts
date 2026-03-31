/**
 * Client helpers for the DataArbiter Anchor program.
 * Program ID must match deployed `programs/data_arbiter` (update after deploy).
 *
 * IDL: `anchor build` → `target/idl/data_arbiter.json`.
 * `initialize_escrow` args end with `judge_authority: Option<Pubkey>` — `None` = only permissionless `ai_judge` settles; `Some(pk)` enables manual `release_to_seller` / `refund_buyer` for that key.
 * `ai_judge` accounts: `escrow`, `signer` (any), `seller`, `buyer`.
 */
import { PublicKey } from "@solana/web3.js";

/** Mirror `MAX_REASON_LEN` in programs/data_arbiter/src/lib.rs */
export const AI_JUDGE_MAX_REASON_BYTES = 256;

/** 32 zero bytes — on-chain `NO_JUDGE_AUTHORITY` when init passes no arbiter */
export const NO_JUDGE_AUTHORITY = new PublicKey(Buffer.alloc(32, 0));

/** Placeholder — run `anchor keys list` after deploy and paste here + in Anchor.toml + declare_id! */
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

/** On-chain escrow states — mirror programs/data_arbiter/src/lib.rs */
export const EscrowState = {
  AwaitingDeposit: 0,
  Funded: 1,
  Submitted: 2,
  Released: 3,
  Refunded: 4,
} as const;
