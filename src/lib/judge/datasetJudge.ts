/**
 * DataArbiter AI Judge — measurable checks for hackathon demo.
 * Runs off-chain; on success the arbiter key signs Solana `release_to_seller`.
 */

export type JudgeRuleSet = {
  /** Minimum uncompressed JSONL / CSV size (bytes) */
  minBytes: number;
  /** Maximum file size to scan (bytes) */
  maxBytes: number;
  /** Required top-level keys if JSON Lines (first line parsed) */
  requiredJsonKeys?: string[];
  /** Max share of invalid lines in sample (0–1) */
  maxInvalidLineRatio: number;
  /** Number of lines to sample from start/middle/end */
  sampleLines: number;
};

export const DEFAULT_RULES: JudgeRuleSet = {
  minBytes: 64,
  maxBytes: 50 * 1024 * 1024,
  requiredJsonKeys: ["text", "label"],
  maxInvalidLineRatio: 0.1,
  sampleLines: 50,
};

export type JudgeResult =
  | { ok: true; score: number; details: string[] }
  | { ok: false; score: number; reasons: string[] };

function sampleIndices(totalLines: number, sampleCount: number): number[] {
  if (totalLines <= 0) return [];
  const n = Math.min(sampleCount, totalLines);
  if (totalLines <= n) return Array.from({ length: totalLines }, (_, i) => i);
  const out = new Set<number>();
  const push = (i: number) => {
    out.add(Math.max(0, Math.min(totalLines - 1, i)));
  };
  for (let k = 0; k < n; k++) push(Math.floor((k / Math.max(n - 1, 1)) * (totalLines - 1)));
  return [...out].sort((a, b) => a - b);
}

/**
 * Validates a UTF-8 dataset blob (e.g. JSON Lines). Pure function for tests and worker.
 */
export function judgeDatasetContent(
  utf8Text: string,
  rules: JudgeRuleSet = DEFAULT_RULES,
): JudgeResult {
  const details: string[] = [];
  const reasons: string[] = [];

  const bytes = new TextEncoder().encode(utf8Text).length;
  if (bytes < rules.minBytes) reasons.push(`size ${bytes} < min ${rules.minBytes}`);
  if (bytes > rules.maxBytes) reasons.push(`size ${bytes} > max ${rules.maxBytes}`);
  if (reasons.length) return { ok: false, score: 0, reasons };

  details.push(`size_ok:${bytes}b`);

  const lines = utf8Text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { ok: false, score: 0, reasons: ["empty after strip"] };
  }
  details.push(`lines:${lines.length}`);

  const idxs = sampleIndices(lines.length, rules.sampleLines);
  let invalid = 0;
  const keys = rules.requiredJsonKeys;

  for (const i of idxs) {
    const line = lines[i];
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      if (keys?.length) {
        const missing = keys.filter((k) => !(k in obj));
        if (missing.length) invalid++;
      }
    } catch {
      invalid++;
    }
  }

  const ratio = invalid / idxs.length;
  if (ratio > rules.maxInvalidLineRatio) {
    reasons.push(
      `invalid_sample_ratio ${(ratio * 100).toFixed(1)}% > ${(rules.maxInvalidLineRatio * 100).toFixed(0)}%`,
    );
    return { ok: false, score: Math.max(0, 1 - ratio), reasons };
  }

  details.push(`sampled:${idxs.length} invalid:${invalid}`);
  const score = 1 - ratio * 0.5;
  return { ok: true, score, details };
}

/**
 * Content hash to submit on-chain (SHA-256 hex). Browser / Node compatible via subtle crypto in app layer if needed.
 */
export async function sha256HexUtf8(utf8Text: string): Promise<string> {
  const buf = new TextEncoder().encode(utf8Text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 32-byte commitment from hex string (for `expected_hash` / `submit_dataset_hash`). */
export function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  if (clean.length !== 64) throw new Error("expected 64 hex chars");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
