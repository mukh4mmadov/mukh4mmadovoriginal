"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, Pause, Play } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import SplitPane from "@/components/exam/SplitPane";
import WritingChart from "@/components/writing/WritingChart";
import { useExamSettings } from "@/hooks/useExamSettings";
import { useExamShortcuts, useTimerWarning } from "@/hooks/useExamShortcuts";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { countWords, WRITING_TASK_RULES } from "@/data/writingTasks";
import { formatTimeLeft } from "@/lib/exam/exam-settings.mjs";
import { formatUzs, PREMIUM_MIN_WORDS, premiumPrice } from "@/lib/writing/premium.mjs";

function SubmitDialog({ open, tasks, essays, remainingSeconds, onClose, onSubmit, canSubmit, blockedReason, premium }) {
  const dialogRef = useModalAccessibility(open, onClose);
  const [mode, setMode] = useState("free");
  if (!open) return null;
  const premiumCount = tasks.filter((task) => countWords(essays[task.slug] || "") >= PREMIUM_MIN_WORDS).length;
  const premiumAmount = premiumPrice(premiumCount);
  const chosePremium = premium && mode === "premium";
  return (
    <div className="exam-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="writing-submit-title" className="exam-dialog">
        <h2 id="writing-submit-title">Submit your writing?</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {tasks.map((task, index) => {
            const words = countWords(essays[task.slug] || "");
            const min = WRITING_TASK_RULES[task.task].minWords;
            return (
              <li key={task.slug} className="exam-box mb-0">
                <b>Part {index + 1}</b> · {words} {words === 1 ? "word" : "words"}
                {words < min && <span style={{ color: "var(--exam-flag)" }}> · below the {min}-word minimum (this lowers the band)</span>}
              </li>
            );
          })}
        </ul>
        {remainingSeconds != null && remainingSeconds > 0 && <p className="text-sm">You still have {formatTimeLeft(remainingSeconds).replace(" left", "")}.</p>}
        {premium && (
          <div className="mt-4" role="radiogroup" aria-label="How should your writing be checked?">
            <p className="mb-2 text-sm font-bold">How should your writing be checked?</p>
            <div className="exam-options">
              <button type="button" role="radio" aria-checked={mode === "free"} aria-pressed={mode === "free"} className="exam-option" onClick={() => setMode("free")}>
                <span className="exam-option-key" aria-hidden="true">1</span>
                <span><b>AI check · free</b><br />Instant feedback and an estimated band for each criterion.</span>
              </button>
              <button type="button" role="radio" aria-checked={mode === "premium"} aria-pressed={mode === "premium"} className="exam-option" onClick={() => setMode("premium")} disabled={premiumCount === 0}>
                <span className="exam-option-key" aria-hidden="true">2</span>
                <span>
                  <b>AI Premium · {formatUzs(premiumPrice(Math.max(1, premiumCount)))}</b><br />
                  Line-by-line corrections, a Band 8+ rewrite of your answer, a deeper report on each criterion and a personal study plan. Pay on Telegram; the result comes after your payment is confirmed.
                  {premiumCount === 0 && <><br /><i>Write at least {PREMIUM_MIN_WORDS} words first.</i></>}
                  {premiumCount > 0 && premiumCount < tasks.length && <><br /><i>Only parts with at least {PREMIUM_MIN_WORDS} words are included.</i></>}
                </span>
              </button>
            </div>
          </div>
        )}
        {blockedReason && <p className="mt-2 text-sm font-semibold" role="alert">{blockedReason}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="exam-btn" onClick={onClose}>Keep writing</button>
          <button type="button" className="exam-btn exam-btn-primary" onClick={() => onSubmit(chosePremium ? "premium" : "free")} disabled={!canSubmit || (chosePremium && premiumCount === 0)}>
            {chosePremium ? `Request AI Premium (${formatUzs(premiumAmount)})` : "Submit for feedback"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Writing in the computer-delivered exam layout: the task (and chart) on
 * the left, the answer box with a live word count on the right, and Part
 * buttons at the bottom when there are two tasks. Essays and elapsed time
 * are saved through onDraftChange so the page decides where drafts live.
 */
export default function WritingExamScreen({
  tasks, title, durationSeconds, initialEssays = {}, initialElapsed = 0, startOnType = false,
  onDraftChange, onSubmit, submitting = false, blockedReason, exitHref = "/writing", exitLabel = "Exit", premium = false, children,
}) {
  const [settings, updateSettings] = useExamSettings();
  const [essays, setEssays] = useState(initialEssays);
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [running, setRunning] = useState(!startOnType);
  const [part, setPart] = useState(0);
  const [mobileTab, setMobileTab] = useState("right");
  const [submitOpen, setSubmitOpen] = useState(false);
  const textareaRef = useRef(null);
  const remaining = Math.max(0, durationSeconds - elapsed);
  const timerWarning = useTimerWarning(running ? remaining : null, settings.timerWarnings);
  const task = tasks[part];
  const rules = WRITING_TASK_RULES[task.task];
  const words = countWords(essays[task.slug] || "");

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    onDraftChange?.({ essays, elapsed });
  }, [essays, elapsed, onDraftChange]);

  // If marking failed and the learner is back in the test, its clock carries on.
  useEffect(() => {
    if (!submitting && !startOnType && elapsed > 0 && remaining > 0) setRunning(true);
    // Only react to the end of a submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  // When time is up the learner can still submit; the timer simply stops.
  useEffect(() => {
    if (running && remaining <= 0) setRunning(false);
  }, [running, remaining]);

  const goToPart = (index) => {
    const next = Math.max(0, Math.min(tasks.length - 1, index));
    setPart(next);
    window.requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
  };

  useExamShortcuts({ onNext: () => goToPart(part + 1), onPrevious: () => goToPart(part - 1), enabled: tasks.length > 1 && !submitOpen });

  const anyText = tasks.some((item) => countWords(essays[item.slug] || "") > 0);

  return (
    <ExamShell settings={settings}>
      <ExamTopBar
        title={title}
        subtitle={tasks.length > 1 ? "Part 1 and Part 2 · 60 minutes" : `Writing Task ${task.task} · ${task.type}`}
        remainingSeconds={remaining}
        settings={settings}
        onSettingsChange={updateSettings}
        helpText={tasks.length > 1
          ? "Write both tasks. Switch between Part 1 and Part 2 with the buttons at the bottom. Spend about 20 minutes on Part 1 and 40 minutes on Part 2. Your answers are saved on this device as you type."
          : "Read the task on the left and write your answer on the right. Your answer is saved on this device as you type."}
      >
        {startOnType && elapsed > 0 && remaining > 0 && (
          <button type="button" className="exam-btn" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause timer" : "Resume timer"}>
            {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            <span className="exam-btn-label">{running ? "Pause" : "Resume"}</span>
          </button>
        )}
        <Link href={exitHref} className="exam-btn" aria-label={`${exitLabel} (your writing is saved on this device)`}>
          <LogOut size={16} aria-hidden="true" /><span className="exam-btn-label">{exitLabel}</span>
        </Link>
        <button type="button" className="exam-btn exam-btn-primary" onClick={() => setSubmitOpen(true)} disabled={submitting}>
          {submitting ? "Marking…" : "Submit"}
        </button>
      </ExamTopBar>

      <div className="exam-part-strip">
        <b>Part {part + 1}</b>
        You should spend about {rules.minutes} minutes on this task. Write at least {rules.minWords} words.
      </div>

      <SplitPane
        leftId="writing-task-panel"
        rightId="writing-answer-panel"
        leftLabel="Task"
        rightLabel="Your answer"
        storageKey="ielts-writing-split-v1"
        mobileTab={mobileTab === "right" ? "right" : "left"}
        onMobileTabChange={setMobileTab}
        left={(
          <div className="exam-questions space-y-4">
            <p className="text-lg font-bold">{task.title}</p>
            <p>{task.prompt}</p>
            <p style={{ color: "var(--exam-muted)" }}>{task.instructions}</p>
            {task.chart && <WritingChart chart={task.chart} />}
          </div>
        )}
        right={(
          <div className="flex h-full min-h-[18rem] flex-col">
            <label htmlFor={`writing-answer-${task.slug}`} className="sr-only">Your answer for Part {part + 1}</label>
            <textarea
              ref={textareaRef}
              key={task.slug}
              id={`writing-answer-${task.slug}`}
              value={essays[task.slug] || ""}
              onChange={(event) => {
                const value = event.target.value;
                setEssays((current) => ({ ...current, [task.slug]: value }));
                if (startOnType && !running && remaining > 0 && elapsed === 0) setRunning(true);
              }}
              readOnly={submitting}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="sentences"
              className="exam-input min-h-0 flex-1 resize-none p-3 leading-7"
              style={{ width: "100%", minHeight: "16rem" }}
              aria-describedby="writing-word-count"
            />
            <p id="writing-word-count" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
              <span><b>Words: {words}</b>{words < rules.minWords ? ` · ${rules.minWords - words} to go` : ""}</span>
              <span style={{ color: "var(--exam-muted)" }}>Spell check is off, as in the real test.</span>
            </p>
          </div>
        )}
      />

      {tasks.length > 1 && (
        <nav className="exam-bottombar" aria-label="Parts">
          <div className="exam-parts">
            {tasks.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className="exam-part exam-part-label"
                data-active={index === part}
                aria-current={index === part ? "true" : undefined}
                onClick={() => goToPart(index)}
              >
                Part {index + 1}<span>{countWords(essays[item.slug] || "")} words</span>
              </button>
            ))}
          </div>
          <div className="exam-bar-actions">
            <button type="button" className="exam-btn" onClick={() => goToPart(part - 1)} disabled={part === 0} aria-label="Previous part"><ChevronLeft size={20} aria-hidden="true" /></button>
            <button type="button" className="exam-btn" onClick={() => goToPart(part + 1)} disabled={part === tasks.length - 1} aria-label="Next part"><ChevronRight size={20} aria-hidden="true" /></button>
          </div>
        </nav>
      )}

      {timerWarning && <p role="status" className="exam-toast">{timerWarning}</p>}
      <SubmitDialog
        open={submitOpen}
        tasks={tasks}
        essays={essays}
        remainingSeconds={remaining}
        onClose={() => setSubmitOpen(false)}
        canSubmit={anyText && !blockedReason}
        blockedReason={blockedReason || (anyText ? "" : "Write your answer before submitting.")}
        premium={premium}
        onSubmit={(mode) => { setSubmitOpen(false); setRunning(false); onSubmit({ essays, elapsed, mode }); }}
      />
      {children}
    </ExamShell>
  );
}
