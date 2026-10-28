"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CloudUpload, History, Trophy } from "lucide-react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { summarizeListeningHistory } from "@/lib/listening/listening-results.mjs";
import { formatAggregateTime } from "@/lib/reading/metrics.mjs";

const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));

export function ListeningCardStats({ slug }) {
  const { history } = useListeningHistory();
  const summary = useMemo(() => summarizeListeningHistory(history).get(slug), [history, slug]);
  if (!summary) return null;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
      <span className="inline-flex items-center gap-1.5 font-semibold"><Trophy size={14} aria-hidden="true" /> Best {summary.best.score}/{summary.best.total} · band {formatBand(summary.best.band)}</span>
      <span>Last {summary.last.score}/{summary.last.total}</span>
      <span>{summary.attempts} {summary.attempts === 1 ? "attempt" : "attempts"}</span>
    </p>
  );
}

export function ListeningHistory() {
  const { history, accountUserId, accountState, unsyncedLocal, syncLocal, syncing } = useListeningHistory();
  const [expandedId, setExpandedId] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");

  return (
    <section id="listening-history" className="mt-10 scroll-mt-24" aria-labelledby="listening-history-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="listening-history-title" className="flex items-center gap-2 text-2xl font-bold text-slate-100">
            <History size={22} className="text-brand-400" aria-hidden="true" /> Your results
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {accountUserId
              ? "Results are saved to your account and available on your other devices."
              : "Results are saved in this browser. Sign in to keep them across devices."}
          </p>
        </div>
        {!accountUserId && (
          <Link href="/login?redirect=%2Flistening" className="text-sm font-semibold text-brand-300 underline underline-offset-2">Sign in</Link>
        )}
      </div>

      {accountState === "error" && (
        <p role="status" className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          Account results could not be loaded. Showing results saved in this browser.
        </p>
      )}
      {unsyncedLocal.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-400/20 bg-brand-500/10 p-3 text-sm text-slate-300">
          <span>{unsyncedLocal.length} {unsyncedLocal.length === 1 ? "result is" : "results are"} only saved in this browser.</span>
          <button
            type="button"
            disabled={syncing}
            onClick={async () => setSyncMessage((await syncLocal()) ? "Browser results saved to your account." : "Results could not be saved. Please try again.")}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-500 px-3 font-semibold text-white disabled:opacity-50"
          >
            <CloudUpload size={16} aria-hidden="true" /> {syncing ? "Saving…" : "Save to my account"}
          </button>
        </div>
      )}
      {syncMessage && <p role="status" className="mb-3 text-sm text-slate-300">{syncMessage}</p>}

      {history.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
          Finish a test and press the results button inside it — your score and band will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.slice(0, 10).map((attempt) => {
            const expanded = expandedId === attempt.id;
            const missed = (attempt.answers || []).filter((answer) => answer.score < answer.max);
            return (
              <li key={attempt.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : attempt.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm"
                >
                  <span className="min-w-0 flex-1 font-semibold text-slate-100">{attempt.testTitle}</span>
                  <span className="text-slate-200">{attempt.score}/{attempt.total}</span>
                  <span className="text-slate-300">Band {formatBand(attempt.band)}</span>
                  {attempt.elapsedSeconds != null && <span className="text-slate-400">{formatAggregateTime(attempt.elapsedSeconds)}</span>}
                  <time className="text-xs text-slate-400" dateTime={attempt.completedAt}>{new Date(attempt.completedAt).toLocaleString()}</time>
                  {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                </button>
                {expanded && (
                  <div className="border-t border-white/10 px-4 py-4 text-sm">
                    {attempt.sections?.length > 0 && (
                      <div className="mb-4 grid gap-2 sm:grid-cols-4">
                        {attempt.sections.map((section) => (
                          <div key={section.number} className="rounded-lg bg-white/5 p-3">
                            <p className="text-xs text-slate-400">Section {section.number}</p>
                            <p className="truncate text-slate-200" title={section.title}>{section.title}</p>
                            <p className="mt-1 font-semibold text-slate-100">{section.correct}/{section.total}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <h3 className="mb-2 font-semibold text-slate-100">
                      {missed.length ? `Missed questions (${missed.length})` : "No missed questions — well done!"}
                    </h3>
                    {missed.length > 0 && (
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {missed.map((answer) => (
                          <li key={answer.label || answer.number} className="rounded-lg bg-white/[0.04] px-3 py-2 text-slate-300">
                            <span className="font-semibold text-slate-100">Q{answer.label || answer.number}</span>
                            {" · "}Your answer: {answer.userAnswer || "not answered"}
                            {answer.correctAnswer && <> · Correct: <span className="text-emerald-300">{answer.correctAnswer}</span></>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ListeningStatsSection() {
  const { history } = useListeningHistory();
  const stats = useMemo(() => {
    if (!history.length) return null;
    const best = history.reduce((top, attempt) => (!top || attempt.score > top.score ? attempt : top), null);
    const average = Math.round(history.reduce((sum, attempt) => sum + attempt.score, 0) / history.length);
    const typeMap = new Map();
    history.forEach((attempt) => (attempt.questionTypes || []).forEach((item) => {
      const current = typeMap.get(item.type) || { type: item.type, correct: 0, total: 0 };
      current.correct += item.correct;
      current.total += item.total;
      typeMap.set(item.type, current);
    }));
    const types = [...typeMap.values()].filter((item) => item.total >= 3)
      .map((item) => ({ ...item, accuracy: Math.round((item.correct / item.total) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy);
    return { best, average, types };
  }, [history]);

  return (
    <section aria-labelledby="listening-stats-title" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="listening-stats-title" className="text-xl font-bold text-white">Listening</h2>
        <Link href="/listening" className="text-sm font-semibold text-brand-300 underline underline-offset-2">
          {stats ? "Practise listening" : "Take a listening test"}
        </Link>
      </div>
      {!stats ? (
        <p className="text-sm text-slate-400">No listening results yet. Finished tests will show your score, approximate band and weakest question types here.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Tests completed", history.length],
              ["Best score", `${stats.best.score}/${stats.best.total}`],
              ["Best band (approx.)", formatBand(stats.best.band)],
              ["Average score", `${stats.average}/40`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          {stats.types.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">Accuracy by question type</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {stats.types.map((item) => (
                  <li key={item.type} className="rounded-lg bg-white/[0.04] px-3 py-2">
                    <div className="flex justify-between text-sm text-slate-200"><span>{item.type}</span><span>{item.accuracy}%</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${item.accuracy}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
