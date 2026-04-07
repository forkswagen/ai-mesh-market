import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  encodeInitializeEscrow,
  encodeInitializeEscrowLegacy,
  encodeDeposit,
  encodeSubmitDatasetHash,
  encodeAiJudge,
  PROGRAM_ID_STR,
} from "./anchorIx.js";

function u64Seed(dealId) {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(BigInt(dealId), 0);
  return b;
}

export function deriveEscrowPda(buyer, seller, dealId, programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyer.toBuffer(), seller.toBuffer(), u64Seed(dealId)],
    programId,
  );
}

export function loadKp(secretJson) {
  const raw = JSON.parse(secretJson);
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export async function runFullChain({
  connection,
  buyerKp,
  sellerKp,
  oracleKp,
  dealId,
  amountLamports,
  expectedHashHex,
  submittedHashHex,
  verdict,
  reason,
}) {
  const programId = new PublicKey(PROGRAM_ID_STR);
  const buyer = buyerKp.publicKey;
  const seller = sellerKp.publicKey;
  const [escrowPda] = deriveEscrowPda(buyer, seller, dealId, programId);

  const initKeys = [
    { pubkey: buyer, isSigner: true, isWritable: true },
    { pubkey: seller, isSigner: false, isWritable: false },
    { pubkey: escrowPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  let sigInit;
  try {
    sigInit = await sendTx(connection, buyerKp, [
      new TransactionInstruction({
        programId,
        keys: initKeys,
        data: encodeInitializeEscrow(dealId, amountLamports, expectedHashHex, null),
      }),
    ]);
  } catch (modernErr) {
    try {
      sigInit = await sendTx(connection, buyerKp, [
        new TransactionInstruction({
          programId,
          keys: initKeys,
          data: encodeInitializeEscrowLegacy(dealId, amountLamports, expectedHashHex),
        }),
      ]);
    } catch {
      throw modernErr;
    }
  }

  const sigDep = await sendTx(connection, buyerKp, [
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: seller, isSigner: false, isWritable: false },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeDeposit(),
    }),
  ]);

  const sigSub = await sendTx(connection, sellerKp, [
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: buyer, isSigner: false, isWritable: false },
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
      ],
      data: encodeSubmitDatasetHash(submittedHashHex),
    }),
  ]);

  const sigJudge = await sendTx(connection, oracleKp, [
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: oracleKp.publicKey, isSigner: true, isWritable: true },
        { pubkey: seller, isSigner: false, isWritable: true },
        { pubkey: buyer, isSigner: false, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
      ],
      data: encodeAiJudge(dealId, verdict, reason),
    }),
  ]);

  return { sigInit, sigDep, sigSub, sigJudge, escrowPda: escrowPda.toBase58() };
}

async function sendTx(connection, feePayer, ixs) {
  const tx = new Transaction().add(...ixs);
  const sig = await sendAndConfirmTransaction(connection, tx, [feePayer], {
    commitment: "confirmed",
    maxRetries: 5,
  });
  return sig;
}

export { Connection, Keypair, PublicKey };
