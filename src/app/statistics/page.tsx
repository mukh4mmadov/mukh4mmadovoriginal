"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ArrowLeft, BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/shared/Navbar';

export default function StatisticsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      // TODO: Fetch actual statistics from database
      setStats({
        total_passages_completed: 12,
        total_time_spent_seconds: 7200,
        average_score: 7.5,
        average_band_score: 7.0,
        total_questions_answered: 240,
        correct_answers: 180,
        accuracy_rate: 75,
        strongest_category: 'True/False/Not Given',
        weakest_category: 'Matching Headings',
      });
      setLoading(false);
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
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
          <p className="text-slate-400">Track your IELTS reading progress</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <p className="text-slate-400 text-sm">Passages Completed</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_passages_completed || 0}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <p className="text-slate-400 text-sm">Time Spent</p>
            </div>
            <p className="text-3xl font-bold text-white">{formatTime(stats?.total_time_spent_seconds || 0)}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <p className="text-slate-400 text-sm">Average Score</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.average_score?.toFixed(1) || 0}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <p className="text-slate-400 text-sm">Accuracy Rate</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.accuracy_rate || 0}%</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Performance Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Questions Answered</span>
                <span className="text-white font-medium">{stats?.total_questions_answered || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Correct Answers</span>
                <span className="text-green-400 font-medium">{stats?.correct_answers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Band Score</span>
                <span className="text-white font-medium">{stats?.average_band_score?.toFixed(1) || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={20} />
              Strengths & Weaknesses
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Strongest Category</p>
                <p className="text-green-400 font-medium">{stats?.strongest_category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Weakest Category</p>
                <p className="text-orange-400 font-medium">{stats?.weakest_category || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
