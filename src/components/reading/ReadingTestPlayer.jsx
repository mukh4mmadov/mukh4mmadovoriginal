"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Timer from "@/components/shared/Timer";
import {
  Check,
  AlertTriangle,
  Type,
  MessageCircle,
  Send,
  GripVertical,
  Bot,
} from "lucide-react";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import HighlightableText from "@/components/reading/HighlightableText";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import ReadingTestResults from "@/components/reading/ReadingTestResults";
import AIChatPanel from "@/components/ai/AIChatPanel";
import { saveProgress } from "@/lib/progressTracker";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/lib/analytics/analytics.service";

function allQuestions(passage) {
  return passage.questionGroups.flatMap((g) => g.questions);
}

function normalise(s) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(q, given) {
  if (!given) return false;
  if (q.type === "true-false-not-given") return given === q.answer;
  if (q.type === "yes-no-not-given") return given === q.answer;
  if (q.type === "matching-headings") return given === q.answer;
  if (q.type === "multiple-choice") return given === q.answer;
  if (q.type === "sentence-completion")
    return q.answer.some((a) => normalise(a) === normalise(given));
  return false;
}

export default function ReadingTestPlayer({ passage }) {
  const { user } = useAuth();
  const questions = useMemo(() => allQuestions(passage), [passage]);
  const questionNumbers = useMemo(() => {
    const map = new Map();
    questions.forEach((question, index) => {
      map.set(question.id, index + 1);
    });
    return map;
  }, [questions]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(20 * 60);
  const [activeQ, setActiveQ] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [answerErrors, setAnswerErrors] = useState({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [panelWidth, setPanelWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [events, setEvents] = useState([]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPersonality, setAiPersonality] = useState("friendly");
  const startTimeRef = useRef(Date.now());
  const pausedTimeRef = useRef(0);
  const lastPauseStartRef = useRef(null);
  const questionRefs = useRef({});
  const previousAnswersRef = useRef({});
  const restoredDraftSlugRef = useRef(null);

  useEffect(() => {
    analyticsService.trackReadingStarted(user?.id ?? null, passage.slug);
  }, [user?.id, passage.slug]);

  const getElapsedSeconds = (now = Date.now()) => {
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    return Math.max(0, elapsed - pausedTimeRef.current);
  };

  const buildAIContext = () => {
    const currentQuestion = activeQ
      ? questions.find((q) => q.id === activeQ)
      : undefined;

    return {
      passage: {
        title: passage.title,
        paragraphs: passage.paragraphs.map((p) => ({
          label: p.label,
          text: p.text,
        })),
      },
      question: currentQuestion
        ? {
            id: currentQuestion.id,
            type: currentQuestion.type,
            prompt: currentQuestion.prompt,
            before:
              currentQuestion.type === "sentence-completion"
                ? currentQuestion.before
                : undefined,
            after:
              currentQuestion.type === "sentence-completion"
                ? currentQuestion.after
                : undefined,
            userAnswer: answers[currentQuestion.id],
            correctAnswer: currentQuestion.answer,
            explanation: currentQuestion.explanation,
            evidence: currentQuestion.evidence,
            paragraphLabel:
              currentQuestion.type === "matching-headings"
                ? currentQuestion.paragraphLabel
                : undefined,
          }
        : undefined,
    };
  };

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateLayout = () => setIsDesktop(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event) => {
      if (!isDesktop) return;
      const container = document.getElementById("reading-shell");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(78, Math.max(30, next));
      setPanelWidth(clamped);
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, isDesktop]);

  useEffect(() => {
    setDraftRestored(false);
    setAnswers({});
    setTimeSpent(0);
    setTimerRunning(true);
    setTimerInitialSeconds(20 * 60);
    previousAnswersRef.current = {};
    if (typeof window === "undefined") return;

    try {
      const savedData = window.localStorage.getItem(
        `ielts-reading-${passage.slug}`,
      );
      let hasValidSavedData = false;

      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          const restoredAnswers =
            parsed.answers && typeof parsed.answers === "object"
              ? parsed.answers
              : {};
          const parsedTimeSpent = Number(parsed.timeSpent);
          const restoredTimeSpent = Number.isFinite(parsedTimeSpent)
            ? Math.max(0, parsedTimeSpent)
            : 0;
          setAnswers(restoredAnswers);
          setTimeSpent(restoredTimeSpent);
          setTimerInitialSeconds(Math.max(0, 20 * 60 - restoredTimeSpent));
          setTimerRunning(parsed.timerRunning ?? true);
          startTimeRef.current = Date.now() - restoredTimeSpent * 1000;
          previousAnswersRef.current = restoredAnswers;
          hasValidSavedData = true;
        }
      }

      if (!hasValidSavedData) {
        setEvents([{ type: "opened", timestamp: Date.now() }]);
      }
    } catch (e) {
      setEvents([{ type: "opened", timestamp: Date.now() }]);
    } finally {
      restoredDraftSlugRef.current = passage.slug;
      setDraftRestored(true);
    }
  }, [passage.slug]);

  useEffect(() => {
    if (
      !draftRestored ||
      restoredDraftSlugRef.current !== passage.slug ||
      submitted ||
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      const saveData = {
        answers,
        timeSpent,
        timerRunning,
        timestamp: Date.now(),
      };

      window.localStorage.setItem(
        `ielts-reading-${passage.slug}`,
        JSON.stringify(saveData),
      );
    } catch (e) {}
  }, [answers, timeSpent, timerRunning, submitted, passage.slug, draftRestored]);

  const answeredCount = Object.keys(answers).filter((id) => answers[id]).length;
  const remainingCount = questions.length - answeredCount;
  const progress = (answeredCount / questions.length) * 100;
  const activeQuestion =
    (activeQ ? questions.find((question) => question.id === activeQ) : null) ??
    questions[0];

  const scrollToQuestion = (questionId) => {
    const element = questionRefs.current[questionId];

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
      setActiveQ(questionId);
    }
  };

  useEffect(() => {
    if (!timerRunning || typeof window === "undefined") return;

    const tick = () => {
      setTimeSpent(getElapsedSeconds());
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const handleTimerPause = () => {
    setTimerRunning(false);
    lastPauseStartRef.current = Date.now();
  };

  const handleTimerResume = () => {
    if (lastPauseStartRef.current) {
      pausedTimeRef.current += Math.floor(
        (Date.now() - lastPauseStartRef.current) / 1000,
      );
      lastPauseStartRef.current = null;
    }
    setTimerRunning(true);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimeSpent(0);
    setTimerInitialSeconds(20 * 60);
    pausedTimeRef.current = 0;
    lastPauseStartRef.current = null;
    startTimeRef.current = Date.now();
  };

  const addEvent = (event) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleHighlight = (text) => {
    addEvent({
      type: "highlighted",
      text,
      timestamp: Date.now(),
    });
    analyticsService.trackHighlightCreated(user?.id ?? null, passage.slug, {
      text,
    });
  };

  const handleHighlightRemove = (text) => {
    addEvent({
      type: "highlight_removed",
      text,
      timestamp: Date.now(),
    });
    analyticsService.trackHighlightRemoved(user?.id ?? null, passage.slug, {
      text,
    });
  };

  const highlightState = useTextHighlight(
    passage.slug,
    handleHighlight,
    handleHighlightRemove,
  );

  const setAnswer = (id, value) => {
    if (submitted) return;
    setAnswerErrors((previous) => ({ ...previous, [id]: "" }));
    setSubmitMessage("");
    const questionNumber = questionNumbers.get(id) ?? 1;
    const oldAnswer = previousAnswersRef.current[id];

    setAnswers((prev) => ({ ...prev, [id]: value }));

    const question = questions.find((q) => q.id === id);
    if (question) {
      const correct = isCorrect(question, value);
      analyticsService.trackQuestionAnswered(
        user?.id ?? null,
        passage.slug,
        id,
        correct,
      );
    }

    if (oldAnswer && oldAnswer !== value) {
      addEvent({
        type: "answer_changed",
        questionId: id,
        questionNumber,
        oldAnswer,
        newAnswer: value,
        timestamp: Date.now(),
      });
    } else if (!oldAnswer && value) {
      addEvent({
        type: "answered",
        questionId: id,
        questionNumber,
        answer: value,
        timestamp: Date.now(),
      });
    }

    previousAnswersRef.current = { ...previousAnswersRef.current, [id]: value };
  };

  const handleSubmit = () => {
    if (answeredCount === 0) {
      setSubmitMessage("Answer the questions before submitting your test.");
      scrollToQuestion(questions[0]?.id);
      return;
    }
    if (remainingCount > 0) {
      setShowSubmitDialog(true);
      return;
    }
    performSubmit();
  };

  const performSubmit = async () => {
    const finalTime = getElapsedSeconds();
    setTimeSpent(finalTime);
    setSubmitted(true);
    setTimerRunning(false);
    setShowSubmitDialog(false);

    const correctCount = questions.filter((q) =>
      isCorrect(q, answers[q.id]),
    ).length;
    const score = (correctCount / questions.length) * 100;

    addEvent({ type: "submitted", timestamp: Date.now() });

    analyticsService.trackReadingFinished(
      user?.id ?? null,
      passage.slug,
      finalTime,
    );
    analyticsService.trackPassageCompleted(
      user?.id ?? null,
      passage.slug,
      score,
    );

    try {
      await saveProgress(
        passage.slug,
        {
          completed: true,
          bestScore: score,
          attempts: 1,
          totalTime: finalTime,
        },
        user?.id,
      );

      localStorage.removeItem(`ielts-reading-${passage.slug}`);
    } catch (error) {
      console.error(
        "Failed to save progress on submit, draft retained:",
        error,
      );
    }
  };

  const resetTestState = () => {
    setAnswers({});
    setSubmitted(false);
    setTimerRunning(true);
    setActiveQ(null);
    setTimeSpent(0);
    setTimerInitialSeconds(20 * 60);
    setShowSubmitDialog(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    lastPauseStartRef.current = null;
  };

  const handleRetry = () => {
    resetTestState();
  };

  const handleRestartIncorrect = () => {
    const nextAnswers = { ...answers };
    questions.forEach((question) => {
      const given = nextAnswers[question.id];
      if (given && !isCorrect(question, given)) {
        delete nextAnswers[question.id];
      }
    });
    setAnswers(nextAnswers);
    setSubmitted(false);
    setTimerRunning(true);
    setActiveQ(null);
    setTimeSpent(0);
    setTimerInitialSeconds(20 * 60);
    setShowSubmitDialog(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    lastPauseStartRef.current = null;
  };

  if (submitted) {
    return (
      <ReadingTestResults
        passage={passage}
        answers={answers}
        onRetry={handleRetry}
        onRestartIncorrect={handleRestartIncorrect}
        onRestartAll={handleRetry}
        timeSpent={timeSpent}
        events={events}
      />
    );
  }

  return (
    <main className="flex h-screen min-h-[100dvh] flex-col bg-surface text-slate-100">
      <div className="flex-shrink-0 border-b border-white/10 bg-surface/95 px-3 py-2 backdrop-blur-sm md:px-6 md:py-3">
        <div className="mx-auto flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="w-full min-w-0 sm:flex-1">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400 sm:text-[11px]">
              {passage.subtitle}
            </p>
            <h1 className="truncate font-display text-base font-semibold sm:text-xl md:text-2xl">
              {passage.title}
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-1 sm:w-auto sm:flex-shrink-0 sm:justify-end sm:gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
              <Type size={14} className="text-slate-400" />
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`h-6 w-6 rounded-full text-[10px] font-semibold transition-all duration-200 sm:h-7 sm:w-7 sm:text-[11px] ${
                    fontSize === size
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                </button>
              ))}
            </div>

            <Timer
              initialSeconds={timerInitialSeconds}
              running={timerRunning}
              onExpire={handleSubmit}
              onPause={handleTimerPause}
              onResume={handleTimerResume}
              onReset={handleTimerReset}
            />
            <button
              type="button"
              onClick={() => setAiChatOpen(true)}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-300 transition-colors hover:bg-brand-500/20"
              aria-label="Open AI Coach"
              title="Open AI Coach"
            >
              <Bot size={16} />
              <span className="hidden sm:inline">AI Coach</span>
            </button>
            <button
              type="button"
              className="btn-primary text-sm sm:text-base"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div
        id="reading-shell"
        className="flex flex-1 flex-col overflow-hidden lg:flex-row"
      >
        <div
          className="flex-shrink-0 overflow-y-auto border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_45%)] px-4 py-4 sm:px-6 sm:py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-8"
          style={{ width: isDesktop ? `${panelWidth}%` : "100%" }}
        >
          <div className="mx-auto max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Reading passage
                </p>
                <p className="text-sm text-slate-400">
                  Read carefully and highlight key ideas as you work.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-surface/60 px-3 py-1 text-xs font-medium text-slate-300">
                {passage.wordCount ?? "—"} words
              </div>
            </div>
            <HighlightablePassage
              paragraphs={passage.paragraphs}
              fontSize={fontSize}
              highlightState={highlightState}
            />
          </div>
        </div>

        <div
          className="hidden lg:flex h-full w-2 flex-shrink-0 cursor-col-resize items-center justify-center transition-colors duration-200 hover:bg-white/10"
          onMouseDown={() => setIsResizing(true)}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize reading panels"
        >
          <div className="h-16 w-1 rounded-full bg-white/20" />
        </div>

        <div
          className="flex-1 overflow-y-auto border-t border-white/10 bg-surface/80 px-3 py-3 sm:px-4 sm:py-4 lg:border-t-0 lg:px-6 lg:py-6"
          style={{ width: isDesktop ? `${100 - panelWidth}%` : "100%" }}
        >
          <div className="mx-auto max-w-xl space-y-4 sm:space-y-5">
            {submitMessage && (
              <p
                className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
                role="alert"
                aria-live="assertive"
              >
                {submitMessage}
              </p>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[11px]">
                    Progress
                  </p>
                  <p className="text-xs text-slate-400 sm:text-sm">
                    Keep pace and track your completion.
                  </p>
                </div>
                <div className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-300 sm:px-3 sm:py-1 sm:text-sm">
                  {Math.round(progress)}%
                </div>
              </div>

              <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-surface/70 p-2 sm:p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
                    Answered
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-100 sm:text-lg">
                    {answeredCount}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface/70 p-2 sm:p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
                    Remaining
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-100 sm:text-lg">
                    {remainingCount}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface/70 p-2 sm:p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
                    Progress
                  </p>
                  <p className="mt-1 text-base font-semibold text-brand-300 sm:text-lg">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-accent-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-4">
              <div className="mb-2 flex items-center justify-between sm:mb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[11px]">
                    Question navigator
                  </p>
                  <p className="text-xs text-slate-400 sm:text-sm">
                    Jump to any question quickly.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-surface/60 px-2 py-0.5 text-[10px] font-medium text-slate-300 sm:px-3 sm:py-1 sm:text-[11px]">
                  {answeredCount}/{questions.length} answered
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {questions.map((q) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isActive = activeQ === q.id;
                  const number = questionNumbers.get(q.id) ?? 1;
                  let stateClass =
                    "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10";

                  if (isActive) {
                    stateClass =
                      "border-brand-500/40 bg-brand-500/20 text-white shadow-lg shadow-brand-500/20";
                  } else if (isAnswered) {
                    stateClass =
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
                  }

                  return (
                    <button
                      type="button"
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 sm:h-9 sm:w-9 sm:text-sm ${stateClass}`}
                      title={`Question ${number}`}
                    >
                      {isAnswered ? <Check size={14} /> : number}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {passage.questionGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <HighlightableText
                    fontSize={fontSize}
                    containerKey={`instructions-${gi}`}
                    highlightState={highlightState}
                    className="block mb-4 text-sm text-slate-400"
                  >
                    {group.instructions}
                  </HighlightableText>

                  {group.questions[0].type === "matching-headings" &&
                    passage.headingBank && (
                      <div className="mb-4 rounded-xl border border-white/10 bg-surface/60 p-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-400">
                          List of headings
                        </p>
                        <ul className="space-y-2 text-sm text-slate-300">
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

                  <div className="space-y-3">
                    {group.questions.map((q) => {
                      const given = answers[q.id];
                      const localQuestionNumber =
                        questionNumbers.get(q.id) ?? 1;

                      return (
                        <div
                          key={q.id}
                          ref={(el) => {
                            if (el) questionRefs.current[q.id] = el;
                          }}
                          tabIndex={-1}
                          onFocus={() => setActiveQ(q.id)}
                          className={`rounded-2xl border p-4 transition-all duration-300 ${
                            activeQ === q.id
                              ? "border-brand-500/40 bg-brand-500/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="mb-3 flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-slate-100">
                              {localQuestionNumber}
                            </span>

                            {q.type === "sentence-completion" ? (
                              <p className="text-sm leading-7 text-slate-200">
                                <HighlightableText
                                  fontSize={fontSize}
                                  containerKey={`${q.id}-before`}
                                  highlightState={highlightState}
                                >
                                  {q.before}
                                </HighlightableText>{" "}
                                <input
                                  value={given || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const wordCount = value.trim()
                                      ? value.trim().split(/\s+/).length
                                      : 0;
                                    if (wordCount > (q.maxWords || 1)) {
                                      setAnswerErrors((previous) => ({
                                        ...previous,
                                        [q.id]: `Use no more than ${q.maxWords || 1} word${(q.maxWords || 1) === 1 ? "" : "s"}.`,
                                      }));
                                      return;
                                    }
                                    setAnswer(q.id, value);
                                  }}
                                  aria-label={`Answer to question ${localQuestionNumber}, maximum ${q.maxWords || 1} word${(q.maxWords || 1) === 1 ? "" : "s"}`}
                                  aria-invalid={Boolean(answerErrors[q.id])}
                                  aria-describedby={answerErrors[q.id] ? `${q.id}-answer-error` : undefined}
                                  className="mx-1 w-full max-w-[9rem] rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-300 focus:border-brand-500 focus:outline-none sm:w-36"
                                  placeholder={`max ${q.maxWords} word${q.maxWords > 1 ? "s" : ""}`}
                                />{" "}
                                <HighlightableText
                                  fontSize={fontSize}
                                  containerKey={`${q.id}-after`}
                                  highlightState={highlightState}
                                >
                                  {q.after}
                                </HighlightableText>
                              </p>
                            ) : (
                              <p className="text-sm leading-7 text-slate-200">
                                <HighlightableText
                                  fontSize={fontSize}
                                  containerKey={`${q.id}-prompt`}
                                  highlightState={highlightState}
                                >
                                  {q.type === "matching-headings"
                                    ? q.paragraphLabel
                                    : q.prompt}
                                </HighlightableText>
                              </p>
                            )}
                          </div>

                          {answerErrors[q.id] && (
                            <p
                              id={`${q.id}-answer-error`}
                              className="ml-9 mb-3 text-xs text-amber-200"
                              role="alert"
                            >
                              {answerErrors[q.id]}
                            </p>
                          )}

                          {q.type === "true-false-not-given" && (
                            <div className="ml-9 flex flex-wrap gap-2">
                              {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => setAnswer(q.id, opt)}
                                  className={`min-h-11 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                                    given === opt
                                      ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                      : "border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/10"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {q.type === "yes-no-not-given" && (
                            <div className="ml-9 flex flex-wrap gap-2">
                              {["YES", "NO", "NOT GIVEN"].map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => setAnswer(q.id, opt)}
                                  className={`min-h-11 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                                    given === opt
                                      ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                      : "border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/10"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {q.type === "matching-headings" &&
                            passage.headingBank && (
                              <div className="ml-9 flex flex-wrap gap-2">
                                {passage.headingBank.map((h) => (
                                  <button
                                    type="button"
                                    key={h.id}
                                    onClick={() => setAnswer(q.id, h.id)}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                                      given === h.id
                                        ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                        : "border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/10"
                                    }`}
                                  >
                                    {h.id}
                                  </button>
                                ))}
                              </div>
                            )}

                          {q.type === "multiple-choice" && (
                            <div className="ml-9 space-y-2">
                              {q.options.map((opt) => (
                                <button
                                  type="button"
                                  key={opt.key}
                                  onClick={() => setAnswer(q.id, opt.key)}
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 ${
                                    given === opt.key
                                      ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                      : "border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/10"
                                  }`}
                                >
                                  <span className="mr-1 font-semibold">
                                    {opt.key}.
                                  </span>
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

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <Bot className="text-brand-400" size={20} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    AI Coach
                  </p>
                  <p className="text-xs text-amber-300">Requires API key</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The server is missing the API key required to generate reading
                feedback. Add the provider key in the environment settings to
                enable this feature.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <MessageCircle
                  size={18}
                  className="mt-0.5 text-brand-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-200">
                    Found a bug or have suggestions?
                  </p>
                  <p className="mb-3 text-sm leading-6 text-slate-400">
                    I&apos;d love to hear your feedback.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://t.me/mukh4mmadov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-brand-400"
                >
                  <Send size={14} aria-hidden="true" />
                  Contact on Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIChatPanel
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        context={buildAIContext()}
        personality={aiPersonality}
        onPersonalityChange={setAiPersonality}
      />

      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="glass-card w-full max-w-md p-6 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-dialog-title"
          >
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <AlertTriangle
                  className="text-amber-400"
                  size={24}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h3
                  id="submit-dialog-title"
                  className="mb-2 text-lg font-bold text-slate-100"
                >
                  Unanswered Questions
                </h3>
                <p className="text-slate-300">
                  You still have{" "}
                  <span className="font-bold text-amber-400">
                    {remainingCount}
                  </span>{" "}
                  unanswered question{remainingCount !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="btn-secondary flex-1"
              >
                Review Answers
              </button>
              <button onClick={performSubmit} className="btn-primary flex-1">
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
