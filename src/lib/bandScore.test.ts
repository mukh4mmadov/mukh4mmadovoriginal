import { describe, expect, it } from "vitest";
import { scoreToBand } from "./bandScore";

describe("scoreToBand", () => {
  it("returns band 9 for a perfect or near-perfect score", () => {
    expect(scoreToBand(40, 40)).toBe(9);
    expect(scoreToBand(39, 40)).toBe(9); // 0.975 >= 0.97
  });

  it("maps each documented percentage threshold to its band", () => {
    const cases: Array<[number, number, number]> = [
      [36, 40, 8.5], // 0.90
      [33, 40, 8], //   0.825
      [30, 40, 7.5], // 0.75
      [27, 40, 7], //   0.675
      [24, 40, 6.5], // 0.60
      [20, 40, 6], //   0.50
      [17, 40, 5.5], // 0.425
      [14, 40, 5], //   0.35
      [11, 40, 4.5], // 0.275
      [8, 40, 4], //    0.20
    ];
    for (const [correct, total, band] of cases) {
      expect(scoreToBand(correct, total)).toBe(band);
    }
  });

  it("returns the floor band 3.5 for very low scores", () => {
    expect(scoreToBand(0, 40)).toBe(3.5);
    expect(scoreToBand(7, 40)).toBe(3.5); // 0.175 < 0.18
  });

  it("returns a value on the exact boundary as the higher band", () => {
    // 0.5 exactly should be band 6, not 5.5
    expect(scoreToBand(5, 10)).toBe(6);
    // 0.67 exactly should be band 7
    expect(scoreToBand(67, 100)).toBe(7);
  });

  it("works with arbitrary totals, not just 40", () => {
    expect(scoreToBand(10, 10)).toBe(9);
    expect(scoreToBand(5, 10)).toBe(6);
    expect(scoreToBand(1, 10)).toBe(3.5);
  });
});
