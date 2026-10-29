// Settings and navigation helpers shared by the exam-style test screens
// (computer-delivered IELTS look): text size, colour scheme, flags.

export const EXAM_SETTINGS_KEY = "ielts-exam-settings-v1";

export const TEXT_SIZES = [
  { id: "standard", label: "Standard" },
  { id: "large", label: "Large" },
  { id: "xlarge", label: "Extra large" },
];

// The colour options the real computer-delivered test offers.
export const COLOUR_SCHEMES = [
  { id: "standard", label: "Black on white", dark: false },
  { id: "inverse", label: "White on black", dark: true },
  { id: "yellow", label: "Yellow on black", dark: true },
];

export const DEFAULT_EXAM_SETTINGS = Object.freeze({
  textSize: "standard",
  scheme: "standard",
  hideTimer: false,
  timerWarnings: true,
});

export function normalizeExamSettings(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    textSize: TEXT_SIZES.some((size) => size.id === input.textSize) ? input.textSize : DEFAULT_EXAM_SETTINGS.textSize,
    scheme: COLOUR_SCHEMES.some((scheme) => scheme.id === input.scheme) ? input.scheme : DEFAULT_EXAM_SETTINGS.scheme,
    hideTimer: typeof input.hideTimer === "boolean" ? input.hideTimer : DEFAULT_EXAM_SETTINGS.hideTimer,
    timerWarnings: typeof input.timerWarnings === "boolean" ? input.timerWarnings : DEFAULT_EXAM_SETTINGS.timerWarnings,
  };
}

export function readExamSettings(storage) {
  try {
    return normalizeExamSettings(JSON.parse(storage?.getItem(EXAM_SETTINGS_KEY) || "null"));
  } catch {
    return { ...DEFAULT_EXAM_SETTINGS };
  }
}

export function writeExamSettings(storage, settings) {
  try {
    storage.setItem(EXAM_SETTINGS_KEY, JSON.stringify(normalizeExamSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

export const isDarkScheme = (schemeId) => Boolean(COLOUR_SCHEMES.find((scheme) => scheme.id === schemeId)?.dark);

// "23 minutes left" the way the exam shows it; seconds only in the last minute.
export function formatTimeLeft(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  if (safe >= 60) {
    const minutes = Math.ceil(safe / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} left`;
  }
  return `${safe} ${safe === 1 ? "second" : "seconds"} left`;
}

export function toggleFlag(flags, number) {
  const next = new Set(flags);
  if (next.has(number)) next.delete(number);
  else next.add(number);
  return [...next].sort((a, b) => a - b);
}

export const clampQuestion = (number, total) => Math.min(Math.max(1, Number(number) || 1), Math.max(1, total));

// Minutes-left marks at which a warning is shown (once each).
export function dueTimerWarning(secondsLeft, alreadyShown = []) {
  for (const minutes of [10, 5]) {
    if (secondsLeft <= minutes * 60 && secondsLeft > (minutes - 1) * 60 && !alreadyShown.includes(minutes)) return minutes;
  }
  return null;
}
