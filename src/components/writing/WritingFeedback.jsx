import { ArrowRight, CheckCircle2, Lightbulb, ListChecks, PenLine, Sparkles } from "lucide-react";
import { WRITING_TASK_RULES } from "@/data/writingTasks";

const CRITERIA = [
  { key: "task", label: (taskNumber) => WRITING_TASK_RULES[taskNumber].criteria[0] },
  { key: "coherence", label: () => "Coherence and Cohesion" },
  { key: "lexical", label: () => "Lexical Resource" },
  { key: "grammar", label: () => "Grammatical Range and Accuracy" },
];

const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));

export default function WritingFeedback({ feedback, taskNumber, wordCount, headingId = "writing-feedback-title" }) {
  if (!feedback) return null;
  const minWords = WRITING_TASK_RULES[taskNumber].minWords;
  return (
    <section aria-labelledby={headingId} className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-400/25 bg-brand-500/10 p-5 sm:flex-row sm:items-center">
        <div className="text-center sm:pr-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Estimated band</p>
          <p className="font-display text-5xl font-bold text-white">{formatBand(feedback.overall)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-lg font-bold text-white">{feedback.premium ? "AI Premium feedback" : "AI examiner feedback"}</h2>
          {feedback.summary && <p className="mt-1 text-sm leading-6 text-slate-300">{feedback.summary}</p>}
          <p className="mt-2 text-xs text-slate-400">
            {wordCount != null && <>{wordCount} words{wordCount < minWords ? ` (below the ${minWords}-word minimum)` : ""} · </>}
            An AI estimate for practice, not an official IELTS score.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map(({ key, label }) => (
          <article key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-100">{label(taskNumber)}</h3>
              <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-sm font-bold text-white">{formatBand(feedback.bands?.[key])}</span>
            </div>
            {feedback.comments?.[key] && <p className="mt-2 text-sm leading-6 text-slate-300">{feedback.comments[key]}</p>}
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {feedback.strengths?.length > 0 && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={18} aria-hidden="true" /> What you did well</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        )}
        {feedback.improvements?.length > 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300"><Lightbulb size={18} aria-hidden="true" /> How to improve</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        )}
      </div>

      {feedback.corrections?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-100"><PenLine size={18} className="text-brand-400" aria-hidden="true" /> {feedback.premium ? "Line-by-line corrections" : "Sentence corrections"}</h3>
          <ul className="space-y-3">
            {feedback.corrections.map((item, index) => (
              <li key={`${index}-${item.original}`} className="rounded-lg bg-white/[0.04] p-3 text-sm">
                <p className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                  <span className="text-rose-300 line-through decoration-rose-400/60">{item.original}</span>
                  <ArrowRight size={16} className="hidden shrink-0 text-slate-500 sm:mt-0.5 sm:block" aria-hidden="true" />
                  <span className="sr-only">should be</span>
                  <span className="text-emerald-300">{item.improved}</span>
                </p>
                {item.reason && <p className="mt-1 text-xs text-slate-400">{item.reason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.rewrite && (
        <div className="rounded-xl border border-brand-400/20 bg-brand-500/[0.06] p-4">
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-brand-200"><Sparkles size={18} aria-hidden="true" /> Band 8+ version of your answer</h3>
          <p className="mb-3 text-xs text-slate-400">Your ideas, rewritten at a high band. Compare it with your answer paragraph by paragraph.</p>
          <div className="space-y-3 text-sm leading-7 text-slate-200">
            {feedback.rewrite.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </div>
      )}

      {feedback.studyPlan?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-100"><ListChecks size={18} className="text-brand-400" aria-hidden="true" /> Your study plan</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-300">
            {feedback.studyPlan.map((item) => <li key={item}>{item.replace(/^\d+[.)]\s*/, "")}</li>)}
          </ol>
        </div>
      )}
    </section>
  );
}
