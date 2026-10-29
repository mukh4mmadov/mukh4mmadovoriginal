import test from "node:test";
import assert from "node:assert/strict";
import {
  clampQuestion,
  dueTimerWarning,
  formatTimeLeft,
  isDarkScheme,
  normalizeExamSettings,
  readExamSettings,
  toggleFlag,
  writeExamSettings,
} from "./exam-settings.mjs";

const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test("normalizes unknown or missing settings to the exam defaults", () => {
  assert.deepEqual(normalizeExamSettings({ textSize: "huge", scheme: "pink", hideTimer: "yes" }), {
    textSize: "standard", scheme: "standard", hideTimer: false, timerWarnings: true,
  });
  assert.deepEqual(normalizeExamSettings({ textSize: "xlarge", scheme: "yellow", hideTimer: true, timerWarnings: false }), {
    textSize: "xlarge", scheme: "yellow", hideTimer: true, timerWarnings: false,
  });
});

test("saves and reads settings, surviving broken storage", () => {
  const storage = memoryStorage();
  writeExamSettings(storage, { textSize: "large", scheme: "inverse" });
  assert.equal(readExamSettings(storage).scheme, "inverse");
  storage.setItem("ielts-exam-settings-v1", "{broken");
  assert.equal(readExamSettings(storage).scheme, "standard");
  assert.equal(readExamSettings(null).textSize, "standard");
});

test("dark schemes are white-on-black and yellow-on-black", () => {
  assert.equal(isDarkScheme("standard"), false);
  assert.equal(isDarkScheme("inverse"), true);
  assert.equal(isDarkScheme("yellow"), true);
});

test("formats time left like the exam", () => {
  assert.equal(formatTimeLeft(3600), "60 minutes left");
  assert.equal(formatTimeLeft(61), "2 minutes left");
  assert.equal(formatTimeLeft(60), "1 minute left");
  assert.equal(formatTimeLeft(42), "42 seconds left");
  assert.equal(formatTimeLeft(-5), "0 seconds left");
});

test("toggles flags and clamps question numbers", () => {
  assert.deepEqual(toggleFlag([3, 1], 2), [1, 2, 3]);
  assert.deepEqual(toggleFlag([1, 2, 3], 2), [1, 3]);
  assert.equal(clampQuestion(0, 40), 1);
  assert.equal(clampQuestion(41, 40), 40);
});

test("warns once at 10 and 5 minutes left", () => {
  assert.equal(dueTimerWarning(600, []), 10);
  assert.equal(dueTimerWarning(590, [10]), null);
  assert.equal(dueTimerWarning(300, [10]), 5);
  assert.equal(dueTimerWarning(1200, []), null);
});
