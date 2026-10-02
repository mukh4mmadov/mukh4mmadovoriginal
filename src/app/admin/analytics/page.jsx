'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Award, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AdminPageLoading } from '@/components/admin/AdminPageStatus';
import { formatAggregateTime } from '@/lib/reading/metrics.mjs';
import { mapAdminReadingMetrics } from '@/lib/reading/admin-analytics.mjs';

export default function AdminAnalytics() {
  const [data, setData] = useState({ attempts: [], readingTime: [], aiUsage: [], registrations: [], questionTypes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadAnalytics() {
      try {
        const metricsResult = await supabase?.rpc('get_admin_reading_metrics', { p_days: 30 }) || { data: null, error: true };
        if (!active) return;
        const metrics = Array.isArray(metricsResult.data) ? metricsResult.data[0] : metricsResult.data;
        if (metricsResult.error || !metrics) {
          setMetricsUnavailable(true);
          setData({ attempts: [], readingTime: [], aiUsage: [], registrations: [], questionTypes: [] });
          return;
        }
        setData(mapAdminReadingMetrics(metrics));
      } catch (error) {
        console.error('Error loading analytics:', error);
        if (active) setMetricsUnavailable(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadAnalytics();
    return () => { active = false; };
  }, []);

  if (isLoading) return <AdminPageLoading label="Loading analytics" />;

  return (
    <div>
      <h1 className="mb-3 text-3xl font-bold text-white">Analytics</h1>
      <p className="mb-8 text-sm text-slate-400">Reading and registration dates use Asia/Tashkent. Analytics events are used only for AI usage here.</p>
      {metricsUnavailable && <p role="status" className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Reading metrics unavailable. Check the database migration and try again.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel icon={TrendingUp} title="Attempts per Tashkent Day" color="brand"><SimpleChart data={data.attempts} color="brand" /></ChartPanel>
        <ChartPanel icon={Clock} title="Reading Time per Tashkent Day" color="green"><SimpleChart data={data.readingTime} color="green" /></ChartPanel>
        <ChartPanel icon={MessageSquare} title="AI Usage" color="purple"><SimpleChart data={data.aiUsage} color="purple" /></ChartPanel>
        <ChartPanel icon={Calendar} title="New Registrations per Tashkent Day" color="blue"><SimpleChart data={data.registrations} color="blue" /></ChartPanel>
        <ChartPanel icon={Award} title="Question Type Exposures and Accuracy" color="yellow">
          <SimpleChart data={data.questionTypes.map((item) => ({ ...item, type: `${item.type} (${item.accuracy}%)` }))} color="yellow" />
        </ChartPanel>
      </div>
    </div>
  );
}

function ChartPanel({ icon: Icon, title, children }) {
  return <section className="rounded-xl border border-white/10 p-6"><div className="mb-4 flex items-center gap-2"><Icon className="text-brand-400" size={20} /><h2 className="text-lg font-semibold text-white">{title}</h2></div>{children}</section>;
}

function SimpleChart({ data, color }) {
  const maxValue = Math.max(...data.map((item) => item.count ?? item.value ?? 0), 1);
  const colors = { brand: 'bg-brand-500', green: 'bg-green-500', purple: 'bg-purple-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500' };
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const value = item.count ?? item.value ?? 0;
        const date = item.date ? new Date(`${item.date}T00:00:00Z`) : null;
        const label = date && !Number.isNaN(date.getTime())
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
          : item.type || 'Unknown';
        return <div key={`${label}-${index}`} className="flex items-center gap-2">
          <span className="w-24 truncate text-xs text-slate-400" title={label}>{label}</span>
          <div className="h-8 flex-1 overflow-hidden rounded bg-white/5"><div className={`h-full ${colors[color]} transition-all`} style={{ width: `${(value / maxValue) * 100}%` }} /></div>
          <span className="w-12 text-right text-xs text-slate-300">{item.timeValue ? formatAggregateTime(value) : value}</span>
        </div>;
      })}
      {!data.length && <p className="text-sm text-slate-500">No data for this period.</p>}
    </div>
  );
}
