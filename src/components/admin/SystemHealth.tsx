"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Database, Server, HardDrive } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface HealthStatus {
  database: { status: 'online' | 'offline'; latency: number };
  api: { status: 'online' | 'offline'; latency: number };
  storage: { status: 'online' | 'offline'; usage: number };
}

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthStatus>({
    database: { status: 'offline', latency: 0 },
    api: { status: 'offline', latency: 0 },
    storage: { status: 'offline', usage: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      const apiStart = Date.now();
      const apiResponse = await fetch('/api/health', { method: 'GET' });
      const apiLatency = Date.now() - apiStart;

      const storageStart = Date.now();
      const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
      const storageLatency = Date.now() - storageStart;

      setHealth({
        database: {
          status: !dbError ? 'online' : 'offline',
          latency: dbLatency,
        },
        api: {
          status: apiResponse.ok ? 'online' : 'offline',
          latency: apiLatency,
        },
        storage: {
          status: !storageError ? 'online' : 'offline',
          usage: 0, // Would need actual storage usage from Supabase
        },
      });
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusIcon(status: 'online' | 'offline') {
    return status === 'online' ? (
      <CheckCircle className="text-green-400" size={20} />
    ) : (
      <XCircle className="text-red-400" size={20} />
    );
  }

  function getStatusColor(status: 'online' | 'offline') {
    return status === 'online'
      ? 'bg-green-500/10 border-green-500/20'
      : 'bg-red-500/10 border-red-500/20';
  }

  function getLatencyColor(latency: number) {
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  }

  if (isLoading) {
    return (
      <div className="border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">System Health</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">System Health</h2>

      <div className="space-y-4">
        {/* Database Status */}
        <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(health.database.status)}`}>
          <div className="flex items-center gap-3">
            <Database className={health.database.status === 'online' ? 'text-green-400' : 'text-red-400'} size={20} />
            <div>
              <p className="text-sm font-medium text-white">Database</p>
              <p className="text-xs text-slate-400">Supabase PostgreSQL</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${getLatencyColor(health.database.latency)}`}>
                {health.database.latency}ms
              </p>
              <p className="text-xs text-slate-400">Latency</p>
            </div>
            {getStatusIcon(health.database.status)}
          </div>
        </div>

        {/* API Status */}
        <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(health.api.status)}`}>
          <div className="flex items-center gap-3">
            <Server className={health.api.status === 'online' ? 'text-green-400' : 'text-red-400'} size={20} />
            <div>
              <p className="text-sm font-medium text-white">API</p>
              <p className="text-xs text-slate-400">Next.js API Routes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${getLatencyColor(health.api.latency)}`}>
                {health.api.latency}ms
              </p>
              <p className="text-xs text-slate-400">Latency</p>
            </div>
            {getStatusIcon(health.api.status)}
          </div>
        </div>

        {/* Storage Status */}
        <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(health.storage.status)}`}>
          <div className="flex items-center gap-3">
            <HardDrive className={health.storage.status === 'online' ? 'text-green-400' : 'text-red-400'} size={20} />
            <div>
              <p className="text-sm font-medium text-white">Storage</p>
              <p className="text-xs text-slate-400">Supabase Storage</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-300">
                {health.storage.usage}%
              </p>
              <p className="text-xs text-slate-400">Usage</p>
            </div>
            {getStatusIcon(health.storage.status)}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
          <Clock size={12} />
          <span>Last checked: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
