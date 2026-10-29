'use client';

import { useEffect, useState } from 'react';
import { Users, UserX, Activity, MessageSquare, TrendingUp, Target, Clock, Bot, LifeBuoy, CheckSquare, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ActivityFeed from '@/components/admin/ActivityFeed';
import SystemHealth from '@/components/admin/SystemHealth';
import EverythingOverview from '@/components/admin/EverythingOverview';
import { AdminPageLoading } from '@/components/admin/AdminPageStatus';
import { formatAggregateTime } from '@/lib/reading/metrics.mjs';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      try {
        const [rpc, activity, ai, feedback] = await Promise.all([
          supabase?.rpc('get_admin_reading_metrics', { p_days: 30 }) || Promise.resolve({ data: null, error: true }),
          supabase?.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', since) || Promise.resolve({ count: 0 }),
          supabase?.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'ai_message_sent') || Promise.resolve({ count: 0 }),
          supabase?.from('support_tickets').select('*', { count: 'exact', head: true }) || Promise.resolve({ count: 0 }),
        ]);
        if (!active) return;
        const metrics = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
        const unavailable = Boolean(rpc.error || !metrics);
        setMetricsUnavailable(unavailable);
        setOffline(false);
        setStats({
          users: metrics?.total_profiles ?? null,
          guests: metrics?.guest_profiles ?? null,
          attempts: metrics?.total_attempts ?? null,
          answered: metrics?.answered ?? null,
          accuracy: metrics?.accuracy_percent ?? null,
          averageSeconds: metrics?.avg_seconds_per_attempt ?? null,
          activeToday: metrics?.active_learners_today ?? null,
          activityEvents: activity?.count || 0,
          aiMessages: ai?.count || 0,
          supportTickets: feedback?.count || 0,
        });
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
        if (active) {
          setMetricsUnavailable(true);
          setOffline(!navigator.onLine);
          setStats({ activityEvents: 0, aiMessages: 0, supportTickets: 0 });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadStats();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setIsLoading(true);
      location.reload();
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) return <AdminPageLoading label="Loading dashboard data" />;

  if (offline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <WifiOff className="text-amber-300" size={28} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">You&apos;re offline</h1>
        <p className="text-slate-400 mb-4">Please check your internet connection and try again.</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const unavailable = '—';
  const metricValue = (value) => metricsUnavailable || value == null ? unavailable : value.toLocaleString();
  const statCards = [
    ['Total users', metricValue(stats?.users), Users, 'text-blue-400', 'bg-blue-500/10', 'border-blue-500/20'],
    ['Guest profiles', metricValue(stats?.guests), UserX, 'text-slate-400', 'bg-white/5', 'border-white/10'],
    ['Active learners today', metricValue(stats?.activeToday), Activity, 'text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/20'],
    ['Activity events (24h)', (stats?.activityEvents || 0).toLocaleString(), Activity, 'text-green-400', 'bg-green-500/10', 'border-green-500/20'],
    ['Passages solved', metricValue(stats?.attempts), TrendingUp, 'text-purple-400', 'bg-purple-500/10', 'border-purple-500/20'],
    ['Questions answered', metricValue(stats?.answered), CheckSquare, 'text-brand-400', 'bg-brand-500/10', 'border-brand-500/20'],
    ['Average accuracy', metricsUnavailable || stats?.accuracy == null ? unavailable : `${stats.accuracy}%`, Target, 'text-green-400', 'bg-green-500/10', 'border-green-500/20'],
    ['Average time per passage', metricsUnavailable || stats?.averageSeconds == null ? unavailable : formatAggregateTime(stats.averageSeconds), Clock, 'text-blue-400', 'bg-blue-500/10', 'border-blue-500/20'],
    ['AI messages (all time)', (stats?.aiMessages || 0).toLocaleString(), Bot, 'text-yellow-400', 'bg-yellow-500/10', 'border-yellow-500/20'],
    ['Support tickets', (stats?.supportTickets || 0).toLocaleString(), LifeBuoy, 'text-orange-400', 'bg-orange-500/10', 'border-orange-500/20'],
  ];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
      <p className="mb-6 max-w-3xl text-sm text-slate-400">Total users includes guest profiles; the Users page lists registered learners only. Activity events count analytics events, not people. Dates use Asia/Tashkent.</p>
      {metricsUnavailable && (
        <p role="status" className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
          Reading metrics are unavailable right now, so some cards show “—”. Check that the latest database migrations are applied, then reload.
        </p>
      )}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {statCards.map(([name, value, Icon, color, bgColor, borderColor]) => (
          <div key={name} className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-sm font-medium text-slate-400">{name}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>
              <div className={`shrink-0 rounded-lg p-2.5 ${bgColor}`}><Icon className={color} size={22} aria-hidden="true" /></div>
            </div>
          </div>
        ))}
      </div>
      <EverythingOverview />
      <div className="grid gap-6 lg:grid-cols-2"><ActivityFeed /><SystemHealth /></div>
    </div>
  );
}
