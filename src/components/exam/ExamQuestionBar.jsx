"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";

/**
 * The exam's bottom bar. The part holding the current question shows its
 * numbered buttons; other parts show "Part 2 · 3 of 14" and open on click.
 * parts: [{ label, questions: [{ number, answered, flagged }] }]
 */
export default function ExamQuestionBar({ parts, current, onSelect, onToggleFlag, onReview, reviewLabel = "Review" }) {
  const all = parts.flatMap((part) => part.questions);
  const total = all.length;
  const answered = all.filter((question) => question.answered).length;
  const currentQuestion = all.find((question) => question.number === current);
  const partsRef = useRef(null);

  // Keep the current question's button visible when the bar scrolls sideways.
  useEffect(() => {
    partsRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [current]);

  return (
    <nav className="exam-bottombar" aria-label="Questions">
      <div ref={partsRef} className="exam-parts">
        {parts.map((part) => {
          const active = part.questions.some((question) => question.number === current);
          const partAnswered = part.questions.filter((question) => question.answered).length;
          return (
            <div key={part.label} className="exam-part" data-active={active}>
              <button
                type="button"
                className="exam-part-label"
                onClick={() => part.questions[0] && onSelect(part.questions[0].number)}
                aria-label={`${part.label}, ${partAnswered} of ${part.questions.length} answered`}
              >
                {part.label}
                {!active && <span>{partAnswered} of {part.questions.length}</span>}
              </button>
              {active && part.questions.map((question) => {
                const state = [question.answered ? "answered" : "not answered", question.flagged ? "flagged for review" : null].filter(Boolean).join(", ");
                return (
                  <button
                    key={question.number}
                    type="button"
                    className="exam-qbtn"
                    data-answered={question.answered}
                    data-flagged={question.flagged}
                    aria-current={question.number === current ? "true" : undefined}
                    aria-label={`Question ${question.number}, ${state}`}
                    title={`Question ${question.number}: ${state}`}
                    onClick={() => onSelect(question.number)}
                  >
                    {question.number}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="exam-bar-actions">
        <span className="exam-bar-count" aria-live="polite">{answered} of {total} answered</span>
        {onToggleFlag && currentQuestion && (
          <button
            type="button"
            className="exam-btn"
            aria-pressed={Boolean(currentQuestion.flagged)}
            onClick={() => onToggleFlag(current)}
            title="Flag this question to come back to it (Alt+F)"
          >
            <Flag size={16} aria-hidden="true" fill={currentQuestion.flagged ? "currentColor" : "none"} />
            <span className="exam-btn-label">{currentQuestion.flagged ? "Flagged" : "Flag"}</span>
          </button>
        )}
        <button type="button" className="exam-btn" onClick={() => onSelect(current - 1)} disabled={current <= 1} aria-label="Previous question (Alt+←)">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" className="exam-btn" onClick={() => onSelect(current + 1)} disabled={current >= total} aria-label="Next question (Alt+→)">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        {onReview && <button type="button" className="exam-btn exam-btn-primary" onClick={onReview}>{reviewLabel}</button>}
      </div>
    </nav>
  );
}
