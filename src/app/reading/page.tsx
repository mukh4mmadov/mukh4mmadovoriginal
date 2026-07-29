"use client";

import Link from "next/link";
import { readingTests } from "@/data/readingTests_new";
import {
  Clock,
  ArrowRight,
  FileText,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { getProgress } from "@/lib/progressTracker";
import DailyInspiration from "@/components/shared/DailyInspiration";
import { useAuth } from "@/contexts/AuthContext";

export default function ReadingListPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [progressData, setProgressData] = useState<Record<string, any>>({});

  useEffect(() => {
    const syncProgress = async () => {
      const data: Record<string, any> = {};
      for (const test of readingTests) {
        const progress = await getProgress(test.slug, user?.id);
        if (progress) {
          data[test.slug] = progress;
        }
      }
      setProgressData(data);
    };

    syncProgress();
  }, [user]);

  const filteredTests = useMemo(() => {
    return readingTests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty =
        selectedDifficulty === "all" || t.difficulty === selectedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, selectedDifficulty]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "medium":
        return "text-brand-400 bg-brand-500/10 border-brand-500/30";
      case "hard":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-slate-400 bg-white/5 border-white/10";
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">
        Reading practice
      </p>
      <h1 className="section-title mb-4">Choose a passage</h1>
      <p className="section-subtitle mb-10 max-w-xl">
        Each passage is timed at 20 minutes and mixes question types the way the
        real Academic Reading test does.
      </p>

      <div className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_12px_40px_rgba(2,8,23,0.12)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search passages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
          <Filter className="text-slate-400" size={18} />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-xl bg-transparent px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {(searchQuery || selectedDifficulty !== "all") && (
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <span>Showing filtered results</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedDifficulty("all");
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Daily Inspiration */}
      <div className="mb-8">
        <DailyInspiration />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {filteredTests.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto mb-4 text-slate-500" size={48} />
            <p className="text-slate-400">
              No passages found matching your criteria.
            </p>
          </div>
        ) : (
          filteredTests.map((t, index) => {
            const passage = t.passages[0];
            return (
              <Link
                key={t.slug}
                href={`/reading/${t.slug}`}
                className="surface-card group relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:-translate-y-0.5 hover:border-brand-500/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:via-brand-500/10 group-hover:to-brand-500/5 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="text-brand-400 group-hover:scale-110 group-hover:text-brand-300 transition-all duration-300"
                        size={26}
                      />
                      {progressData[t.slug]?.completed && (
                        <CheckCircle2 className="text-emerald-400" size={18} />
                      )}
                    </div>
                    {t.difficulty && (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${getDifficultyColor(t.difficulty)}`}
                      >
                        {t.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
                    {t.subtitle}
                  </p>
                  <h3 className="mb-2 font-display text-xl font-bold group-hover:text-brand-200 transition-colors">
                    {t.title}
                  </h3>
                  <div className="mb-4 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 group-hover:text-brand-300 transition-colors">
                      <Clock size={14} /> 20 min
                    </span>
                    <span className="group-hover:text-brand-300 transition-colors">
                      {passage.wordCount} words
                    </span>
                    <span className="group-hover:text-brand-300 transition-colors">
                      {
                        passage.questionGroups.flatMap((g: any) => g.questions)
                          .length
                      }{" "}
                      questions
                    </span>
                    {progressData[t.slug]?.bestScore && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        Best: {progressData[t.slug].bestScore.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-400 group-hover:gap-2 group-hover:text-brand-300 transition-all">
                    Start test{" "}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
