"use client";

import { Clock, Play, Pause, RotateCcw } from "lucide-react";

export default function Timer({
  remainingSeconds,
  running,
  onPause,
  onResume,
  onReset,
  showControls = true,
}) {
  const mins = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remainingSeconds % 60).toString().padStart(2, "0");
  const low = remainingSeconds <= 60;

  const handlePause = () => {
    onPause?.();
  };

  const handleResume = () => {
    onResume?.();
  };

  const handleReset = () => {
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
              disabled={remainingSeconds === 0}
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
