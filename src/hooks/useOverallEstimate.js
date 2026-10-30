"use client";

import { useEffect, useMemo, useState } from "react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { useWritingHistory } from "@/hooks/useWritingHistory";
import { MOCK_STORAGE_KEY } from "@/lib/reading/mock-scoring.mjs";
import { readingMockAttemptsRepository } from "@/lib/supabase/repositories/reading-mock-attempts.repository";
import { estimateOverallBand, latestBand } from "@/lib/progress/overall-band.mjs";

export function useReadingMockResults(accountUserId) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    let local = [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(MOCK_STORAGE_KEY) || "null");
      local = Array.isArray(saved?.results) ? saved.results : [];
    } catch {
      local = [];
    }
    setResults(local);
    if (!accountUserId) return undefined;
    let cancelled = false;
    readingMockAttemptsRepository.listForUser(accountUserId)
      .then((remote) => {
        if (cancelled) return;
        const byId = new Map([...local, ...remote].filter((item) => item?.id).map((item) => [item.id, item]));
        setResults([...byId.values()]);
      })
      .catch((error) => console.warn("Reading mock results could not be loaded from the account:", error));
    return () => { cancelled = true; };
  }, [accountUserId]);
  return results;
}

// Latest Reading mock, Listening and Writing bands combined into an
// estimated overall band.
export function useOverallEstimate() {
  const { history: listening, accountUserId } = useListeningHistory();
  const { history: writing } = useWritingHistory();
  const readingMocks = useReadingMockResults(accountUserId);
  return useMemo(() => estimateOverallBand({
    reading: latestBand(readingMocks, (item) => item.band, (item) => item.completedAt),
    listening: latestBand(listening, (item) => item.band, (item) => item.completedAt),
    writing: latestBand(writing, (item) => item.overall, (item) => item.createdAt),
  }), [readingMocks, listening, writing]);
}
