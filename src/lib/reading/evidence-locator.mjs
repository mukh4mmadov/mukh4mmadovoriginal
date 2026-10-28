// Finds where in a passage the answer to a question comes from, so the
// results screen can show the exact sentence (or at least the paragraph).

const MIN_QUOTE_LENGTH = 12;

// Lowercase, straighten quotes and dashes, and collapse whitespace, keeping a
// map from each normalized character back to its index in the original text.
function normalizeWithMap(text) {
  const source = String(text || "");
  let normalized = "";
  const indexMap = [];
  let lastWasSpace = true;
  for (let index = 0; index < source.length; index += 1) {
    let char = source[index];
    if (/\s/.test(char)) {
      if (lastWasSpace) continue;
      char = " ";
      lastWasSpace = true;
    } else {
      lastWasSpace = false;
      char = char
        .replace(/[‘’`´]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[‐-―]/g, "-")
        .toLowerCase();
    }
    normalized += char;
    indexMap.push(index);
  }
  return { normalized, indexMap };
}

export function normalizeEvidenceText(text) {
  return normalizeWithMap(text).normalized.trim();
}

function cleanCandidate(value) {
  return normalizeEvidenceText(value)
    .replace(/^[\s"'.,;:]+|[\s"'.,;:]+$/g, "")
    .replace(/\s*(\.\.\.|…)\s*/g, "…");
}

// Phrases the explanation quotes from the passage, in '…' or "…".
// A closing quote must be followed by a space, punctuation or the end, so
// apostrophes inside a quote ("world's") do not end it early.
export function extractQuotedPhrases(explanation) {
  const text = String(explanation || "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const phrases = [];
  const pattern = /(?:^|[\s(\[:,])(['"])(.+?)\1(?=[\s.,;:!?)\]]|$)/g;
  for (const match of text.matchAll(pattern)) {
    const phrase = match[2].trim();
    if (phrase.length >= MIN_QUOTE_LENGTH) phrases.push(phrase);
  }
  return phrases;
}

function sentenceBounds(text, start, end) {
  let sentenceStart = start;
  while (sentenceStart > 0 && !/[.!?]\s/.test(text.slice(sentenceStart - 2, sentenceStart))) {
    sentenceStart -= 1;
  }
  let sentenceEnd = end;
  while (sentenceEnd < text.length && !/[.!?]/.test(text[sentenceEnd - 1])) sentenceEnd += 1;
  // Keep a closing quote or bracket that belongs to the sentence.
  while (sentenceEnd < text.length && /["'”’)]/.test(text[sentenceEnd])) sentenceEnd += 1;
  return { start: sentenceStart, end: Math.max(sentenceEnd, end) };
}

function findInParagraphs(paragraphs, candidate) {
  // "a … b" quotes are matched piece by piece; the longest piece wins.
  const pieces = candidate.split("…").map((piece) => piece.trim()).filter((piece) => piece.length >= MIN_QUOTE_LENGTH);
  const ordered = pieces.length > 1 ? [...pieces].sort((a, b) => b.length - a.length) : pieces;
  for (const piece of ordered) {
    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
      const original = String(paragraphs[paragraphIndex]?.text || "");
      const { normalized, indexMap } = normalizeWithMap(original);
      const position = normalized.indexOf(piece);
      if (position === -1) continue;
      const start = indexMap[position];
      const end = indexMap[position + piece.length - 1] + 1;
      return { paragraphIndex, start, end, sentence: sentenceBounds(original, start, end) };
    }
  }
  return null;
}

const contentWords = (text) => normalizeEvidenceText(text).match(/[a-z0-9']{3,}/g) || [];

// For quotes that were lightly reworded: the sentence containing most of the
// quote's words (at least 75%) is taken as the evidence.
function findClosestSentence(paragraphs, candidate) {
  const quoteWords = [...new Set(contentWords(candidate))];
  if (quoteWords.length < 6) return null;
  let best = null;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const original = String(paragraph?.text || "");
    for (const match of original.matchAll(/[^.!?]+[.!?]*["'”’)]*/g)) {
      const sentenceWords = new Set(contentWords(match[0]));
      const score = quoteWords.filter((word) => sentenceWords.has(word)).length / quoteWords.length;
      if (score >= 0.75 && (!best || score > best.score)) {
        const leading = match[0].length - match[0].trimStart().length;
        const start = match.index + leading;
        const end = match.index + match[0].trimEnd().length;
        best = { score, paragraphIndex, start, end, sentence: { start, end } };
      }
    }
  });
  return best;
}

const PARAGRAPH_MENTION = /\b(?:[Pp]aragraph|[Ss]ection)\s+([A-J])\b/;

function paragraphLetter(question) {
  const fromLabel = String(question?.paragraphLabel || "").match(/\b([A-J])\s*$/);
  if (fromLabel) return fromLabel[1];
  const fromExplanation = String(question?.explanation || "").match(PARAGRAPH_MENTION);
  return fromExplanation ? fromExplanation[1] : null;
}

/**
 * Returns where the evidence for a question is, or null when it can't be found:
 * - { kind: "exact", paragraphIndex, ranges: [{ start, end, sentence }] }
 * - { kind: "paragraph", paragraphIndex, ranges: [] }
 * Ranges are character offsets into paragraphs[paragraphIndex].text.
 */
export function locateEvidence(passage, question) {
  const paragraphs = Array.isArray(passage?.paragraphs) ? passage.paragraphs : [];
  if (!question || paragraphs.length === 0) return null;

  const candidates = [question.evidence, ...extractQuotedPhrases(question.explanation)]
    .filter((value) => typeof value === "string" && value.trim())
    .map(cleanCandidate)
    .filter((value) => value.replace(/…/g, "").length >= MIN_QUOTE_LENGTH);

  const matches = [];
  for (const candidate of candidates) {
    const match = findInParagraphs(paragraphs, candidate) || findClosestSentence(paragraphs, candidate);
    if (match && !matches.some((existing) => existing.paragraphIndex === match.paragraphIndex && existing.start === match.start)) {
      matches.push(match);
    }
  }
  if (matches.length > 0) {
    const paragraphIndex = matches[0].paragraphIndex;
    const ranges = matches
      .filter((match) => match.paragraphIndex === paragraphIndex)
      .map(({ start, end, sentence }) => ({ start, end, sentence }))
      .filter((range, index, all) => !all.some((other, otherIndex) => otherIndex !== index
        && other.start <= range.start && other.end >= range.end
        && (other.start < range.start || other.end > range.end || otherIndex < index)))
      .sort((a, b) => a.start - b.start);
    return { kind: "exact", paragraphIndex, ranges };
  }

  const letter = paragraphLetter(question);
  if (letter) {
    const paragraphIndex = paragraphs.findIndex((paragraph) => String(paragraph.label || "").trim().toUpperCase() === letter);
    if (paragraphIndex !== -1) return { kind: "paragraph", paragraphIndex, ranges: [] };
  }
  return null;
}

// Splits a paragraph into plain, sentence and match segments for rendering.
export function segmentParagraph(text, ranges = []) {
  const source = String(text || "");
  if (ranges.length === 0) return [{ text: source, kind: "plain" }];
  const marks = new Array(source.length).fill(0);
  for (const range of ranges) {
    for (let index = range.sentence.start; index < range.sentence.end; index += 1) marks[index] = Math.max(marks[index], 1);
    for (let index = range.start; index < range.end; index += 1) marks[index] = 2;
  }
  const kinds = ["plain", "sentence", "match"];
  const segments = [];
  for (let index = 0; index < source.length; index += 1) {
    const kind = kinds[marks[index]];
    const last = segments[segments.length - 1];
    if (last && last.kind === kind) last.text += source[index];
    else segments.push({ text: source[index], kind });
  }
  return segments;
}

export function summarizeEvidenceCoverage(passages) {
  const totals = { questions: 0, exact: 0, paragraph: 0, none: 0 };
  for (const passage of passages || []) {
    for (const group of passage?.questionGroups || []) {
      for (const question of group?.questions || []) {
        totals.questions += 1;
        const located = locateEvidence(passage, question);
        totals[located ? located.kind : "none"] += 1;
      }
    }
  }
  return totals;
}
