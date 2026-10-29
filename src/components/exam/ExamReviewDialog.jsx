"use client";

import { Flag } from "lucide-react";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { formatTimeLeft } from "@/lib/exam/exam-settings.mjs";

function NumberList({ numbers, onJump, label }) {
  if (numbers.length === 0) return <p className="text-sm" style={{ color: "var(--exam-muted)" }}>None</p>;
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label={label}>
      {numbers.map((number) => (
        <button key={number} type="button" role="listitem" className="exam-qbtn" onClick={() => onJump(number)} aria-label={`Go to question ${number}`}>
          {number}
        </button>
      ))}
    </div>
  );
}

// "Check your answers" screen before submitting: unanswered and flagged
// questions, each one a shortcut back to the question.
export default function ExamReviewDialog({ open, onClose, onSubmit, total, unanswered, flagged, remainingSeconds, onJump, itemLabel = "questions", submitLabel = "Submit test" }) {
  const dialogRef = useModalAccessibility(open, onClose);
  if (!open) return null;
  const answered = total - unanswered.length;
  return (
    <div className="exam-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="exam-review-title" className="exam-dialog">
        <h2 id="exam-review-title">Check your answers</h2>
        <p className="mb-4 text-sm">
          You have answered <b>{answered} of {total}</b> {itemLabel}.
          {remainingSeconds != null && <> You have <b>{formatTimeLeft(remainingSeconds).replace(" left", "")}</b> left.</>}
        </p>
        <h3 className="mb-2 text-sm font-bold">Not answered ({unanswered.length})</h3>
        <NumberList numbers={unanswered} onJump={onJump} label="Questions not answered" />
        <h3 className="mb-2 mt-4 flex items-center gap-1.5 text-sm font-bold"><Flag size={14} aria-hidden="true" /> Flagged for review ({flagged.length})</h3>
        <NumberList numbers={flagged} onJump={onJump} label="Questions flagged for review" />
        {unanswered.length > 0 && <p className="mt-4 text-sm">Unanswered questions will be marked as wrong.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="exam-btn" onClick={onClose}>Keep working</button>
          <button type="button" className="exam-btn exam-btn-primary" onClick={onSubmit}>{submitLabel}</button>
        </div>
      </section>
    </div>
  );
}
