"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Circle, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function RoadmapPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    try {
      const { data, error } = await supabase
        .from("roadmap")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading roadmap:", error);
      setItems(getDemoRoadmap());
      setUsingDemoData(true);
    } finally {
      setIsLoading(false);
    }
  }

  function getDemoRoadmap() {
    return [
      {
        id: 1,
        title: "AI Reading Coach",
        description:
          "Deploy the AI coach as a real end-user feature when the required provider API key is configured.",
        status: "in_progress",
        priority: "high",
        category: "feature",
        progress: 72,
        target_date: "2026-10-15",
      },
      {
        id: 2,
        title: "Reading Analytics & Progress Tracking",
        description:
          "Expand insight reporting for streaks, score trends, and practice consistency across passages.",
        status: "completed",
        priority: "high",
        category: "improvement",
        progress: 100,
        target_date: "2026-09-15",
      },
      {
        id: 3,
        title: "Admin Feedback & Issue Reporting",
        description:
          "Keep feedback submission, moderation, and issue tracking available for product improvements.",
        status: "completed",
        priority: "medium",
        category: "bug_fix",
        progress: 100,
        target_date: "2026-09-20",
      },
      {
        id: 4,
        title: "Speaking Practice Expansion",
        description:
          "Add future speaking and pronunciation modules after the core reading experience is fully stabilized.",
        status: "planned",
        priority: "medium",
        category: "feature",
        progress: 18,
        target_date: "2026-12-01",
      },
      {
        id: 5,
        title: "Mobile & UX Polish",
        description:
          "Improve responsive behavior and small-screen interaction quality for users studying on mobile devices.",
        status: "planned",
        priority: "medium",
        category: "improvement",
        progress: 30,
        target_date: "2026-11-15",
      },
    ];
  }

  const statusConfig = {
    completed: {
      label: "Completed",
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    in_progress: {
      label: "In Progress",
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    planned: {
      label: "Planned",
      icon: Circle,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    },
  };

  const priorityConfig = {
    low: { label: "Low", color: "text-slate-400", bg: "bg-slate-500/10" },
    medium: {
      label: "Medium",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    high: { label: "High", color: "text-red-400", bg: "bg-red-500/10" },
  };

  const categoryConfig = {
    feature: {
      label: "Feature",
      color: "text-brand-400",
      bg: "bg-brand-500/10",
    },
    improvement: {
      label: "Improvement",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    bug_fix: { label: "Bug Fix", color: "text-red-400", bg: "bg-red-500/10" },
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" aria-hidden="true" />
        <p className="text-sm text-slate-300">Loading roadmap…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {usingDemoData && <p className="mb-6 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100" role="status">Database content is unavailable. Showing sample roadmap data.</p>}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Product Roadmap
          </h1>
          <p className="text-slate-400 text-lg">
            See what we're working on and what's coming next
          </p>
        </div>

        <div className="space-y-12">
          {["completed", "in_progress", "planned"].map((status) => {
            const config = statusConfig[status];
            const StatusIcon = config.icon;
            const sectionItems = items.filter((i) => i.status === status);

            return (
              <div key={status}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-3 rounded-xl ${config.bg} ${config.border}`}
                  >
                    <StatusIcon className={config.color} size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {config.label}
                    </h2>
                    <span className="text-slate-400">
                      {sectionItems.length} items
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all hover:scale-105"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].bg} ${categoryConfig[item.category].color}`}
                        >
                          {categoryConfig[item.category].label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[item.priority].bg} ${priorityConfig[item.priority].color}`}
                        >
                          {priorityConfig[item.priority].label}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-3">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-6">
                        {item.description}
                      </p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-white font-medium">
                              {item.progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>

                        {item.target_date && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar size={14} />
                            <span>
                              Target:{" "}
                              {new Date(item.target_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {sectionItems.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-slate-400">
                    No items in this section yet
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>No roadmap items are available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
