/**
 * Minimal off-chain checks (aligned with src/lib/judge/datasetJudge.ts spirit).
 */
export function heuristicJudge(deliverableText) {
  const raw = deliverableText || "";
  const bytes = Buffer.byteLength(raw, "utf8");
  if (bytes < 64) {
    return { verdict: false, reason: `Too small: ${bytes} bytes (min 64)` };
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 3) {
    return { verdict: false, reason: `Too few lines: ${lines.length}` };
  }
  const sample = lines.slice(0, 40);
  let bad = 0;
  for (const line of sample) {
    try {
      JSON.parse(line.trim());
    } catch {
      bad += 1;
    }
  }
  const ratio = bad / sample.length;
  if (ratio > 0.35) {
    return { verdict: false, reason: `Invalid JSONL ratio ${ratio.toFixed(2)}` };
  }
  return { verdict: true, reason: "Heuristic checks passed (JSONL sample ok)" };
}
