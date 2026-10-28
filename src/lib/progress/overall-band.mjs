// Combines the latest Reading mock, Listening and Writing bands into an
// estimated overall band, rounded the way IELTS rounds the overall score.

export const SKILLS = [
  { id: "reading", label: "Reading", source: "full Reading mock", cta: "Take a full Reading mock", href: "/readingmock" },
  { id: "listening", label: "Listening", source: "Listening test", cta: "Take a Listening test", href: "/listening" },
  { id: "writing", label: "Writing", source: "Writing feedback", cta: "Write a task for feedback", href: "/writing" },
];

// IELTS rounds the average to the nearest half band; .25 and .75 round up.
export function roundOverallBand(average) {
  return Math.min(9, Math.floor(average * 2 + 0.5 + 1e-9) / 2);
}

const time = (value) => {
  const parsed = typeof value === "number" ? value : Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

// The most recent entry with a usable band.
export function latestBand(entries, bandOf, dateOf) {
  let latest = null;
  for (const entry of entries || []) {
    const band = Number(bandOf(entry));
    if (bandOf(entry) == null || !Number.isFinite(band) || band < 0 || band > 9) continue;
    const at = time(dateOf(entry));
    if (!latest || at > latest.at) latest = { band, at };
  }
  return latest;
}

/**
 * bands: { reading, listening, writing } each { band, at } or null.
 * Returns the estimate (needs at least two skills), the skills used,
 * the missing ones and the weakest skill to practise next.
 */
export function estimateOverallBand(bands) {
  const skills = SKILLS.map((skill) => ({ ...skill, result: bands?.[skill.id] || null }));
  const available = skills.filter((skill) => skill.result);
  const missing = skills.filter((skill) => !skill.result);
  const overall = available.length >= 2
    ? roundOverallBand(available.reduce((sum, skill) => sum + skill.result.band, 0) / available.length)
    : null;
  const weakest = available.length >= 2
    ? [...available].sort((first, second) => first.result.band - second.result.band)[0]
    : null;
  return { overall, skills, available, missing, weakest };
}
