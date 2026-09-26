"use client";

import Link from "next/link";
import readingTestsModule from "@/data/readingTests_new";
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
  const readingTests = readingTestsModule?.readingTests || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [progressData, setProgressData] = useState({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    const syncProgress = async () => {
      const data = {};
      if (readingTests && readingTests.length > 0) {
        for (const test of readingTests) {
          const progress = await getProgress(test.slug, user?.id);
          if (progress) {
            data[test.slug] = progress;
          }
        }
      }
      setProgressData(data);
      setProgressLoaded(true);
    };

    setProgressLoaded(false);
    syncProgress();
  }, [user]);

  const recommendation = useMemo(() => {
    if (!progressLoaded || !readingTests.length) return null;

    const completedTests = readingTests.filter(
      (test) => progressData[test.slug]?.completed,
    );
    const completedScores = completedTests
      .map((test) => Number(progressData[test.slug]?.bestScore))
      .filter((score) => Number.isFinite(score))
      .map((score) => Math.min(100, Math.max(0, score)));
    const averageScore = completedScores.length
      ? completedScores.reduce((total, score) => total + score, 0) / completedScores.length
      : null;

    if (completedTests.length === readingTests.length) {
      const lowestScoringTest = completedTests.reduce((lowest, test) => {
        const score = Number(progressData[test.slug]?.bestScore) || 0;
        return !lowest || score < (Number(progressData[lowest.slug]?.bestScore) || 0)
          ? test
          : lowest;
      }, null);

      return lowestScoringTest
        ? {
            test: lowestScoringTest,
            reason: `You have completed every passage. Review this one to improve your previous ${Math.round(Number(progressData[lowestScoringTest.slug]?.bestScore) || 0)}% best score.`,
            action: "Review passage",
          }
        : null;
    }

    const targetDifficulty = averageScore === null || averageScore < 60
      ? "easy"
      : averageScore < 80
        ? "medium"
        : "hard";
    const nextTest = readingTests.find(
      (test) => !progressData[test.slug]?.completed && test.difficulty === targetDifficulty,
    ) || readingTests.find((test) => !progressData[test.slug]?.completed);

    if (!nextTest) return null;

    const reason = averageScore === null
      ? "Start here to build your reading practice history."
      : averageScore < 60
        ? `Your average best score is ${Math.round(averageScore)}%. This easier passage is a good next step for building accuracy.`
        : averageScore < 80
          ? `Your average best score is ${Math.round(averageScore)}%. Continue with a medium-level passage.`
          : `Your average best score is ${Math.round(averageScore)}%. Try a harder passage for more challenge.`;

    return { test: nextTest, reason, action: "Start recommended passage" };
  }, [progressData, progressLoaded, readingTests]);

  const filteredTests = useMemo(() => {
    if (!readingTests || readingTests.length === 0) return [];
    return readingTests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty =
        selectedDifficulty === "all" || t.difficulty === selectedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [searchQuery, selectedDifficulty, readingTests]);

  const getDifficultyColor = (difficulty) => {
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
          <label htmlFor="search-input" className="sr-only">Search passages</label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
            aria-hidden="true"
          />
          <input
            id="search-input"
            type="text"
            placeholder="Search passages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            aria-label="Search passages by title or subtitle"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
          <label htmlFor="difficulty-select" className="sr-only">Filter by difficulty level</label>
          <Filter className="text-slate-400" size={18} aria-hidden="true" />
          <select
            id="difficulty-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-xl bg-transparent px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
            aria-label="Filter passages by difficulty level"
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

      <div className="mb-8">
        <DailyInspiration />
      </div>

      {recommendation && !searchQuery && selectedDifficulty === "all" && (
        <section
          aria-labelledby="recommended-practice-title"
          className="mb-8 rounded-2xl border border-brand-400/30 bg-brand-500/10 p-5 sm:p-6"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            Recommended next step
          </p>
          <h2 id="recommended-practice-title" className="mb-2 text-xl font-bold text-white">
            {recommendation.test.title}
          </h2>
          <p className="mb-4 max-w-2xl text-sm leading-6 text-slate-300">
            {recommendation.reason} The recommendation uses saved passage completion and best scores; it does not analyze individual question types.
          </p>
          <Link
            href={`/reading/${recommendation.test.slug}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
          >
            {recommendation.action}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

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
                        aria-hidden="true"
                      />
                      {progressData[t.slug]?.completed && (
                        <CheckCircle2 className="text-emerald-400" size={18} aria-hidden="true" />
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
                      <Clock size={14} aria-hidden="true" /> 20 min
                    </span>
                    <span className="group-hover:text-brand-300 transition-colors">
                      {passage.wordCount} words
                    </span>
                    <span className="group-hover:text-brand-300 transition-colors">
                      {
                        passage.questionGroups.flatMap((g) => g.questions)
                          .length
                      }{" "}
                      questions
                    </span>
                    {progressData[t.slug]?.bestScore !== undefined && (
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
