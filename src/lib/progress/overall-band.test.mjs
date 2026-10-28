import test from "node:test";
import assert from "node:assert/strict";
import { estimateOverallBand, latestBand, roundOverallBand } from "./overall-band.mjs";

test("rounds the average the IELTS way", () => {
  assert.equal(roundOverallBand(6.25), 6.5);
  assert.equal(roundOverallBand(6.75), 7);
  assert.equal(roundOverallBand(6.125), 6);
  assert.equal(roundOverallBand(6 + 1 / 3), 6.5);
  assert.equal(roundOverallBand(6 + 1 / 6), 6);
});

test("uses the most recent valid band", () => {
  const entries = [
    { band: 6, completedAt: "2026-10-01T00:00:00Z" },
    { band: 7, completedAt: "2026-10-05T00:00:00Z" },
    { band: null, completedAt: "2026-10-09T00:00:00Z" },
  ];
  assert.deepEqual(latestBand(entries, (entry) => entry.band, (entry) => entry.completedAt), { band: 7, at: Date.parse("2026-10-05T00:00:00Z") });
  assert.equal(latestBand([], (entry) => entry.band, (entry) => entry.at), null);
});

test("estimates from two or more skills and finds the weakest", () => {
  const result = estimateOverallBand({ reading: { band: 7, at: 1 }, listening: { band: 6.5, at: 1 }, writing: { band: 5.5, at: 1 } });
  assert.equal(result.overall, 6.5);
  assert.equal(result.weakest.id, "writing");
  assert.deepEqual(result.missing, []);
});

test("needs at least two skills", () => {
  const result = estimateOverallBand({ reading: { band: 7, at: 1 } });
  assert.equal(result.overall, null);
  assert.equal(result.weakest, null);
  assert.deepEqual(result.missing.map((skill) => skill.id), ["listening", "writing"]);
});
