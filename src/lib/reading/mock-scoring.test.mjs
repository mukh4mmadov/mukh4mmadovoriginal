import test from "node:test";
import assert from "node:assert/strict";
import { getMockBand } from "./mock-scoring.mjs";

test("does not estimate a band for empty or unsupported scores", () => {
  assert.equal(getMockBand(0), null);
  assert.equal(getMockBand(1), null);
  assert.equal(getMockBand(10), null);
  assert.equal(getMockBand(-1), null);
  assert.equal(getMockBand(41), null);
  assert.equal(getMockBand(1.5), null);
});

test("uses the published Academic Reading average score thresholds", () => {
  const boundaries = [
    [11, 4], [13, 4.5], [16, 5], [18, 5.5], [23, 6],
    [26, 6.5], [30, 7], [32, 7.5], [35, 8], [37, 8.5], [39, 9], [40, 9],
  ];
  for (const [rawScore, expectedBand] of boundaries) {
    assert.equal(getMockBand(rawScore), expectedBand, `raw score ${rawScore}`);
  }
});

test("keeps the lower edge of each band range in the band above it", () => {
  const boundaries = [[13, 4], [16, 4.5], [18, 5], [23, 5.5], [26, 6], [30, 6.5], [32, 7], [35, 7.5], [37, 8], [39, 8.5]];
  for (const [rawScore, precedingBand] of boundaries) {
    assert.equal(getMockBand(rawScore - 1), precedingBand, `raw score ${rawScore - 1}`);
  }
});
