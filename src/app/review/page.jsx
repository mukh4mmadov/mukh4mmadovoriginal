"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearReviewQueue,
  getReviewQueue,
  isQuestionReviewed,
  markQuestionReviewed,
  removeReviewQueueItem,
  unmarkQuestionReviewed,
} from "@/lib/reading/answer-review";

const QUESTION_TYPE_LABELS = {
  "true-false-not-given": "True / False / Not Given",
  "yes-no-not-given": "Yes / No / Not Given",
  "matching-headings": "Matching Headings",
  "multiple-choice": "Multiple Choice",
  "sentence-completion": "Sentence Completion",
};

export default function ReviewPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [queue, setQueue] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [typeFilter, setTypeFilter] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextQueue = getReviewQueue(userId);
    setQueue(nextQueue);
    setReviewedIds(new Set(nextQueue.filter((item) => isQuestionReviewed(item.id, userId)).map((item) => item.id)));
  }, [userId]);

  const typeCounts = useMemo(() => queue.reduce((counts, item) => {
    counts[item.questionType] = (counts[item.questionType] || 0) + 1;
    return counts;
  }, {}), [queue]);

  const recommendedType = useMemo(() => Object.entries(typeCounts)
    .sort((first, second) => second[1] - first[1])[0]?.[0], [typeCounts]);

  const visibleQueue = useMemo(() => typeFilter === "all"
    ? queue
    : queue.filter((item) => item.questionType === typeFilter), [queue, typeFilter]);

  const toggleReviewed = (item) => {
    const currentlyReviewed = reviewedIds.has(item.id);
    if (currentlyReviewed && !unmarkQuestionReviewed(item.id, userId)) {
      setMessage("This browser could not update review progress. Check its available storage and try again.");
      return;
    }
    if (!currentlyReviewed && !markQuestionReviewed(item.id, userId)) {
      setMessage("This browser could not save review progress. Check its available storage and try again.");
      return;
    }
    if (currentlyReviewed) {
      // The queue item remains until it is removed, so unchecking is only a visual reset for this visit.
      setReviewedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setMessage("Marked for another review.");
      return;
    }
    setReviewedIds((current) => new Set(current).add(item.id));
    setMessage("Marked as reviewed. Remove it from the queue when you are ready.");
  };

  const removeItem = (itemId) => {
    const nextQueue = removeReviewQueueItem(itemId, userId);
    if (!nextQueue) {
      setMessage("This browser could not update the queue. Check its available storage and try again.");
      return;
    }
    setQueue(nextQueue);
    setReviewedIds((current) => {
      const next = new Set(current);
      next.delete(itemId);
      return next;
    });
    setMessage("Question removed from your review queue.");
  };

  const handleClearQueue = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    if (!clearReviewQueue(userId)) {
      setMessage("This browser could not clear the queue. Check its available storage and try again.");
      return;
    }
    setQueue([]);
    setReviewedIds(new Set());
    setConfirmClear(false);
    setMessage("Review queue cleared.");
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Study review</p>
      <h1 className="mb-3 text-3xl font-bold text-white">Mistake review queue</h1>
      <p className="mb-8 max-w-2xl text-sm leading-6 text-slate-300">
        Revisit the questions you missed or skipped. Your queue and review marks are saved in this browser and do not sync to other devices.
      </p>

      {queue.length > 0 ? (
        <>
          <section className="mb-8 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5" aria-labelledby="next-review-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="next-review-title" className="font-semibold text-white">Your next focused review</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {recommendedType
                    ? `${QUESTION_TYPE_LABELS[recommendedType] || recommendedType} appears most often in your queue (${typeCounts[recommendedType]} questions).`
                    : "Choose a question below to start reviewing."}
                </p>
              </div>
              {recommendedType && (
                <button type="button" onClick={() => setTypeFilter(recommendedType)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400">
                  Review this question type <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filter review questions by type">
            <button type="button" onClick={() => setTypeFilter("all")} aria-pressed={typeFilter === "all"} className={`min-h-10 rounded-lg px-3 text-sm ${typeFilter === "all" ? "bg-brand-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              All ({queue.length})
            </button>
            {Object.entries(typeCounts).map(([type, count]) => (
              <button key={type} type="button" onClick={() => setTypeFilter(type)} aria-pressed={typeFilter === type} className={`min-h-10 rounded-lg px-3 text-sm ${typeFilter === type ? "bg-brand-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {QUESTION_TYPE_LABELS[type] || type} ({count})
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {confirmClear && <span className="text-xs text-amber-200">Clear all {queue.length} questions?</span>}
              <button type="button" onClick={handleClearQueue} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/5">
                <Trash2 size={15} aria-hidden="true" /> {confirmClear ? "Confirm clear" : "Clear queue"}
              </button>
              {confirmClear && <button type="button" onClick={() => setConfirmClear(false)} className="min-h-10 rounded-lg px-3 text-sm text-slate-400 hover:text-white">Cancel</button>}
            </div>
          </div>

          <div className="space-y-4">
            {visibleQueue.map((item) => {
              const reviewed = reviewedIds.has(item.id);
              return (
                <article key={item.id} className={`rounded-2xl border p-5 ${reviewed ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">{QUESTION_TYPE_LABELS[item.questionType] || item.questionType}</p>
                      <h2 className="mt-1 font-semibold text-white">{item.passageTitle} · Question {item.questionNumber}</h2>
                    </div>
                    <span className="text-xs text-slate-400">Missed {item.attempts} {item.attempts === 1 ? "time" : "times"}</span>
                  </div>

                  <p className="text-sm leading-6 text-slate-200">{item.sentenceBefore}{item.questionText}{item.sentenceAfter}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-rose-500/5 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-300">Your answer</p>
                      <p className="break-words text-sm text-slate-200">{item.selectedAnswer}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/5 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">Answer</p>
                      <p className="break-words text-sm text-slate-200">{item.correctAnswer}</p>
                    </div>
                  </div>
                  {item.explanation && <p className="mt-4 text-sm leading-6 text-slate-300">{item.explanation}</p>}
                  {item.evidence && <blockquote className="mt-3 border-l-2 border-brand-400 pl-3 text-sm italic leading-6 text-slate-400">{item.evidence}</blockquote>}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleReviewed(item)} aria-pressed={reviewed} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
                      <CheckCircle2 size={16} aria-hidden="true" /> {reviewed ? "Reviewed" : "Mark reviewed"}
                    </button>
                    <Link href={`/reading/${item.passageSlug}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500/10 px-3 text-sm font-medium text-brand-200 hover:bg-brand-500/20">
                      <BookOpen size={16} aria-hidden="true" /> Practice this passage
                    </Link>
                    <button type="button" onClick={() => removeItem(item.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
                      <RotateCcw size={15} aria-hidden="true" /> Remove from queue
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ClipboardList className="mx-auto mb-4 text-brand-300" size={36} aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">Your review queue is clear</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-300">After your next passage, save missed or skipped questions here and use their explanations to plan what to practice next.</p>
          <Link href="/reading" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400">
            Choose a passage <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
      {message && <p role="status" className="mt-5 text-sm text-slate-300">{message}</p>}
    </main>
  );
}
