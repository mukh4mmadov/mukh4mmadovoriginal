"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, PenLine, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { exportQuery } from "@/lib/admin/export";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import WritingFeedback from "@/components/writing/WritingFeedback";
import writingTasks from "@/data/writingTasks";

const PAGE_SIZE = 25;
const pageButtonClass = "min-h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

export default function AdminWritingPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const from = page * PAGE_SIZE;
      const { data, count, error: queryError } = await supabase
        .from("writing_submissions")
        .select("id, task_slug, task_number, essay, word_count, time_spent_seconds, overall_band, feedback, created_at, user:profiles!writing_submissions_user_id_fkey(id, full_name, username, email)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (queryError) throw queryError;
      setRows(data || []);
      setTotal(count || 0);
    } catch (loadError) {
      console.error("Could not load writing submissions:", loadError);
      setError("Writing submissions could not be loaded. Confirm that migration 017_writing_submissions.sql has been applied, then retry.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  if (loading && rows.length === 0) return <AdminPageLoading label="Loading writing submissions" />;
  if (error && rows.length === 0) return <AdminPageError message={error} onRetry={() => void load()} />;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <PenLine className="text-brand-400" size={28} aria-hidden="true" />
        <h1 className="text-3xl font-bold text-white">Writing Submissions</h1>
      </div>
      <p className="mb-6 text-sm text-slate-400">Responses submitted for AI feedback, newest first. Use this to spot-check the quality of the AI marking.</p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{total.toLocaleString()} {total === 1 ? "submission" : "submissions"}</p>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh</button>
        <button type="button" onClick={() => exportQuery("writing-submissions", supabase.from("writing_submissions").select("task_slug, task_number, word_count, time_spent_seconds, overall_band, essay, created_at, user:profiles!writing_submissions_user_id_fkey(full_name, email)").order("created_at", { ascending: false }), [{ label: "Learner", value: (r) => r.user?.full_name }, { label: "Email", value: (r) => r.user?.email }, { label: "Task", value: (r) => r.task_slug }, { label: "Task number", value: (r) => r.task_number }, { label: "Words", value: (r) => r.word_count }, { label: "Band", value: (r) => r.overall_band }, { label: "Essay", value: (r) => r.essay }, { label: "Submitted", value: (r) => r.created_at }]).catch((e) => window.alert(e.message))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5"><Download size={15} aria-hidden="true" />Export CSV</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="p-4">Learner</th><th className="p-4">Task</th><th className="p-4">Submitted</th><th className="p-4 text-center">Words</th><th className="p-4 text-center">Band</th><th className="p-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">No writing submissions yet.</td></tr>
            ) : rows.map((row) => {
              const learner = row.user || {};
              const task = writingTasks.find((candidate) => candidate.slug === row.task_slug);
              const expanded = selectedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-white/10 text-sm text-slate-200 hover:bg-white/[0.03]">
                    <td className="p-4"><p className="font-medium text-white">{learner.full_name || learner.username || "Unknown learner"}</p><p className="mt-1 text-xs text-slate-400">{learner.email || "No account details"}</p></td>
                    <td className="p-4 text-slate-300">Task {row.task_number} · {task?.title || row.task_slug}</td>
                    <td className="p-4 text-slate-300">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="p-4 text-center">{row.word_count}</td>
                    <td className="p-4 text-center font-semibold">{row.overall_band != null ? Number(row.overall_band).toFixed(1) : "—"}</td>
                    <td className="p-4 text-right">
                      <button type="button" aria-expanded={expanded} onClick={() => setSelectedId(expanded ? null : row.id)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm hover:bg-white/5">
                        {expanded ? "Hide" : "View"}{expanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-white/10">
                      <td colSpan={6} className="space-y-4 p-4 sm:p-6">
                        <div>
                          <h2 className="mb-2 font-semibold text-white">Response</h2>
                          <p className="whitespace-pre-wrap rounded-lg bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">{row.essay}</p>
                        </div>
                        <WritingFeedback feedback={row.feedback} taskNumber={row.task_number} wordCount={row.word_count} />
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
