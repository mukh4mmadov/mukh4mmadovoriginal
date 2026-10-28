// Vocabulary notebook: words learners save from Reading passages, kept in the
// browser and (for signed-in learners) in their account.

export const VOCABULARY_KEY = "ielts-vocabulary-v1";
export const MAX_TERM_LENGTH = 60;
const MAX_TERM_WORDS = 6;
const MAX_SENTENCE_LENGTH = 400;
const MAX_NOTE_LENGTH = 500;

export const vocabularyStorageKey = (userId) => `${VOCABULARY_KEY}:${userId || "guest"}`;

// Trims punctuation and spacing; returns "" for text that isn't a word or short phrase.
export function cleanTerm(text) {
  const term = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .trim();
  if (!term || term.length > MAX_TERM_LENGTH || term.split(" ").length > MAX_TERM_WORDS) return "";
  return term;
}

export const termId = (term) => cleanTerm(term).toLowerCase();

// The sentence of `text` that contains `term` (first occurrence), for context.
export function sentenceContaining(text, term) {
  const source = String(text || "");
  const index = source.toLowerCase().indexOf(String(term || "").toLowerCase());
  if (index === -1) return "";
  let start = index;
  while (start > 0 && !/[.!?]\s/.test(source.slice(start - 2, start))) start -= 1;
  let end = index + term.length;
  while (end < source.length && !/[.!?]/.test(source[end - 1])) end += 1;
  const sentence = source.slice(start, end).trim();
  return sentence.length > MAX_SENTENCE_LENGTH ? `${sentence.slice(0, MAX_SENTENCE_LENGTH - 1)}…` : sentence;
}

export function makeVocabularyItem({ term, sentence = "", passageSlug = "", passageTitle = "", note = "" }, now = new Date().toISOString()) {
  const clean = cleanTerm(term);
  if (!clean) return null;
  return {
    id: termId(clean),
    term: clean,
    sentence: String(sentence || "").slice(0, MAX_SENTENCE_LENGTH),
    passageSlug: String(passageSlug || ""),
    passageTitle: String(passageTitle || ""),
    note: String(note || "").slice(0, MAX_NOTE_LENGTH),
    status: "learning",
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// Adds an item, or refreshes the context of a word that's already saved
// while keeping the learner's note and progress.
export function addVocabularyItem(list, item) {
  if (!item) return list;
  const existing = list.find((entry) => entry.id === item.id);
  if (!existing) return [item, ...list];
  const updated = {
    ...existing,
    sentence: item.sentence || existing.sentence,
    passageSlug: item.passageSlug || existing.passageSlug,
    passageTitle: item.passageTitle || existing.passageTitle,
    status: "learning",
    updatedAt: item.updatedAt,
  };
  return [updated, ...list.filter((entry) => entry.id !== item.id)];
}

export function updateVocabularyItem(list, id, changes, now = new Date().toISOString()) {
  return list.map((entry) => {
    if (entry.id !== id) return entry;
    const next = { ...entry, ...changes, updatedAt: now };
    if (typeof next.note === "string") next.note = next.note.slice(0, MAX_NOTE_LENGTH);
    return next;
  });
}

export function readVocabulary(storage, userId) {
  try {
    const parsed = JSON.parse(storage.getItem(vocabularyStorageKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.id && entry?.term) : [];
  } catch {
    return [];
  }
}

export function writeVocabulary(storage, userId, list) {
  try {
    storage.setItem(vocabularyStorageKey(userId), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

const time = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Merges local items with account rows ({ item_id, data, removed_at }).
 * A local item newer than the account copy (or its removal) wins and is
 * returned in toUpsert; otherwise the account decides.
 */
export function mergeVocabulary(localItems = [], accountRows = []) {
  const local = new Map(localItems.filter((item) => item?.id).map((item) => [item.id, item]));
  const account = new Map(accountRows.filter((row) => row?.item_id).map((row) => [row.item_id, row]));
  const items = [];
  const toUpsert = [];
  for (const id of new Set([...local.keys(), ...account.keys()])) {
    const localItem = local.get(id);
    const row = account.get(id);
    const accountTime = row ? Math.max(time(row.data?.updatedAt), time(row.removed_at)) : 0;
    if (localItem && (!row || time(localItem.updatedAt) > accountTime)) {
      items.push(localItem);
      toUpsert.push({ item_id: id, data: localItem, removed_at: null });
    } else if (row && !row.removed_at && row.data) {
      items.push(row.data);
    }
  }
  items.sort((first, second) => time(second.updatedAt) - time(first.updatedAt));
  return { items, toUpsert };
}
