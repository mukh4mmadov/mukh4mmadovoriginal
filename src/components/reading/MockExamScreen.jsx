"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import ExamQuestionBar from "@/components/exam/ExamQuestionBar";
import ExamReviewDialog from "@/components/exam/ExamReviewDialog";
import SplitPane from "@/components/exam/SplitPane";
import ReadingQuestionList from "@/components/exam/ReadingQuestionList";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import FullscreenToggle from "@/components/shared/FullscreenToggle";
import ReportPassageIssueButton from "@/components/shared/ReportPassageIssueButton";
import { useExamSettings } from "@/hooks/useExamSettings";
import { useExamShortcuts, useTimerWarning } from "@/hooks/useExamShortcuts";
import { clampQuestion } from "@/lib/exam/exam-settings.mjs";

const isAnswered = (value) => String(value ?? "").trim() !== "";

/**
 * The full Reading mock in the computer-delivered exam layout. Answers,
 * timer and draft saving stay with the page; this screen handles layout,
 * navigation, flags and the review screen.
 */
export default function MockExamScreen({ passages, questions, answers, onAnswer, remaining, highlightStates, flags, onToggleFlag, focusWarning, onExit, onSubmit }) {
  const [settings, updateSettings] = useExamSettings();
  const [current, setCurrent] = useState(1);
  const [mobileTab, setMobileTab] = useState("left");
  const [reviewOpen, setReviewOpen] = useState(false);
  const timerWarning = useTimerWarning(remaining, settings.timerWarnings);

  const keyFor = (question) => questions.find((item) => item.question === question)?.key;
  const currentItem = questions[current - 1];
  const passageIndex = currentItem?.passageIndex ?? 0;
  const passage = passages[passageIndex];
  const ranges = passages.map((_, index) => {
    const first = questions.findIndex((item) => item.passageIndex === index) + 1;
    const total = questions.filter((item) => item.passageIndex === index).length;
    return { first, last: first + total - 1 };
  });

  const goTo = (number, { scroll = true } = {}) => {
    const next = clampQuestion(number, questions.length);
    setCurrent(next);
    if (!scroll) return;
    setMobileTab("right");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById(`mock-q-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
  };

  useExamShortcuts({
    onNext: () => goTo(current + 1),
    onPrevious: () => goTo(current - 1),
    onToggleFlag: () => onToggleFlag(current),
    enabled: !reviewOpen,
  });

  const parts = passages.map((_, index) => ({
    label: `Part ${index + 1}`,
    questions: questions
      .map((item, itemIndex) => ({ item, number: itemIndex + 1 }))
      .filter(({ item }) => item.passageIndex === index)
      .map(({ item, number }) => ({ number, answered: isAnswered(answers[item.key]), flagged: flags.includes(number) })),
  }));
  const unanswered = questions.map((item, index) => (isAnswered(answers[item.key]) ? null : index + 1)).filter(Boolean);

  return (
    <ExamShell settings={settings}>
      <ExamTopBar
        title="IELTS Academic Reading"
        subtitle="Full mock test · 3 parts · 40 questions"
        remainingSeconds={remaining}
        settings={settings}
        onSettingsChange={updateSettings}
        helpText="Read each passage on the left and answer the questions on the right. Use the bar at the bottom to move between questions, and flag any you want to come back to. Select words in the passage to highlight them."
      >
        <FullscreenToggle className="exam-btn hidden sm:inline-flex" />
        {passage && <ReportPassageIssueButton passageTitle={passage.title} className="exam-btn hidden md:inline-flex" />}
        <button type="button" className="exam-btn" onClick={onExit} aria-label="Save & exit" title="Save your answers and leave. The timer keeps running.">
          <LogOut size={16} aria-hidden="true" /><span className="exam-btn-label">Save &amp; exit</span>
        </button>
        <button type="button" className="exam-btn exam-btn-primary" onClick={() => setReviewOpen(true)}>Submit</button>
      </ExamTopBar>

      <div className="exam-part-strip" aria-live="polite">
        <b>Part {passageIndex + 1}</b>
        Read the text and answer questions {ranges[passageIndex].first}–{ranges[passageIndex].last}.
      </div>
      {focusWarning && <p role="status" className="exam-notice">The timer kept running while this tab was hidden. Your answers have not been submitted.</p>}

      <SplitPane
        leftId="mock-reading-panel"
        rightId="mock-question-panel"
        leftLabel="Passage"
        rightLabel={`Questions ${ranges[passageIndex].first}–${ranges[passageIndex].last}`}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        left={(
          <div className="exam-passage">
            <h2>{passage.title}</h2>
            <HighlightablePassage paragraphs={passage.paragraphs} fontSize="inherit" highlightState={highlightStates[passageIndex]} highContrastHighlights={settings.scheme !== "standard"} />
          </div>
        )}
        right={(
          <ReadingQuestionList
            passage={passage}
            firstNumber={ranges[passageIndex].first}
            getValue={(question) => answers[keyFor(question)]}
            onAnswer={(question, value) => onAnswer(keyFor(question), value)}
            current={current}
            flags={flags}
            onFocusQuestion={setCurrent}
            idPrefix="mock-q"
          />
        )}
      />

      <ExamQuestionBar parts={parts} current={current} onSelect={(number) => goTo(number)} onToggleFlag={onToggleFlag} onReview={() => setReviewOpen(true)} reviewLabel="Review & submit" />

      {timerWarning && <p role="status" className="exam-toast">{timerWarning}</p>}
      <ExamReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmit={onSubmit}
        total={questions.length}
        unanswered={unanswered}
        flagged={flags}
        remainingSeconds={remaining}
        onJump={(number) => { setReviewOpen(false); goTo(number); }}
      />
    </ExamShell>
  );
}
