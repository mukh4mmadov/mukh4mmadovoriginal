// Average IELTS Academic Reading raw-score thresholds published by IDP IELTS.
// Scores below the published band 4 threshold are intentionally not estimated.
const ACADEMIC_READING_THRESHOLDS = [
  [39, 9],
  [37, 8.5],
  [35, 8],
  [32, 7.5],
  [30, 7],
  [26, 6.5],
  [23, 6],
  [18, 5.5],
  [16, 5],
  [13, 4.5],
  [11, 4],
];

export function getMockBand(rawScore) {
  if (!Number.isInteger(rawScore) || rawScore < 11 || rawScore > 40) return null;
  return ACADEMIC_READING_THRESHOLDS.find(([minimum]) => rawScore >= minimum)?.[1] ?? null;
}
