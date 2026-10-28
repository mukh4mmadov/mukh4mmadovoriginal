"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw } from "lucide-react";

const motivationalQuotes = [
  "Consistent practice is the key to IELTS success.",
  "Every passage gives you another chance to learn from your answers.",
  "Stay focused on your progress, not perfection.",
  "Reading speed improves with regular practice.",
  "Your dedication will pay off on exam day.",
  "Take it one passage at a time.",
  "Mistakes are learning opportunities.",
  "Trust the process and keep practicing.",
];

export default function DailyInspiration({ compact = false }) {
  const [mounted, setMounted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dayNumber = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    setCurrentQuote(motivationalQuotes[dayNumber % motivationalQuotes.length]);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCurrentQuote((previous) => {
        const others = motivationalQuotes.filter((quote) => quote !== previous);
        return others[Math.floor(Math.random() * others.length)];
      });
      setIsRefreshing(false);
    }, 500);
  };

  if (!mounted) return null;

  if (compact) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-400" size={20} aria-hidden="true" />
          <p className="text-sm text-slate-300 flex-1">{currentQuote}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          aria-label="Show another quote"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-400" size={24} aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Daily inspiration</h2>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          aria-label="Show another quote"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
        </button>
      </div>
      <p className="text-slate-300 leading-relaxed" aria-live="polite">{currentQuote}</p>
    </div>
  );
}
