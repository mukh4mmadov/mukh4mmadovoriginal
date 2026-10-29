"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import ExamQuestionBar from "@/components/exam/ExamQuestionBar";
import ExamReviewDialog from "@/components/exam/ExamReviewDialog";
import SplitPane from "@/components/exam/SplitPane";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import FullscreenToggle from "@/components/shared/FullscreenToggle";
import ReportPassageIssueButton from "@/components/shared/ReportPassageIssueButton";
import { useExamSettings } from "@/hooks/useExamSettings";
import { useExamShortcuts, useTimerWarning } from "@/hooks/useExamShortcuts";
import { renumberInstructions } from "@/lib/reading/question-numbering.mjs";
import { clampQuestion } from "@/lib/exam/exam-settings.mjs";

const ANSWER_OPTIONS = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};
const isAnswered = (value) => String(value ?? "").trim() !== "";

function QuestionInput({ question, passage, number, value, onChange }) {
  if (ANSWER_OPTIONS[question.type]) {
    return (
      <div className="exam-options-inline" role="group" aria-label={`Answer for question ${number}`}>
        {ANSWER_OPTIONS[question.type].map((option) => (
          <button key={option} type="button" className="exam-option" aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>
        ))}
      </div>
    );
  }
  if (question.type === "multiple-choice") {
    return (
      <div className="exam-options" role="group" aria-label={`Answer for question ${number}`}>
        {question.options.map((option) => (
          <button key={option.key} type="button" className="exam-option" aria-pressed={value === option.key} onClick={() => onChange(option.key)}>
            <span className="exam-option-key" aria-hidden="true">{option.key}</span><span>{option.text}</span>
          </button>
        ))}
      </div>
    );
  }
  if (question.type === "matching-headings") {
    return (
      <select aria-label={`Choose a heading for question ${number}`} value={value} onChange={(event) => onChange(event.target.value)} className="exam-input exam-select mt-1">
        <option value="">Choose a heading</option>
        {passage.headingBank?.map((heading) => <option key={heading.id} value={heading.id}>{heading.id}. {heading.text}</option>)}
      </select>
    );
  }
  return null;
}

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
          <div className="exam-questions">
            {passage.questionGroups.map((group, groupIndex) => {
              const firstNumber = questions.findIndex((item) => item.passage === passage && item.question === group.questions[0]) + 1;
              const lastNumber = firstNumber + group.questions.length - 1;
              return (
                <section key={`${passage.slug}-group-${groupIndex}`} className="exam-group" aria-label={`Questions ${firstNumber}–${lastNumber}`}>
                  <p className="exam-group-title">Questions {firstNumber}{lastNumber > firstNumber ? `–${lastNumber}` : ""}</p>
                  <p className="exam-instructions">{renumberInstructions(group.instructions, firstNumber)}</p>
                  {group.wordBank?.length > 0 && (
                    <div className="exam-box">
                      <p className="exam-box-title">List of words</p>
                      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{group.wordBank.map((word) => <p key={word.id}><b>{word.id}</b> {word.text}</p>)}</div>
                    </div>
                  )}
                  {group.questions[0]?.type === "matching-headings" && passage.headingBank && (
                    <div className="exam-box">
                      <p className="exam-box-title">List of headings</p>
                      <div className="grid gap-1">{passage.headingBank.map((heading) => <p key={heading.id}><b>{heading.id}</b> {heading.text}</p>)}</div>
                    </div>
                  )}
                  {group.questions.map((question, questionIndex) => {
                    const number = firstNumber + questionIndex;
                    const key = questions[number - 1].key;
                    const value = answers[key] ?? "";
                    const set = (next) => onAnswer(key, next);
                    return (
                      <div
                        key={key}
                        id={`mock-q-${number}`}
                        className="exam-question"
                        data-current={number === current}
                        data-flagged={flags.includes(number)}
                        onFocusCapture={() => goTo(number, { scroll: false })}
                        onClick={() => setCurrent(number)}
                      >
                        <span className="exam-qnum" aria-hidden="true">{number}</span>
                        <div className="min-w-0 flex-1">
                          {question.type === "sentence-completion" ? (
                            <p>
                              {question.before}{" "}
                              <input
                                aria-label={`Answer for question ${number}, maximum ${question.maxWords || 1} word${(question.maxWords || 1) === 1 ? "" : "s"}`}
                                maxLength={120}
                                className="exam-input"
                                placeholder={group.wordBank?.length ? "letter" : undefined}
                                value={value}
                                onChange={(event) => { const next = event.target.value; if (next.trim().split(/\s+/).filter(Boolean).length <= (question.maxWords || 1)) set(next); }}
                              />{" "}
                              {question.after}
                            </p>
                          ) : (
                            <p>{question.type === "matching-headings" ? question.paragraphLabel : question.prompt}</p>
                          )}
                          <QuestionInput question={question} passage={passage} number={number} value={value} onChange={set} />
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
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
