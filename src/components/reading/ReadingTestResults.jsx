"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowLeft,
  Clock,
  Target,
  RotateCcw,
  RefreshCcw,
  Eye,
  History,
  Bot,
  Share2,
} from "lucide-react";
import AIChatPanel from "@/components/ai/AIChatPanel";
import DailyInspiration from "@/components/shared/DailyInspiration";
import Link from "next/link";
import { addMissedQuestionsToReviewQueue, getReviewQueue, isAnswerCorrect } from "@/lib/reading/answer-review";

function allQuestions(passage) {
  return passage.questionGroups.flatMap((g) => g.questions);
}

export default function ReadingTestResults({
  passage,
  answers,
  onRetry,
  onRestartIncorrect,
  onRestartAll,
  timeSpent = 0,
  events = [],
  userId,
}) {
  const questions = allQuestions(passage);
  const questionNumbers = useMemo(() => {
    const map = new Map();
    questions.forEach((question, index) => {
      map.set(question.id, index + 1);
    });
    return map;
  }, [questions]);
  const [expandedExplanation, setExpandedExplanation] = useState(
    null,
  );
  const [animateIndex, setAnimateIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(
    "all",
  );
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('friendly');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [reviewQueueCount, setReviewQueueCount] = useState(0);
  const [reviewQueueMessage, setReviewQueueMessage] = useState("");
  const [missedQuestionsSaved, setMissedQuestionsSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const correctCount = questions.filter((q) =>
    isAnswerCorrect(q, answers[q.id]),
  ).length;
  const incorrectCount = questions.filter(
    (q) => answers[q.id] && !isAnswerCorrect(q, answers[q.id]),
  ).length;
  const skippedCount = questions.filter((q) => !answers[q.id]).length;
  const missedCount = incorrectCount + skippedCount;
  const percentage = questions.length > 0
    ? (correctCount / questions.length) * 100
    : 0;
  const resultSummary = `You answered ${correctCount} of ${questions.length} questions correctly${skippedCount > 0 ? ` and skipped ${skippedCount}` : ""}.`;

  useEffect(() => {
    setReviewQueueCount(getReviewQueue(userId).length);
  }, [userId]);

  const analyticsByType = useMemo(() => {
    const typeStats = {};
    
    questions.forEach((q) => {
      const type = q.type;
      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0, time: 0 };
      }
      typeStats[type].total++;
      if (isAnswerCorrect(q, answers[q.id])) {
        typeStats[type].correct++;
      }
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      accuracy: (stats.correct / stats.total) * 100,
      count: stats.total,
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [questions, answers]);

  const strongestSkill = analyticsByType[0];
  const weakestSkill = analyticsByType[analyticsByType.length - 1];
  const avgTimePerQuestion = questions.length > 0 ? timeSpent / questions.length : 0;

  const buildAIContext = () => {
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
        before: currentQuestion.type === 'sentence-completion' ? currentQuestion.before : undefined,
        after: currentQuestion.type === 'sentence-completion' ? currentQuestion.after : undefined,
        userAnswer: answers[currentQuestion.id],
        correctAnswer: currentQuestion.answer,
        isCorrect: isAnswerCorrect(currentQuestion, answers[currentQuestion.id]),
        explanation: currentQuestion.explanation,
        evidence: currentQuestion.evidence,
        paragraphLabel: currentQuestion.type === 'matching-headings' ? currentQuestion.paragraphLabel : undefined,
      } : undefined,
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEventTime = (timestamp) => {
    if (events.length === 0) return "00:00";
    const elapsed = Math.floor((timestamp - events[0].timestamp) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getEventDescription = (event) => {
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
    const timer = setInterval(() => {
      setAnimateIndex((prev) => {
        if (prev < questions.length - 1) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [questions.length]);

  const toggleExplanation = (questionId) => {
    setExpandedExplanation(
      expandedExplanation === questionId ? null : questionId,
    );
  };

  const saveMissedQuestions = () => {
    const queue = addMissedQuestionsToReviewQueue(passage, answers, userId);
    if (!queue) {
      setReviewQueueMessage("Your review queue could not be saved in this browser. Check available storage and try again.");
      return;
    }

    setReviewQueueCount(queue.length);
    setMissedQuestionsSaved(true);
    setReviewQueueMessage(`${missedCount} missed or skipped question${missedCount === 1 ? "" : "s"} saved to your review queue.`);
  };

  const shareResult = async () => {
    const report = [
      `Passage: ${passage.title}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Score: ${correctCount}/${questions.length} correct`,
      `Skipped: ${skippedCount}`,
      `Percentage: ${percentage.toFixed(0)}%`,
      `Time: ${formatTime(timeSpent)}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "My IELTS Reading practice result", text: report });
        setShareMessage("Your result was shared.");
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        setShareMessage("Result copied. You can paste it into a message.");
        return;
      }
    } catch (error) {
      if (error.name === "AbortError") return;
    }

    try {
      const file = new Blob([report], { type: "text/plain;charset=utf-8" });
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `reading-result-${passage.slug}.txt`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      setShareMessage("Result downloaded as a text file.");
    } catch {
      setShareMessage("Could not share or download this result. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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
            <ArrowLeft size={16} aria-hidden="true" />
            Back to test
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiChatOpen(true)}
            className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/20 transition-colors"
            title="Open AI Coach"
            aria-label="Open AI Coach"
          >
            <Bot size={16} aria-hidden="true" />
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

      <div className="premium-results-card mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-brand-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="premium-text-brand mb-2 text-[11px] font-semibold uppercase tracking-[0.28em]">
              Premium Results
            </p>
            <h2 className="premium-text-primary font-display text-3xl font-semibold">
              Your results
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="premium-text-muted text-[11px] uppercase tracking-[0.24em]">
              Overall Score
            </p>
            <p className="premium-text-primary mt-2 text-3xl font-semibold">
              {correctCount} / {questions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="premium-text-correct text-[11px] uppercase tracking-[0.24em]">
              Correct Answers
            </p>
            <p className="premium-text-correct mt-2 text-3xl font-semibold">
              {correctCount}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="premium-text-incorrect text-[11px] uppercase tracking-[0.24em]">
              Incorrect Answers
            </p>
            <p className="premium-text-incorrect mt-2 text-3xl font-semibold">
              {incorrectCount}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="premium-text-skipped text-[11px] uppercase tracking-[0.24em]">
              Skipped Questions
            </p>
            <p className="premium-text-skipped mt-2 text-3xl font-semibold">
              {skippedCount}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="premium-text-brand flex items-center gap-2">
              <Target size={16} />
              <p className="text-sm font-semibold">Accuracy Percentage</p>
            </div>
            <p className="premium-text-primary mt-3 text-4xl font-semibold">
              {percentage.toFixed(0)}%
            </p>
            <p className="premium-text-muted mt-2 text-sm">{resultSummary}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="premium-text-brand flex items-center gap-2">
              <Clock size={16} />
              <p className="text-sm font-semibold">Time Spent</p>
            </div>
            <p className="premium-text-primary mt-3 text-4xl font-semibold">
              {formatTime(timeSpent)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-brand-500/20">
              <Target size={20} className="text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Performance Analytics</h3>
              <p className="text-sm text-slate-400">Breakdown by question type</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyticsByType.map((stat) => (
              <div key={stat.type} className="rounded-xl border border-white/10 bg-surface/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {stat.type.replace(/-/g, ' ')}
                  </p>
                  <p className="text-lg font-bold text-white">{stat.accuracy.toFixed(0)}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {stat.count} question{stat.count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                Strongest Skill
              </p>
              <p className="text-sm font-medium text-white">
                {strongestSkill?.type.replace(/-/g, ' ') || 'N/A'}
              </p>
              <p className="text-xs text-emerald-300 mt-1">
                {strongestSkill?.accuracy.toFixed(0)}% accuracy
              </p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                Weakest Skill
              </p>
              <p className="text-sm font-medium text-white">
                {weakestSkill?.type.replace(/-/g, ' ') || 'N/A'}
              </p>
              <p className="text-xs text-rose-300 mt-1">
                {weakestSkill?.accuracy.toFixed(0)}% accuracy
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                Avg Time/Question
              </p>
              <p className="text-sm font-medium text-white">
                {Math.round(avgTimePerQuestion)}s
              </p>
              <p className="text-xs text-amber-300 mt-1">
                {avgTimePerQuestion < 90 ? 'Good pace' : 'Improve speed'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2">
              💡 Suggested Next Practice
            </p>
            <p className="text-sm text-white">
              {weakestSkill && weakestSkill.accuracy < 70
                ? `Focus on ${weakestSkill.type.replace(/-/g, ' ')} questions to improve your reading accuracy.`
                : "Great job! Try practicing more complex passages to challenge yourself further."}
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
            Retry incorrect answers
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
            : "Review incorrect and skipped answers"}
        </button>
        {missedCount > 0 && (
          <button
            type="button"
            onClick={saveMissedQuestions}
            disabled={missedQuestionsSaved}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
          >
            <RefreshCcw size={15} className="mr-2 inline" />
            {missedQuestionsSaved ? "Saved to review queue" : `Save ${missedCount} for later review`}
          </button>
        )}
        {reviewQueueCount > 0 && (
          <Link href="/review" className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/20">
            Open review queue ({reviewQueueCount})
          </Link>
        )}
        <button type="button" onClick={shareResult} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
          <Share2 size={15} aria-hidden="true" /> Share this result
        </button>
        {shareMessage && <p className="w-full text-sm text-slate-300" role="status">{shareMessage}</p>}
        {reviewQueueMessage && <p className="w-full text-sm text-slate-300" role="status">{reviewQueueMessage}</p>}
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
                    return !given || !isAnswerCorrect(q, given);
                  }
                  return true;
                })
                .map((q) => {
                  const given = answers[q.id];
                  const correct = isAnswerCorrect(q, given);
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

                      {(q.explanation || q.evidence) && (
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
                                : correct
                                  ? "Why is this correct?"
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
                                  {q.type.replace(/-/g, " ")} · Explanation
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
