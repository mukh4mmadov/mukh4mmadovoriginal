// Passage instructions keep the question numbers from their source book
// ("Questions 27–32", "boxes 27–32"). The practice player numbers questions
// from 1 (and the full mock from 1 to 40), so the references are shifted at
// display time to match the numbers learners actually see. The stored content
// is never changed.
const QUESTION_REFERENCE = /\b(Questions?|boxes|box)(\s+)(\d+)(?:(\s*[–-]\s*|\s+and\s+)(\d+))?/g;

export function renumberInstructions(instructions, firstDisplayedNumber) {
  if (typeof instructions !== "string" || !Number.isInteger(firstDisplayedNumber)) {
    return instructions;
  }

  const firstReference = QUESTION_REFERENCE.exec(instructions);
  QUESTION_REFERENCE.lastIndex = 0;
  if (!firstReference) return instructions;

  const offset = firstDisplayedNumber - Number(firstReference[3]);
  if (offset === 0) return instructions;

  return instructions.replace(
    QUESTION_REFERENCE,
    (match, label, space, start, separator, end) =>
      `${label}${space}${Number(start) + offset}${end ? `${separator}${Number(end) + offset}` : ""}`,
  );
}
