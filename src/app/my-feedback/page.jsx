"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { feedbackRepository } from "@/lib/supabase/repositories/feedback.repository";

const statusLabels = {
  new: "Received",
  read: "Under review",
  replied: "Response available",
};

export default function MyFeedbackPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFeedback() {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      setItems(await feedbackRepository.getUserFeedback(user.id));
    } catch (loadError) {
      setError(loadError.message || "Your feedback could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent("/my-feedback")}`);
      return;
    }
    if (user) loadFeedback();
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || (!user && isLoading)) {
    return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-300">Loading your feedback…</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/profile" className="mb-6 inline-flex min-h-11 items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft size={18} /> Back to profile
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare className="text-brand-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">My feedback reports</h1>
            <p className="mt-1 text-sm text-slate-400">Check report status and read any response from the team.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <p>{error}</p>
            <button type="button" onClick={loadFeedback} className="mt-3 inline-flex min-h-10 items-center gap-2 underline">
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        )}

        {isLoading && <p role="status" className="py-8 text-center text-slate-400">Loading your reports…</p>}

        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-slate-300">You haven&apos;t sent any reports while signed in yet.</p>
            <p className="mt-2 text-sm text-slate-500">Reports sent as a guest cannot be linked to this account.</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-white">{item.subject}</h2>
                <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs text-brand-200">
                  {statusLabels[item.status] || "Received"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{item.message}</p>
              <p className="mt-3 text-xs text-slate-500">
                {new Date(item.created_at).toLocaleString()} · {item.message_type?.replaceAll("_", " ")}
              </p>
              {item.public_response && (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <h3 className="text-sm font-semibold text-emerald-200">Response from the team</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{item.public_response}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
