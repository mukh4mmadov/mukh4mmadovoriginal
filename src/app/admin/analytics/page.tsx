"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Award, MessageSquare, Users, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { toISODate } from '@/lib/date';

interface AnalyticsData {
  dailyUsers: { date: string; count: number }[];
  weeklyReadingTime: { week: string; minutes: number }[];
  xpGrowth: { date: string; xp: number }[];
  aiUsage: { date: string; count: number }[];
  registrationTrend: { date: string; count: number }[];
  questionTypes: { type: string; count: number }[];
  deviceTypes: { device: string; count: number }[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    dailyUsers: [],
    weeklyReadingTime: [],
    xpGrowth: [],
    aiUsage: [],
    registrationTrend: [],
    questionTypes: [],
    deviceTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [dailyUsers, readingFinished, aiUsage, registrationTrend, questionAnswered, allEvents] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('analytics_events')
          .select('created_at, event_data')
          .eq('event_type', 'reading_finished')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('analytics_events')
          .select('created_at')
          .eq('event_type', 'ai_message_sent')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('analytics_events')
          .select('created_at')
          .eq('event_type', 'user_registered')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('analytics_events')
          .select('event_data')
          .eq('event_type', 'question_answered'),
        supabase
          .from('analytics_events')
          .select('device_info')
          .gte('created_at', thirtyDaysAgo),
      ]);

      const dailyUsersData = processDailyData(dailyUsers.data || []);
      const weeklyReadingTimeData = processWeeklyReadingTime(readingFinished.data || []);
      const aiUsageData = processDailyData(aiUsage.data || []);
      const registrationData = processDailyData(registrationTrend.data || []);
      const questionTypesData = processQuestionTypes(questionAnswered.data || []);
      const deviceTypesData = processDeviceTypes(allEvents.data || []);

      setData({
        dailyUsers: dailyUsersData,
        weeklyReadingTime: weeklyReadingTimeData,
        xpGrowth: [],
        aiUsage: aiUsageData,
        registrationTrend: registrationData,
        questionTypes: questionTypesData,
        deviceTypes: deviceTypesData,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function processDailyData(events: any[], dateField = 'created_at'): { date: string; count: number }[] {
    const dailyMap = new Map<string, number>();
    
    events.forEach((event) => {
      const date = toISODate(new Date(event[dateField]));
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    return Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function processWeeklyReadingTime(sessions: any[]): { week: string; minutes: number }[] {
    const weeklyMap = new Map<string, number>();
    
    sessions.forEach((session) => {
      const date = new Date(session.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = toISODate(weekStart);
      const minutes = (session.event_data?.timeSpent || 0) / 60;
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + minutes);
    });

    return Array.from(weeklyMap.entries())
      .map(([week, minutes]) => ({ week, minutes: Math.round(minutes) }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  function processQuestionTypes(questions: any[]): { type: string; count: number }[] {
    const typeMap = new Map<string, number>();
    
    questions.forEach((q) => {
      const type = q.event_data?.questionId?.split('_')[0] || 'unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  function processDeviceTypes(events: any[]): { device: string; count: number }[] {
    const deviceMap = new Map<string, number>();
    
    events.forEach((event) => {
      const deviceInfo = event.device_info;
      let device = 'desktop';
      if (deviceInfo?.touchSupport) {
        device = deviceInfo?.screenWidth < 768 ? 'mobile' : 'tablet';
      }
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    return Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }

  if (isLoading) {
    return <LoadingSpinner containerClassName="h-64" />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Users Chart */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-brand-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Daily Active Users</h2>
          </div>
          <SimpleChart data={data.dailyUsers} color="brand" />
        </div>

        {/* Reading Time Chart */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-green-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Weekly Reading Time (minutes)</h2>
          </div>
          <SimpleChart data={data.weeklyReadingTime.map((d: any) => ({ ...d, value: d.minutes }))} color="green" />
        </div>

        {/* AI Usage Chart */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="text-purple-400" size={20} />
            <h2 className="text-lg font-semibold text-white">AI Usage</h2>
          </div>
          <SimpleChart data={data.aiUsage} color="purple" />
        </div>

        {/* Registration Trend */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">New Registrations</h2>
          </div>
          <SimpleChart data={data.registrationTrend} color="blue" />
        </div>

        {/* Question Types */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-yellow-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Question Types</h2>
          </div>
          <SimpleChart data={data.questionTypes.map((d: any) => ({ ...d, value: d.count }))} color="yellow" />
        </div>

        {/* Device Types */}
        <div className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-orange-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Device Types</h2>
          </div>
          <SimpleChart data={data.deviceTypes.map((d: any) => ({ ...d, value: d.count }))} color="orange" />
        </div>
      </div>
    </div>
  );
}

interface SimpleChartProps {
  data: { date: string; count?: number; value?: number }[];
  color: 'brand' | 'green' | 'purple' | 'blue' | 'yellow' | 'orange';
}

function SimpleChart({ data, color }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.count || d.value || 0), 1);
  const colorClasses = {
    brand: 'bg-brand-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="space-y-2">
      {data.slice(-7).map((item, index) => {
        const value = item.count || item.value || 0;
        const height = (value / maxValue) * 100;
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-20">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden">
              <div
                className={`h-full ${colorClasses[color]} transition-all duration-500`}
                style={{ width: `${height}%` }}
              />
            </div>
            <span className="text-xs text-slate-300 w-8 text-right">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
