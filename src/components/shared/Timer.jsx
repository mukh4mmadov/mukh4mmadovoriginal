"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

export default function Timer({
  initialSeconds,
  running,
  onExpire,
  onPause,
  onResume,
  onReset,
  showControls = true,
}) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(initialSeconds);
    expiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return;

    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const low = remaining <= 60;

  const handlePause = () => {
    onPause?.();
  };

  const handleResume = () => {
    onResume?.();
  };

  const handleReset = () => {
    setRemaining(initialSeconds);
    expiredRef.current = false;
    onReset?.();
  };

  return (
    <div className="flex items-center gap-2">
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

      {showControls && (
        <div className="flex items-center gap-1">
          {running ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-white/20 hover:bg-white/10"
              aria-label="Pause timer"
              title="Pause timer"
            >
              <Pause size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResume}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/20 text-brand-300 transition-all hover:border-brand-500/50 hover:bg-brand-500/30"
              aria-label="Resume timer"
              title="Resume timer"
              disabled={remaining === 0}
            >
              <Play size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-white/20 hover:bg-white/10"
            aria-label="Reset timer"
            title="Reset timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
