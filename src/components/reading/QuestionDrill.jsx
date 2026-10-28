"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react";
import readingTestsModule from "@/data/readingTests_new";
import { buildDrillPool, DRILL_TYPES, getDrillType, pickDrillRound } from "@/lib/reading/question-drills.mjs";
import { segmentParagraph } from "@/lib/reading/evidence-locator.mjs";
import { formatAnswer, isAnswerCorrect } from "@/lib/reading/answer-review";
import { recordDrillRound } from "@/lib/missions/daily-missions.mjs";

const ROUND_SIZE = 10;
const CHOICES = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};

function choicesFor(item) {
  const { question, passage } = item;
  if (CHOICES[question.type]) return CHOICES[question.type].map((value) => ({ value, label: value }));
  if (question.type === "multiple-choice") return (question.options || []).map((option) => ({ value: option.key, label: `${option.key}. ${option.text}` }));
  if (question.type === "matching-headings") return (passage.headingBank || []).map((heading) => ({ value: heading.id, label: `${heading.id}. ${heading.text}` }));
  return null;
}

function promptFor(question) {
  if (question.type === "matching-headings") return `Choose the correct heading for ${question.paragraphLabel || "this paragraph"}.`;
  if (question.type === "sentence-completion") return [question.before, "_____", question.after].filter(Boolean).join(" ");
  return question.prompt || "";
}

function DrillParagraph({ item, showEvidence }) {
  const { paragraph, location } = item;
  const segments = showEvidence ? segmentParagraph(paragraph.text, location.ranges) : [{ text: paragraph.text, kind: "plain" }];
  return (
    <p
      className={`break-words text-base leading-8 text-slate-200 ${showEvidence && location.kind === "paragraph" ? "evidence-paragraph rounded-xl p-3" : ""}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {paragraph.label && <span className="mr-3 font-semibold uppercase tracking-[0.2em] text-brand-400/90">{paragraph.label}</span>}
      {segments.map((segment, index) => (segment.kind === "plain"
        ? <span key={index}>{segment.text}</span>
        : <mark key={index} className={segment.kind === "match" ? "evidence-match" : "evidence-sentence"}>{segment.text}</mark>))}
    </p>
  );
}

export default function QuestionDrill({ type }) {
  const drillType = getDrillType(type);
  const pool = useMemo(() => buildDrillPool(readingTestsModule.readingTests, type), [type]);
  const [round, setRound] = useState(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState([]);

  const startRound = useCallback(() => {
    setRound(pickDrillRound(pool, ROUND_SIZE));
    setIndex(0);
    setAnswer("");
    setChecked(false);
    setResults([]);
  }, [pool]);

  // Shuffled after mount so the server and browser render the same markup.
  useEffect(() => { startRound(); }, [startRound]);

  const item = round?.[index];
  const finished = round && index >= round.length;
  const correctSoFar = results.filter((result) => result.correct).length;
  const isCorrect = checked && results[results.length - 1]?.correct;

  const check = () => {
    if (!item || !String(answer).trim()) return;
    setChecked(true);
    setResults((current) => [...current, { item, answer, correct: isAnswerCorrect(item.question, String(answer).trim()) }]);
  };

  const next = () => {
    if (index + 1 >= round.length) {
      recordDrillRound(window.localStorage, { type, correct: results.filter((result) => result.correct).length, total: results.length, completedAt: new Date().toISOString() });
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setChecked(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!drillType) return null;
  const choices = item ? choicesFor(item) : null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/reading/practice" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> All question types
      </Link>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Question type drill</p>
      <h1 className="text-3xl font-bold text-white">{drillType.label}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{drillType.tip}</p>

      {!round ? (
        <p className="mt-8 text-sm text-slate-400" role="status">Preparing your questions…</p>
      ) : pool.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No questions of this type are available yet.</p>
      ) : finished ? (
        <section className="mt-8 space-y-5" aria-labelledby="drill-summary-title">
          <div className="rounded-2xl border border-brand-400/25 bg-brand-500/10 p-6 text-center">
            <Target size={28} className="mx-auto text-brand-300" aria-hidden="true" />
            <h2 id="drill-summary-title" className="mt-2 text-2xl font-bold text-white">{correctSoFar} of {results.length} correct</h2>
            <p className="mt-1 text-sm text-slate-300">
              {correctSoFar === results.length ? "Perfect round." : correctSoFar >= results.length * 0.7 ? "Strong work. Keep the streak going." : "Read each explanation below, then try another round."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={startRound} className="btn-primary"><RotateCcw size={18} aria-hidden="true" /> Practise another {Math.min(ROUND_SIZE, pool.length)}</button>
              <Link href="/reading/practice" className="btn-secondary">Choose another type</Link>
            </div>
          </div>
          {results.some((result) => !result.correct) && (
            <div>
              <h3 className="mb-3 font-semibold text-white">Questions to look at again</h3>
              <ul className="space-y-2">
                {results.filter((result) => !result.correct).map(({ item: missed, answer: given }) => (
                  <li key={missed.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <p className="text-slate-200">{promptFor(missed.question)}</p>
                    <p className="mt-1 text-slate-400">
                      Your answer: {formatAnswer(missed.question, given, missed.passage)} · Correct: <span className="text-emerald-300">{formatAnswer(missed.question, missed.question.answer, missed.passage)}</span>
                    </p>
                    <Link href={`/reading/${missed.passage.slug}`} className="mt-1 inline-flex min-h-9 items-center text-xs text-brand-300 hover:underline">Practise “{missed.passage.title}” in full</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-400" aria-live="polite">
            <span>Question {index + 1} of {round.length}</span>
            <span>{correctSoFar} correct</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(index / round.length) * 100}%` }} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section aria-label="Paragraph" className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">From “{item.passage.title}”</p>
              <DrillParagraph item={item} showEvidence={checked} />
            </section>

            <section aria-labelledby="drill-question" className="min-w-0 space-y-4">
              <h2 id="drill-question" className="text-lg font-semibold leading-7 text-white">
                {item.question.type === "sentence-completion" ? "Complete the sentence." : promptFor(item.question)}
              </h2>

              {item.question.type === "sentence-completion" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Use no more than {item.question.maxWords || 3} {item.question.maxWords === 1 ? "word" : "words"} from the paragraph
                  </p>
                  <label className="mt-2 block text-base leading-8 text-slate-200">
                    {item.question.before}{" "}
                    <input
                      type="text"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (checked) next(); else check(); } }}
                      readOnly={checked}
                      autoComplete="off"
                      spellCheck={false}
                      aria-label="Your answer"
                      className="mx-1 inline-block min-h-10 w-48 max-w-full rounded-lg border border-white/15 bg-white/5 px-3 text-base text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />{" "}
                    {item.question.after}
                  </label>
                </div>
              ) : (
                <div role="radiogroup" aria-labelledby="drill-question" className="space-y-2">
                  {choices.map((choice) => {
                    const selected = answer === choice.value;
                    const isAnswer = checked && choice.value === item.question.answer;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={checked}
                        onClick={() => setAnswer(choice.value)}
                        className={`flex min-h-11 w-full items-start gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                          isAnswer
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                            : checked && selected
                              ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                              : selected
                                ? "border-brand-500/60 bg-brand-500/15 text-white"
                                : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {checked && (
                <div role="status" className={`rounded-xl border p-4 text-sm ${isCorrect ? "border-emerald-400/25 bg-emerald-500/[0.07]" : "border-rose-400/25 bg-rose-500/[0.07]"}`}>
                  <p className={`flex items-center gap-2 font-semibold ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
                    {isCorrect ? <CheckCircle2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}
                    {isCorrect ? "Correct" : `Not quite. The answer is ${formatAnswer(item.question, item.question.answer, item.passage)}.`}
                  </p>
                  {item.question.explanation && <p className="mt-2 leading-6 text-slate-300">{item.question.explanation}</p>}
                  <p className="mt-2 text-xs text-slate-400">
                    {item.location.kind === "exact" ? "The evidence is highlighted in the paragraph." : "The whole paragraph is the evidence."}
                  </p>
                </div>
              )}

              {checked ? (
                <button type="button" onClick={next} className="btn-primary w-full sm:w-auto">
                  {index + 1 < round.length ? "Next question" : "See your result"} <ArrowRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={check} disabled={!String(answer).trim()} className="btn-primary w-full sm:w-auto">Check answer</button>
              )}
            </section>
          </div>
        </>
      )}

      <nav aria-label="Other question types" className="mt-12 border-t border-white/10 pt-6">
        <p className="mb-3 text-sm font-semibold text-slate-300">Other question types</p>
        <div className="flex flex-wrap gap-2">
          {DRILL_TYPES.filter((entry) => entry.type !== type).map((entry) => (
            <Link key={entry.type} href={`/reading/practice/${entry.type}`} className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-4 text-sm text-slate-300 hover:bg-white/5">
              {entry.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
