"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Flame, ListChecks } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { getAllProgress } from "@/lib/progressTracker";
import { getReviewedQuestionIds, getReviewQueue } from "@/lib/reading/answer-review";
import { readListeningHistory } from "@/lib/listening/listening-results.mjs";
import { readWritingHistory } from "@/lib/writing/writing-history.mjs";
import { readVocabulary } from "@/lib/vocabulary/vocabulary-notebook.mjs";
import {
  ensureTodayRecord,
  evaluateMissions,
  localDayKey,
  markDayComplete,
  missionsStorageKey,
  missionStreak,
  readDrillRounds,
} from "@/lib/missions/daily-missions.mjs";
import { dailyMissionsRepository } from "@/lib/supabase/repositories/daily-missions.repository";

function readRecord(userId) {
  try {
    return JSON.parse(window.localStorage.getItem(missionsStorageKey(userId)) || "null");
  } catch {
    return null;
  }
}

function writeRecord(userId, record) {
  try {
    window.localStorage.setItem(missionsStorageKey(userId), JSON.stringify(record));
  } catch {
    // Missions still show for this visit.
  }
}

export default function DailyMissionsCard() {
  const { user, profile, isLoading } = useAuth();
  const userId = user?.id;
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [state, setState] = useState(null);
  const lastSynced = useRef("");

  const refresh = useCallback(async () => {
    const progress = await getAllProgress(userId).catch(() => []);
    const readingAttempts = (progress || []).flatMap((item) => {
      const history = Array.isArray(item?.attemptHistory) ? item.attemptHistory : [];
      if (history.length > 0) return history.map((attempt) => Number(attempt?.timestamp)).filter(Boolean);
      return Number(item?.lastAttempt) > 0 ? [Number(item.lastAttempt)] : [];
    });
    const storage = window.localStorage;
    const reviewedIds = getReviewedQuestionIds(userId);
    const reviewedSet = new Set(reviewedIds);
    const reviewable = getReviewQueue(userId).filter((item) => !reviewedSet.has(item.id)).length;
    const today = localDayKey();

    let record = ensureTodayRecord(readRecord(userId), today, { signedIn: Boolean(accountUserId), reviewable, reviewedIds });
    const missions = evaluateMissions(record.missions, today, {
      readingAttempts,
      listeningAttempts: readListeningHistory(storage).map((attempt) => attempt.completedAt),
      wordsSaved: readVocabulary(storage, userId).map((item) => item.createdAt),
      drillRounds: readDrillRounds(storage).map((round) => round.completedAt),
      writingFeedback: readWritingHistory(storage).map((item) => item.createdAt),
      reviewedIds,
      baselineReviewedIds: record.baselineReviewedIds,
    });
    const allDone = missions.every((mission) => mission.done);
    if (allDone) record = markDayComplete(record);
    writeRecord(userId, record);
    setState({ missions, allDone, streak: missionStreak(record.completedDays, today) });

    // Completed missions are also kept per day in the learner's account.
    const completed = missions.filter((mission) => mission.done).map((mission) => mission.id);
    const signature = `${today}:${completed.join(",")}`;
    if (accountUserId && signature !== lastSynced.current) {
      lastSynced.current = signature;
      dailyMissionsRepository.createDailyMissions({
        user_id: accountUserId,
        date: today,
        missions: record.missions,
        completed_missions: completed,
      }).catch((error) => console.warn("Daily missions could not be saved to the account:", error));
    }
  }, [userId, accountUserId]);

  useEffect(() => {
    if (isLoading) return undefined;
    void refresh();
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoading, refresh]);

  if (!state) return null;
  const doneCount = state.missions.filter((mission) => mission.done).length;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="daily-missions-title">
      <div className="rounded-2xl border border-brand-400/20 bg-brand-500/[0.06] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={20} className="text-brand-400" aria-hidden="true" />
            <h2 id="daily-missions-title" className="text-lg font-semibold text-white">Today&apos;s missions</h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {state.streak >= 2 && (
              <span className="inline-flex items-center gap-1 text-amber-200"><Flame size={16} aria-hidden="true" /> {state.streak}-day streak</span>
            )}
            <span className="text-slate-300">{doneCount} of {state.missions.length} done</span>
          </div>
        </div>
        {state.allDone && (
          <p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            All done for today. Come back tomorrow for new missions.
          </p>
        )}
        <ul className="grid gap-2 sm:grid-cols-2">
          {state.missions.map((mission) => (
            <li key={mission.id}>
              <Link
                href={mission.href}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${mission.done ? "border-emerald-400/20 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
              >
                {mission.done
                  ? <CheckCircle2 size={20} className="shrink-0 text-emerald-400" aria-hidden="true" />
                  : <Circle size={20} className="shrink-0 text-slate-500" aria-hidden="true" />}
                <span className={`min-w-0 flex-1 ${mission.done ? "text-slate-300" : "text-slate-100"}`}>
                  {mission.title}
                  <span className="sr-only">{mission.done ? " (done)" : ""}</span>
                </span>
                {mission.target > 1 && <span className="shrink-0 text-xs font-semibold text-slate-400">{mission.progress}/{mission.target}</span>}
                {!mission.done && <ArrowRight size={16} className="shrink-0 text-brand-400" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
