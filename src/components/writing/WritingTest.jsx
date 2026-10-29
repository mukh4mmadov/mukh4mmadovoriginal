"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, PenLine, RotateCcw, Shuffle } from "lucide-react";
import writingTasks, { countWords, getWritingTask, WRITING_TASK_RULES } from "@/data/writingTasks";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { combinedWritingBand, pickWritingTestPair } from "@/lib/writing/writing-feedback.mjs";
import { requestWritingFeedback } from "@/lib/writing/request-feedback";
import { saveWritingResultLocally } from "@/lib/writing/writing-history.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";
import WritingExamScreen from "@/components/writing/WritingExamScreen";
import WritingFeedback from "@/components/writing/WritingFeedback";
import { PremiumRequestSaved } from "@/components/writing/PremiumPayment";
import { premiumEssays } from "@/lib/writing/premium.mjs";
import { createPremiumRequest } from "@/lib/writing/premium-requests";

const DRAFT_KEY = "ielts-writing-test-draft-v1";
const DURATION = 60 * 60;
const MIN_WORDS_FOR_FEEDBACK = 50;

function readDraft() {
  try {
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null");
    const tasks = (draft?.taskSlugs || []).map(getWritingTask);
    return tasks.length === 2 && tasks.every(Boolean) ? { ...draft, tasks } : null;
  } catch {
    return null;
  }
}

const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));

/**
 * A full IELTS Writing test: Task 1 and Task 2 in 60 minutes in the exam
 * layout, then AI feedback on both tasks and an overall Writing band.
 */
export default function WritingTest() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [stage, setStage] = useState("intro");
  const [pair, setPair] = useState(null);
  const [savedDraft, setSavedDraft] = useState(null);
  const [initial, setInitial] = useState({ essays: {}, elapsed: 0 });
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [premiumRequest, setPremiumRequest] = useState(null);

  useEffect(() => {
    const draft = readDraft();
    setSavedDraft(draft);
    setPair(draft?.tasks || pickWritingTestPair(writingTasks));
  }, []);

  const saveDraft = useCallback(({ essays, elapsed }) => {
    if (!pair) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ taskSlugs: pair.map((task) => task.slug), essays, elapsed, savedAt: Date.now() }));
    } catch {
      // The test still works; it just can't be resumed after leaving.
    }
  }, [pair]);

  const start = (resume) => {
    if (resume && savedDraft) {
      setPair(savedDraft.tasks);
      setInitial({ essays: savedDraft.essays || {}, elapsed: Number(savedDraft.elapsed) || 0 });
    } else {
      setInitial({ essays: {}, elapsed: 0 });
    }
    setError("");
    setStage("writing");
  };

  const submit = async ({ essays, elapsed, mode }) => {
    setStage("marking");
    setError("");
    if (mode === "premium") {
      try {
        setPremiumRequest(await createPremiumRequest(accountUserId, premiumEssays(pair, essays, countWords)));
        try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
        setStage("premium");
        window.scrollTo({ top: 0 });
      } catch (cause) {
        setError(cause.message);
        setInitial({ essays, elapsed });
        setStage("writing");
      }
      return;
    }
    const marked = [];
    for (const [index, task] of pair.entries()) {
      const essay = essays[task.slug] || "";
      const words = countWords(essay);
      if (words < MIN_WORDS_FOR_FEEDBACK) {
        marked.push({ task, essay, words, skipped: `Part ${index + 1} has ${words} ${words === 1 ? "word" : "words"}, too few to mark (at least ${MIN_WORDS_FOR_FEEDBACK}).` });
        continue;
      }
      setProgress(`Marking Part ${index + 1} of 2… about 20 seconds`);
      try {
        const data = await requestWritingFeedback(task.slug, essay, elapsed);
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
        marked.push({ task, essay, words, result: saved });
      } catch (cause) {
        marked.push({ task, essay, words, skipped: `Part ${index + 1} could not be marked: ${cause.message}` });
      }
    }
    setProgress("");
    if (marked.every((item) => !item.result)) {
      // Nothing was marked: keep the answers and go back to the test.
      setError(marked.map((item) => item.skipped).join(" "));
      setInitial({ essays, elapsed });
      setStage("writing");
      return;
    }
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
    setResults(marked);
    setStage("done");
    window.scrollTo({ top: 0 });
  };

  if (!pair) return null;

  if (stage === "premium" && premiumRequest) return <PremiumRequestSaved request={premiumRequest} />;

  if (stage === "writing" || stage === "marking") {
    const blockedReason = isLoading
      ? "Checking your account…"
      : !accountUserId
        ? <>Sign in to get AI feedback. Your answers stay saved on this device. <Link href="/login?redirect=%2Fwriting%2Ftest" className="underline">Sign in</Link></>
        : "";
    return (
      <WritingExamScreen
        tasks={pair}
        title="IELTS Academic Writing test"
        durationSeconds={DURATION}
        initialEssays={initial.essays}
        initialElapsed={initial.elapsed}
        onDraftChange={saveDraft}
        onSubmit={submit}
        submitting={stage === "marking"}
        blockedReason={blockedReason}
        exitLabel="Save & exit"
        premium
      >
        {progress && <p role="status" className="exam-toast">{progress}</p>}
        {error && !progress && <p role="alert" className="exam-toast" style={{ borderColor: "var(--exam-flag)" }}>{error}</p>}
      </WritingExamScreen>
    );
  }

  if (stage === "done") {
    const [first, second] = results;
    const overall = combinedWritingBand(first?.result?.overall, second?.result?.overall);
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/writing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} aria-hidden="true" /> Writing practice
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Your Writing test result</h1>
        <section className="mt-6 rounded-2xl border border-brand-400/25 bg-brand-500/10 p-6" aria-labelledby="writing-test-band">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Estimated Writing band</p>
          <p id="writing-test-band" className="mt-1 font-display text-6xl font-bold text-white">{formatBand(overall)}</p>
          <p className="mt-2 text-sm text-slate-300">
            {overall == null
              ? "Both parts need feedback for an overall band."
              : `Part 1: ${formatBand(first.result.overall)} · Part 2: ${formatBand(second.result.overall)}. Part 2 counts twice as much as Part 1, as in IELTS.`}
          </p>
          <p className="mt-1 text-xs text-slate-400">An AI estimate for practice, not an official IELTS score.</p>
        </section>
        {results.map((item, index) => (
          <section key={item.task.slug} className="mt-8" aria-labelledby={`writing-test-part-${index}`}>
            <h2 id={`writing-test-part-${index}`} className="mb-3 text-xl font-bold text-white">Part {index + 1}: {item.task.title}</h2>
            {item.result
              ? <WritingFeedback feedback={item.result.feedback} taskNumber={item.task.task} wordCount={item.result.wordCount} headingId={`writing-feedback-title-${index}`} />
              : <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">{item.skipped}</p>}
            {item.essay && (
              <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-300">Show your answer ({item.words} words)</summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.essay}</p>
              </details>
            )}
          </section>
        ))}
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => { setPair(pickWritingTestPair(writingTasks)); setSavedDraft(null); setStage("intro"); }}>
            <RotateCcw size={18} aria-hidden="true" /> Take another Writing test
          </button>
          <Link href="/writing" className="btn-secondary">Practise single tasks</Link>
        </div>
      </main>
    );
  }

  const draftLeft = savedDraft ? Math.max(0, DURATION - (Number(savedDraft.elapsed) || 0)) : 0;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/writing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> Writing practice
      </Link>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Full Writing test</p>
      <h1 className="section-title mb-3">IELTS Academic Writing test</h1>
      <p className="section-subtitle mb-6 max-w-2xl">Two tasks in 60 minutes, in the same layout as the computer-delivered exam. When you submit, both tasks get AI feedback and you get an overall Writing band.</p>

      <ul className="mb-6 grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"><Clock size={18} className="mb-1 text-brand-400" aria-hidden="true" /> 60 minutes for both parts</li>
        <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"><PenLine size={18} className="mb-1 text-brand-400" aria-hidden="true" /> Part 1: at least {WRITING_TASK_RULES[1].minWords} words (about 20 min)</li>
        <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"><PenLine size={18} className="mb-1 text-brand-400" aria-hidden="true" /> Part 2: at least {WRITING_TASK_RULES[2].minWords} words (about 40 min)</li>
      </ul>

      <section className="surface-card mb-6" aria-labelledby="writing-test-tasks">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="writing-test-tasks" className="text-lg font-bold text-slate-100">{savedDraft ? "Your unfinished test" : "Your tasks"}</h2>
          {!savedDraft && (
            <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/5" onClick={() => setPair(pickWritingTestPair(writingTasks))}>
              <Shuffle size={15} aria-hidden="true" /> Different tasks
            </button>
          )}
        </div>
        <ol className="space-y-2 text-sm text-slate-300">
          {pair.map((task, index) => <li key={task.slug}><b className="text-slate-100">Part {index + 1}</b> · {task.type} · {task.title}</li>)}
        </ol>
      </section>

      {!isLoading && !accountUserId && (
        <p className="mb-4 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4 text-sm text-slate-300">
          You can write without an account, but AI feedback needs you to <Link href="/login?redirect=%2Fwriting%2Ftest" className="font-semibold text-brand-300 underline">sign in</Link>. Feedback for both parts uses 2 of your 5 daily requests.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {savedDraft ? (
          <>
            <button type="button" className="btn-primary" onClick={() => start(true)}>Resume test ({Math.ceil(draftLeft / 60)} minutes left)</button>
            <button type="button" className="btn-secondary" onClick={() => { try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ } setSavedDraft(null); setPair(pickWritingTestPair(writingTasks)); }}>Start a new test instead</button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => start(false)}>Start the 60-minute test</button>
        )}
      </div>
    </main>
  );
}
