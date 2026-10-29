// Parsing and scoring for AI Writing feedback. The model's JSON is treated as
// untrusted: every field is validated and the overall band is computed here.

export const CRITERIA_KEYS = ["task", "coherence", "lexical", "grammar"];

const clampText = (value, limit) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);

export function roundToHalfBand(value) {
  return Math.round(Math.min(9, Math.max(0, Number(value))) * 2) / 2;
}

// IELTS averages the four criteria and rounds to the nearest half band, with
// .25 rounding up to .5 and .75 rounding up to the next whole band.
export function overallWritingBand(bands) {
  const values = CRITERIA_KEYS.map((key) => Number(bands?.[key]));
  if (values.some((value) => !Number.isFinite(value))) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(9, Math.floor(average * 2 + 0.5 + 1e-9) / 2);
}

function extractJson(raw) {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

const list = (value, maxItems, limit) => (Array.isArray(value) ? value : [])
  .map((item) => clampText(item, limit))
  .filter(Boolean)
  .slice(0, maxItems);

const FREE_LIMITS = { comment: 700, summary: 600, strengths: 4, improvements: 5, corrections: 5 };
const PREMIUM_LIMITS = { comment: 1600, summary: 1000, strengths: 5, improvements: 6, corrections: 40 };

export function parseWritingFeedback(raw, limits = FREE_LIMITS) {
  const data = extractJson(raw);
  if (!data || typeof data !== "object") return null;

  const bands = {};
  const comments = {};
  for (const key of CRITERIA_KEYS) {
    const criterion = data.criteria?.[key];
    const band = Number(criterion?.band);
    if (!Number.isFinite(band) || band < 0 || band > 9) return null;
    bands[key] = roundToHalfBand(band);
    comments[key] = clampText(criterion?.comment, limits.comment);
  }

  const corrections = (Array.isArray(data.corrections) ? data.corrections : [])
    .map((item) => ({
      original: clampText(item?.original, 300),
      improved: clampText(item?.improved, 300),
      reason: clampText(item?.reason, 200),
    }))
    .filter((item) => item.original && item.improved)
    .slice(0, limits.corrections);

  return {
    bands,
    comments,
    overall: overallWritingBand(bands),
    summary: clampText(data.summary, limits.summary),
    strengths: list(data.strengths, limits.strengths, 300),
    improvements: list(data.improvements, limits.improvements, 300),
    corrections,
  };
}

// AI Premium feedback: the free fields with more room, plus a Band 8+
// rewrite of the response and a short study plan. The rewrite keeps its
// paragraph breaks.
export function parsePremiumFeedback(raw) {
  const base = parseWritingFeedback(raw, PREMIUM_LIMITS);
  if (!base) return null;
  const data = extractJson(raw);
  const rewrite = String(data.rewrite ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 5000);
  return {
    ...base,
    premium: true,
    rewrite,
    studyPlan: list(data.studyPlan, 3, 400),
  };
}

// Overall Writing band from both tasks: Task 2 counts twice as much as
// Task 1, rounded to the nearest half band (practice estimate).
export function combinedWritingBand(task1Band, task2Band) {
  if (task1Band == null || task2Band == null) return null;
  const first = Number(task1Band);
  const second = Number(task2Band);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return Math.min(9, Math.floor(((first + 2 * second) / 3) * 2 + 0.5 + 1e-9) / 2);
}

// One Task 1 and one Task 2 for a full Writing test.
export function pickWritingTestPair(tasks, random = Math.random) {
  const pick = (list) => list[Math.floor(random() * list.length)] || null;
  const first = pick(tasks.filter((task) => task.task === 1));
  const second = pick(tasks.filter((task) => task.task === 2));
  return first && second ? [first, second] : null;
}
