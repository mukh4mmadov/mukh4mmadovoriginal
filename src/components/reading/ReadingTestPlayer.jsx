"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import PracticeExamScreen from "@/components/reading/PracticeExamScreen";
import { toggleFlag } from "@/lib/exam/exam-settings.mjs";
import { useVocabulary } from "@/hooks/useVocabulary";
import { sentenceContaining } from "@/lib/vocabulary/vocabulary-notebook.mjs";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import ReadingTestResults from "@/components/reading/ReadingTestResults";
import AIChatPanel from "@/components/ai/AIChatPanel";
import { saveAttemptLocally, saveProgress } from "@/lib/progressTracker";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/lib/analytics/analytics.service";
import { isAnswerCorrect } from "@/lib/reading/answer-review";
import { enqueueReadingAttempt, makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";

function allQuestions(passage) {
  return passage.questionGroups.flatMap((g) => g.questions);
}

const TIMER_DURATION_SECONDS = 20 * 60;
const TIMER_DURATION_MS = TIMER_DURATION_SECONDS * 1000;

export default function ReadingTestPlayer({ passage }) {
  const { user } = useAuth();
  const questions = useMemo(() => allQuestions(passage), [passage]);
  const matchingChoiceIds = useMemo(
    () => passage.headingBank?.length
      ? passage.headingBank.map(({ id }) => id)
      : [...new Set(passage.paragraphs.map(({ label }) => label).filter(Boolean))],
    [passage],
  );
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
  const [remainingSeconds, setRemainingSeconds] = useState(TIMER_DURATION_SECONDS);
  const [activeQ, setActiveQ] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [flags, setFlags] = useState([]);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState("");
  const [events, setEvents] = useState([]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPersonality, setAiPersonality] = useState("friendly");
  const remainingSecondsRef = useRef(TIMER_DURATION_SECONDS);
  const remainingMillisecondsRef = useRef(TIMER_DURATION_MS);
  const timerDeadlineRef = useRef(Date.now() + TIMER_DURATION_MS);
  const timerRunningRef = useRef(true);
  const submittedRef = useRef(false);
  const expireHandlerRef = useRef(null);
  const previousAnswersRef = useRef({});
  const restoredDraftSlugRef = useRef(null);

  useEffect(() => {
    analyticsService.trackReadingStarted(user?.id ?? null, passage.slug);
  }, [user?.id, passage.slug]);

  const getRemainingSeconds = (now = Date.now()) => {
    return Math.ceil(getRemainingMilliseconds(now) / 1000);
  };

  const getRemainingMilliseconds = (now = Date.now()) => {
    if (!timerRunningRef.current || timerDeadlineRef.current === null) {
      return remainingMillisecondsRef.current;
    }
    return Math.max(0, Math.min(TIMER_DURATION_MS, timerDeadlineRef.current - now));
  };

  const syncTimerDisplay = (remainingMs = getRemainingMilliseconds()) => {
    const safeMs = Math.max(0, Math.min(TIMER_DURATION_MS, remainingMs));
    remainingMillisecondsRef.current = safeMs;
    const seconds = Math.ceil(safeMs / 1000);
    remainingSecondsRef.current = seconds;
    setRemainingSeconds(seconds);
    setTimeSpent(TIMER_DURATION_SECONDS - seconds);
  };

  const buildAIContext = () => {
    const currentQuestion = activeQ
      ? questions.find((q) => q.id === activeQ)
      : undefined;

    return {
      assessmentMode: "active",
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
          }
        : undefined,
      activeTest: {
        answeredQuestions: questions.filter((question) => answers[question.id] !== undefined && answers[question.id] !== "").map((question) => ({
          number: questions.findIndex((candidate) => candidate.id === question.id) + 1,
          id: question.id,
          prompt: question.prompt || `${question.before || ""} ___ ${question.after || ""}`,
          type: question.type,
          selectedAnswer: answers[question.id],
          correctAnswer: question.answer,
        })),
      },
    };
  };

  useEffect(() => {
    setDraftRestored(false);
    setAnswers({});
    setFlags([]);
    setTimeSpent(0);
    setTimerRunning(true);
    setRemainingSeconds(TIMER_DURATION_SECONDS);
    remainingSecondsRef.current = TIMER_DURATION_SECONDS;
    timerRunningRef.current = true;
    remainingMillisecondsRef.current = TIMER_DURATION_MS;
    timerDeadlineRef.current = Date.now() + TIMER_DURATION_MS;
    submittedRef.current = false;
    previousAnswersRef.current = {};
    if (typeof window === "undefined") return;

    try {
      const savedData = window.localStorage.getItem(
        `ielts-reading-${passage.slug}`,
      );
      let hasValidSavedData = false;

      if (savedData) {
        const parsed = JSON.parse(savedData);
        const now = Date.now();
        const savedAt = parsed && Number.isFinite(parsed.timestamp)
          ? parsed.timestamp
          : null;
        if (
          parsed &&
          savedAt !== null &&
          now >= savedAt &&
          now - savedAt < 24 * 60 * 60 * 1000
        ) {
          const restoredAnswers =
            parsed.answers && typeof parsed.answers === "object" && !Array.isArray(parsed.answers)
              ? parsed.answers
              : {};
          const isRunning = parsed.timerRunning !== false;
          let restoredRemaining = TIMER_DURATION_SECONDS;
          let restoredRemainingMs = null;

          if (
            parsed.timerVersion === 2 &&
            Number.isFinite(parsed.remainingMilliseconds) &&
            parsed.remainingMilliseconds >= 0 &&
            parsed.remainingMilliseconds <= TIMER_DURATION_MS
          ) {
            restoredRemainingMs = parsed.remainingMilliseconds;
            restoredRemaining = Math.ceil(restoredRemainingMs / 1000);
          } else if (
            parsed.timerVersion === 2 &&
            Number.isFinite(parsed.remainingSeconds) &&
            parsed.remainingSeconds >= 0 &&
            parsed.remainingSeconds <= TIMER_DURATION_SECONDS
          ) {
            restoredRemaining = parsed.remainingSeconds;
            restoredRemainingMs = restoredRemaining * 1000;
          } else if (
            Number.isFinite(parsed.timeSpent) &&
            parsed.timeSpent >= 0
          ) {
            // Legacy drafts stored elapsed time.
            restoredRemaining = Math.max(
              0,
              Math.min(TIMER_DURATION_SECONDS, TIMER_DURATION_SECONDS - parsed.timeSpent),
            );
            restoredRemainingMs = restoredRemaining * 1000;
          } else if (
            Number.isFinite(parsed.remainingSeconds) &&
            parsed.remainingSeconds >= 0 &&
            parsed.remainingSeconds <= TIMER_DURATION_SECONDS
          ) {
            restoredRemaining = parsed.remainingSeconds;
            restoredRemainingMs = restoredRemaining * 1000;
          }

          restoredRemainingMs ??= restoredRemaining * 1000;
          restoredRemainingMs = Math.max(
            0,
            Math.min(TIMER_DURATION_MS, restoredRemainingMs),
          );
          restoredRemaining = Math.ceil(restoredRemainingMs / 1000);
          setAnswers(restoredAnswers);
          setFlags(Array.isArray(parsed.flags) ? parsed.flags.filter(Number.isInteger) : []);
          if (typeof parsed.activeQuestionId === "string") setActiveQ(parsed.activeQuestionId);
          remainingSecondsRef.current = restoredRemaining;
          remainingMillisecondsRef.current = restoredRemainingMs;
          setRemainingSeconds(restoredRemaining);
          setTimeSpent(TIMER_DURATION_SECONDS - restoredRemaining);
          timerRunningRef.current = isRunning && restoredRemaining > 0;
          setTimerRunning(timerRunningRef.current);
          timerDeadlineRef.current = timerRunningRef.current
            ? now + restoredRemainingMs
            : null;
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
      const savedAt = Date.now();
      const saveData = {
        timerVersion: 2,
        answers,
        flags,
        activeQuestionId: activeQ,
        remainingSeconds: getRemainingSeconds(savedAt),
        remainingMilliseconds: getRemainingMilliseconds(savedAt),
        timerRunning: timerRunningRef.current,
        timestamp: savedAt,
      };

      window.localStorage.setItem(
        `ielts-reading-${passage.slug}`,
        JSON.stringify(saveData),
      );
      setDraftSaveStatus("Draft saved on this device · Not submitted");
    } catch (e) {
      setDraftSaveStatus("Draft could not be saved on this device");
    }
  }, [answers, flags, activeQ, timeSpent, timerRunning, submitted, passage.slug, draftRestored]);

  useEffect(() => {
    if (!draftRestored || !timerRunning || typeof window === "undefined") return;

    const refresh = () => {
      const remainingMs = getRemainingMilliseconds();
      syncTimerDisplay(remainingMs);
      const remaining = Math.ceil(remainingMs / 1000);
      if (remaining === 0) {
        timerRunningRef.current = false;
        timerDeadlineRef.current = null;
        setTimerRunning(false);
        expireHandlerRef.current?.();
      }
    };

    const handleVisible = () => refresh();
    refresh();
    const interval = window.setInterval(refresh, 500);
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    window.addEventListener("pageshow", handleVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
      window.removeEventListener("pageshow", handleVisible);
    };
  }, [draftRestored, timerRunning]);

  const handleTimerPause = () => {
    const remainingMs = getRemainingMilliseconds();
    syncTimerDisplay(remainingMs);
    timerRunningRef.current = false;
    timerDeadlineRef.current = null;
    setTimerRunning(false);
    if (remainingMs === 0) expireHandlerRef.current?.();
  };

  const handleTimerResume = () => {
    const now = Date.now();
    if (remainingSecondsRef.current <= 0) {
      expireHandlerRef.current?.();
      return;
    }
    timerDeadlineRef.current = now + remainingMillisecondsRef.current;
    timerRunningRef.current = true;
    setTimerRunning(true);
  };

  const handleTimerReset = () => {
    timerRunningRef.current = false;
    timerDeadlineRef.current = null;
    setTimerRunning(false);
    submittedRef.current = false;
    syncTimerDisplay(TIMER_DURATION_MS);
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
  const { items: vocabulary, saveWord } = useVocabulary({ sync: false });
  const savedTermIds = useMemo(() => new Set(vocabulary.map((item) => item.id)), [vocabulary]);

  const setAnswer = (id, value) => {
    if (submitted) return;
    const questionNumber = questionNumbers.get(id) ?? 1;
    const oldAnswer = previousAnswersRef.current[id];

    setAnswers((prev) => ({ ...prev, [id]: value }));

    const question = questions.find((q) => q.id === id);
    if (question) {
      const correct = isAnswerCorrect(question, value);
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

  const performSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const finalTime = TIMER_DURATION_SECONDS - getRemainingSeconds();
    setTimeSpent(finalTime);
    timerRunningRef.current = false;
    timerDeadlineRef.current = null;
    setSubmitted(true);
    setTimerRunning(false);
    window.scrollTo({ top: 0 });

    const correctCount = questions.filter((q) =>
      isAnswerCorrect(q, answers[q.id]),
    ).length;
    const score = (correctCount / questions.length) * 100;
    const attemptTimestamp = Date.now();
    const attemptId = makeAttemptUuid();
    const questionResults = questions.map((question) => ({
      id: question.id,
      type: question.type,
      answered: Boolean(answers[question.id]),
      correct: isAnswerCorrect(question, answers[question.id]),
      selectedAnswer: answers[question.id] == null ? null : String(answers[question.id]),
    }));
    const questionPayload = questionResults.map((answer) => ({
      question_id: answer.id,
      question_type: answer.type,
      selected_answer: answer.selectedAnswer,
      is_correct: answer.correct,
    }));

    const localAttempt = {
      id: attemptId,
      timestamp: attemptTimestamp,
      completedAt: new Date(attemptTimestamp).toISOString(),
      passageId: passage.slug,
      durationSeconds: finalTime,
      questionResults,
    };

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

    const progressFields = { completed: true, bestScore: score, totalTime: finalTime, questionAttempt: localAttempt };
    try {
      const locallySaved = saveAttemptLocally(passage.slug, progressFields);
      if (user?.id) {
        enqueueReadingAttempt(window.localStorage, user.id, {
          attemptKey: attemptId,
          completedAt: new Date(attemptTimestamp).toISOString(),
          passageId: passage.slug,
          durationSeconds: finalTime,
          answers: questionPayload,
        });
      }
      // Keep the existing reading_progress sync, but never make the result screen
      // wait for it or for the new exact-attempt RPC.
      void saveProgress(passage.slug, {
        completed: true,
        bestScore: score,
        totalTime: finalTime,
        attempts: locallySaved?.attempts,
      }, user?.id).catch((error) => console.error("Failed to sync reading progress:", error));
      // The local attempt is durable now; remove its active-draft marker before
      // any asynchronous module loading so an immediate refresh cannot revive it.
      localStorage.removeItem(`ielts-reading-${passage.slug}`);
      if (user?.id) {
        const { supabase } = await import('@/lib/supabase/client');
        const { flushReadingAttemptOutbox } = await import('@/lib/reading/reading-attempt-outbox.mjs');
        void flushReadingAttemptOutbox(window.localStorage, user.id, supabase);
      }
    } catch (error) {
      console.error("Failed to save local reading attempt:", error);
    }
  };

  useEffect(() => {
    expireHandlerRef.current = performSubmit;
  });

  const resetTestState = () => {
    setAnswers({});
    previousAnswersRef.current = {};
    setSubmitted(false);
    submittedRef.current = false;
    remainingSecondsRef.current = TIMER_DURATION_SECONDS;
    remainingMillisecondsRef.current = TIMER_DURATION_MS;
    timerDeadlineRef.current = Date.now() + TIMER_DURATION_MS;
    timerRunningRef.current = true;
    setTimerRunning(true);
    setActiveQ(null);
    setTimeSpent(0);
    setRemainingSeconds(TIMER_DURATION_SECONDS);
    setFlags([]);
    setEvents([{ type: "opened", timestamp: Date.now() }]);
    window.scrollTo({ top: 0 });
  };

  const handleRetry = () => {
    resetTestState();
  };

  const handleRestartIncorrect = () => {
    const nextAnswers = { ...answers };
    questions.forEach((question) => {
      const given = nextAnswers[question.id];
      if (given && !isAnswerCorrect(question, given)) {
        delete nextAnswers[question.id];
      }
    });
    setAnswers(nextAnswers);
    previousAnswersRef.current = nextAnswers;
    setSubmitted(false);
    submittedRef.current = false;
    remainingSecondsRef.current = TIMER_DURATION_SECONDS;
    remainingMillisecondsRef.current = TIMER_DURATION_MS;
    timerDeadlineRef.current = Date.now() + TIMER_DURATION_MS;
    timerRunningRef.current = true;
    setTimerRunning(true);
    setActiveQ(null);
    setTimeSpent(0);
    setRemainingSeconds(TIMER_DURATION_SECONDS);
    setFlags([]);
    setEvents([{ type: "opened", timestamp: Date.now() }]);
    window.scrollTo({ top: 0 });
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
        userId={user?.id}
      />
    );
  }

  return (
    <PracticeExamScreen
      // Rendered straight away (the passage stays in the pre-rendered page),
      // then opened again on the saved question once the draft is read.
      key={`${passage.slug}-${draftRestored ? "restored" : "initial"}`}
      initialCurrent={Math.max(1, questions.findIndex((question) => question.id === activeQ) + 1)}
      passage={passage}
      answers={answers}
      onAnswer={setAnswer}
      remainingSeconds={remainingSeconds}
      timerRunning={timerRunning}
      onPauseTimer={handleTimerPause}
      onResumeTimer={handleTimerResume}
      onResetTimer={handleTimerReset}
      highlightState={highlightState}
      savedTermIds={savedTermIds}
      onSaveWord={({ term, paragraphText }) => saveWord({
        term,
        sentence: sentenceContaining(paragraphText, term),
        passageSlug: passage.slug,
        passageTitle: passage.title,
      })}
      flags={flags}
      onToggleFlag={(number) => setFlags((current) => toggleFlag(current, number))}
      onSubmit={performSubmit}
      onOpenCoach={() => setAiChatOpen(true)}
      onActiveQuestion={setActiveQ}
      statusText={[passage.provenanceLabel, draftRestored && draftSaveStatus].filter(Boolean).join(" · ")}
    >
      <AIChatPanel
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        context={buildAIContext()}
        personality={aiPersonality}
        onPersonalityChange={setAiPersonality}
      />
    </PracticeExamScreen>
  );
}
