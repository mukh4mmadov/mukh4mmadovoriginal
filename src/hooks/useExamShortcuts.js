"use client";

import { useEffect, useRef, useState } from "react";
import { dueTimerWarning } from "@/lib/exam/exam-settings.mjs";

// Alt+→ / Alt+← move between questions, Alt+F flags the current one.
export function useExamShortcuts({ onNext, onPrevious, onToggleFlag, enabled = true }) {
  const handlers = useRef({ onNext, onPrevious, onToggleFlag });
  handlers.current = { onNext, onPrevious, onToggleFlag };

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") { event.preventDefault(); handlers.current.onNext?.(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); handlers.current.onPrevious?.(); }
      else if (event.code === "KeyF") { event.preventDefault(); handlers.current.onToggleFlag?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

// A short message at 10 and 5 minutes left (once each), unless turned off.
export function useTimerWarning(remainingSeconds, enabled) {
  const shown = useRef([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enabled || remainingSeconds == null) return;
    const minutes = dueTimerWarning(remainingSeconds, shown.current);
    if (!minutes) return;
    shown.current = [...shown.current, minutes];
    setMessage(`${minutes} minutes left`);
  }, [remainingSeconds, enabled]);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return message;
}
