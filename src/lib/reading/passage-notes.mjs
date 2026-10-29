// Private notes learners attach to selected passage text, stored per
// passage in the browser (like the real exam's right-click "Notes").

export const notesStorageKey = (passageKey) => `ielts-passage-notes-v1:${passageKey}`;
const MAX_NOTE_LENGTH = 500;
const MAX_QUOTE_LENGTH = 300;

export function readNotes(storage, passageKey) {
  try {
    const parsed = JSON.parse(storage?.getItem(notesStorageKey(passageKey)) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((note) => note?.id && Array.isArray(note.tokenKeys) && note.tokenKeys.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function writeNotes(storage, passageKey, notes) {
  try {
    storage.setItem(notesStorageKey(passageKey), JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

export function makeNote({ id, paragraphKey, tokenKeys, quote, text }, now = new Date().toISOString()) {
  const cleanText = String(text || "").trim().slice(0, MAX_NOTE_LENGTH);
  if (!cleanText || !Array.isArray(tokenKeys) || tokenKeys.length === 0) return null;
  return {
    id: id || `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    paragraphKey: String(paragraphKey || ""),
    tokenKeys: [...tokenKeys],
    quote: String(quote || "").replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE_LENGTH),
    text: cleanText,
    createdAt: now,
  };
}

// Notes in passage order (by their first word), so the list reads top to bottom.
export function sortNotes(notes, tokenOrder) {
  const position = (note) => {
    const index = tokenOrder.indexOf(note.tokenKeys[0]);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...notes].sort((first, second) => position(first) - position(second));
}

// tokenKey -> note id, for underlining noted words.
export function notedTokens(notes) {
  const map = new Map();
  for (const note of notes) for (const key of note.tokenKeys) if (!map.has(key)) map.set(key, note.id);
  return map;
}
