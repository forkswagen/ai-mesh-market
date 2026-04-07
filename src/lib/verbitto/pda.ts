import { PublicKey } from "@solana/web3.js";

function u64Le(n: bigint): Uint8Array {
  const arr = new Uint8Array(8);
  new DataView(arr.buffer).setBigUint64(0, n, true);
  return arr;
}

function seedUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Деривинг PDA по сидам, принятым в типичном Anchor-проекте.
 * Публичного IDL Verbitto в репозитории нет — перед mainnet сверьте сиды с официальным IDL.
 */
export function verbittoPlatformPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([seedUtf8("platform")], programId);
}

export function verbittoTaskPda(
  programId: PublicKey,
  creator: PublicKey,
  taskId: bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [seedUtf8("task"), creator.toBytes(), u64Le(taskId)],
    programId,
  );
}

export function verbittoEscrowPda(programId: PublicKey, task: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([seedUtf8("escrow"), task.toBytes()], programId);
}

export function verbittoAgentProfilePda(programId: PublicKey, agent: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([seedUtf8("agent_profile"), agent.toBytes()], programId);
}
