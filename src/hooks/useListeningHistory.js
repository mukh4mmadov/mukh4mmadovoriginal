"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listeningAttemptsRepository } from "@/lib/supabase/repositories/listening-attempts.repository";
import { mergeListeningHistory, readListeningHistory } from "@/lib/listening/listening-results.mjs";

// Several components read the history at once (test cards, recent results),
// so share one account request per user.
const accountRequests = new Map();

function loadAccountHistory(userId, force = false) {
  if (force) accountRequests.delete(userId);
  if (!accountRequests.has(userId)) {
    const request = listeningAttemptsRepository.listForUser(userId).catch((error) => {
      accountRequests.delete(userId);
      throw error;
    });
    accountRequests.set(userId, request);
  }
  return accountRequests.get(userId);
}

export function getListeningAccountUserId(user, profile, isLoading) {
  return !isLoading && user?.id && profile && !profile.is_guest && !user.is_anonymous ? user.id : null;
}

export function useListeningHistory() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getListeningAccountUserId(user, profile, isLoading);
  const [localHistory, setLocalHistory] = useState([]);
  const [accountHistory, setAccountHistory] = useState([]);
  const [accountState, setAccountState] = useState("idle");
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async (force = false) => {
    setLocalHistory(readListeningHistory(window.localStorage));
    if (!accountUserId) {
      setAccountHistory([]);
      setAccountState("idle");
      return;
    }
    setAccountState("loading");
    try {
      setAccountHistory(await loadAccountHistory(accountUserId, force));
      setAccountState("ready");
    } catch {
      setAccountState("error");
    }
  }, [accountUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unsyncedLocal = useMemo(() => {
    if (!accountUserId || accountState !== "ready") return [];
    const accountIds = new Set(accountHistory.map((item) => item.id));
    return localHistory.filter((item) => !accountIds.has(item.id));
  }, [accountUserId, accountState, accountHistory, localHistory]);

  const syncLocal = useCallback(async () => {
    if (!accountUserId || unsyncedLocal.length === 0) return false;
    setSyncing(true);
    try {
      await listeningAttemptsRepository.upsertMany(accountUserId, unsyncedLocal);
      await refresh(true);
      return true;
    } catch {
      return false;
    } finally {
      setSyncing(false);
    }
  }, [accountUserId, unsyncedLocal, refresh]);

  const history = useMemo(() => mergeListeningHistory(localHistory, accountHistory), [localHistory, accountHistory]);

  return { history, accountUserId, accountState, unsyncedLocal, syncLocal, syncing, refresh };
}

export async function saveListeningAttemptToAccount(userId, attempt) {
  await listeningAttemptsRepository.upsertMany(userId, [attempt]);
  accountRequests.delete(userId);
}
