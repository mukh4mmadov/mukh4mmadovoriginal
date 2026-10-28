"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { vocabularyRepository } from "@/lib/supabase/repositories/vocabulary.repository";
import {
  addVocabularyItem,
  makeVocabularyItem,
  mergeVocabulary,
  readVocabulary,
  updateVocabularyItem,
  writeVocabulary,
} from "@/lib/vocabulary/vocabulary-notebook.mjs";

const CHANGE_EVENT = "vocabulary:changed";

/**
 * The learner's vocabulary notebook. Saved in this browser; signed-in
 * learners also keep it in their account (merged once per page load).
 * syncState: "local" | "syncing" | "synced" | "failed".
 */
export function useVocabulary({ sync = true } = {}) {
  const { user, profile, isLoading } = useAuth();
  const userId = user?.id;
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const canSync = Boolean(accountUserId && accountUserId === userId);
  const [items, setItems] = useState([]);
  const [syncState, setSyncState] = useState("local");

  useEffect(() => {
    const refresh = () => setItems(readVocabulary(window.localStorage, userId));
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [userId]);

  useEffect(() => {
    setSyncState("local");
    if (!sync || !canSync) return undefined;
    let cancelled = false;
    setSyncState("syncing");
    vocabularyRepository.listForUser(accountUserId)
      .then(async (rows) => {
        const merged = mergeVocabulary(readVocabulary(window.localStorage, userId), rows);
        writeVocabulary(window.localStorage, userId, merged.items);
        await vocabularyRepository.upsertMany(accountUserId, merged.toUpsert);
        if (cancelled) return;
        window.dispatchEvent(new Event(CHANGE_EVENT));
        setSyncState("synced");
      })
      .catch((error) => {
        console.warn("Vocabulary could not be synced with the account:", error);
        if (!cancelled) setSyncState("failed");
      });
    return () => { cancelled = true; };
  }, [sync, canSync, accountUserId, userId]);

  // Saves locally, then mirrors the changed item to the account.
  const commit = useCallback((nextList, changedId, removed = false) => {
    if (!writeVocabulary(window.localStorage, userId, nextList)) return false;
    window.dispatchEvent(new Event(CHANGE_EVENT));
    if (canSync) {
      const write = removed
        ? vocabularyRepository.remove(accountUserId, changedId)
        : vocabularyRepository.upsertMany(accountUserId, [{ item_id: changedId, data: nextList.find((entry) => entry.id === changedId), removed_at: null }]);
      write.catch((error) => console.warn("Vocabulary change could not be saved to the account:", error));
    }
    return true;
  }, [userId, canSync, accountUserId]);

  const saveWord = useCallback((input) => {
    const item = makeVocabularyItem(input);
    if (!item) return null;
    const next = addVocabularyItem(readVocabulary(window.localStorage, userId), item);
    return commit(next, item.id) ? item : null;
  }, [commit, userId]);

  const updateWord = useCallback((id, changes) => (
    commit(updateVocabularyItem(readVocabulary(window.localStorage, userId), id, changes), id)
  ), [commit, userId]);

  const removeWord = useCallback((id) => (
    commit(readVocabulary(window.localStorage, userId).filter((entry) => entry.id !== id), id, true)
  ), [commit, userId]);

  return { items, syncState, accountUserId, saveWord, updateWord, removeWord };
}
