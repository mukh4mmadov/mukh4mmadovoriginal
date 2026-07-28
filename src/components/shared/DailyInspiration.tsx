"use client";

import { useState, useEffect, useMemo } from "react";
import { BookOpen, Lightbulb, Target, Check, RefreshCw } from "lucide-react";
import { verses } from "@/data/dailyVerses";
import { strategies } from "@/data/dailyStrategies";
import { words } from "@/data/dailyWords";
import { missionSets, Mission } from "@/data/dailyMissions";
import { getDailyContent, getRandomContentExcluding } from "@/lib/dailyRotation";

interface DailyInspirationProps {
  compact?: boolean;
}

export default function DailyInspiration({ compact = false }: DailyInspirationProps) {
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get daily content with caching (for strategy, word, missions - still daily rotation)
  const dailyStrategy = useMemo(() => getDailyContent(strategies, "daily-strategy"), []);
  const dailyWord = useMemo(() => getDailyContent(words, "daily-word"), []);
  const dailyMissions = useMemo(() => getDailyContent(missionSets, "daily-missions"), []);

  // Select random verse on client mount
  useEffect(() => {
    setMounted(true);
    
    // Select a random verse
    const randomVerse = getRandomContentExcluding(verses);
    setCurrentVerseIndex(randomVerse.index);
    
    // Load completed missions from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem("daily-missions-completed");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only load if it's from today
          if (parsed.date === dailyMissions.date) {
            setCompletedMissions(new Set(parsed.completed));
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }, [dailyMissions.date]);

  const handleRefreshVerse = () => {
    setIsRefreshing(true);
    
    // Get a new random verse excluding the current one
    const newVerse = getRandomContentExcluding(verses, currentVerseIndex ?? undefined);
    setCurrentVerseIndex(newVerse.index);
    
    // Reset animation after transition
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const toggleMission = (missionId: string) => {
    setCompletedMissions((prev) => {
      const next = new Set(prev);
      if (next.has(missionId)) {
        next.delete(missionId);
      } else {
        next.add(missionId);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            "daily-missions-completed",
            JSON.stringify({
              completed: Array.from(next),
              date: dailyMissions.date,
            })
          );
        } catch (e) {
          // Ignore errors
        }
      }
      
      return next;
    });
  };

  if (!mounted || currentVerseIndex === null) {
    return null; // Prevent hydration mismatch
  }

  const currentVerse = verses[currentVerseIndex];

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-brand-500/10 via-transparent to-surface/50 border border-white/10 rounded-xl p-4 space-y-3">
        {/* Compact Verse */}
        <div className="flex items-start gap-3">
          <BookOpen className="text-brand-400 shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium leading-relaxed">
              {currentVerse.text}
            </p>
            <p className="text-slate-500 text-xs mt-1">{currentVerse.reference}</p>
          </div>
        </div>

        {/* Compact Strategy */}
        <div className="flex items-start gap-3">
          <Lightbulb className="text-amber-400 shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-1">IELTS Strategy</p>
            <p className="text-slate-200 text-sm">{dailyStrategy.content.tip}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-brand-500/10 via-transparent to-surface/50 border border-white/10 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Verse Section */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-brand-500/20 blur-lg rounded-full" />
          <BookOpen className="text-brand-400 relative" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-slate-200 text-base font-medium leading-relaxed">
              {currentVerse.text}
            </p>
            <p className="text-slate-500 text-sm mt-2">{currentVerse.reference}</p>
          </div>
        </div>
        <button
          onClick={handleRefreshVerse}
          className="shrink-0 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-slate-400 hover:text-brand-400 hover:scale-110"
          aria-label="New inspiration"
          title="Get new inspiration"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Strategy Section */}
      <div className="flex items-start gap-4">
        <Lightbulb className="text-amber-400 shrink-0" size={18} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
            📚 IELTS Strategy of the Day
          </p>
          <p className="text-slate-200 text-sm">{dailyStrategy.content.tip}</p>
        </div>
      </div>

      {/* Word of the Day */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full" />
          <Lightbulb className="text-emerald-400 relative" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
            💡 Word of the Day
          </p>
          <p className="text-brand-300 text-base font-semibold mb-1">
            {dailyWord.content.word}
          </p>
          <p className="text-slate-300 text-sm mb-1.5">{dailyWord.content.meaning}</p>
          <p className="text-slate-400 text-xs italic">{dailyWord.content.example}</p>
        </div>
      </div>

      {/* Today's Missions */}
      <div className="flex items-start gap-4">
        <Target className="text-purple-400 shrink-0" size={18} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">
            🎯 Today's Mission
          </p>
          <div className="space-y-2">
            {dailyMissions.content.map((mission) => (
              <button
                key={mission.id}
                onClick={() => toggleMission(mission.id)}
                className={`w-full flex items-center gap-3 text-left p-2 rounded-lg transition-all ${
                  completedMissions.has(mission.id)
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    completedMissions.has(mission.id)
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-slate-500"
                  }`}
                >
                  {completedMissions.has(mission.id) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    completedMissions.has(mission.id)
                      ? "text-emerald-300 line-through"
                      : "text-slate-200"
                  }`}
                >
                  {mission.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
