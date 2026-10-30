"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ChevronDown, ChevronUp, FileText, History, PenLine, Sparkles } from "lucide-react";
import writingTasks, { WRITING_TASK_RULES } from "@/data/writingTasks";
import { useWritingHistory } from "@/hooks/useWritingHistory";
import { summarizeWritingHistory } from "@/lib/writing/writing-history.mjs";
import WritingFeedback from "@/components/writing/WritingFeedback";
import { formatUzs, PREMIUM_PRICE_UZS } from "@/lib/writing/premium.mjs";

const FILTERS = [
  { id: "all", label: "All tasks" },
  { id: "1", label: "Task 1 · reports" },
  { id: "2", label: "Task 2 · essays" },
];
const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));

export default function WritingPage() {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const { history, accountUserId } = useWritingHistory();
  const summary = useMemo(() => summarizeWritingHistory(history), [history]);
  const tasks = writingTasks.filter((task) => filter === "all" || String(task.task) === filter);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Writing practice</p>
      <h1 className="section-title mb-4">Write, then get examiner-style feedback</h1>
      <p className="section-subtitle mb-8 max-w-2xl">
        Timed IELTS Academic Writing tasks with a live word count. Submit your response for AI feedback on the four official criteria and an estimated band.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {[1, 2].map((number) => (
          <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-100">
              {number === 1 ? <BarChart3 size={18} className="text-brand-400" aria-hidden="true" /> : <FileText size={18} className="text-brand-400" aria-hidden="true" />}
              Task {number}: {number === 1 ? "describe a visual" : "write an essay"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {WRITING_TASK_RULES[number].minutes} minutes · at least {WRITING_TASK_RULES[number].minWords} words{number === 2 ? " · worth twice as much as Task 1" : ""}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-brand-400/20 bg-brand-500/10 p-5 sm:flex-row sm:items-center" aria-labelledby="writing-test-promo">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-300">Full exam simulation</p>
          <h2 id="writing-test-promo" className="mt-1 text-lg font-bold text-white">Task 1 + Task 2 · 60 minutes</h2>
          <p className="mt-1 text-sm text-slate-300">Write both tasks in the exam layout and get an overall Writing band.</p>
        </div>
        <Link href="/writing/test" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 px-5 font-semibold text-white">Start a full Writing test</Link>
      </section>

      <section className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5 sm:flex-row sm:items-center" aria-labelledby="writing-premium-promo">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300"><Sparkles size={14} aria-hidden="true" /> AI Premium · {formatUzs(PREMIUM_PRICE_UZS)} per task</p>
          <h2 id="writing-premium-promo" className="mt-1 text-lg font-bold text-white">A deeper check of your writing</h2>
          <p className="mt-1 text-sm text-slate-300">Line-by-line corrections, a Band 8+ rewrite of your answer, a detailed report on each criterion and a personal study plan. Choose it when you submit; pay on Telegram, or save with a bundle of 5 or 10 checks.</p>
        </div>
        <Link href="/writing/premium" className="btn-secondary shrink-0">My AI Premium checks</Link>
      </section>

      <div role="group" aria-label="Filter writing tasks" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${filter === item.id ? "border-brand-500/50 bg-brand-500/15 text-brand-200" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map((task) => {
          const stats = summary.get(task.slug);
          return (
            <Link key={task.slug} href={`/writing/${task.slug}`} className="surface-card group flex flex-col hover:border-brand-500/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Task {task.task} · {task.type}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-100">{task.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{task.prompt}</p>
              {stats && (
                <p className="mt-3 text-xs text-emerald-300">
                  Best band {formatBand(stats.best)} · {stats.attempts} {stats.attempts === 1 ? "attempt" : "attempts"}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
                <PenLine size={16} aria-hidden="true" /> {stats ? "Write again" : "Start writing"}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <section className="mt-12" aria-labelledby="writing-history-title">
        <h2 id="writing-history-title" className="flex items-center gap-2 text-2xl font-bold text-slate-100">
          <History size={22} className="text-brand-400" aria-hidden="true" /> Your feedback history
        </h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">
          {accountUserId ? "Responses you submit are saved to your account." : "Sign in to get feedback; your results will appear here."}
        </p>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No feedback yet. Choose a task above to start.</p>
        ) : (
          <ul className="space-y-2">
            {history.slice(0, 15).map((item) => {
              const task = writingTasks.find((candidate) => candidate.slug === item.taskSlug);
              const expanded = expandedId === item.id;
              return (
                <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <button type="button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : item.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm">
                    <span className="min-w-0 flex-1 font-semibold text-slate-100">{task?.title || item.taskSlug}</span>
                    <span className="text-slate-300">Task {item.taskNumber}</span>
                    <span className="font-semibold text-slate-100">Band {formatBand(item.overall)}</span>
                    <time className="text-xs text-slate-400" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                    {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </button>
                  {expanded && (
                    <div className="space-y-4 border-t border-white/10 p-4">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-brand-300">Show your response ({item.wordCount} words)</summary>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">{item.essay}</p>
                      </details>
                      <WritingFeedback feedback={item.feedback} taskNumber={item.taskNumber} wordCount={item.wordCount} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
