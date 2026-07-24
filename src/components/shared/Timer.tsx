"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

interface TimerProps {
  initialSeconds: number;
  running: boolean;
  onExpire?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  showControls?: boolean;
}

export default function Timer({ 
  initialSeconds, 
  running, 
  onExpire, 
  onPause, 
  onResume, 
  onReset,
  showControls = true 
}: TimerProps) {
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
              onClick={handlePause}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
              title="Pause timer"
            >
              <Pause size={14} />
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/30 hover:border-brand-500/50 transition-all"
              title="Resume timer"
              disabled={remaining === 0}
            >
              <Play size={14} />
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
            title="Reset timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
