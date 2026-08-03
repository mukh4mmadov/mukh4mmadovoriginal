"use client";

import { useState, useEffect, useMemo } from "react";
import { BookOpen, Lightbulb, Target, Check, RefreshCw, Star, Copy } from "lucide-react";
import { studyWisdomQuotes, getRandomQuoteExcluding } from "@/data/studyWisdom";
import { strategies } from "@/data/dailyStrategies";
import { words } from "@/data/dailyWords";
import { missionSets, Mission } from "@/data/dailyMissions";
import { getDailyContent } from "@/lib/dailyRotation";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedQuotes } from "@/hooks/useSavedQuotes";

interface DailyInspirationProps {
  compact?: boolean;
}

export default function DailyInspiration({ compact = false }: DailyInspirationProps) {
  const { user } = useAuth();
  const { quotes: savedQuotes, toggleQuote } = useSavedQuotes();
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewedQuoteIds, setViewedQuoteIds] = useState<string[]>([]);

  // Get daily content with caching (for strategy, word, missions - still daily rotation)
  const dailyStrategy = useMemo(() => getDailyContent(strategies, "daily-strategy"), []);
  const dailyWord = useMemo(() => getDailyContent(words, "daily-word"), []);
  const dailyMissions = useMemo(() => getDailyContent(missionSets, "daily-missions"), []);

  // Select random quote on client mount
  useEffect(() => {
    setMounted(true);
    
    // Load viewed quotes from localStorage
    if (typeof window !== 'undefined') {
      try {
        const viewedQuotes = localStorage.getItem("viewed-quote-ids");
        if (viewedQuotes) {
          setViewedQuoteIds(JSON.parse(viewedQuotes));
        }
        
        // Load completed missions from localStorage
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
  
  // Select a random quote on client mount (only runs once)
  useEffect(() => {
    if (!mounted) return;
    
    const availableQuotes = studyWisdomQuotes.filter(q => !viewedQuoteIds.includes(q.id));
    
    // If all quotes have been viewed, reset the viewed list
    if (availableQuotes.length === 0) {
      setViewedQuoteIds([]);
      const randomQuote = getRandomQuoteExcluding([]);
      setCurrentQuote(randomQuote.id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("viewed-quote-ids", JSON.stringify([randomQuote.id]));
        } catch (e) {
          // Ignore errors
        }
      }
    } else {
      const randomQuote = getRandomQuoteExcluding(viewedQuoteIds);
      setCurrentQuote(randomQuote.id);
      const newViewedIds = [...viewedQuoteIds, randomQuote.id];
      setViewedQuoteIds(newViewedIds);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("viewed-quote-ids", JSON.stringify(newViewedIds));
        } catch (e) {
          // Ignore errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleRefreshQuote = () => {
    setIsRefreshing(true);
    
    // Get a new random quote excluding the current one
    const availableQuotes = studyWisdomQuotes.filter(q => q.id !== currentQuote && !viewedQuoteIds.includes(q.id));
    
    if (availableQuotes.length === 0) {
      // All quotes have been viewed, reset and start fresh
      setViewedQuoteIds([]);
      const newQuote = getRandomQuoteExcluding([currentQuote || ""]);
      setCurrentQuote(newQuote.id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("viewed-quote-ids", JSON.stringify([newQuote.id]));
        } catch (e) {
          // Ignore errors
        }
      }
    } else {
      const newQuote = getRandomQuoteExcluding([...viewedQuoteIds, currentQuote || ""]);
      setCurrentQuote(newQuote.id);
      const newViewedIds = [...viewedQuoteIds, newQuote.id];
      setViewedQuoteIds(newViewedIds);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("viewed-quote-ids", JSON.stringify(newViewedIds));
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // Reset animation after transition
    setTimeout(() => setIsRefreshing(false), 300);
  };
  
  const handleSaveQuote = async () => {
    if (!currentQuote) return;
    
    const quoteData = studyWisdomQuotes.find(q => q.id === currentQuote);
    if (!quoteData) return;

    try {
      await toggleQuote({
        quote_id: quoteData.id,
        quote: quoteData.quote,
        author: quoteData.author,
        role: quoteData.role,
        category: quoteData.category,
        reflection: quoteData.reflection,
      });
    } catch (error) {
      console.error('Error saving quote:', error);
    }
  };
  
  const handleCopyQuote = () => {
    const quote = studyWisdomQuotes.find(q => q.id === currentQuote);
    if (!quote) return;
    
    const text = `"${quote.quote}" - ${quote.author}`;
    
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      });
    }
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

  if (!mounted || currentQuote === null) {
    return null; // Prevent hydration mismatch
  }

  const quoteData = studyWisdomQuotes.find(q => q.id === currentQuote);
  if (!quoteData) return null;

  const isQuoteSaved = savedQuotes.some(q => q.quote_id === currentQuote);

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-brand-500/10 via-transparent to-surface/50 border border-white/10 rounded-xl p-4 space-y-3">
        {/* Compact Study Wisdom */}
        <div className="flex items-start gap-3">
          <BookOpen className="text-brand-400 shrink-0" size={16} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium leading-relaxed">
              {quoteData.quote}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {quoteData.author} • {quoteData.role}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={handleSaveQuote}
              className={`p-1.5 rounded-lg transition-all ${
                isQuoteSaved
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : "text-slate-500 hover:bg-white/10 hover:text-slate-300"
              }`}
              aria-label="Save quote"
              title="Save quote"
            >
              <Star size={14} className={isQuoteSaved ? "fill-current" : ""} />
            </button>
            <button
              onClick={handleCopyQuote}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-all"
              aria-label="Copy quote"
              title="Copy quote"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Compact Strategy */}
        <div className="flex items-start gap-3">
          <Lightbulb className="text-amber-400 shrink-0" size={16} aria-hidden="true" />
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
      {/* Study Wisdom Section */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-brand-500/20 blur-lg rounded-full" />
          <BookOpen className="text-brand-400 relative" size={20} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-slate-200 text-base font-medium leading-relaxed">
              {quoteData.quote}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              {quoteData.author} • {quoteData.role}
            </p>
            <p className="text-slate-500 text-xs mt-2 italic">
              {quoteData.reflection}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleSaveQuote}
            className={`p-2 rounded-lg transition-all ${
              isQuoteSaved
                ? "text-amber-400 hover:bg-amber-400/10"
                : "text-slate-500 hover:bg-white/10 hover:text-slate-300"
            }`}
            aria-label="Save quote"
            title="Save quote"
          >
            <Star size={16} className={isQuoteSaved ? "fill-current" : ""} />
          </button>
          <button
            onClick={handleCopyQuote}
            className="p-2 rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-all"
            aria-label="Copy quote"
            title="Copy quote"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleRefreshQuote}
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-slate-400 hover:text-brand-400 hover:scale-110"
            aria-label="New wisdom"
            title="Get new wisdom"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Strategy Section */}
      <div className="flex items-start gap-4">
        <Lightbulb className="text-amber-400 shrink-0" size={18} aria-hidden="true" />
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
          <Lightbulb className="text-emerald-400 relative" size={18} aria-hidden="true" />
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
        <Target className="text-purple-400 shrink-0" size={18} aria-hidden="true" />
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
