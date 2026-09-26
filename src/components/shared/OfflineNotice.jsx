"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }

    const updateStatus = () => setIsOffline(!navigator.onLine);
    const keepCurrentPageOffline = (event) => {
      const link = event.target.closest("a[href]");
      if (!link || navigator.onLine || link.href.startsWith(`${window.location.origin}#`)) {
        return;
      }

      if (new URL(link.href).origin === window.location.origin) {
        event.preventDefault();
      }
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    document.addEventListener("click", keepCurrentPageOffline, true);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      document.removeEventListener("click", keepCurrentPageOffline, true);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-amber-300/30 bg-slate-950/95 p-4 text-sm text-amber-100 shadow-2xl"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={20} className="shrink-0" aria-hidden="true" />
      <p className="flex-1">You are offline. Reconnect to continue using the app.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-11 rounded-lg bg-amber-300/15 px-3 font-semibold text-amber-100 hover:bg-amber-300/25"
      >
        Retry
      </button>
    </div>
  );
}
