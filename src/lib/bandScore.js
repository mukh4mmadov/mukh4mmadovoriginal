export function scoreToBand(correct, total) {
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
