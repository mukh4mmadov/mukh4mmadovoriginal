"use client";

import { useEffect, useState } from 'react';
import { Activity, BookOpen, MessageSquare, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityItem {
  id: string;
  event_type: string;
  user_id: string | null;
  event_data: any;
  created_at: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadActivities();
    setupRealtimeSubscription();
  }, []);

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload: any) => {
          setActivities((prev) => [payload.new as ActivityItem, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function getActivityMessage(item: ActivityItem): string {
    const data = item.event_data || {};
    switch (item.event_type) {
      case 'passage_completed':
        return `Completed passage with score ${Math.round(data.score || 0)}%`;
      case 'question_answered':
        return `Answered question ${data.isCorrect ? 'correctly' : 'incorrectly'}`;
      case 'ai_message_sent':
        return 'Sent a message to AI Coach';
      case 'ai_coach_opened':
        return 'Opened AI Coach';
      case 'highlight_created':
        return 'Created a highlight';
      case 'highlight_removed':
        return 'Removed a highlight';
      case 'quote_saved':
        return 'Saved a quote';
      case 'reading_started':
        return `Started reading ${data.passageId}`;
      case 'reading_finished':
        return `Finished reading in ${Math.round((data.timeSpent || 0) / 60)} minutes`;
      case 'user_registered':
        return 'New user registered';
      case 'user_login':
        return 'User logged in';
      case 'user_logout':
        return 'User logged out';
      case 'feedback_submitted':
        return 'Submitted feedback';
      case 'bug_report_submitted':
        return `Reported a bug: ${data.subject}`;
      default:
        return item.event_type.replace(/_/g, ' ');
    }
  }

  function getActivityIcon(item: ActivityItem) {
    switch (item.event_type) {
      case 'passage_completed':
        return <BookOpen className="text-green-400" size={16} />;
      case 'question_answered':
        return <Activity className="text-blue-400" size={16} />;
      case 'ai_message_sent':
      case 'ai_coach_opened':
        return <MessageSquare className="text-purple-400" size={16} />;
      case 'bug_report_submitted':
        return <AlertTriangle className="text-red-400" size={16} />;
      case 'user_registered':
        return <UserPlus className="text-green-400" size={16} />;
      default:
        return <Activity className="text-slate-400" size={16} />;
    }
  }

  function getActivityColor(item: ActivityItem): string {
    switch (item.event_type) {
      case 'passage_completed':
        return 'bg-green-500/10 border-green-500/20';
      case 'question_answered':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'ai_message_sent':
      case 'ai_coach_opened':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'bug_report_submitted':
        return 'bg-red-500/10 border-red-500/20';
      case 'user_registered':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-white/5 border-white/10';
    }
  }

  if (isLoading) {
    return (
      <div className="border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Live Activity Feed</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Live Activity Feed</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={14} />
          <span>Real-time</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No recent activity
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(item)}`}
            >
              <div className="mt-1">
                {getActivityIcon(item)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{getActivityMessage(item)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
