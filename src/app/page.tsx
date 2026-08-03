"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Target,
  Highlighter,
  ArrowRight,
  Send,
  Play,
  TrendingUp,
  CheckCircle,
  Mail,
} from "lucide-react";
import BandGauge from "@/components/shared/BandGauge";
import DailyInspiration from "@/components/shared/DailyInspiration";
import { readingTests } from "@/data/readingTests_new";
import { getAllProgress } from "@/lib/progressTracker";
import { useAuth } from "@/contexts/AuthContext";
import ContactForm from "@/components/shared/ContactForm";

export default function Home() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    readingTime: 0,
    testsCompleted: 0,
    highlightsCreated: 0,
    accuracy: 0,
  });
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  useEffect(() => {
    // Load progress data
    const loadProgress = async () => {
      const progress = await getAllProgress(user?.id);
      setProgressData(progress);

      // Calculate today's stats
      const todayProgress = progress.filter(p => {
        const lastAttempt = new Date(p.lastAttempt);
        const today = new Date();
        return lastAttempt.toDateString() === today.toDateString();
      });

      const totalTime = todayProgress.reduce((sum, p) => sum + (p.totalTime || 0), 0);
      const completedToday = todayProgress.filter(p => p.completed).length;
      const avgAccuracy = todayProgress.length > 0
        ? todayProgress.reduce((sum, p) => sum + p.bestScore, 0) / todayProgress.length
        : 0;

      setTodayStats({
        readingTime: Math.round(totalTime / 60),
        testsCompleted: completedToday,
        highlightsCreated: 0,
        accuracy: Math.round(avgAccuracy),
      });
    };

    loadProgress();
  }, [user]);

  const lastTest = progressData[0];
  const lastTestPassage = lastTest ? readingTests.find(t => t.slug === lastTest.slug) : null;
  return (
    <>
      <main>
        {/* Continue Last Test Banner */}
        {lastTest && !lastTest.completed && lastTestPassage && (
          <section className="border-b border-white/10 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-brand-500/20 p-2">
                    <Play size={20} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Continue Your Last Test</p>
                    <p className="text-xs text-slate-400">
                      {lastTestPassage.title}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/reading/${lastTest.slug}`}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
                >
                  Resume
                </Link>
              </div>
            </div>
          </section>
        )}

      {/* Today's Study Stats */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-brand-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">Today's Study</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-brand-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand-500/10">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Clock size={16} aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider">Reading Time</p>
              </div>
              <p className="text-2xl font-bold text-white">{todayStats.readingTime}m</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-brand-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand-500/10">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <CheckCircle size={16} aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider">Tests Completed</p>
              </div>
              <p className="text-2xl font-bold text-white">{todayStats.testsCompleted}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-brand-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand-500/10">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Highlighter size={16} aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider">Highlights</p>
              </div>
              <p className="text-2xl font-bold text-white">{todayStats.highlightsCreated}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-brand-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand-500/10">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Target size={16} aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider">Accuracy</p>
              </div>
              <p className="text-2xl font-bold text-white">{todayStats.accuracy}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
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
              the text — scored instantly with an estimated band.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reading" className="btn-primary">
                Browse passages <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="surface-panel animate-fade-in">
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-400">
              Sample result
            </p>
            <BandGauge band={7.5} correct={10} total={13} />
          </div>
        </div>
      </section>

      {/* Daily Inspiration */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <DailyInspiration />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
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
              title: "Instant band estimate",
              body: "Submit and immediately see a band estimate with per-question feedback.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="surface-card">
                <Icon className="mb-3 text-brand-400" size={22} />
                <h4 className="font-semibold text-slate-100">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>

        <Link
          href="/reading"
          className="surface-card group mt-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="text-brand-400" size={28} aria-hidden="true" />
            <div>
              <h3 className="font-display text-xl font-bold">All passages</h3>
              <p className="text-sm text-slate-400">
                Pick any passage to start.
              </p>
            </div>
          </div>
          <ArrowRight
            className="text-brand-400 transition-transform group-hover:translate-x-1"
            size={22}
            aria-hidden="true"
          />
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="surface-panel p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-100">
            Found a bug or have suggestions?
          </h2>
          <p className="mb-6 text-slate-400">I’d love to hear your feedback.</p>
          <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-slate-300">
            If you find any mistakes or have ideas to improve this project,
            please let me know.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setIsContactFormOpen(true)}
              className="group flex items-center gap-3 rounded-full border border-brand-500/30 bg-brand-500/10 px-6 py-3 transition-all hover:border-brand-500 hover:bg-brand-500/20"
            >
              <Mail
                className="text-brand-400 group-hover:text-brand-300"
                size={20}
              />
              <span className="font-semibold text-slate-100">
                Contact Developer
              </span>
            </button>
          </div>
        </div>
      </section>
      </main>

      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />
    </>
  );
}
