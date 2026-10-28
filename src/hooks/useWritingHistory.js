"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { writingSubmissionsRepository } from "@/lib/supabase/repositories/writing-submissions.repository";
import { fromSubmissionRow, mergeWritingHistory, readWritingHistory } from "@/lib/writing/writing-history.mjs";

export function useWritingHistory() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [localHistory, setLocalHistory] = useState([]);
  const [accountHistory, setAccountHistory] = useState([]);

  const refresh = useCallback(async () => {
    setLocalHistory(readWritingHistory(window.localStorage));
    if (!accountUserId) {
      setAccountHistory([]);
      return;
    }
    try {
      setAccountHistory((await writingSubmissionsRepository.listForUser(accountUserId)).map(fromSubmissionRow));
    } catch {
      // The table may not exist yet; browser history still shows.
      setAccountHistory([]);
    }
  }, [accountUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const history = useMemo(() => mergeWritingHistory(localHistory, accountHistory), [localHistory, accountHistory]);
  return { history, accountUserId, authLoading: isLoading, refresh };
}
