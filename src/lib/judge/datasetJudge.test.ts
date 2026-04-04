import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, judgeDatasetContent } from "./datasetJudge";

describe("datasetJudge", () => {
  it("rejects tiny content", () => {
    const r = judgeDatasetContent("x", { ...DEFAULT_RULES, minBytes: 100 });
    expect(r.verdict).toBe(false);
  });

  it("accepts valid JSONL sample", () => {
    const lines = Array.from({ length: 5 }, (_, i) =>
      JSON.stringify({ text: `s${i}`, label: i % 2 }),
    );
    const content = lines.join("\n");
    const r = judgeDatasetContent(content, DEFAULT_RULES);
    expect(r.verdict).toBe(true);
  });

  it("rejects too many bad JSON lines", () => {
    const bad = Array.from({ length: 20 }, () => "not json {{{").join("\n");
    const r = judgeDatasetContent(bad, { ...DEFAULT_RULES, maxInvalidLineRatio: 0.2, sampleLines: 20 });
    expect(r.verdict).toBe(false);
  });
});
