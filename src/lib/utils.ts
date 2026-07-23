import clsx from "clsx";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

export function getCEFRColor(level: string): string {
  const colors: Record<string, string> = {
    A1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    A2: "bg-green-500/20 text-green-400 border-green-500/30",
    B1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    B2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    C1: "bg-red-500/20 text-red-400 border-red-500/30",
    C2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return colors[level] || colors.A1;
}

export function getCEFRLabel(level: string): string {
  const labels: Record<string, string> = {
    A1: "Beginner",
    A2: "Elementary",
    B1: "Intermediate",
    B2: "Upper Intermediate",
    C1: "Advanced",
    C2: "Proficiency",
  };
  return labels[level] || level;
}

export function calculateSM2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): { repetitions: number; easeFactor: number; interval: number } {
  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  let newReps = repetitions;
  let newInterval = interval;

  if (quality < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    if (newReps === 0) {
      newInterval = 1;
    } else if (newReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEase);
    }
    newReps += 1;
  }

  return { repetitions: newReps, easeFactor: newEase, interval: newInterval };
}

export function getStoredProgress() {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("linguaflow-progress");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProgress(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("linguaflow-progress", JSON.stringify(data));
}
