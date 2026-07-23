"use client";

import { useMemo, useState } from "react";
import { ReadingPassage, ReadingQuestion } from "@/types/ielts";
import Timer from "@/components/shared/Timer";
import { BookOpen } from "lucide-react";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import ReadingTestResults from "@/components/reading/ReadingTestResults";

function allQuestions(passage: ReadingPassage): ReadingQuestion[] {
  return passage.questionGroups.flatMap((g) => g.questions);
}

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(q: ReadingQuestion, given: string | undefined): boolean {
  if (!given) return false;
  if (q.type === "true-false-not-given") return given === q.answer;
  if (q.type === "matching-headings") return given === q.answer;
  if (q.type === "multiple-choice") return given === q.answer;
  if (q.type === "sentence-completion")
    return q.answer.some((a) => normalise(a) === normalise(given));
  return false;
}

export default function ReadingTestPlayer({ passage }: { passage: ReadingPassage }) {
  const questions = useMemo(() => allQuestions(passage), [passage]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [activeQ, setActiveQ] = useState<string | null>(null);

  const setAnswer = (id: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimerRunning(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setTimerRunning(true);
    setActiveQ(null);
  };

  if (submitted) {
    return <ReadingTestResults passage={passage} answers={answers} onRetry={handleRetry} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            {passage.subtitle}
          </p>
          <h1 className="font-display text-3xl font-bold">{passage.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Timer
            initialSeconds={20 * 60}
            running={timerRunning}
            onExpire={handleSubmit}
          />
          <button
            className="btn-primary"
            onClick={handleSubmit}
          >
            Submit answers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Passage panel */}
        <div className="glass-card max-h-[75vh] overflow-y-auto lg:sticky lg:top-6">
          <HighlightablePassage paragraphs={passage.paragraphs} />
        </div>

        {/* Question panel */}
        <div className="space-y-8">
          {passage.questionGroups.map((group, gi) => (
            <div key={gi} className="glass-card">
              <p className="mb-4 text-sm text-slate-400">{group.instructions}</p>

              {group.questions[0].type === "matching-headings" && passage.headingBank && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-400">
                    List of headings
                  </p>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {passage.headingBank.map((h) => (
                      <li key={h.id}>
                        <span className="mr-2 font-semibold text-slate-100">
                          {h.id}.
                        </span>
                        {h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                {group.questions.map((q) => {
                  const given = answers[q.id];

                  return (
                    <div
                      key={q.id}
                      onFocus={() => setActiveQ(q.id)}
                      className={`rounded-xl border p-3 transition-colors ${
                        activeQ === q.id
                          ? "border-brand-500/50 bg-brand-500/5"
                          : "border-white/10"
                      }`}
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                          {q.number}
                        </span>

                        {q.type === "sentence-completion" ? (
                          <p className="text-sm text-slate-200">
                            {q.before}{" "}
                            <input
                              value={given || ""}
                              onChange={(e) => setAnswer(q.id, e.target.value)}
                              className="mx-1 w-40 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
                              placeholder={`max ${q.maxWords} words`}
                            />{" "}
                            {q.after}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-200">
                            {q.type === "matching-headings" ? q.paragraphLabel : q.prompt}
                          </p>
                        )}
                      </div>

                      {q.type === "true-false-not-given" && (
                        <div className="ml-8 flex flex-wrap gap-2">
                          {(["TRUE", "FALSE", "NOT GIVEN"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setAnswer(q.id, opt)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                given === opt
                                  ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                  : "border-white/15 text-slate-300 hover:border-white/30"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === "matching-headings" && passage.headingBank && (
                        <div className="ml-8 flex flex-wrap gap-2">
                          {passage.headingBank.map((h) => (
                            <button
                              key={h.id}
                              onClick={() => setAnswer(q.id, h.id)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                given === h.id
                                  ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                  : "border-white/15 text-slate-300 hover:border-white/30"
                              }`}
                            >
                              {h.id}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === "multiple-choice" && (
                        <div className="ml-8 space-y-1.5">
                          {q.options.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setAnswer(q.id, opt.key)}
                              className={`block w-full rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                                given === opt.key
                                  ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                  : "border-white/15 text-slate-300 hover:border-white/30"
                              }`}
                            >
                              <span className="mr-1 font-semibold">{opt.key}.</span>
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
