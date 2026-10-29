"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, ChevronDown, Flag, LogOut, Pause, Play, RotateCcw, Wrench } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import ExamQuestionBar from "@/components/exam/ExamQuestionBar";
import ExamReviewDialog from "@/components/exam/ExamReviewDialog";
import SplitPane from "@/components/exam/SplitPane";
import ReadingQuestionList from "@/components/exam/ReadingQuestionList";
import { HeadingDropZone, paragraphLetter } from "@/components/exam/HeadingDragDrop";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import HighlightableText from "@/components/reading/HighlightableText";
import { useExamSettings } from "@/hooks/useExamSettings";
import { useExamShortcuts, useTimerWarning } from "@/hooks/useExamShortcuts";
import { requestHelpDialog } from "@/lib/help-dialog";
import { clampQuestion } from "@/lib/exam/exam-settings.mjs";

const isAnswered = (value) => String(value ?? "").trim() !== "";

// Practice-only tools (the real exam has none of these): AI Coach, pausing
// or resetting the timer, and reporting a content problem.
function ToolsMenu({ timerRunning, onOpenCoach, onPauseTimer, onResumeTimer, onResetTimer, passageTitle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const run = (action) => () => { setOpen(false); action(); };
  return (
    <div ref={ref} className="relative">
      <button type="button" className="exam-btn" aria-label="Practice tools" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <Wrench size={16} aria-hidden="true" /><span className="exam-btn-label">Tools</span><ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="exam-popover" role="menu" aria-label="Practice tools">
          <h3>Practice tools</h3>
          <div className="grid gap-1.5">
            <button type="button" role="menuitem" className="exam-btn justify-start" onClick={run(onOpenCoach)}><Bot size={16} aria-hidden="true" /> AI Coach</button>
            {timerRunning
              ? <button type="button" role="menuitem" className="exam-btn justify-start" onClick={run(onPauseTimer)}><Pause size={16} aria-hidden="true" /> Pause timer</button>
              : <button type="button" role="menuitem" className="exam-btn justify-start" onClick={run(onResumeTimer)}><Play size={16} aria-hidden="true" /> Resume timer</button>}
            <button type="button" role="menuitem" className="exam-btn justify-start" onClick={run(onResetTimer)}><RotateCcw size={16} aria-hidden="true" /> Reset timer to 20 minutes</button>
            <button
              type="button"
              role="menuitem"
              className="exam-btn justify-start"
              onClick={(event) => {
                const target = event.currentTarget;
                setOpen(false);
                requestHelpDialog(target, {
                  category: "incorrect_answer",
                  subject: `Reading content: ${passageTitle}`.slice(0, 200),
                  body: `Please describe the issue you found in “${passageTitle}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n`,
                });
              }}
            >
              <Flag size={16} aria-hidden="true" /> Report a problem with this passage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A single practice passage in the computer-delivered exam layout. Timer,
 * answers and saving stay with ReadingTestPlayer.
 */
export default function PracticeExamScreen({
  passage, answers, onAnswer, remainingSeconds, timerRunning, onPauseTimer, onResumeTimer, onResetTimer,
  highlightState, savedTermIds, onSaveWord, flags, onToggleFlag, onSubmit, onOpenCoach, onActiveQuestion, statusText, children, initialCurrent = 1,
}) {
  const [settings, updateSettings] = useExamSettings();
  const [current, setCurrent] = useState(Math.max(1, initialCurrent));
  const [mobileTab, setMobileTab] = useState("left");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pickedHeading, setPickedHeading] = useState(null);
  const timerWarning = useTimerWarning(timerRunning ? remainingSeconds : null, settings.timerWarnings);
  const questions = passage.questionGroups.flatMap((group) => group.questions);

  const select = (number) => {
    const next = clampQuestion(number, questions.length);
    setCurrent(next);
    onActiveQuestion?.(questions[next - 1]?.id);
  };
  const goTo = (number) => {
    const next = clampQuestion(number, questions.length);
    select(next);
    setMobileTab("right");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById(`reading-q-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
  };

  useEffect(() => {
    if (initialCurrent > 1) document.getElementById(`reading-q-${initialCurrent}`)?.scrollIntoView({ block: "center" });
    // Only when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useExamShortcuts({
    onNext: () => goTo(current + 1),
    onPrevious: () => goTo(current - 1),
    onToggleFlag: () => onToggleFlag(current),
    enabled: !reviewOpen,
  });

  const parts = [{
    label: "Part 1",
    questions: questions.map((question, index) => ({ number: index + 1, answered: isAnswered(answers[question.id]), flagged: flags.includes(index + 1) })),
  }];
  const unanswered = questions.map((question, index) => (isAnswered(answers[question.id]) ? null : index + 1)).filter(Boolean);
  const headingQuestions = passage.headingBank?.length ? questions.filter((question) => question.type === "matching-headings") : [];
  const headingTools = headingQuestions.length > 0 ? {
    picked: pickedHeading,
    usedIds: new Set(headingQuestions.map((question) => answers[question.id]).filter(Boolean)),
    onPick: (id) => {
      setPickedHeading(id);
      // On phones the paragraphs are on the other tab.
      if (id && window.matchMedia("(max-width: 1023px)").matches) setMobileTab("left");
    },
  } : undefined;
  const renderDropZone = (paragraph) => {
    const question = headingQuestions.find((item) => paragraphLetter(item) === String(paragraph.label || "").toUpperCase());
    if (!question) return null;
    const number = questions.indexOf(question) + 1;
    return (
      <HeadingDropZone
        number={number}
        headingBank={passage.headingBank}
        value={answers[question.id]}
        picked={pickedHeading}
        onPlace={(headingId) => { onAnswer(question.id, headingId); setPickedHeading(null); select(number); }}
        onClear={() => onAnswer(question.id, "")}
        onFocusQuestion={() => goTo(number)}
      />
    );
  };
  const answeredCount = questions.length - unanswered.length;

  return (
    <ExamShell settings={settings}>
      <ExamTopBar
        title={passage.title}
        subtitle={statusText}
        remainingSeconds={remainingSeconds}
        settings={settings}
        onSettingsChange={updateSettings}
        helpText="Read the passage on the left and answer the questions on the right. Select words in the passage to highlight them or save them to your vocabulary notebook. Use the bar at the bottom to move between questions and flag any you want to come back to."
      >
        {!timerRunning && remainingSeconds > 0 && <span className="text-sm font-bold" role="status">Timer paused</span>}
        <ToolsMenu
          timerRunning={timerRunning}
          onOpenCoach={onOpenCoach}
          onPauseTimer={onPauseTimer}
          onResumeTimer={onResumeTimer}
          onResetTimer={onResetTimer}
          passageTitle={passage.title}
        />
        <Link href="/reading" className="exam-btn" aria-label="Exit (your answers are saved on this device)" title="Your answers are saved on this device">
          <LogOut size={16} aria-hidden="true" /><span className="exam-btn-label">Exit</span>
        </Link>
        <button type="button" className="exam-btn exam-btn-primary" onClick={() => setReviewOpen(true)}>Submit</button>
      </ExamTopBar>

      <div className="exam-part-strip">
        <b>Part 1</b>
        Read the text and answer questions 1–{questions.length}.
      </div>

      <SplitPane
        leftId="reading-panel-passage"
        rightId="reading-panel-questions"
        leftLabel="Passage"
        rightLabel={`Questions 1–${questions.length}`}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        left={(
          <div className="exam-passage">
            <h2>{passage.title}</h2>
            <HighlightablePassage
              paragraphs={passage.paragraphs}
              fontSize="inherit"
              highlightState={highlightState}
              highContrastHighlights={settings.scheme !== "standard"}
              savedTermIds={savedTermIds}
              onSaveWord={onSaveWord}
              notesKey={passage.slug}
              renderBeforeParagraph={headingTools ? renderDropZone : undefined}
            />
          </div>
        )}
        right={(
          <ReadingQuestionList
            passage={passage}
            getValue={(question) => answers[question.id]}
            onAnswer={(question, value) => onAnswer(question.id, value)}
            current={current}
            flags={flags}
            onFocusQuestion={select}
            idPrefix="reading-q"
            headingTools={headingTools}
            renderText={(text, key) => (text ? <HighlightableText fontSize="inherit" containerKey={key} highlightState={highlightState}>{text}</HighlightableText> : null)}
          />
        )}
      />

      <ExamQuestionBar parts={parts} current={current} onSelect={goTo} onToggleFlag={onToggleFlag} onReview={() => setReviewOpen(true)} reviewLabel="Review & submit" />

      {timerWarning && <p role="status" className="exam-toast">{timerWarning}</p>}
      <ExamReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmit={() => { setReviewOpen(false); onSubmit(); }}
        submitDisabled={answeredCount === 0}
        submitLabel={answeredCount === 0 ? "Answer a question first" : "Submit test"}
        total={questions.length}
        unanswered={unanswered}
        flagged={flags}
        remainingSeconds={remainingSeconds}
        onJump={(number) => { setReviewOpen(false); goTo(number); }}
      />
      {children}
    </ExamShell>
  );
}
