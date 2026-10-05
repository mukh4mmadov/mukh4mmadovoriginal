"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function DataLoadingStatus({ label, onRetry }) {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsTakingLong(true), 7000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center" aria-busy="true" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-400/30 border-t-brand-500" aria-hidden="true" />
      <div role="status" className="max-w-md text-sm text-slate-500">
        {isTakingLong
          ? `${label} is taking longer than usual. Check your connection and try again if it does not finish.`
          : `${label} is loading. This may take a few seconds.`}
      </div>
      {isTakingLong && (
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white/10 dark:text-slate-200">
          <RefreshCw size={15} aria-hidden="true" /> Retry loading
        </button>
      )}
    </main>
  );
}
