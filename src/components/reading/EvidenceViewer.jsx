"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapPin, X } from "lucide-react";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { segmentParagraph } from "@/lib/reading/evidence-locator.mjs";

export function questionWording(question) {
  if (!question) return "";
  if (question.type === "sentence-completion") {
    return [question.before, "_____", question.after].filter(Boolean).join(" ");
  }
  if (question.type === "matching-headings") return `Choose the heading for ${question.paragraphLabel || question.prompt}.`;
  return question.prompt || question.paragraphLabel || "";
}

/**
 * Shows the passage with the evidence for one question highlighted, next to
 * the question's own wording, so learners can compare the paraphrase.
 */
export default function EvidenceViewer({ passage, question, questionNumber, location, correctAnswer, onClose }) {
  const closeButtonRef = useRef(null);
  const targetRef = useRef(null);
  const open = Boolean(question && location);
  const dialogRef = useModalAccessibility(open, onClose, closeButtonRef);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => targetRef.current?.scrollIntoView({ block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [open, location]);

  if (!open) return null;
  const targetParagraph = passage.paragraphs[location.paragraphIndex];
  const paragraphName = targetParagraph?.label ? `paragraph ${targetParagraph.label}` : "this paragraph";

  // Portalled to <body> so it always uses the site theme, even when opened
  // from a page area with its own fixed colours (the full mock test).
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        tabIndex={-1}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-surface text-slate-100 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id="evidence-title" className="flex items-center gap-2 text-lg font-bold">
              <MapPin size={18} className="shrink-0 text-brand-400" aria-hidden="true" /> Where the answer is
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">Question {questionNumber} · {passage.title}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/10">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {/* Two scroll areas so the question stays visible while the passage scrolls to the evidence. */}
        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <aside className="max-h-[40dvh] shrink-0 space-y-3 overflow-y-auto overscroll-contain border-b border-white/10 p-4 sm:p-6 md:max-h-none md:border-b-0 md:border-r">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">The question says</p>
              <p className="mt-1 text-base leading-7 text-slate-100">{questionWording(question)}</p>
            </div>
            {correctAnswer && (
              <p className="text-sm text-slate-300">
                Correct answer: <span className="font-semibold text-emerald-300">{correctAnswer}</span>
              </p>
            )}
            <div className="rounded-xl border border-brand-400/20 bg-brand-500/10 p-3 text-sm leading-6 text-slate-300">
              {location.kind === "exact"
                ? "The highlighted words in the passage are the evidence. Compare them with the question: IELTS usually says the same idea in different words."
                : question.type === "matching-headings"
                  ? `Read ${paragraphName} for its main idea, then compare it with the correct heading. Headings sum up the whole paragraph, not one detail.`
                  : `The answer is in ${paragraphName}. Read it again and look for words that mean the same as the question.`}
            </div>
            <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 md:flex" aria-hidden="true">
              {location.kind === "exact" && <span><mark className="evidence-match">evidence</mark></span>}
              {location.kind === "exact" && <span><mark className="evidence-sentence">its sentence</mark></span>}
            </p>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6" style={{ fontFamily: "var(--font-display)" }}>
            <h3 className="mb-4 text-lg font-bold text-slate-100">{passage.title}</h3>
            {passage.paragraphs.map((paragraph, index) => {
              const isTarget = index === location.paragraphIndex;
              const segments = isTarget ? segmentParagraph(paragraph.text, location.ranges) : [{ text: paragraph.text, kind: "plain" }];
              const firstMark = segments.findIndex((segment) => segment.kind === "match");
              return (
                <p
                  key={paragraph.label ? `${paragraph.label}-${index}` : index}
                  ref={isTarget && firstMark === -1 ? targetRef : undefined}
                  className={`mb-5 break-words leading-8 last:mb-0 ${isTarget ? "text-slate-100" : "text-slate-400"} ${isTarget && location.kind === "paragraph" ? "evidence-paragraph rounded-xl p-3" : ""}`}
                >
                  {paragraph.label && <span className="mr-3 font-semibold uppercase tracking-[0.2em] text-brand-400/90">{paragraph.label}</span>}
                  {segments.map((segment, segmentIndex) => (
                    segment.kind === "plain"
                      ? <span key={segmentIndex}>{segment.text}</span>
                      : (
                        <mark
                          key={segmentIndex}
                          ref={segmentIndex === firstMark ? targetRef : undefined}
                          className={segment.kind === "match" ? "evidence-match" : "evidence-sentence"}
                        >
                          {segment.text}
                        </mark>
                      )
                  ))}
                </p>
              );
            })}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
