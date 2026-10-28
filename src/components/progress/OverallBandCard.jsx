"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { useWritingHistory } from "@/hooks/useWritingHistory";
import { MOCK_STORAGE_KEY } from "@/lib/reading/mock-test";
import { readingMockAttemptsRepository } from "@/lib/supabase/repositories/reading-mock-attempts.repository";
import { estimateOverallBand, latestBand } from "@/lib/progress/overall-band.mjs";

const formatBand = (band) => Number(band).toFixed(1);
const formatDate = (at) => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function useReadingMockResults(accountUserId) {
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

export default function OverallBandCard() {
  const { history: listening, accountUserId } = useListeningHistory();
  const { history: writing } = useWritingHistory();
  const readingMocks = useReadingMockResults(accountUserId);

  const estimate = useMemo(() => estimateOverallBand({
    reading: latestBand(readingMocks, (item) => item.band, (item) => item.completedAt),
    listening: latestBand(listening, (item) => item.band, (item) => item.completedAt),
    writing: latestBand(writing, (item) => item.overall, (item) => item.createdAt),
  }), [readingMocks, listening, writing]);

  const next = estimate.missing[0] || estimate.weakest;

  return (
    <section aria-labelledby="overall-band-title" className="mb-8 rounded-2xl border border-brand-400/25 bg-brand-500/[0.07] p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="lg:w-64 lg:shrink-0">
          <h2 id="overall-band-title" className="flex items-center gap-2 text-xl font-bold text-white">
            <Award size={22} className="text-brand-400" aria-hidden="true" /> Estimated overall band
          </h2>
          <p className="mt-3 font-display text-6xl font-bold text-white">{estimate.overall == null ? "—" : formatBand(estimate.overall)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {estimate.overall == null
              ? "Complete at least two of the three skills below to see an estimate."
              : `From your latest ${estimate.available.length === 3 ? "Reading, Listening and Writing" : estimate.available.map((skill) => skill.label).join(" and ")} results. Speaking isn't included. A practice estimate, not an official score.`}
          </p>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {estimate.skills.map((skill) => (
            <div key={skill.id} className={`rounded-xl border p-4 ${estimate.weakest?.id === skill.id ? "border-amber-400/30 bg-amber-400/[0.06]" : "border-white/10 bg-white/5"}`}>
              <p className="text-sm text-slate-400">{skill.label}</p>
              {skill.result ? (
                <>
                  <p className="mt-1 text-3xl font-bold text-white">{formatBand(skill.result.band)}</p>
                  <p className="mt-1 text-xs text-slate-400">Latest {skill.source}{skill.result.at ? ` · ${formatDate(skill.result.at)}` : ""}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-300">No result yet</p>
                  <Link href={skill.href} className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-300 hover:underline">
                    {skill.cta} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {next && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-white">What to practise next: </span>
            {estimate.missing.length > 0
              ? `add a ${next.label} result so the estimate covers more of the test.`
              : `${next.label} is your lowest band (${formatBand(next.result.band)}). Raising it lifts your overall band the most.`}
          </p>
          <Link href={next.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-400">
            Practise {next.label} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
