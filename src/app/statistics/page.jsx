"use client";

import { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, BookOpen, CalendarDays, Clock, Share2, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllProgress } from '@/lib/progressTracker';
import readingTestsModule from '@/data/readingTests_new';
import { supabase } from '@/lib/supabase/client';
import { getReviewedQuestionCount } from '@/lib/reading/answer-review';
import { formatAggregateTime, getMyReadingMetrics } from '@/lib/reading/metrics.mjs';

export default function StatisticsPage() {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState({ target_band: '6.5', exam_date: '', study_days_per_week: 4 });
  const [goalLoading, setGoalLoading] = useState(true);
  const [initialGoalLoaded, setInitialGoalLoaded] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(`/login?redirect=${encodeURIComponent('/statistics')}`);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (userId) {
      let isActive = true;

      Promise.all([
        getAllProgress(userId),
        getMyReadingMetrics(supabase, '1970-01-01T00:00:00.000Z', new Date().toISOString()),
      ]).then(([progress, serverMetrics]) => {
        if (!isActive) return;

        const completedProgress = (progress || []).filter((item) => item.completed);
        const tests = readingTestsModule?.readingTests || [];
        const questionAttempts = completedProgress.flatMap((item) =>
          (item.attemptHistory || []).map((attempt) => ({ slug: item.slug, ...attempt })),
        );
        const masteryCounts = new Map();
        let answeredQuestions = 0;
        let correctResponses = 0;
        questionAttempts.forEach((attempt) => {
          (attempt.questionResults || []).forEach((result) => {
            if (!result.answered) return;
            answeredQuestions += 1;
            if (result.correct) {
              correctResponses += 1;
              const key = `${attempt.slug}:${result.id}`;
              masteryCounts.set(key, (masteryCounts.get(key) || 0) + 1);
            }
          });
        });
        const completedTotals = completedProgress.reduce((totals, item) => {
          const test = tests.find((candidate) => candidate.slug === item.slug);
          const passage = test?.passages?.[0];
          const count = passage?.questionGroups?.reduce(
            (groupTotal, group) => groupTotal + (group.questions?.length || 0),
            0,
          ) || 0;
          totals.questions += count;
          const scorePercent = Math.min(100, Math.max(0, Number(item.bestScore) || 0));
          totals.correct += (count * scorePercent) / 100;
          return totals;
        }, { questions: 0, correct: 0 });

        const localStats = {
          total_passages_completed: completedProgress.length,
          total_time_spent_seconds: (progress || []).reduce(
            (total, item) => total + (Number(item.totalTime) || 0),
            0,
          ),
          total_questions_answered: completedTotals.questions,
          correct_answers: Math.round(completedTotals.correct),
          accuracy_rate: completedTotals.questions
            ? Math.round((completedTotals.correct / completedTotals.questions) * 100)
            : 0,
          question_attempts: answeredQuestions,
          correct_responses: correctResponses,
          reviewed_questions: getReviewedQuestionCount(userId),
          mastered_questions: [...masteryCounts.values()].filter((correctAttempts) => correctAttempts >= 3).length,
          has_detailed_question_history: questionAttempts.length > 0,
          highlights_count: null,
          source: 'local',
        };
        setStats(serverMetrics ? {
          ...localStats,
          total_passages_completed: serverMetrics.attempts,
          total_time_spent_seconds: serverMetrics.total_seconds,
          total_questions_answered: serverMetrics.question_exposures,
          correct_answers: serverMetrics.correct,
          accuracy_rate: serverMetrics.question_exposures ? serverMetrics.accuracy_percent : 0,
          question_attempts: serverMetrics.answered,
          correct_responses: serverMetrics.correct,
          highlights_count: serverMetrics.highlights_count,
          source: 'server',
        } : localStats);
        setLoading(false);
      }).catch(() => {
        if (!isActive) return;
        setStats(null);
        setLoading(false);
      });

      return () => {
        isActive = false;
      };
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (!supabase) {
      setGoalMessage('Study goals are unavailable because the database is not configured.');
      setGoalLoading(false);
      return;
    }
    let active = true;

    supabase
      .from('study_goals')
      .select('target_band, exam_date, study_days_per_week')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setGoalMessage('Could not load your saved study goal.');
        } else if (data) {
          setGoal({
            target_band: Number(data.target_band || 6.5).toFixed(1),
            exam_date: data.exam_date || '',
            study_days_per_week: data.study_days_per_week || 4,
          });
          setInitialGoalLoaded(true);
        }
        setGoalLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setGoalMessage('Could not load your saved study goal.');
        setGoalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (!isLoading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" role="status" aria-live="polite">
        <p className="text-sm text-slate-300">Taking you to sign in…</p>
      </main>
    );
  }

  const saveGoal = async (event) => {
    event.preventDefault();
    if (!userId || !supabase) {
      setGoalMessage('Study goals are unavailable because the database is not configured.');
      return;
    }
    if (!initialGoalLoaded) {
      setGoalMessage('Please wait for your saved goal to load before saving.');
      return;
    }
    setGoalSaving(true);
    setGoalMessage('');

    try {
      const { error } = await supabase.from('study_goals').upsert({
        user_id: userId,
        target_band: Number(goal.target_band),
        exam_date: goal.exam_date || null,
        study_days_per_week: Number(goal.study_days_per_week),
      }, { onConflict: 'user_id' });

      setGoalMessage(error ? 'Could not save your study goal. Please try again.' : 'Your study plan is saved.');
    } catch {
      setGoalMessage('Could not save your study goal. Please try again.');
    } finally {
      setGoalSaving(false);
    }
  };

  const shareProgress = async () => {
    const report = [
      'My IELTS Reading progress',
      `Completed passages: ${stats?.total_passages_completed || 0}`,
      `Questions in completed passages: ${stats?.total_questions_answered || 0}`,
      `Accuracy: ${stats?.total_questions_answered ? `${stats.accuracy_rate}%` : 'Not enough completed results yet'}`,
      `Answers submitted: ${stats?.question_attempts || 0}`,
      `Correct responses across attempts: ${stats?.correct_responses || 0}`,
      `Mastered questions: ${stats?.mastered_questions || 0}`,
      `Reading time: ${formatAggregateTime(stats?.total_time_spent_seconds || 0)}`,
      `Exam date: ${goal.exam_date || 'Not set'}`,
      `Study days per week: ${goal.study_days_per_week}`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'My IELTS Reading progress', text: report });
        setShareMessage('Choose where to send your progress report from your device share menu.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        setShareMessage('Progress report copied. You can paste it into a message to your teacher.');
      } else {
        const file = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const fileUrl = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'ielts-reading-progress.txt';
        link.click();
        URL.revokeObjectURL(fileUrl);
        setShareMessage('Progress report downloaded. You can send the file to your teacher.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Could not share the report. Please try again.');
    }
  };

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950" aria-busy="true">
        <div role="status" aria-label="Loading statistics">
          <span className="sr-only">Loading statistics</span>
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white" aria-hidden="true" />
        </div>
      </main>
    );
  }

  const daysUntilExam = (() => {
    if (!goal.exam_date) return null;
    const [year, month, day] = goal.exam_date.split('-').map(Number);
    const examDay = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((examDay.getTime() - today.getTime()) / 86400000);
  })();
  const plannedStudyDays = Number(goal.study_days_per_week);

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Statistics</h1>
          <p className="text-slate-400">{stats?.source === 'server' ? 'All-time totals from saved reading attempts.' : 'All-time local summary; server attempt metrics are unavailable.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <p className="text-slate-400 text-sm">Tests Completed</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_passages_completed || 0}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <p className="text-slate-400 text-sm">Time Spent</p>
            </div>
            <p className="text-3xl font-bold text-white">{formatAggregateTime(stats?.total_time_spent_seconds || 0)}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <p className="text-slate-400 text-sm">Question Exposures</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_questions_answered || 0}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <p className="text-slate-400 text-sm">Highlights</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.highlights_count == null ? 'Not tracked' : stats.highlights_count}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <p className="text-slate-400 text-sm">Accuracy Rate</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_questions_answered ? `${stats.accuracy_rate}%` : '—'}</p>
          </div>
        </div>

        <section aria-labelledby="question-progress-title" className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 id="question-progress-title" className="text-xl font-bold text-white">Question learning progress</h2>
            <p className="mt-1 text-sm text-slate-400">Detailed question tracking starts with submissions made after this update. Older results did not save individual answers.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Answers submitted</p>
              <p className="mt-2 text-2xl font-bold text-white">{stats?.question_attempts || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Answered questions across saved test attempts</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm text-slate-400">Correct responses</p>
              <p className="mt-2 text-2xl font-bold text-emerald-200">{stats?.correct_responses || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Correct answers across those attempts</p>
            </div>
            <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-4">
              <p className="text-sm text-slate-400">Mistakes reviewed</p>
              <p className="mt-2 text-2xl font-bold text-brand-200">{stats?.reviewed_questions || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Distinct questions marked reviewed in this browser</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-sm text-slate-400">Mastered questions</p>
              <p className="mt-2 text-2xl font-bold text-amber-200">{stats?.mastered_questions || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Answered correctly on at least 3 submitted attempts</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="study-plan-title" className="mb-8 rounded-2xl border border-brand-400/25 bg-brand-500/10 p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays className="text-brand-300" size={22} aria-hidden="true" />
            <div>
              <h2 id="study-plan-title" className="text-xl font-bold text-white">Your study plan</h2>
              <p className="text-sm text-slate-300">Set your goal and get a practical weekly reading routine.</p>
            </div>
          </div>

          <form onSubmit={saveGoal} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <div>
              <label htmlFor="exam-date" className="mb-2 block text-sm font-medium text-slate-200">Exam date (optional)</label>
              <input
                id="exam-date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={goal.exam_date}
                onChange={(event) => setGoal((current) => ({ ...current, exam_date: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
                disabled={goalLoading || goalSaving}
              />
            </div>
            <div>
              <label htmlFor="study-days" className="mb-2 block text-sm font-medium text-slate-200">Study days per week</label>
              <select
                id="study-days"
                value={goal.study_days_per_week}
                onChange={(event) => setGoal((current) => ({ ...current, study_days_per_week: Number(event.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"
                disabled={goalLoading || goalSaving}
              >
                {[2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={goalLoading || goalSaving}
              className="min-h-11 rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
            >
              {goalSaving ? 'Saving…' : 'Save study plan'}
            </button>
          </form>

          {goalMessage && <p role="status" className="mb-4 text-sm text-slate-200">{goalMessage}</p>}

          {goalLoading ? (
            <p role="status" className="text-sm text-slate-300">Loading your saved study goal…</p>
          ) : daysUntilExam !== null && daysUntilExam < 0 ? (
            <p role="status" className="text-sm text-amber-200">That exam date has passed. Choose a future date to get a countdown.</p>
          ) : (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm leading-6 text-slate-300">
                Aim for {plannedStudyDays} reading practice {plannedStudyDays === 1 ? 'session' : 'sessions'} each week. For each session, complete one timed passage, then review the answers and explanations. {daysUntilExam !== null ? `Your exam is in ${daysUntilExam} days.` : 'Add an exam date to see your countdown.'}
                {daysUntilExam !== null && daysUntilExam > 0 && daysUntilExam <= 14 ? ' With less than two weeks left, consider adding practice days if your schedule allows.' : ''}
              </p>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-3 text-sm text-slate-300">Share a summary with a teacher or tutor when you choose. Nothing is shared until you press the button.</p>
                <button
                  type="button"
                  onClick={shareProgress}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
                >
                  <Share2 size={16} aria-hidden="true" />
                  Share progress report
                </button>
                {shareMessage && <p role="status" className="mt-3 text-sm text-slate-300">{shareMessage}</p>}
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Performance Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Questions in Completed Passages</span>
                <span className="text-white font-medium">{stats?.total_questions_answered || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Correct Answers</span>
                <span className="text-green-400 font-medium">{stats?.correct_answers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Accuracy Rate</span>
                <span className="text-white font-medium">{stats?.total_questions_answered ? `${stats.accuracy_rate}%` : '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={20} />
              How your statistics are counted
            </h3>
            <p className="text-sm leading-6 text-slate-400">
              Exact attempt metrics include every question in each saved attempt, including skipped questions. Accuracy is total correct answers divided by total question exposures, rounded once. Answered-question totals count selected answers. Detailed mastery and review counts remain local to this browser.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
