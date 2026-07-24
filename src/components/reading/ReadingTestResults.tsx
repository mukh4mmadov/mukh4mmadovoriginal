"use client";

import { useState, useEffect, useRef } from "react";
import { ReadingPassage, ReadingQuestion } from "@/types/ielts";
import { scoreToBand } from "@/lib/bandScore";
import BandGauge from "@/components/shared/BandGauge";
import { CheckCircle2, XCircle, BookOpen, Lightbulb, X, ArrowLeft, Trophy, Sparkles, Clock, Target } from "lucide-react";

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

interface ReadingTestResultsProps {
  passage: ReadingPassage;
  answers: Record<string, string>;
  onRetry: () => void;
  timeSpent?: number;
}

export default function ReadingTestResults({
  passage,
  answers,
  onRetry,
  timeSpent = 0,
}: ReadingTestResultsProps) {
  const questions = allQuestions(passage);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animateIndex, setAnimateIndex] = useState(0);

  const correctCount = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const incorrectCount = questions.filter((q) => answers[q.id] && !isCorrect(q, answers[q.id])).length;
  const skippedCount = questions.filter((q) => !answers[q.id]).length;
  const band = scoreToBand(correctCount, questions.length);
  const percentage = (correctCount / questions.length) * 100;

  // Motivational feedback based on score
  const getMotivationalMessage = () => {
    if (percentage >= 90) return "Outstanding! You're ready for the real IELTS exam!";
    if (percentage >= 80) return "Excellent work! Keep practicing to maintain this level.";
    if (percentage >= 70) return "Great job! You're making solid progress.";
    if (percentage >= 60) return "Good effort! Focus on your weak areas for improvement.";
    if (percentage >= 50) return "Keep practicing! Review the explanations to learn from mistakes.";
    return "Don't give up! Study the explanations and try again.";
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (percentage >= 70) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [percentage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimateIndex((prev) => {
        if (prev < questions.length - 1) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [questions.length]);

  const toggleExplanation = (questionId: string) => {
    setExpandedExplanation(expandedExplanation === questionId ? null : questionId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <Trophy className="text-yellow-400" size={64} />
          </div>
          <Sparkles className="text-brand-400 absolute animate-pulse" size={48} style={{ top: '20%', left: '30%' }} />
          <Sparkles className="text-accent-400 absolute animate-pulse" size={32} style={{ top: '30%', right: '25%' }} />
          <Sparkles className="text-emerald-400 absolute animate-pulse" size={40} style={{ bottom: '25%', left: '25%' }} />
        </div>
      )}
      
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to test
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            {passage.subtitle}
          </p>
          <h1 className="font-display text-3xl font-bold">{passage.title}</h1>
        </div>
      </div>

      <div className="glass-card mb-8 animate-fade-in relative overflow-hidden">
        {percentage >= 70 && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-brand-500/10 to-emerald-500/10 animate-pulse" />
        )}
        <div className="relative z-10">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-brand-400" size={28} />
              <div>
                <p className="font-display text-xl font-bold">Results</p>
                <p className="text-sm text-slate-400">
                  Here&apos;s how you did on {passage.title}.
                </p>
              </div>
            </div>
            <BandGauge band={band} correct={correctCount} total={questions.length} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Target className="mx-auto mb-2 text-emerald-400" size={20} />
              <p className="text-2xl font-bold text-emerald-400">{correctCount}</p>
              <p className="text-xs text-slate-400">Correct</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <XCircle className="mx-auto mb-2 text-rose-400" size={20} />
              <p className="text-2xl font-bold text-rose-400">{incorrectCount}</p>
              <p className="text-xs text-slate-400">Incorrect</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <BookOpen className="mx-auto mb-2 text-amber-400" size={20} />
              <p className="text-2xl font-bold text-amber-400">{skippedCount}</p>
              <p className="text-xs text-slate-400">Skipped</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Clock className="mx-auto mb-2 text-brand-400" size={20} />
              <p className="text-2xl font-bold text-brand-400">{formatTime(timeSpent)}</p>
              <p className="text-xs text-slate-400">Time Spent</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Trophy className="mx-auto mb-2 text-accent-400" size={20} />
              <p className="text-2xl font-bold text-accent-400">{percentage.toFixed(0)}%</p>
              <p className="text-xs text-slate-400">Accuracy</p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="mt-6 rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-accent-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-brand-300">{getMotivationalMessage()}</p>
          </div>
        </div>
      </div>

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
              {group.questions.map((q, qIndex) => {
                const given = answers[q.id];
                const correct = isCorrect(q, given);
                const wrong = given && !correct;
                const unanswered = !given;
                const globalIndex = questions.findIndex((q2) => q2.id === q.id);
                const shouldAnimate = globalIndex <= animateIndex;
                // Calculate local question number (1-based within this group)
                const localQuestionNumber = qIndex + 1;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 transition-all duration-300 ${
                      correct
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : wrong
                        ? "border-rose-500/30 bg-rose-500/5"
                        : "border-white/10 bg-white/5"
                    } ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                        {localQuestionNumber}
                      </span>

                      <div className="flex-1">
                        <p className="text-sm text-slate-200 mb-2">
                          {q.type === "matching-headings" ? q.paragraphLabel : q.prompt}
                        </p>

                        {q.type === "sentence-completion" && (
                          <p className="text-sm text-slate-200">
                            {q.before}{" "}
                            <span className="font-semibold text-white">
                              {given || "[No answer]"}
                            </span>{" "}
                            {q.after}
                          </p>
                        )}

                        {q.type === "true-false-not-given" && given && (
                          <span className="inline-block rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white/10 border-white/20 text-slate-300">
                            {given}
                          </span>
                        )}

                        {q.type === "matching-headings" && given && (
                          <span className="inline-block rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white/10 border-white/20 text-slate-300">
                            {given}
                          </span>
                        )}

                        {q.type === "multiple-choice" && q.options && (
                          <div className="space-y-1.5">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={`rounded-lg border px-3 py-1.5 text-xs ${
                                  given === opt.key
                                    ? correct
                                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                                      : "border-rose-500 bg-rose-500/20 text-rose-300"
                                    : opt.key === q.answer
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                                    : "border-white/15 text-slate-400"
                                }`}
                              >
                                <span className="mr-1 font-semibold">{opt.key}.</span>
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {correct ? (
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        ) : wrong ? (
                          <XCircle size={20} className="text-rose-400" />
                        ) : (
                          <XCircle size={20} className="text-slate-500" />
                        )}
                      </div>
                    </div>

                    {(wrong || unanswered) && (
                      <div className="ml-9 mb-3">
                        <p className="text-xs text-emerald-400 font-semibold">
                          ✓ Correct answer:{" "}
                          <span className="text-white">
                            {q.type === "sentence-completion"
                              ? q.answer[0]
                              : q.type === "multiple-choice"
                              ? q.options?.find((o) => o.key === q.answer)?.text || q.answer
                              : q.answer}
                          </span>
                        </p>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="ml-9">
                        <button
                          onClick={() => toggleExplanation(q.id)}
                          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                            expandedExplanation === q.id
                              ? "bg-brand-500/20 border border-brand-500/50 text-brand-300"
                              : wrong
                              ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                              : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          <Lightbulb size={14} className={expandedExplanation === q.id ? "animate-pulse" : ""} />
                          {expandedExplanation === q.id ? "Hide explanation" : wrong ? "Why was this wrong?" : "Show explanation"}
                        </button>

                        {expandedExplanation === q.id && (
                          <div className="mt-3 rounded-xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-brand-500/5 p-4 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/10 rounded-full blur-2xl" />
                            <div className="relative z-10">
                              <p className="mb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
                                Explanation
                              </p>
                              <p className="text-sm text-slate-200 leading-relaxed mb-3">
                                {q.explanation}
                              </p>
                              {q.evidence && (
                                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                                  <p className="mb-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    Evidence from passage
                                  </p>
                                  <p className="text-xs text-slate-300 italic leading-relaxed">
                                    "{q.evidence}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onRetry}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
