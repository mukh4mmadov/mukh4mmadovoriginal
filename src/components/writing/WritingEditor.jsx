"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2, RotateCcw, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { countWords, WRITING_TASK_RULES } from "@/data/writingTasks";
import { saveWritingResultLocally, writingDraftKey } from "@/lib/writing/writing-history.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";
import WritingChart from "@/components/writing/WritingChart";
import WritingFeedback from "@/components/writing/WritingFeedback";

const formatClock = (seconds) => {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

export default function WritingEditor({ task }) {
  const rules = WRITING_TASK_RULES[task.task];
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [essay, setEssay] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const words = countWords(essay);
  const remaining = rules.minutes * 60 - elapsed;

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(writingDraftKey(task.slug)) || "null");
      if (saved?.essay) {
        setEssay(saved.essay);
        setElapsed(Number(saved.elapsed) || 0);
      }
    } catch {
      // Start with an empty draft.
    }
    setDraftReady(true);
  }, [task.slug]);

  useEffect(() => {
    if (!draftReady || result) return;
    try {
      if (essay) window.localStorage.setItem(writingDraftKey(task.slug), JSON.stringify({ essay, elapsed, savedAt: Date.now() }));
      else window.localStorage.removeItem(writingDraftKey(task.slug));
    } catch {
      // The draft stays in memory for this visit.
    }
  }, [essay, elapsed, draftReady, result, task.slug]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const handleChange = (event) => {
    setEssay(event.target.value);
    if (!timerRunning && !result) setTimerRunning(true);
  };

  const submit = async () => {
    setError("");
    if (!accountUserId) return;
    if (words < 50) {
      setError("Write at least 50 words before asking for feedback.");
      return;
    }
    setStatus("loading");
    setTimerRunning(false);
    try {
      const response = await fetch("/api/writing-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskSlug: task.slug, essay, timeSpentSeconds: elapsed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.feedback) throw new Error(data.error || "Feedback could not be generated. Please try again.");
      const saved = {
        id: data.submission?.id || makeAttemptUuid(),
        taskSlug: task.slug,
        taskNumber: task.task,
        essay,
        wordCount: data.wordCount,
        timeSpentSeconds: elapsed,
        overall: data.feedback.overall,
        feedback: data.feedback,
        createdAt: data.submission?.createdAt || new Date().toISOString(),
      };
      saveWritingResultLocally(window.localStorage, saved);
      window.localStorage.removeItem(writingDraftKey(task.slug));
      setResult({ ...saved, remainingToday: data.remainingToday });
      setStatus("done");
      window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (cause) {
      setError(cause.message);
      setStatus("idle");
    }
  };

  const startAgain = () => {
    setResult(null);
    setEssay("");
    setElapsed(0);
    setTimerRunning(false);
    setStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/writing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> All writing tasks
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="writing-task-title" className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Writing Task {task.task} · {task.type}</p>
            <h1 id="writing-task-title" className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{task.title}</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-base leading-7 text-slate-100">{task.prompt}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{task.instructions}</p>
          </div>
          <WritingChart chart={task.chart} />
        </section>

        <section aria-label="Your response" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className={`inline-flex items-center gap-2 font-mono text-lg font-semibold ${remaining <= 0 ? "text-amber-300" : "text-slate-100"}`} role="timer" aria-label={`${formatClock(remaining)} remaining`}>
              <Clock size={18} aria-hidden="true" /> {remaining > 0 ? formatClock(remaining) : "Time is up"}
            </div>
            <p className="text-sm text-slate-400">
              Suggested time {rules.minutes} min{!timerRunning && !result && elapsed === 0 ? " · starts when you type" : ""}
            </p>
            {!result && elapsed > 0 && (
              <button type="button" onClick={() => setTimerRunning((running) => !running)} className="min-h-9 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/5">
                {timerRunning ? "Pause" : "Resume"}
              </button>
            )}
          </div>

          <div>
            <label htmlFor="writing-response" className="sr-only">Your response</label>
            <textarea
              id="writing-response"
              value={essay}
              onChange={handleChange}
              readOnly={Boolean(result) || status === "loading"}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="sentences"
              rows={18}
              placeholder={task.task === 1 ? "Start with an overview of the main features…" : "Introduce the topic and state your position…"}
              className="min-h-[24rem] w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 text-base leading-7 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-describedby="writing-word-count"
            />
            <div id="writing-word-count" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
              <span className={words >= rules.minWords ? "text-emerald-300" : "text-slate-400"}>
                {words} {words === 1 ? "word" : "words"} · minimum {rules.minWords}
              </span>
              <span className="text-xs text-slate-500">Spell check is off, as in the real test. Your draft is saved on this device.</span>
            </div>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

          {!result && (
            accountUserId ? (
              <button type="button" onClick={submit} disabled={status === "loading" || words === 0} className="btn-primary w-full sm:w-auto">
                {status === "loading"
                  ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Marking your response… (about 20 seconds)</>
                  : <><Send size={18} aria-hidden="true" /> Get AI feedback</>}
              </button>
            ) : (
              <div className="rounded-xl border border-brand-400/20 bg-brand-500/10 p-4 text-sm text-slate-300">
                {isLoading ? "Checking your account…" : (
                  <>
                    <p>Sign in to get AI feedback with an estimated band. Your draft stays saved on this device.</p>
                    <Link href={`/login?redirect=${encodeURIComponent(`/writing/${task.slug}`)}`} className="btn-primary mt-3">Sign in to get feedback</Link>
                  </>
                )}
              </div>
            )
          )}

          {result && (
            <div ref={resultRef} className="scroll-mt-24 space-y-4">
              <WritingFeedback feedback={result.feedback} taskNumber={task.task} wordCount={result.wordCount} />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={startAgain} className="btn-secondary"><RotateCcw size={18} aria-hidden="true" /> Write it again</button>
                <Link href="/writing" className="btn-secondary">Choose another task</Link>
              </div>
              {result.remainingToday != null && (
                <p className="text-xs text-slate-400">{result.remainingToday} feedback {result.remainingToday === 1 ? "request" : "requests"} left today.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
