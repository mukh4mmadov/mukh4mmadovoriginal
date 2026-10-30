"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudyGoal } from "@/hooks/useStudyGoal";
import { useOverallEstimate } from "@/hooks/useOverallEstimate";
import { getAllProgress } from "@/lib/progressTracker";
import { getQuestionTypeAccuracy } from "@/lib/reading/practice-summary";
import { readVocabulary } from "@/lib/vocabulary/vocabulary-notebook.mjs";
import { dueItems } from "@/lib/vocabulary/spaced-review.mjs";
import { readFullMock } from "@/lib/mock/full-mock.mjs";
import { localDayKey } from "@/lib/missions/daily-missions.mjs";
import { buildExamPlan, daysUntil } from "@/lib/progress/exam-plan.mjs";

const BANDS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];
const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));
const inputClass = "min-h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-100";

function GoalForm({ goal, onSave, onCancel }) {
  const [examDate, setExamDate] = useState(goal.exam_date || "");
  const [target, setTarget] = useState(BANDS.includes(goal.target_band) ? goal.target_band : "6.5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = localDayKey();
  const save = async (event) => {
    event.preventDefault();
    if (!examDate || examDate < today) { setError("Choose a date from today onwards."); return; }
    setSaving(true);
    try {
      await onSave({ exam_date: examDate, target_band: target });
    } catch {
      setError("Your exam date could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-slate-300">Exam date
        <input type="date" min={today} value={examDate} onChange={(event) => setExamDate(event.target.value)} className={`${inputClass} mt-1 block`} required />
      </label>
      <label className="text-sm text-slate-300">Target band
        <select value={target} onChange={(event) => setTarget(event.target.value)} className={`${inputClass} mt-1 block`}>
          {BANDS.map((band) => <option key={band} value={band} style={{ color: "#111" }}>{band}</option>)}
        </select>
      </label>
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Make my plan"}</button>
      {onCancel && <button type="button" onClick={onCancel} className="min-h-11 text-sm text-slate-400 underline">Cancel</button>}
      {error && <p role="alert" className="w-full text-sm text-rose-300">{error}</p>}
    </form>
  );
}

/**
 * Exam countdown and today's focus: from the learner's exam date and target
 * band, their latest bands and the question types they miss most.
 */
export default function ExamPlanCard() {
  const { user } = useAuth();
  const userId = user?.id;
  const { goal, saveGoal } = useStudyGoal(userId);
  const estimate = useOverallEstimate();
  const [signals, setSignals] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    getAllProgress(userId).catch(() => []).then((progress) => {
      if (!active) return;
      let savedWords = 0;
      let dueWords = 0;
      let daysSinceFullMock = null;
      try {
        const words = readVocabulary(window.localStorage, userId);
        savedWords = words.length;
        dueWords = dueItems(words).length;
        const lastMock = readFullMock(window.localStorage).history[0];
        const finished = Date.parse(lastMock?.completedAt || "");
        if (Number.isFinite(finished)) daysSinceFullMock = Math.floor((Date.now() - finished) / (24 * 60 * 60 * 1000));
      } catch {
        // Without browser data the plan still works.
      }
      setSignals({ weakestQuestionType: getQuestionTypeAccuracy(progress || [])[0] || null, savedWords, dueWords, daysSinceFullMock });
    });
    return () => { active = false; };
  }, [userId]);

  const daysLeft = daysUntil(goal?.exam_date, localDayKey());
  const plan = useMemo(() => (signals && daysLeft != null ? buildExamPlan({
    daysLeft,
    targetBand: Number(goal.target_band),
    estimate,
    ...signals,
  }) : null), [signals, daysLeft, goal?.target_band, estimate]);

  if (!goal || !signals) return null;
  const save = async (next) => { await saveGoal(next); setEditing(false); };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8" aria-labelledby="exam-plan-title">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        {!plan || editing || plan.phase.id === "passed" ? (
          <>
            <h2 id="exam-plan-title" className="mb-1 flex items-center gap-2 text-lg font-semibold text-white"><CalendarClock size={20} className="text-brand-400" aria-hidden="true" /> {plan?.phase.id === "passed" ? "Your exam date has passed" : "When is your IELTS exam?"}</h2>
            <p className="mb-4 text-sm text-slate-400">Add your exam date and target band to get a countdown and a focus list for every day.</p>
            <GoalForm goal={goal} onSave={save} onCancel={editing ? () => setEditing(false) : null} />
          </>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="lg:border-r lg:border-white/10 lg:pr-6">
              <h2 id="exam-plan-title" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-300"><CalendarClock size={16} aria-hidden="true" /> Your exam</h2>
              <p className="mt-2 font-display text-5xl font-bold text-white">{daysLeft}<span className="ml-2 text-lg font-semibold text-slate-300">{daysLeft === 1 ? "day left" : "days left"}</span></p>
              <p className="mt-1 text-sm text-slate-400">{new Date(`${goal.exam_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long" })}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-200"><Target size={15} className="text-brand-400" aria-hidden="true" /> Target {formatBand(goal.target_band)} · now {formatBand(estimate.overall)}</p>
              {plan.gap != null && <p className={`mt-1 text-sm ${plan.gap > 0 ? "text-amber-200" : "text-emerald-300"}`}>{plan.gap > 0 ? `${plan.gap.toFixed(1)} band to go` : "You're at your target, keep it steady"}</p>}
              <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs text-slate-400 underline hover:text-white">Change date or target</button>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{plan.phase.label}</p>
              <p className="mb-3 text-sm text-slate-400">{plan.phase.advice}</p>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Today&apos;s focus</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {plan.tasks.map((task) => (
                  <li key={task.id}>
                    <Link href={task.href} className="flex min-h-16 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06]">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-100">{task.title}</span>
                        <span className="block text-xs text-slate-400">{task.why}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-brand-400" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
