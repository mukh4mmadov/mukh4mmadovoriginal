"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Trash2 } from "lucide-react";
import { clearReviewQueue, getReviewQueue, markQuestionReviewed, removeReviewQueueItem } from "@/lib/reading/answer-review";
import { useAuth } from "@/contexts/AuthContext";

const questionTypeLabels = {
  "true-false-not-given": "True / False / Not Given",
  "yes-no-not-given": "Yes / No / Not Given",
  "matching-headings": "Matching Headings",
  "multiple-choice": "Multiple Choice",
  "sentence-completion": "Sentence Completion",
};

export default function ReviewQueuePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reviewActionMessage, setReviewActionMessage] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    setItems(getReviewQueue(user?.id));
    setIsLoaded(true);
  }, [isAuthLoading, user?.id]);

  function markReviewed(itemId) {
    setReviewActionMessage("");
    if (!markQuestionReviewed(itemId, user?.id)) {
      setReviewActionMessage("This question could not be marked reviewed because browser storage is unavailable.");
      return;
    }
    const nextItems = removeReviewQueueItem(itemId, user?.id);
    if (nextItems) {
      setItems(nextItems);
    } else {
      setReviewActionMessage("The reviewed status was saved, but the queue could not be updated. Reload this page and try again.");
    }
  }

  function clearQueue() {
    if (!window.confirm("Clear all questions from your review queue? This cannot be undone.")) return;
    if (clearReviewQueue(user?.id)) setItems([]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Practice review</p>
          <h1 className="section-title mb-3">Mistake review queue</h1>
          <p className="max-w-2xl text-slate-400">
            Revisit missed and skipped questions, compare your answer with the passage evidence, and mark each one reviewed when you are ready.
          </p>
        </div>
        <Link href="/reading" className="btn-secondary">
          Find a passage <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        This queue is saved in this browser only. It is not synced to your account or other devices, and clearing this browser&apos;s site data will remove it.
      </p>

      {!isLoaded ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400" role="status">
          Loading your review queue…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
          <ClipboardList className="mx-auto mb-4 text-slate-500" size={40} aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold text-white">Your queue is clear</h2>
          <p className="mx-auto mb-5 max-w-xl text-slate-400">
            After submitting a passage, save missed or skipped questions here to review their explanations and evidence later.
          </p>
          <Link href="/reading" className="btn-primary">Choose a passage</Link>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-300" aria-live="polite">
            {items.length} question{items.length === 1 ? "" : "s"} to review{user ? " in this account on this browser" : " on this browser"}
            </p>
            <button
              type="button"
              onClick={clearQueue}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 size={15} aria-hidden="true" /> Clear queue
            </button>
          </div>
          {reviewActionMessage && <p className="mb-4 text-sm text-amber-200" role="status">{reviewActionMessage}</p>}

          <div className="space-y-5">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                      {item.passageTitle} · Question {item.questionNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {questionTypeLabels[item.questionType] || item.questionType}
                      {item.attempts > 1 ? ` · Added after ${item.attempts} attempts` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markReviewed(item.id)}
                    aria-label={`Mark question ${item.questionNumber} from ${item.passageTitle} as reviewed`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" /> Mark reviewed
                  </button>
                </div>

                <h2 className="mb-4 text-base font-semibold leading-7 text-white">
                  {item.questionText || `Question ${item.questionNumber}`}
                </h2>
                {item.sentenceBefore && (
                  <p className="mb-4 rounded-lg bg-white/5 p-3 text-sm leading-6 text-slate-300">
                    {item.sentenceBefore} <strong className="text-rose-200">{item.selectedAnswer}</strong> {item.sentenceAfter}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-300">Your answer</p>
                    <p className="text-sm text-slate-200">{item.selectedAnswer}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">Accepted answer</p>
                    <p className="text-sm text-slate-200">{item.correctAnswer}</p>
                  </div>
                </div>

                {item.explanation && (
                  <div className="mt-4 rounded-xl border border-brand-400/20 bg-brand-400/5 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-300">Explanation</p>
                    <p className="text-sm leading-6 text-slate-200">{item.explanation}</p>
                  </div>
                )}

                {item.evidence && (
                  <blockquote className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">Evidence from the passage</p>
                    <p className="text-sm italic leading-6 text-slate-300">“{item.evidence}”</p>
                  </blockquote>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
