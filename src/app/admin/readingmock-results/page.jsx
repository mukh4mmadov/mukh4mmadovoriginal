"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";

const PAGE_SIZE = 25;
const inputClass = "rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100";

export default function AdminReadingMockResultsPage() {
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
      const from = page * PAGE_SIZE;
      const { data, count, error: queryError } = await supabase
        .from("reading_mock_attempts")
        .select("attempt_key, result_data, completed_at, user:profiles!reading_mock_attempts_user_id_fkey(id, full_name, username, email)", { count: "exact" })
        .order("completed_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (queryError) throw queryError;
      setRows(data || []);
      setTotal(count || 0);
    } catch (loadError) {
      console.error("Could not load admin reading mock results:", loadError);
      setError("Reading mock results could not be loaded. Confirm that migration 012_admin_reading_mock_attempts.sql has been applied, then retry.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadResults(); }, [loadResults]);

  if (loading && rows.length === 0) return <AdminPageLoading label="Loading reading mock results" />;
  if (error && rows.length === 0) return <AdminPageError message={error} onRetry={() => void loadResults()} />;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <ClipboardList className="text-brand-400" size={28} />
        <h1 className="text-3xl font-bold text-white">Reading Mock Results</h1>
      </div>
      <p className="mb-6 text-sm text-slate-400">All saved reading mock attempts from signed-in learners, newest first. Guest results are stored only in their browser unless they sign in and sync them.</p>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{total.toLocaleString()} {total === 1 ? "attempt" : "attempts"}</p>
        <button type="button" onClick={() => void loadResults()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5"><RefreshCw size={15} />Refresh</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px]">
          <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="p-4">Learner</th><th className="p-4">Completed</th><th className="p-4 text-center">Score</th><th className="p-4 text-center">Est. band</th><th className="p-4 text-center">Time</th><th className="p-4 text-right">Review</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">No saved reading mock results yet.</td></tr> : rows.map((row) => {
              const result = row.result_data || {};
              const learner = row.user || {};
              const expanded = selectedId === row.attempt_key;
              const elapsed = Number(result.elapsedSeconds) || 0;
              return <Fragment key={row.attempt_key}>
                <tr key={row.attempt_key} className="border-b border-white/10 text-sm text-slate-200 hover:bg-white/[0.03]">
                  <td className="p-4"><p className="font-medium text-white">{learner.full_name || learner.username || "Unknown learner"}</p><p className="mt-1 text-xs text-slate-400">{learner.email || learner.id || "No account details"}</p></td>
                  <td className="p-4 text-slate-300">{row.completed_at ? new Date(row.completed_at).toLocaleString() : "—"}</td>
                  <td className="p-4 text-center font-semibold">{Number(result.rawScore) || 0}/{Number(result.total) || 40}</td>
                  <td className="p-4 text-center">{result.band != null ? Number(result.band).toFixed(1) : "—"}</td>
                  <td className="p-4 text-center">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</td>
                  <td className="p-4 text-right"><button type="button" aria-expanded={expanded} onClick={() => setSelectedId(expanded ? null : row.attempt_key)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm hover:bg-white/5">{expanded ? "Hide" : "View"}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></td>
                </tr>
                {expanded && <tr key={`${row.attempt_key}-details`} className="border-b border-white/10"><td colSpan={6} className="p-4 sm:p-6">
                  <div className="mb-5 grid gap-3 sm:grid-cols-3">{(Array.isArray(result.sections) ? result.sections : []).map((section) => <section key={`${row.attempt_key}-${section.title}`} className="rounded-lg border border-white/10 p-3"><p className="text-xs uppercase text-slate-400">{section.difficulty} · {section.answered}/{section.total} answered</p><h3 className="mt-1 font-semibold text-white">{section.title}</h3><p className="mt-2 text-lg font-bold text-slate-100">{section.correct}/{section.total}</p></section>)}</div>
                  <h2 className="mb-3 font-semibold text-white">Answer review</h2>
                  <div className="space-y-2">{(Array.isArray(result.answers) ? result.answers : []).map((answer) => <article key={`${row.attempt_key}-q${answer.number}`} className="rounded-lg bg-white/[0.03] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium text-slate-100">Q{answer.number} · Passage {answer.passageNumber}: {answer.prompt}</p><span className={answer.correct ? "text-emerald-300" : "text-rose-300"}>{answer.correct ? "Correct" : answer.userAnswer ? "Incorrect" : "Skipped"}</span></div><p className="mt-2 text-slate-300">Learner: {answer.userAnswer || "Not answered"} · Correct: {answer.correctAnswer || "—"}</p>{answer.explanation && <p className="mt-1 text-slate-400">{answer.explanation}</p>}</article>)}</div>
                  {result.autoSubmitReason && <p className="mt-4 text-sm text-amber-200">Auto-submitted: {result.autoSubmitReason}</p>}
                </td></tr>}
              </Fragment>;
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300"><span>Page {page + 1} of {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page === 0 || loading} onClick={() => setPage((current) => current - 1)} className={`${inputClass} disabled:opacity-40`}>Previous</button><button type="button" disabled={page + 1 >= pageCount || loading} onClick={() => setPage((current) => current + 1)} className={`${inputClass} disabled:opacity-40`}>Next</button></div></div>
    </div>
  );
}
