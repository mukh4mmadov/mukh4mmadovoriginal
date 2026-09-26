"use client";

import { AlertCircle, RefreshCw } from 'lucide-react';

export function AdminPageLoading({ label = 'Loading admin data' }) {
  return (
    <div
      className="min-h-[16rem] flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-8"
      role="status"
      aria-live="polite"
    >
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-lg border border-white/10 bg-white/5" />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
        {label}…
      </div>
    </div>
  );
}

export function AdminPageError({ message, onRetry }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center"
      role="alert"
    >
      <AlertCircle className="text-red-400" size={24} />
      <p className="text-sm text-red-200">{message || 'Admin data could not be loaded.'}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
