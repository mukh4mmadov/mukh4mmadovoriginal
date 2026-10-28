"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Database, Server, HardDrive, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const SERVICES = [
  { key: "database", label: "Database", detail: "Supabase PostgreSQL", icon: Database },
  { key: "api", label: "API", detail: "Next.js API routes", icon: Server },
  { key: "storage", label: "Storage", detail: "Supabase Storage", icon: HardDrive },
];

async function timed(check) {
  const start = performance.now();
  try {
    const ok = await check();
    return { status: ok ? "online" : "offline", latency: Math.round(performance.now() - start) };
  } catch {
    return { status: "offline", latency: null };
  }
}

function latencyColor(latency) {
  if (latency == null) return "text-slate-400";
  if (latency < 300) return "text-green-400";
  if (latency < 800) return "text-yellow-400";
  return "text-red-400";
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    const [database, api, storage] = await Promise.all([
      timed(async () => {
        if (!supabase) return false;
        const { error } = await supabase.from("profiles").select("id").limit(1);
        return !error;
      }),
      timed(async () => (await fetch("/api/health", { cache: "no-store" })).ok),
      timed(async () => {
        if (!supabase) return false;
        const { error } = await supabase.storage.listBuckets();
        return !error;
      }),
    ]);
    setHealth({ database, api, storage });
    setCheckedAt(new Date());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = window.setInterval(checkHealth, 30000);
    return () => window.clearInterval(interval);
  }, [checkHealth]);

  return (
    <section className="rounded-xl border border-white/10 p-6" aria-labelledby="system-health-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="system-health-title" className="text-lg font-semibold text-white">System health</h2>
        <button
          type="button"
          onClick={checkHealth}
          disabled={isChecking}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} aria-hidden="true" />
          Check now
        </button>
      </div>

      {!health ? (
        <div className="flex h-32 items-center justify-center" role="status" aria-label="Checking system health">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-3" aria-live="polite">
          {SERVICES.map(({ key, label, detail, icon: Icon }) => {
            const { status, latency } = health[key];
            const online = status === "online";
            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${online ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className={online ? "text-green-400" : "text-red-400"} size={20} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="truncate text-xs text-slate-400">{detail}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${latencyColor(latency)}`}>{latency == null ? "—" : `${latency} ms`}</p>
                    <p className="text-xs text-slate-400">Response</p>
                  </div>
                  {online
                    ? <CheckCircle className="text-green-400" size={20} aria-label="Online" />
                    : <XCircle className="text-red-400" size={20} aria-label="Not responding" />}
                </div>
              </div>
            );
          })}
          <p className="flex items-center gap-2 pt-1 text-xs text-slate-400">
            <Clock size={12} aria-hidden="true" />
            Last checked {checkedAt ? checkedAt.toLocaleTimeString() : "—"} · refreshes every 30 seconds
          </p>
        </div>
      )}
    </section>
  );
}
