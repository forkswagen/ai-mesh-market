import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, judgeDatasetContent } from "./datasetJudge";

describe("datasetJudge", () => {
  it("rejects tiny content", () => {
    const r = judgeDatasetContent("x", { ...DEFAULT_RULES, minBytes: 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.some((x) => x.includes("min"))).toBe(true);
  });

  it("accepts valid JSONL with required keys", () => {
    const lines = Array.from({ length: 20 }, (_, i) =>
      JSON.stringify({ text: `row ${i}`, label: i % 2 }),
    );
    const content = lines.join("\n");
    const r = judgeDatasetContent(content, DEFAULT_RULES);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.details.some((d) => d.startsWith("lines:"))).toBe(true);
  });

  it("rejects when too many lines are invalid JSON", () => {
    const bad = Array.from({ length: 40 }, () => "not json").join("\n");
    const r = judgeDatasetContent(bad, { ...DEFAULT_RULES, maxInvalidLineRatio: 0.2, sampleLines: 20 });
    expect(r.ok).toBe(false);
  });
});
