/**
 * Off-chain dataset checks before an LLM / agent calls `ai_judge`.
 * Wire your model to produce { verdict, reason } then submit the on-chain tx.
 */

export type JudgeRuleSet = {
  minBytes: number;
  maxBytes: number;
  minLines: number;
  maxInvalidLineRatio: number;
  sampleLines: number;
  requireJsonKeys?: string[];
};

export const DEFAULT_RULES: JudgeRuleSet = {
  minBytes: 64,
  maxBytes: 50 * 1024 * 1024,
  minLines: 3,
  maxInvalidLineRatio: 0.35,
  sampleLines: 40,
  requireJsonKeys: ["text", "label"],
};

export type JudgeResult = { verdict: boolean; reason: string };

function countNonEmptyLines(s: string): number {
  return s.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
}

function invalidJsonlRatio(sample: string[]): number {
  if (sample.length === 0) return 1;
  let bad = 0;
  for (const line of sample) {
    const t = line.trim();
    if (!t) continue;
    try {
      JSON.parse(t);
    } catch {
      bad += 1;
    }
  }
  return bad / sample.length;
}

export function judgeDatasetContent(raw: string, rules: JudgeRuleSet = DEFAULT_RULES): JudgeResult {
  const bytes = new TextEncoder().encode(raw).length;
  if (bytes < rules.minBytes) {
    return { verdict: false, reason: `Too small: ${bytes} bytes (min ${rules.minBytes})` };
  }
  if (bytes > rules.maxBytes) {
    return { verdict: false, reason: `Too large: ${bytes} bytes (max ${rules.maxBytes})` };
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < rules.minLines) {
    return { verdict: false, reason: `Too few lines: ${lines.length} (min ${rules.minLines})` };
  }
  const sample = lines.slice(0, rules.sampleLines);
  const ratio = invalidJsonlRatio(sample);
  if (ratio > rules.maxInvalidLineRatio) {
    return {
      verdict: false,
      reason: `Invalid JSONL ratio ${ratio.toFixed(2)} (max ${rules.maxInvalidLineRatio})`,
    };
  }
  if (rules.requireJsonKeys?.length) {
    for (const line of sample.slice(0, 10)) {
      try {
        const o = JSON.parse(line) as Record<string, unknown>;
        for (const k of rules.requireJsonKeys) {
          if (!(k in o)) {
            return { verdict: false, reason: `Missing JSON key "${k}"` };
          }
        }
      } catch {
        /* handled by ratio */
      }
    }
  }
  return { verdict: true, reason: "Heuristic checks passed" };
}

export async function sha256HexUtf8(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes32(hex: string): number[] {
  const h = hex.replace(/^0x/i, "");
  if (h.length !== 64) throw new Error("expected 64 hex chars");
  const out: number[] = [];
  for (let i = 0; i < 64; i += 2) {
    out.push(parseInt(h.slice(i, i + 2), 16));
  }
  return out;
}
