"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import { formatAggregateTime } from "@/lib/reading/metrics.mjs";

const PAGE_SIZE = 25;
const pageButtonClass = "min-h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

export default function AdminListeningResultsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const from = page * PAGE_SIZE;
      const { data, count, error: queryError } = await supabase
        .from("listening_attempts")
        .select("attempt_key, test_slug, score, total, result_data, completed_at, user:profiles!listening_attempts_user_id_fkey(id, full_name, username, email)", { count: "exact" })
        .order("completed_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (queryError) throw queryError;
      setRows(data || []);
      setTotal(count || 0);
    } catch (loadError) {
      console.error("Could not load admin listening results:", loadError);
      setError("Listening results could not be loaded. Confirm that migration 016_listening_attempts.sql has been applied, then retry.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadResults(); }, [loadResults]);

  if (loading && rows.length === 0) return <AdminPageLoading label="Loading listening results" />;
  if (error && rows.length === 0) return <AdminPageError message={error} onRetry={() => void loadResults()} />;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Headphones className="text-brand-400" size={28} aria-hidden="true" />
        <h1 className="text-3xl font-bold text-white">Listening Results</h1>
      </div>
      <p className="mb-6 text-sm text-slate-400">Saved listening attempts from signed-in learners, newest first. Guest results stay in their browser unless they sign in and save them.</p>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{total.toLocaleString()} {total === 1 ? "attempt" : "attempts"}</p>
        <button type="button" onClick={() => void loadResults()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="p-4">Learner</th><th className="p-4">Test</th><th className="p-4">Completed</th><th className="p-4 text-center">Score</th><th className="p-4 text-center">Est. band</th><th className="p-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">No saved listening results yet.</td></tr>
            ) : rows.map((row) => {
              const result = row.result_data || {};
              const learner = row.user || {};
              const expanded = selectedId === row.attempt_key;
              const missed = (Array.isArray(result.answers) ? result.answers : []).filter((answer) => answer.score < answer.max);
              return (
                <Fragment key={row.attempt_key}>
                  <tr className="border-b border-white/10 text-sm text-slate-200 hover:bg-white/[0.03]">
                    <td className="p-4"><p className="font-medium text-white">{learner.full_name || learner.username || "Unknown learner"}</p><p className="mt-1 text-xs text-slate-400">{learner.email || learner.id || "No account details"}</p></td>
                    <td className="p-4 text-slate-300">{result.testTitle || row.test_slug}</td>
                    <td className="p-4 text-slate-300">{row.completed_at ? new Date(row.completed_at).toLocaleString() : "—"}</td>
                    <td className="p-4 text-center font-semibold">{row.score}/{row.total}</td>
                    <td className="p-4 text-center">{result.band != null ? Number(result.band).toFixed(1) : "—"}</td>
                    <td className="p-4 text-right">
                      <button type="button" aria-expanded={expanded} onClick={() => setSelectedId(expanded ? null : row.attempt_key)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm hover:bg-white/5">
                        {expanded ? "Hide" : "View"}{expanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-white/10">
                      <td colSpan={6} className="p-4 sm:p-6">
                        <div className="mb-4 grid gap-3 sm:grid-cols-4">
                          {(Array.isArray(result.sections) ? result.sections : []).map((section) => (
                            <section key={section.number} className="rounded-lg border border-white/10 p-3">
                              <p className="text-xs uppercase text-slate-400">Section {section.number}</p>
                              <h3 className="mt-1 truncate font-semibold text-white" title={section.title}>{section.title}</h3>
                              <p className="mt-2 text-lg font-bold text-slate-100">{section.correct}/{section.total}</p>
                            </section>
                          ))}
                        </div>
                        {result.elapsedSeconds != null && <p className="mb-3 text-sm text-slate-400">Time on page: {formatAggregateTime(result.elapsedSeconds)}</p>}
                        <h2 className="mb-2 font-semibold text-white">Missed questions ({missed.length})</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {missed.map((answer) => (
                            <p key={answer.label || answer.number} className="rounded-lg bg-white/[0.03] p-3 text-sm text-slate-300">
                              <span className="font-medium text-slate-100">Q{answer.label || answer.number}</span>
                              {answer.type && <span className="text-slate-400"> · {answer.type}</span>}
                              <br />Learner: {answer.userAnswer || "Not answered"} · Correct: {answer.correctAnswer || "—"}
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300">
        <span>Page {page + 1} of {pageCount}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 0 || loading} onClick={() => setPage((current) => current - 1)} className={pageButtonClass}>Previous</button>
          <button type="button" disabled={page + 1 >= pageCount || loading} onClick={() => setPage((current) => current + 1)} className={pageButtonClass}>Next</button>
        </div>
      </div>
    </div>
  );
}
