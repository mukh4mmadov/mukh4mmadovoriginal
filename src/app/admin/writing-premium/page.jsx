"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import WritingFeedback from "@/components/writing/WritingFeedback";
import { PremiumStatus } from "@/components/writing/PremiumChecks";
import { getWritingTask } from "@/data/writingTasks";
import { buildPremiumPrompt } from "@/lib/ai/writing-prompts";
import { parsePremiumFeedback } from "@/lib/writing/writing-feedback.mjs";
import { formatUzs, PREMIUM_STATUSES } from "@/lib/writing/premium.mjs";

const FILTERS = [
  { id: "awaiting_payment", label: "Waiting for payment" },
  { id: "paid", label: "Paid · to check" },
  { id: "done", label: "Done" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];
const buttonClass = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";
const primaryClass = "inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40";

function CopyPromptButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this text for Claude:", text);
        }
      }}
    >
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy for Claude"}
    </button>
  );
}

// Marking a paid request: copy each essay's prompt into Claude, paste the
// answer back, check the preview and publish.
function MarkingPanel({ request, onPublished }) {
  const essays = Array.isArray(request.essays) ? request.essays : [];
  const [answers, setAnswers] = useState(() => essays.map(() => ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const parsed = useMemo(() => answers.map((answer) => (answer.trim() ? parsePremiumFeedback(answer) : null)), [answers]);
  const ready = parsed.length > 0 && parsed.every(Boolean);

  const publish = async () => {
    setSaving(true);
    setError("");
    try {
      const { data, error: updateError } = await supabase
        .from("premium_writing_requests")
        .update({ feedback: parsed, status: "done", completed_at: new Date().toISOString() })
        .eq("id", request.id)
        .select("id");
      if (updateError) throw updateError;
      if (!data?.length) throw new Error("No request was updated.");
      onPublished();
    } catch (publishError) {
      console.error("Could not publish premium feedback:", publishError);
      setError("The result could not be published. Check that you are signed in as an administrator and that migration 020 is applied.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {essays.map((item, index) => {
        const task = getWritingTask(item.taskSlug);
        const answer = answers[index];
        return (
          <section key={`${item.taskSlug}-${index}`} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-white">Task {item.taskNumber}: {task?.title || item.taskSlug} · {item.wordCount} words</h3>
              {task ? <CopyPromptButton text={buildPremiumPrompt(task, item.essay)} /> : <span className="text-sm text-rose-300">Unknown task</span>}
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-brand-300">Learner&apos;s answer</summary>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">{item.essay}</p>
            </details>
            <label className="block text-sm font-medium text-slate-200" htmlFor={`premium-answer-${request.id}-${index}`}>Paste Claude&apos;s whole answer here</label>
            <textarea
              id={`premium-answer-${request.id}-${index}`}
              value={answer}
              onChange={(event) => setAnswers((current) => current.map((value, i) => (i === index ? event.target.value : value)))}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs text-slate-200"
              placeholder='{"summary": "...", "criteria": {...}, ...}'
            />
            {answer.trim() && !parsed[index] && (
              <p role="alert" className="text-sm text-rose-300">This answer could not be read. Paste Claude&apos;s whole reply, including the {"{"} and {"}"} and all four criteria bands.</p>
            )}
            {parsed[index] && (
              <div className="rounded-xl border border-emerald-400/20 p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">Preview: what the learner will see</p>
                <WritingFeedback feedback={parsed[index]} taskNumber={item.taskNumber} wordCount={item.wordCount} headingId={`admin-premium-${request.id}-${index}`} />
              </div>
            )}
          </section>
        );
      })}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button type="button" className={primaryClass} disabled={!ready || saving} onClick={() => void publish()}>
        <Sparkles size={15} aria-hidden="true" />{saving ? "Publishing…" : "Publish result to the learner"}
      </button>
    </div>
  );
}

function RequestDetails({ request, onChanged }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remark, setRemark] = useState(request.status === "paid");
  const essays = Array.isArray(request.essays) ? request.essays : [];
  const feedback = Array.isArray(request.feedback) ? request.feedback : [];

  const update = async (changes) => {
    setBusy(true);
    setError("");
    try {
      const { data, error: updateError } = await supabase.from("premium_writing_requests").update(changes).eq("id", request.id).select("id");
      if (updateError) throw updateError;
      if (!data?.length) throw new Error("No request was updated.");
      onChanged();
    } catch (updateError) {
      console.error("Could not update premium request:", updateError);
      setError("The request could not be updated. Check that you are signed in as an administrator, then retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {request.status === "awaiting_payment" && (
        <div className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-4">
          <p className="text-sm text-slate-200">
            Confirm only after <b>{formatUzs(request.price_uzs)}</b> with code <b className="font-mono">{request.code}</b> has reached you on Telegram.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={primaryClass} disabled={busy} onClick={() => void update({ status: "paid", approved_at: new Date().toISOString() })}>
              <Check size={15} aria-hidden="true" /> Confirm payment
            </button>
            <input value={note} onChange={(event) => setNote(event.target.value.slice(0, 500))} placeholder="Reason (optional, shown to the learner)" aria-label="Reason for rejecting" className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-slate-200" />
            <button type="button" className={buttonClass} disabled={busy} onClick={() => void update({ status: "rejected", admin_note: note.trim() || null })}>Reject</button>
          </div>
        </div>
      )}
      {request.status === "rejected" && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>Rejected{request.admin_note ? `: ${request.admin_note}` : "."}</span>
          <button type="button" className={buttonClass} disabled={busy} onClick={() => void update({ status: "awaiting_payment", admin_note: null })}>Move back to waiting for payment</button>
        </div>
      )}
      {request.status === "done" && (
        <div className="space-y-4">
          {essays.map((item, index) => feedback[index] && (
            <WritingFeedback key={index} feedback={feedback[index]} taskNumber={item.taskNumber} wordCount={item.wordCount} headingId={`admin-done-${request.id}-${index}`} />
          ))}
          {!remark && <button type="button" className={buttonClass} onClick={() => setRemark(true)}>Replace the published result</button>}
        </div>
      )}
      {request.status !== "awaiting_payment" && request.status !== "rejected" && remark && <MarkingPanel request={request} onPublished={onChanged} />}
      {request.status === "awaiting_payment" && essays.map((item, index) => (
        <details key={index} className="rounded-xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm text-brand-300">Task {item.taskNumber} answer ({item.wordCount} words)</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.essay}</p>
        </details>
      ))}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}

export default function AdminWritingPremiumPage() {
  const [filter, setFilter] = useState("awaiting_payment");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      let query = supabase
        .from("premium_writing_requests")
        .select("id, code, essays, price_uzs, status, feedback, admin_note, created_at, approved_at, completed_at, user:profiles!premium_writing_requests_user_id_fkey(id, full_name, username, email)")
        .order("created_at", { ascending: filter === "paid" || filter === "awaiting_payment" })
        .limit(100);
      if (filter !== "all") query = query.eq("status", filter);
      const [{ data, error: queryError }, statusRows] = await Promise.all([
        query,
        supabase.from("premium_writing_requests").select("status").limit(1000),
      ]);
      if (queryError) throw queryError;
      setRows(data || []);
      const next = {};
      for (const row of statusRows.data || []) next[row.status] = (next[row.status] || 0) + 1;
      setCounts(next);
    } catch (loadError) {
      console.error("Could not load premium writing requests:", loadError);
      setError("AI Premium requests could not be loaded. Confirm that migration 020_premium_writing_requests.sql has been applied, then retry.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  if (loading && rows.length === 0 && !error) return <AdminPageLoading label="Loading AI Premium requests" />;
  if (error && rows.length === 0) return <AdminPageError message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Sparkles className="text-brand-400" size={28} aria-hidden="true" />
        <h1 className="text-3xl font-bold text-white">AI Premium Writing</h1>
      </div>
      <ol className="mb-6 max-w-3xl list-decimal space-y-1 pl-5 text-sm text-slate-400">
        <li>A learner sends you the code and pays on Telegram. Find the code under <b>Waiting for payment</b> and click <b>Confirm payment</b>.</li>
        <li>Under <b>Paid · to check</b>, click <b>Copy for Claude</b> and paste it into Claude (claude.ai or a Claude Code chat).</li>
        <li>Copy Claude&apos;s whole answer, paste it into the box, check the preview, then click <b>Publish result</b>. The learner sees it on their AI Premium page.</li>
      </ol>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter requests" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setSelectedId(null); }} className={`${buttonClass} ${filter === item.id ? "border-brand-400 bg-brand-500/15 text-white" : ""}`}>
              {item.label}{item.id !== "all" && counts[item.id] ? ` (${counts[item.id]})` : ""}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className={buttonClass}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="p-4">Code</th><th className="p-4">Learner</th><th className="p-4">Tasks</th><th className="p-4">Amount</th><th className="p-4">Requested</th><th className="p-4">Status</th><th className="p-4 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-slate-400">No {filter === "all" ? "" : `"${PREMIUM_STATUSES[filter]?.label || filter}" `}requests.</td></tr>
            ) : rows.map((row) => {
              const learner = row.user || {};
              const essays = Array.isArray(row.essays) ? row.essays : [];
              const expanded = selectedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-white/10 text-sm text-slate-200 hover:bg-white/[0.03]">
                    <td className="p-4 font-mono font-semibold tracking-widest text-white">{row.code}</td>
                    <td className="p-4"><p className="font-medium text-white">{learner.full_name || learner.username || "Unknown learner"}</p><p className="mt-1 text-xs text-slate-400">{learner.email || "No account details"}</p></td>
                    <td className="p-4 text-slate-300">{essays.map((item) => `Task ${item.taskNumber}`).join(" + ")}</td>
                    <td className="p-4">{formatUzs(row.price_uzs)}</td>
                    <td className="p-4 text-slate-300">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="p-4"><PremiumStatus status={row.status} /></td>
                    <td className="p-4 text-right">
                      <button type="button" aria-expanded={expanded} onClick={() => setSelectedId(expanded ? null : row.id)} className={buttonClass}>
                        {expanded ? "Hide" : "Open"}{expanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-white/10">
                      <td colSpan={7} className="p-4 sm:p-6">
                        <RequestDetails key={`${row.id}-${row.status}`} request={row} onChanged={() => { setSelectedId(null); void load(); }} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
