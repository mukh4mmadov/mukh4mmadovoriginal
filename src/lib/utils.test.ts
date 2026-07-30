import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateSM2,
  cn,
  getCEFRColor,
  getCEFRLabel,
  getStoredProgress,
  saveProgress,
} from "./utils";

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    expect(cn("a", "b")).toBe("a b");
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns an empty string when nothing is passed", () => {
    expect(cn()).toBe("");
  });
});

describe("getCEFRColor", () => {
  it("returns the mapped color for a known level", () => {
    expect(getCEFRColor("B2")).toContain("orange");
    expect(getCEFRColor("C2")).toContain("purple");
  });

  it("falls back to the A1 color for an unknown level", () => {
    expect(getCEFRColor("ZZ")).toBe(getCEFRColor("A1"));
  });
});

describe("getCEFRLabel", () => {
  it("returns the human label for a known level", () => {
    expect(getCEFRLabel("A1")).toBe("Beginner");
    expect(getCEFRLabel("C1")).toBe("Advanced");
  });

  it("echoes the input for an unknown level", () => {
    expect(getCEFRLabel("XX")).toBe("XX");
  });
});

describe("calculateSM2", () => {
  it("resets repetitions and interval when quality is below 3", () => {
    const result = calculateSM2(1, 5, 2.5, 20);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("uses a 1-day interval for the first successful repetition", () => {
    const result = calculateSM2(5, 0, 2.5, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("uses a 6-day interval for the second successful repetition", () => {
    const result = calculateSM2(5, 1, 2.5, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("scales interval by the ease factor from the third repetition on", () => {
    const result = calculateSM2(5, 2, 2.5, 6);
    // newEase = 2.5 + 0.1 = 2.6; interval = round(6 * 2.6) = 16
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
    expect(result.interval).toBe(16);
    expect(result.repetitions).toBe(3);
  });

  it("never lets the ease factor drop below 1.3", () => {
    const result = calculateSM2(0, 0, 1.3, 1);
    expect(result.easeFactor).toBe(1.3);
  });
});

describe("localStorage progress helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(getStoredProgress()).toBeNull();
  });

  it("round-trips saved progress data", () => {
    saveProgress({ streak: 3, xp: 120 });
    expect(getStoredProgress()).toEqual({ streak: 3, xp: 120 });
  });

  it("returns null (and does not throw) when stored JSON is corrupt", () => {
    localStorage.setItem("linguaflow-progress", "{not-json");
    expect(getStoredProgress()).toBeNull();
  });
});
