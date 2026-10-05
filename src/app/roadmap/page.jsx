"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Circle, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import DataLoadingStatus from "@/components/shared/DataLoadingStatus";

export default function RoadmapPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    setIsLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from("roadmap")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading roadmap:", error);
      setItems([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
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

  function getPublicRoadmapCopy(item) {
    if (item.title?.trim().toLowerCase().includes("speaking")) {
      return {
        title: "Deferred: speaking practice expansion",
        description:
          "This is deferred until the focused reading practice loop, mistake review, and support reliability are proven with learners.",
      };
    }

    return { title: item.title, description: item.description };
  }

  function formatTargetDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  if (isLoading) { return <DataLoadingStatus label="Roadmap" onRetry={loadRoadmap} />; }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Product Roadmap
          </h1>
          <p className="text-slate-400 text-lg">
            See what we're working on and what's coming next
          </p>
        </div>

        {loadError && (
          <div className="mb-8 rounded-xl border border-amber-300/20 bg-amber-300/10 p-5 text-center" role="status">
            <p className="text-sm text-amber-100">The roadmap is temporarily unavailable.</p>
            <button
              type="button"
              onClick={loadRoadmap}
              className="mt-3 min-h-11 rounded-lg border border-amber-200/30 px-4 text-sm font-semibold text-amber-50 hover:bg-amber-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Try again
            </button>
          </div>
        )}

        <div className="space-y-12">
          {["completed", "in_progress", "planned"]
            .filter((status) => items.some((item) => item.status === status))
            .map((status) => {
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
                  {sectionItems.map((item) => {
                    const publicCopy = getPublicRoadmapCopy(item);
                    return (
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
                        {publicCopy.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-6">
                        {publicCopy.description}
                      </p>

                      <div className="space-y-3">
                        {item.status === "in_progress" && (
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
                        )}

                        {item.target_date && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar size={14} />
                            <span>
                              Target:{" "}
                              {formatTargetDate(item.target_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {!loadError && items.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>No roadmap items are available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
