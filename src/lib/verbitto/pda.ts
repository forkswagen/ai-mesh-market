import { PublicKey } from "@solana/web3.js";

/**
 * Сиды PDA — ориентир по типичным Anchor-паттернам; перед mainnet сверь с официальным IDL Verbitto.
 */
export function verbittoPlatformPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("platform")], programId);
}

export function verbittoTaskPda(programId: PublicKey, creator: PublicKey, taskIndex: bigint | number): [PublicKey, number] {
  const idx = Buffer.alloc(8);
  idx.writeBigUInt64LE(typeof taskIndex === "bigint" ? taskIndex : BigInt(taskIndex));
  return PublicKey.findProgramAddressSync([Buffer.from("task"), creator.toBuffer(), idx], programId);
}

export function verbittoEscrowPda(programId: PublicKey, task: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("escrow"), task.toBuffer()], programId);
}

export function verbittoAgentProfilePda(programId: PublicKey, agent: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("agent"), agent.toBuffer()], programId);
}
