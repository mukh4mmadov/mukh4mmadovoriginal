"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Same storage as the goal form on the Statistics page: the browser for
// guests, the study_goals table for signed-in learners.
export const LOCAL_STUDY_GOAL_KEY = "ielts-reading-study-goal-v1";
const DEFAULT_GOAL = { target_band: "6.5", exam_date: "", study_days_per_week: 4 };

function readLocalGoal() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_STUDY_GOAL_KEY) || "null");
    if (!parsed) return DEFAULT_GOAL;
    const band = Number(parsed.target_band);
    return {
      target_band: Number.isFinite(band) && band >= 4 && band <= 9 ? band.toFixed(1) : DEFAULT_GOAL.target_band,
      exam_date: typeof parsed.exam_date === "string" ? parsed.exam_date : "",
      study_days_per_week: Number(parsed.study_days_per_week) || DEFAULT_GOAL.study_days_per_week,
    };
  } catch {
    return DEFAULT_GOAL;
  }
}

export function useStudyGoal(userId) {
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    if (!userId || !supabase) { setGoal(readLocalGoal()); return undefined; }
    let active = true;
    supabase.from("study_goals").select("target_band, exam_date, study_days_per_week").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setGoal(data ? {
          target_band: Number(data.target_band || 6.5).toFixed(1),
          exam_date: data.exam_date || "",
          study_days_per_week: data.study_days_per_week || 4,
        } : DEFAULT_GOAL);
      })
      .catch(() => { if (active) setGoal(DEFAULT_GOAL); });
    return () => { active = false; };
  }, [userId]);

  const saveGoal = useCallback(async (next) => {
    const merged = { ...(goal || DEFAULT_GOAL), ...next };
    if (!userId || !supabase) {
      window.localStorage.setItem(LOCAL_STUDY_GOAL_KEY, JSON.stringify({ ...merged, target_band: Number(merged.target_band) }));
    } else {
      const { error } = await supabase.from("study_goals").upsert({
        user_id: userId,
        target_band: Number(merged.target_band),
        exam_date: merged.exam_date || null,
        study_days_per_week: Number(merged.study_days_per_week),
      }, { onConflict: "user_id" });
      if (error) throw error;
    }
    setGoal(merged);
  }, [goal, userId]);

  return { goal, saveGoal };
}
