"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-xl text-center" role="alert">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
          <AlertTriangle size={28} aria-hidden="true" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-slate-100">Something went wrong</h1>
        <p className="mx-auto mb-7 max-w-md text-slate-400">
          This page hit an unexpected problem. Your saved drafts and results on this device are safe. Try again, or go back home.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="btn-primary">
            <RotateCcw size={18} aria-hidden="true" />
            Try again
          </button>
          <Link href="/home" className="btn-secondary">
            <Home size={18} aria-hidden="true" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
