// Average IELTS Listening raw-score thresholds (out of 40), as published by
// the IELTS partners. Like the reading mock, scores below the band 4 threshold
// are not estimated.
const LISTENING_THRESHOLDS = [
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
  [10, 4],
];

export function getListeningBand(rawScore, total = 40) {
  if (total !== 40 || !Number.isInteger(rawScore) || rawScore < 10 || rawScore > 40) return null;
  return LISTENING_THRESHOLDS.find(([minimum]) => rawScore >= minimum)?.[1] ?? null;
}
