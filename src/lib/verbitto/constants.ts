import { PublicKey } from "@solana/web3.js";

/** Совпадает с документацией Verbitto (TaskCategory). */
export const VerbittoTaskCategory = {
  DataLabeling: 0,
  LiteratureReview: 1,
  CodeReview: 2,
  Translation: 3,
  Analysis: 4,
  Research: 5,
  Other: 6,
} as const;

export const VERBITTO_TASK_CATEGORY_LABELS: Record<number, string> = {
  0: "Data labeling",
  1: "Literature review",
  2: "Code review",
  3: "Translation",
  4: "Analysis",
  5: "Research",
  6: "Other",
};

/** Биты навыков агента (документация Verbitto). */
export const VerbittoSkillBits = {
  DataLabeling: 1 << 0,
  LiteratureReview: 1 << 1,
  CodeReview: 1 << 2,
  Translation: 1 << 3,
  Analysis: 1 << 4,
  Research: 1 << 5,
  Other: 1 << 6,
} as const;

/**
 * Program ID из `VITE_VERBITTO_PROGRAM_ID`.
 * Цепочные инструкции подписывает кошелёк на клиенте; ID нужен для PDA и (позже) Anchor IDL.
 */
export function getVerbittoProgramId(): PublicKey | null {
  const raw = import.meta.env.VITE_VERBITTO_PROGRAM_ID?.trim();
  if (!raw) return null;
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}
