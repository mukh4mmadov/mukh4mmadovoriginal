"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ReadingPassage, ReadingQuestion } from "@/types/ielts";
import { TestEvent } from "@/types/testEvents";
import { AIPersonality, AIConversationContext } from "@/types/aiCoach";
import { scoreToBand } from "@/lib/bandScore";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowLeft,
  Trophy,
  Sparkles,
  Clock,
  Target,
  RotateCcw,
  RefreshCcw,
  Eye,
  History,
  Bot,
} from "lucide-react";
import AIChatPanel from "@/components/ai/AIChatPanel";
import DailyInspiration from "@/components/shared/DailyInspiration";

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
  onRestartIncorrect?: () => void;
  onRestartAll?: () => void;
  timeSpent?: number;
  events?: TestEvent[];
}

export default function ReadingTestResults({
  passage,
  answers,
  onRetry,
  onRestartIncorrect,
  onRestartAll,
  timeSpent = 0,
  events = [],
}: ReadingTestResultsProps) {
  const questions = allQuestions(passage);
  const questionNumbers = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((question, index) => {
      map.set(question.id, index + 1);
    });
    return map;
  }, [questions]);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(
    null,
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const [animateIndex, setAnimateIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState<"all" | "incorrect" | "none">(
    "all",
  );
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('friendly');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const correctCount = questions.filter((q) =>
    isCorrect(q, answers[q.id]),
  ).length;
  const incorrectCount = questions.filter(
    (q) => answers[q.id] && !isCorrect(q, answers[q.id]),
  ).length;
  const skippedCount = questions.filter((q) => !answers[q.id]).length;
  const band = scoreToBand(correctCount, questions.length);
  const percentage = (correctCount / questions.length) * 100;

  const buildAIContext = (): AIConversationContext => {
    const currentQuestion = selectedQuestionId ? questions.find(q => q.id === selectedQuestionId) : undefined;
    
    return {
      passage: {
        title: passage.title,
        paragraphs: passage.paragraphs.map(p => ({
          label: p.label,
          text: p.text,
        })),
      },
      question: currentQuestion ? {
        id: currentQuestion.id,
        type: currentQuestion.type,
        prompt: currentQuestion.prompt,
        before: (currentQuestion as any).before,
        after: (currentQuestion as any).after,
        userAnswer: answers[currentQuestion.id],
        correctAnswer: currentQuestion.answer,
        explanation: currentQuestion.explanation,
        evidence: currentQuestion.evidence,
        paragraphLabel: (currentQuestion as any).paragraphLabel,
      } : undefined,
    };
  };

  const getMotivationalMessage = () => {
    if (percentage >= 90)
      return "Outstanding! You are clearly building strong IELTS Reading instincts.";
    if (percentage >= 80)
      return "Excellent work! You are close to Band 8 and ready for more challenge.";
    if (percentage >= 70)
      return "Great job! You are showing strong control of the passage and question logic.";
    if (percentage >= 60)
      return "Good effort! Focus on evidence-based reading and your weak question types.";
    if (percentage >= 50)
      return "Keep practicing! Review the explanations carefully and build your accuracy.";
    return "Keep going! Each mistake is a lesson, and your next attempt will be stronger.";
  };

  const getBandLabel = () => {
    if (band >= 8.0) return "Band 8+";
    if (band >= 7.5) return "Band 7.5";
    if (band >= 7.0) return "Band 7";
    if (band >= 6.5) return "Band 6.5";
    if (band >= 6.0) return "Band 6";
    return `Band ${band.toFixed(1)}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEventTime = (timestamp: number) => {
    if (events.length === 0) return "00:00";
    const elapsed = Math.floor((timestamp - events[0].timestamp) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getEventDescription = (event: TestEvent) => {
    switch (event.type) {
      case "opened":
        return "Opened the test";
      case "highlighted":
        return `Highlighted "${event.text}"`;
      case "highlight_removed":
        return `Removed highlight from "${event.text}"`;
      case "answered":
        return `Answered Question ${event.questionNumber}`;
      case "answer_changed":
        return `Changed Question ${event.questionNumber} from ${event.oldAnswer} to ${event.newAnswer}`;
      case "question_skipped":
        return `Skipped Question ${event.questionNumber}`;
      case "question_returned":
        return `Returned to Question ${event.questionNumber}`;
      case "submitted":
        return "Submitted the test";
      default:
        return "Unknown event";
    }
  };

  useEffect(() => {
    if (percentage < 70) {
      setShowCelebration(false);
      return;
    }

    setShowCelebration(true);
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
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
    setExpandedExplanation(
      expandedExplanation === questionId ? null : questionId,
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <Trophy className="text-yellow-400" size={64} />
          </div>
          <Sparkles
            className="text-brand-400 absolute animate-pulse"
            size={48}
            style={{ top: "20%", left: "30%" }}
          />
          <Sparkles
            className="text-accent-400 absolute animate-pulse"
            size={32}
            style={{ top: "30%", right: "25%" }}
          />
          <Sparkles
            className="text-emerald-400 absolute animate-pulse"
            size={40}
            style={{ bottom: "25%", left: "25%" }}
          />
        </div>
      )}

      {/* Daily Inspiration (Compact) */}
      <div className="mb-6">
        <DailyInspiration compact />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to test
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiChatOpen(true)}
            className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/20 transition-colors"
            title="Open AI Coach"
          >
            <Bot size={16} />
            <span className="hidden sm:inline">AI Coach</span>
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">
            {passage.subtitle}
          </p>
          <h1 className="font-display text-3xl font-bold">{passage.title}</h1>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-brand-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-300">
              Premium Results
            </p>
            <h2 className="font-display text-3xl font-semibold text-white">
              You completed the reading test with focus and precision.
            </h2>
          </div>
          <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand-300">
              Estimated Band
            </p>
            <p className="text-3xl font-semibold text-brand-100">
              {band.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Overall Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {correctCount} / {questions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">
              Correct Answers
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-200">
              {correctCount}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-rose-300">
              Incorrect Answers
            </p>
            <p className="mt-2 text-3xl font-semibold text-rose-200">
              {incorrectCount}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300">
              Skipped Questions
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-200">
              {skippedCount}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-brand-300">
              <Target size={16} />
              <p className="text-sm font-semibold">Accuracy Percentage</p>
            </div>
            <p className="mt-3 text-4xl font-semibold text-white">
              {percentage.toFixed(0)}%
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {getMotivationalMessage()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-brand-300">
              <Clock size={16} />
              <p className="text-sm font-semibold">Time Spent</p>
            </div>
            <p className="mt-3 text-4xl font-semibold text-white">
              {formatTime(timeSpent)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {getBandLabel()} •{" "}
              {correctCount >= 30 ? "Excellent pacing" : "Keep building speed"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <button
          onClick={onRestartAll ?? onRetry}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
        >
          <span className="mr-2 inline-flex">↺</span>
          Restart entire test
        </button>
        {onRestartIncorrect && (
          <button
            onClick={onRestartIncorrect}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
          >
            <RotateCcw size={15} className="mr-2 inline" />
            Restart incorrect questions
          </button>
        )}
        <button
          onClick={() =>
            setReviewMode(reviewMode === "all" ? "incorrect" : "all")
          }
          className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20"
        >
          <Eye size={15} className="mr-2 inline" />
          {reviewMode === "incorrect"
            ? "Review all answers"
            : "Review only incorrect answers"}
        </button>
      </div>

      {events.length > 0 && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <History size={20} className="text-brand-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-400">
                Reading Replay
              </p>
              <p className="text-sm text-slate-400">
                Review your test timeline and reading behavior
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.05]"
              >
                <span className="shrink-0 text-xs font-mono text-slate-500 w-16">
                  {formatEventTime(event.timestamp)}
                </span>
                <span className="text-sm text-slate-300">
                  {getEventDescription(event)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {passage.questionGroups.map((group, gi) => (
          <div key={gi} className="glass-card">
            <p className="mb-4 text-sm text-slate-400">{group.instructions}</p>

            {group.questions[0].type === "matching-headings" &&
              passage.headingBank && (
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
              {group.questions
                .filter((q) => {
                  const given = answers[q.id];
                  if (reviewMode === "incorrect") {
                    return Boolean(given && !isCorrect(q, given));
                  }
                  return true;
                })
                .map((q) => {
                  const given = answers[q.id];
                  const correct = isCorrect(q, given);
                  const wrong = given && !correct;
                  const unanswered = !given;
                  const globalIndex = questions.findIndex(
                    (q2) => q2.id === q.id,
                  );
                  const shouldAnimate = globalIndex <= animateIndex;
                  const localQuestionNumber = questionNumbers.get(q.id) ?? 1;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition-all duration-300 ${
                        correct
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : wrong
                            ? "border-rose-500/30 bg-rose-500/5"
                            : "border-white/10 bg-white/5"
                      } ${shouldAnimate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                          {localQuestionNumber}
                        </span>

                        <div className="flex-1">
                          <p className="text-sm text-slate-200 mb-2">
                            {q.type === "matching-headings"
                              ? q.paragraphLabel
                              : q.prompt}
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
                                  <span className="mr-1 font-semibold">
                                    {opt.key}.
                                  </span>
                                  {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {correct ? (
                            <CheckCircle2
                              size={20}
                              className="text-emerald-400"
                            />
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
                                  ? q.options?.find((o) => o.key === q.answer)
                                      ?.text || q.answer
                                  : q.answer}
                            </span>
                          </p>
                        </div>
                      )}

                      {(wrong || unanswered) && q.explanation && (
                        <div className="ml-9">
                          <div className="flex flex-wrap gap-2">
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
                              <Lightbulb
                                size={14}
                                className={
                                  expandedExplanation === q.id
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
                              {expandedExplanation === q.id
                                ? "Hide explanation"
                                : wrong
                                  ? "Why was this wrong?"
                                  : "Show explanation"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuestionId(q.id);
                                setAiChatOpen(true);
                              }}
                              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-300 bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20"
                            >
                              <Bot size={14} />
                              Ask AI Coach
                            </button>
                          </div>

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
                                {wrong && (
                                  <div className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                                    Your selection does not match the evidence
                                    in the passage closely enough. Re-read the
                                    relevant sentence and compare the wording
                                    before choosing again.
                                  </div>
                                )}
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
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      </div>

      <AIChatPanel
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        context={buildAIContext()}
        personality={aiPersonality}
        onPersonalityChange={setAiPersonality}
      />
    </div>
  );
}
