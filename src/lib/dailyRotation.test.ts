import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDailyContent,
  getDailyContentNoCache,
  getRandomContentExcluding,
  getRandomIndexExcluding,
} from "./dailyRotation";

describe("getDailyContentNoCache", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("returns an index within bounds and the matching content", () => {
    const result = getDailyContentNoCache(items, "2024-01-15");
    expect(result.index).toBeGreaterThanOrEqual(0);
    expect(result.index).toBeLessThan(items.length);
    expect(result.content).toBe(items[result.index]);
    expect(result.date).toBe("2024-01-15");
  });

  it("is deterministic: the same date always yields the same index", () => {
    const a = getDailyContentNoCache(items, "2024-03-01");
    const b = getDailyContentNoCache(items, "2024-03-01");
    expect(a.index).toBe(b.index);
  });

  it("generally produces different indices for different dates", () => {
    const dates = ["2024-01-01", "2024-06-15", "2024-12-31", "2025-02-20"];
    const indices = dates.map((d) => getDailyContentNoCache(items, d).index);
    // Not all four dates should collapse to the same index.
    expect(new Set(indices).size).toBeGreaterThan(1);
  });
});

describe("getRandomIndexExcluding", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns 0 for arrays of length 0 or 1", () => {
    expect(getRandomIndexExcluding(0)).toBe(0);
    expect(getRandomIndexExcluding(1)).toBe(0);
    expect(getRandomIndexExcluding(1, 0)).toBe(0);
  });

  it("uses Math.random directly when no exclusion is given", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(getRandomIndexExcluding(4)).toBe(2);
  });

  it("never returns the excluded index", () => {
    // First draw hits the excluded index, second draw avoids it.
    const seq = [0.0, 0.75];
    let call = 0;
    vi.spyOn(Math, "random").mockImplementation(() => seq[call++]);
    expect(getRandomIndexExcluding(4, 0)).toBe(3);
  });

  it("stays within bounds across many random draws", () => {
    for (let i = 0; i < 100; i++) {
      const idx = getRandomIndexExcluding(5, 2);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5);
      expect(idx).not.toBe(2);
    }
  });
});

describe("getRandomContentExcluding", () => {
  it("returns content matching the chosen index", () => {
    const items = ["x", "y", "z"];
    const result = getRandomContentExcluding(items, 1);
    expect(result.index).not.toBe(1);
    expect(result.content).toBe(items[result.index]);
  });
});

describe("getDailyContent", () => {
  const items = ["a", "b", "c", "d"];
  const KEY = "test-daily-key";

  const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 4, 20, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("selects content for today and caches it under the given key", () => {
    const result = getDailyContent(items, KEY);
    expect(result.date).toBe(isoDate(new Date(2024, 4, 20)));
    expect(result.content).toBe(items[result.index]);

    const cached = JSON.parse(localStorage.getItem(KEY) as string);
    expect(cached).toEqual(result);
  });

  it("returns the cached value on subsequent calls the same day", () => {
    const first = getDailyContent(items, KEY);
    // Tamper with the cache to prove the cached copy is returned verbatim.
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...first, content: "SENTINEL" }),
    );
    const second = getDailyContent(items, KEY);
    expect(second.content).toBe("SENTINEL");
  });

  it("recomputes when the cached entry is from a previous day", () => {
    getDailyContent(items, KEY);
    // Advance to the next day; stale cache should be ignored.
    vi.setSystemTime(new Date(2024, 4, 21, 12, 0, 0));
    const next = getDailyContent(items, KEY);
    expect(next.date).toBe(isoDate(new Date(2024, 4, 21)));
  });
});
