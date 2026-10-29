"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Target,
  Highlighter,
  ArrowRight,
  Play,
  TrendingUp,
  CheckCircle,
  Headphones,
  ClipboardCheck,
  MessageSquare,
  PenLine,
  Trophy,
} from "lucide-react";
import DailyInspiration from "@/components/shared/DailyInspiration";
import DailyMissionsCard from "@/components/shared/DailyMissionsCard";
import { getAllProgress } from "@/lib/progressTracker";
import { useAuth } from "@/contexts/AuthContext";
import readingTestsModule from "@/data/readingTests_new";
import { supabase } from '@/lib/supabase/client';
import { formatAggregateTime, getHomeMetricsSource, getMyReadingMetrics, getTashkentTodayRange } from '@/lib/reading/metrics.mjs';
import { requestOpenMigrationPrompt } from '@/lib/reading/migration-prompt-events.mjs';
import { requestHelpDialog } from '@/lib/help-dialog';

const readingTests = readingTestsModule?.readingTests || [];
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Unsubmitted tests are saved as drafts by the reading player; offer to resume
// the most recent one that still has answers.
function findLatestDraft() {
  try {
    let latest = null;
    for (const test of readingTests) {
      const saved = JSON.parse(window.localStorage.getItem(`ielts-reading-${test.slug}`) || "null");
      const savedAt = Number(saved?.timestamp);
      const answered = Object.values(saved?.answers || {}).filter(Boolean).length;
      if (!answered || !Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) continue;
      if (!latest || savedAt > latest.savedAt) latest = { test, savedAt, answered };
    }
    return latest;
  } catch {
    return null;
  }
}

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id;
  const [resumeDraft, setResumeDraft] = useState(null);
  const [todayStats, setTodayStats] = useState({
    readingTimeSeconds: 0,
    testsCompleted: 0,
    highlightsCreated: null,
    accuracy: null,
    source: 'local',
  });

  useEffect(() => {
    let isActive = true;
    const loadProgress = async () => {
      const range = getTashkentTodayRange();
      const [progress, todayMetrics] = await Promise.all([
        getAllProgress(userId),
        userId ? getMyReadingMetrics(supabase, range.from, range.to) : Promise.resolve(null),
      ]);
      if (!isActive) return;
      const localAttemptHistoryExists = (progress || []).some((item) => (item.attemptHistory || []).length > 0);
      const allTimeMetrics = todayMetrics?.attempts === 0 && localAttemptHistoryExists
        ? await getMyReadingMetrics(supabase, '1970-01-01T00:00:00.000Z', new Date(Date.now() + 86400000).toISOString())
        : null;
      if (!isActive) return;

      const todayProgress = (progress || []).filter(p => {
        const lastAttempt = new Date(p.lastAttempt);
        const today = new Date();
        return lastAttempt.toDateString() === today.toDateString();
      });

      const totalTime = todayProgress.reduce((sum, p) => sum + (p.totalTime || 0), 0);
      const completedPassages = todayProgress.filter((p) => p.completed);
      const completedTotals = completedPassages.reduce((totals, item) => {
        const test = readingTests.find((candidate) => candidate.slug === item.slug);
        const questionCount = (test?.passages?.[0]?.questionGroups || []).reduce(
          (groupTotal, group) => groupTotal + (group.questions?.length || 0),
          0,
        );
        totals.questions += questionCount;
        const scorePercent = Math.min(100, Math.max(0, Number(item.bestScore) || 0));
        totals.correct += (questionCount * scorePercent) / 100;
        return totals;
      }, { questions: 0, correct: 0 });

      const localStats = {
        readingTimeSeconds: totalTime,
        testsCompleted: completedPassages.length,
        highlightsCreated: "Not tracked",
        accuracy: completedTotals.questions
          ? Math.round((completedTotals.correct / completedTotals.questions) * 100)
          : null,
      };
      const source = getHomeMetricsSource(todayMetrics, allTimeMetrics, localAttemptHistoryExists);
      setTodayStats(source === 'server' ? {
        readingTimeSeconds: todayMetrics.total_seconds,
        testsCompleted: todayMetrics.attempts,
        highlightsCreated: todayMetrics.highlights_count,
        accuracy: todayMetrics.question_exposures ? todayMetrics.accuracy_percent : null,
        source,
      } : { ...localStats, source });
    };

    loadProgress();
    setResumeDraft(findLatestDraft());
    return () => {
      isActive = false;
    };
  }, [userId]);

  const statCards = [
    { icon: Clock, label: "Reading time", value: formatAggregateTime(todayStats.readingTimeSeconds) },
    { icon: CheckCircle, label: "Tests completed", value: todayStats.testsCompleted },
    { icon: Highlighter, label: "Highlights", value: todayStats.highlightsCreated ?? "Not tracked" },
    { icon: Target, label: "Accuracy", value: todayStats.accuracy === null ? "—" : `${todayStats.accuracy}%` },
  ];
  const practiceModes = [
    {
      href: "/full-mock",
      icon: Trophy,
      title: "Full IELTS mock",
      body: "Listening, Reading and Writing in exam-day order, with an estimated overall band.",
    },
    {
      href: "/reading",
      icon: BookOpen,
      title: "Reading passages",
      body: `${readingTests.length} timed passages with instant, question-by-question feedback.`,
    },
    {
      href: "/readingmock",
      icon: ClipboardCheck,
      title: "Full reading mock",
      body: "Three passages, 40 questions and 60 minutes, with an approximate band estimate.",
    },
    {
      href: "/listening",
      icon: Headphones,
      title: "Listening tests",
      body: "Four-section listening tests with built-in audio controls and saved results.",
    },
    {
      href: "/writing",
      icon: PenLine,
      title: "Writing practice",
      body: "Task 1 and Task 2 with AI feedback on the four official criteria, or a full 60-minute Writing test.",
    },
  ];

  return (
    <main>
      {resumeDraft && (
        <section className="border-b border-white/10 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-brand-500/20 p-2">
                  <Play size={20} className="text-brand-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Continue your unfinished test</p>
                  <p className="text-xs text-slate-400">
                    {resumeDraft.test.title} · {resumeDraft.answered} answered
                  </p>
                </div>
              </div>
              <Link
                href={`/reading/${resumeDraft.test.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Resume
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="animate-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-300">
              Exam format
            </p>
            <h1 className="section-title mb-6 text-balance">
              IELTS Reading, practiced{" "}
              <span className="gradient-text">on your terms</span>.
            </h1>
            <p className="section-subtitle mb-8 max-w-xl text-balance">
              Timed passages, exam-style questions, and a highlighter built into
              the text — scored instantly with clear question-by-question feedback.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/reading" className="btn-primary">
                Browse passages <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/readingmock" className="btn-secondary">
                Take a full mock
              </Link>
            </div>
          </div>

          <div className="surface-panel animate-fade-in" aria-label="Example of a practice result">
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">
              Sample result
            </p>
            <dl className="grid grid-cols-2 gap-4 text-center">
              {[
                ["Correct", "10 / 13"],
                ["Skipped", "0"],
                ["Percentage", "77%"],
                ["Time", "12:34"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className="text-3xl font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="today-study-title">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-400" aria-hidden="true" />
          <h2 id="today-study-title" className="text-lg font-semibold text-white">Today&apos;s study</h2>
        </div>
        <div className="mb-4 text-sm text-slate-400">
          {todayStats.source === 'server' ? 'Today in Asia/Tashkent, from saved reading attempts.' : todayStats.source === 'local-older' ? 'Older results are stored in this browser and are not saved to your account yet.' : user ? 'Today from this browser only; server metrics are unavailable right now.' : 'Today from this browser only. Sign in to keep your progress across devices.'}
          {todayStats.source === 'local-older' && <button type="button" onClick={requestOpenMigrationPrompt} className="ml-2 underline underline-offset-2 hover:text-white">Save older results</button>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Icon size={16} aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
              </div>
              <p className="text-xl font-bold text-white sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <DailyMissionsCard />

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="practice-modes-title">
        <h2 id="practice-modes-title" className="mb-4 font-display text-2xl font-bold text-slate-100">Choose how to practise</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {practiceModes.map(({ href, icon: Icon, title, body }) => (
            <Link key={href} href={href} className="surface-card group flex flex-col hover:border-brand-500/30">
              <Icon className="mb-3 text-brand-400" size={26} aria-hidden="true" />
              <h3 className="font-display text-xl font-bold text-slate-100">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
                Start <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-label="Features">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Real timing",
              body: "Every passage runs on a 20-minute clock, so pacing becomes second nature.",
            },
            {
              icon: Highlighter,
              title: "Built-in highlighter",
              body: "Drag across words to mark key phrases in three colours, just like a paper test.",
            },
            {
              icon: Target,
              title: "Immediate feedback",
              body: "Submit and review your result with per-question explanations and evidence.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="surface-card">
                <Icon className="mb-3 text-brand-400" size={22} aria-hidden="true" />
                <h3 className="font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <DailyInspiration />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="surface-panel p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-100">
            Found a bug or have a suggestion?
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-400">
            If you spot a mistake in a passage or have an idea to improve the site, please let me know.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={(event) => requestHelpDialog(event.currentTarget, { category: "general" })}
              className="btn-primary"
            >
              <MessageSquare size={18} aria-hidden="true" />
              Send feedback
            </button>
            {user && (
              <Link href="/my-feedback" className="btn-secondary">
                View my feedback
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
