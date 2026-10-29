"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { getWritingTask } from "@/data/writingTasks";
import { formatUzs, PREMIUM_STATUSES } from "@/lib/writing/premium.mjs";
import { cancelPremiumRequest, listMyPremiumRequests } from "@/lib/writing/premium-requests";
import PremiumPayment from "@/components/writing/PremiumPayment";
import WritingFeedback from "@/components/writing/WritingFeedback";

const TONES = {
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  brand: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export function PremiumStatus({ status }) {
  const info = PREMIUM_STATUSES[status] || { label: status, tone: "amber" };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[info.tone]}`}>{info.label}</span>;
}

function RequestCard({ request, onCancel }) {
  const [open, setOpen] = useState(request.status !== "rejected");
  const essays = Array.isArray(request.essays) ? request.essays : [];
  const feedback = Array.isArray(request.feedback) ? request.feedback : [];
  return (
    <article className="surface-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">
            Code <span className="font-mono tracking-widest">{request.code}</span> · {essays.map((item) => `Task ${item.taskNumber}`).join(" + ")}
          </p>
          <p className="mt-1 text-xs text-slate-400">{new Date(request.created_at).toLocaleString()} · {formatUzs(request.price_uzs)}</p>
        </div>
        <div className="flex items-center gap-2">
          <PremiumStatus status={request.status} />
          <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
            {open ? "Hide" : "Show"}{open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {request.status === "awaiting_payment" && (
            <>
              <PremiumPayment code={request.code} amount={request.price_uzs} compact />
              <button type="button" onClick={() => onCancel(request)} className="text-sm text-slate-400 underline hover:text-white">Cancel this request</button>
            </>
          )}
          {request.status === "paid" && (
            <p className="text-sm text-slate-300">Your payment is confirmed. Your AI Premium result is being prepared and will appear here, usually within 24 hours.</p>
          )}
          {request.status === "rejected" && (
            <p className="text-sm text-slate-300">
              This request was not accepted{request.admin_note ? `: ${request.admin_note}` : "."} If you think this is a mistake, message us on Telegram with your code.
            </p>
          )}
          {essays.map((item, index) => {
            const task = getWritingTask(item.taskSlug);
            const result = feedback[index];
            return (
              <section key={`${item.taskSlug}-${index}`} className="space-y-3" aria-labelledby={`premium-${request.id}-${index}`}>
                <h2 id={`premium-${request.id}-${index}`} className="text-lg font-bold text-white">Task {item.taskNumber}: {task?.title || item.taskSlug}</h2>
                {request.status === "done" && result && (
                  <WritingFeedback feedback={result} taskNumber={item.taskNumber} wordCount={item.wordCount} headingId={`premium-feedback-${request.id}-${index}`} />
                )}
                <details className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-brand-300">Your answer ({item.wordCount} words)</summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.essay}</p>
                </details>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function PremiumChecks() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accountUserId) return;
    setError("");
    try {
      setRequests(await listMyPremiumRequests(accountUserId));
    } catch (loadError) {
      console.error("Could not load premium requests:", loadError);
      setError("Your AI Premium checks could not be loaded. Please try again.");
      setRequests([]);
    }
  }, [accountUserId]);

  useEffect(() => { void load(); }, [load]);

  const cancel = async (request) => {
    if (!window.confirm(`Cancel AI Premium request ${request.code}? Your answer will be deleted.`)) return;
    try {
      await cancelPremiumRequest(request.id);
      await load();
    } catch {
      setError("The request could not be cancelled. It may already be paid.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/writing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> Writing practice
      </Link>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400"><Sparkles size={14} aria-hidden="true" /> AI Premium</p>
      <h1 className="section-title mb-3">My AI Premium checks</h1>
      <p className="section-subtitle mb-6 max-w-2xl">
        AI Premium gives line-by-line corrections, a Band 8+ rewrite of your answer, a deeper report on each criterion and a personal study plan. To request one, write a task and choose AI Premium when you submit.
      </p>

      {!isLoading && !accountUserId ? (
        <p className="surface-card text-sm text-slate-300">
          <Link href="/login?redirect=%2Fwriting%2Fpremium" className="font-semibold text-brand-300 underline">Sign in</Link> to see your AI Premium checks.
        </p>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
              <RefreshCw size={15} aria-hidden="true" /> Refresh
            </button>
          </div>
          {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}
          {requests === null ? (
            <p className="text-sm text-slate-400" role="status">Loading…</p>
          ) : requests.length === 0 ? (
            <div className="surface-card text-sm text-slate-300">
              No AI Premium checks yet. <Link href="/writing" className="font-semibold text-brand-300 underline">Choose a task</Link> or <Link href="/writing/test" className="font-semibold text-brand-300 underline">take a full Writing test</Link>, then pick AI Premium when you submit.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => <RequestCard key={request.id} request={request} onCancel={cancel} />)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
