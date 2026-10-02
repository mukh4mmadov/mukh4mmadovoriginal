"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminAccessNotice() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("noAdminAccess") !== "1") return;

    url.searchParams.delete("noAdminAccess");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    if (user && !user.is_anonymous) {
      setVisible(true);
      const timeout = window.setTimeout(() => setVisible(false), 4500);
      return () => window.clearTimeout(timeout);
    }
  }, [isLoading, pathname, user]);

  if (!visible) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
      You do not have access to this page
    </div>
  );
}
