"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { countWords, WRITING_TASK_RULES } from "@/data/writingTasks";
import { saveWritingResultLocally, writingDraftKey } from "@/lib/writing/writing-history.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";
import WritingExamScreen from "@/components/writing/WritingExamScreen";
import WritingFeedback from "@/components/writing/WritingFeedback";
import ShareResultButton from "@/components/shared/ShareResultButton";
import { requestWritingFeedback } from "@/lib/writing/request-feedback";
import { premiumEssays } from "@/lib/writing/premium.mjs";
import { createPremiumRequest, createPremiumRequestWithCredits, getCreditBalance } from "@/lib/writing/premium-requests";
import { PremiumRequestSaved } from "@/components/writing/PremiumPayment";

export default function WritingEditor({ task }) {
  const rules = WRITING_TASK_RULES[task.task];
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState("writing");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [premiumRequest, setPremiumRequest] = useState(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!accountUserId) { setCredits(0); return; }
    getCreditBalance().then(setCredits).catch(() => setCredits(0));
  }, [accountUserId]);

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(writingDraftKey(task.slug)) || "null");
    } catch {
      // Start with an empty draft.
    }
    setDraft({ essay: saved?.essay || "", elapsed: Number(saved?.elapsed) || 0 });
  }, [task.slug, attempt]);

  const saveDraft = useCallback(({ essays, elapsed }) => {
    const essay = essays[task.slug] || "";
    try {
      if (essay) window.localStorage.setItem(writingDraftKey(task.slug), JSON.stringify({ essay, elapsed, savedAt: Date.now() }));
      else window.localStorage.removeItem(writingDraftKey(task.slug));
    } catch {
      // The draft stays in memory for this visit.
    }
  }, [task.slug]);

  const submit = async ({ essays, elapsed, mode }) => {
    const essay = essays[task.slug] || "";
    setError("");
    setStatus("loading");
    try {
      if (mode === "premium") {
        const request = await (async () => {
          const chosen = premiumEssays([task], essays, countWords);
          return credits >= chosen.length && chosen.length > 0
            ? createPremiumRequestWithCredits(chosen)
            : createPremiumRequest(accountUserId, chosen);
        })();
        window.localStorage.removeItem(writingDraftKey(task.slug));
        setPremiumRequest(request);
        setStatus("premium");
        window.scrollTo({ top: 0 });
        return;
      }
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
      window.localStorage.removeItem(writingDraftKey(task.slug));
      setResult({ ...saved, remainingToday: data.remainingToday });
      setStatus("done");
      window.scrollTo({ top: 0 });
    } catch (cause) {
      setError(cause.message);
      setStatus("writing");
    }
  };

  const startAgain = () => {
    setResult(null);
    setStatus("writing");
    setDraft(null);
    setAttempt((value) => value + 1);
  };

  if (status === "premium" && premiumRequest) return <PremiumRequestSaved request={premiumRequest} />;

  if (status === "done" && result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/writing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} aria-hidden="true" /> All writing tasks
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Writing Task {task.task} · {task.type}</p>
        <h1 className="mb-6 mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{task.title}</h1>
        <WritingFeedback feedback={result.feedback} taskNumber={task.task} wordCount={result.wordCount} />
        <details className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-300">Show your answer ({result.wordCount} words)</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{result.essay}</p>
        </details>
        <div className="mt-6 flex flex-wrap gap-3">
          <ShareResultButton card={{ kind: `IELTS Writing Task ${task.task}`, band: result.overall, bandLabel: "Writing band", detail: task.title }} />
          <button type="button" onClick={startAgain} className="btn-secondary"><RotateCcw size={18} aria-hidden="true" /> Write it again</button>
          <Link href="/writing" className="btn-secondary">Choose another task</Link>
          <Link href="/writing/test" className="btn-primary">Try a full Writing test</Link>
        </div>
        {result.remainingToday != null && (
          <p className="mt-3 text-xs text-slate-400">{result.remainingToday} feedback {result.remainingToday === 1 ? "request" : "requests"} left today.</p>
        )}
      </main>
    );
  }

  if (!draft) return null;

  const blockedReason = isLoading
    ? "Checking your account…"
    : !accountUserId
      ? <>Sign in to get AI feedback. Your answer stays saved on this device. <Link href={`/login?redirect=${encodeURIComponent(`/writing/${task.slug}`)}`} className="underline">Sign in</Link></>
      : "";

  return (
    <WritingExamScreen
      key={attempt}
      tasks={[task]}
      title="IELTS Academic Writing"
      durationSeconds={rules.minutes * 60}
      initialEssays={{ [task.slug]: draft.essay }}
      initialElapsed={draft.elapsed}
      startOnType
      onDraftChange={saveDraft}
      onSubmit={submit}
      submitting={status === "loading"}
      blockedReason={blockedReason}
      premium
      premiumCredits={credits}
    >
      {status === "loading" && <p role="status" className="exam-toast">Marking your answer… this takes about 20 seconds.</p>}
      {error && <p role="alert" className="exam-toast" style={{ borderColor: "var(--exam-flag)" }}>{error}</p>}
    </WritingExamScreen>
  );
}
