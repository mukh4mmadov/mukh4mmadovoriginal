"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  initialSeconds: number;
  running: boolean;
  onExpire?: () => void;
}

export default function Timer({ initialSeconds, running, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, onExpire]);

  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const low = remaining <= 60;

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-sm font-semibold ${
        low
          ? "bg-accent-500/20 text-accent-400 animate-pulse-soft"
          : "bg-white/5 text-slate-200"
      }`}
    >
      <Clock size={16} />
      {mins}:{secs}
    </div>
  );
}
