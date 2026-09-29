"use client";

import { useState, useEffect } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const motivationalQuotes = [
  "Consistent practice is the key to IELTS success.",
  "Every passage you complete brings you closer to your target band.",
  "Stay focused on your progress, not perfection.",
  "Reading speed improves with regular practice.",
  "Your dedication will pay off on exam day.",
  "Take it one passage at a time.",
  "Mistakes are learning opportunities.",
  "Trust the process and keep practicing.",
];

export default function DailyInspiration({ compact = false }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentQuote(motivationalQuotes[0]);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuote(motivationalQuotes[randomIndex]);
      setIsRefreshing(false);
    }, 500);
  };

  if (!mounted) return null;

  if (compact) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-400" size={20} />
          <p className="text-sm text-slate-300 flex-1">{currentQuote}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Get new quote"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Daily Inspiration</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Get new quote"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
      <p className="text-slate-300 leading-relaxed">{currentQuote}</p>
    </div>
  );
}