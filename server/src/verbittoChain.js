/**
 * Опционально: список аккаунтов программы с дискриминатором Anchor account:Task.
 * Задайте VERBITTO_PROGRAM_ID и при необходимости VERBITTO_TASK_DISCRIMINATOR_HEX (16 hex).
 */
import { Connection, PublicKey } from "@solana/web3.js";

/** Первые 8 байт sha256("account:Task") — сверьте с IDL Verbitto. */
const DEFAULT_TASK_DISC = Buffer.from([0x4f, 0x22, 0xe5, 0x37, 0x58, 0x5a, 0x37, 0x54]);

export async function fetchVerbittoTaskPubkeysOnChain() {
  const pid = process.env.VERBITTO_PROGRAM_ID?.trim();
  if (!pid) return { programId: null, items: [] };

  let disc = DEFAULT_TASK_DISC;
  const hex = process.env.VERBITTO_TASK_DISCRIMINATOR_HEX?.trim();
  if (hex && /^[0-9a-fA-F]{16}$/.test(hex)) {
    disc = Buffer.from(hex, "hex");
  }

  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const programId = new PublicKey(pid);

  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset: 0,
          encoding: "base64",
          bytes: disc.toString("base64"),
        },
      },
    ],
  });

  return {
    programId: pid,
    rpc,
    items: accounts.map(({ pubkey, account }) => ({
      pubkey: pubkey.toBase58(),
      lamports: account.lamports,
      dataLength: account.data.length,
    })),
  };
}
