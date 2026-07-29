"use client";

import { useEffect, useState } from 'react';
import { Users, Activity, MessageSquare, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ActivityFeed from '@/components/admin/ActivityFeed';
import SystemHealth from '@/components/admin/SystemHealth';

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalPassagesSolved: number;
  totalQuestionsAnswered: number;
  totalAIMessages: number;
  totalFeedback: number;
  averageAccuracy: number;
  averageReadingTime: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsersToday: 0,
    totalPassagesSolved: 0,
    totalQuestionsAnswered: 0,
    totalAIMessages: 0,
    totalFeedback: 0,
    averageAccuracy: 0,
    averageReadingTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const today = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [totalUsers, activeUsers, passageCompleted, questionAnswered, aiMessages, feedback] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase
            .from('analytics_events')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', today),
          supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'passage_completed'),
          supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'question_answered'),
          supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'ai_message_sent'),
          supabase.from('feedback_messages').select('*', { count: 'exact', head: true }),
        ]);

        // Calculate average accuracy from question_answered events
        const { data: questionData } = await supabase
          .from('analytics_events')
          .select('event_data')
          .eq('event_type', 'question_answered');

        let totalCorrect = 0;
        let totalQuestions = 0;
        questionData?.forEach((event: any) => {
          if (event.event_data?.isCorrect !== undefined) {
            totalQuestions++;
            if (event.event_data.isCorrect) totalCorrect++;
          }
        });
        const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        // Calculate average reading time from reading_finished events
        const { data: readingData } = await supabase
          .from('analytics_events')
          .select('event_data')
          .eq('event_type', 'reading_finished');

        let totalTime = 0;
        let totalSessions = 0;
        readingData?.forEach((event: any) => {
          if (event.event_data?.timeSpent) {
            totalTime += event.event_data.timeSpent;
            totalSessions++;
          }
        });
        const averageReadingTime = totalSessions > 0 ? Math.round(totalTime / totalSessions / 60) : 0;

        setStats({
          totalUsers: totalUsers.count || 0,
          activeUsersToday: activeUsers.count || 0,
          totalPassagesSolved: passageCompleted.count || 0,
          totalQuestionsAnswered: questionAnswered.count || 0,
          totalAIMessages: aiMessages.count || 0,
          totalFeedback: feedback.count || 0,
          averageAccuracy,
          averageReadingTime,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      name: 'Active Users Today',
      value: stats.activeUsersToday,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      name: 'Total Passages Solved',
      value: stats.totalPassagesSolved,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      name: 'Total Questions Answered',
      value: stats.totalQuestionsAnswered,
      icon: MessageSquare,
      color: 'text-brand-400',
      bgColor: 'bg-brand-500/10',
      borderColor: 'border-brand-500/20',
    },
    {
      name: 'Total AI Messages',
      value: stats.totalAIMessages,
      icon: MessageSquare,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      name: 'Total Feedback',
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    {
      name: 'Average Accuracy',
      value: `${stats.averageAccuracy}%`,
      icon: AlertTriangle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      name: 'Average Reading Time',
      value: `${stats.averageReadingTime} min`,
      icon: Lightbulb,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`rounded-xl border ${stat.borderColor} ${stat.bgColor} p-6 transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <SystemHealth />
      </div>
    </div>
  );
}
