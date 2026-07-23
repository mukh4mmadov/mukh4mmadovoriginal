// Approximate IELTS raw-score-to-band conversion, based on the publicly
// known general shape of the Academic conversion scale (out of a 40-item
// test). This is an approximation for practice purposes only — official
// band scores are set by Cambridge/IDP examiners.

export function scoreToBand(correct: number, total: number): number {
  const pct = correct / total;
  if (pct >= 0.97) return 9;
  if (pct >= 0.9) return 8.5;
  if (pct >= 0.82) return 8;
  if (pct >= 0.75) return 7.5;
  if (pct >= 0.67) return 7;
  if (pct >= 0.58) return 6.5;
  if (pct >= 0.5) return 6;
  if (pct >= 0.42) return 5.5;
  if (pct >= 0.34) return 5;
  if (pct >= 0.26) return 4.5;
  if (pct >= 0.18) return 4;
  return 3.5;
}
