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

export function parseWritingFeedback(raw) {
  const data = extractJson(raw);
  if (!data || typeof data !== "object") return null;

  const bands = {};
  const comments = {};
  for (const key of CRITERIA_KEYS) {
    const criterion = data.criteria?.[key];
    const band = Number(criterion?.band);
    if (!Number.isFinite(band) || band < 0 || band > 9) return null;
    bands[key] = roundToHalfBand(band);
    comments[key] = clampText(criterion?.comment, 700);
  }

  const corrections = (Array.isArray(data.corrections) ? data.corrections : [])
    .map((item) => ({
      original: clampText(item?.original, 300),
      improved: clampText(item?.improved, 300),
      reason: clampText(item?.reason, 200),
    }))
    .filter((item) => item.original && item.improved)
    .slice(0, 5);

  return {
    bands,
    comments,
    overall: overallWritingBand(bands),
    summary: clampText(data.summary, 600),
    strengths: list(data.strengths, 4, 300),
    improvements: list(data.improvements, 5, 300),
    corrections,
  };
}
