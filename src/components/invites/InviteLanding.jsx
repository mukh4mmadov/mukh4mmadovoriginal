"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Gift, Headphones, PenLine, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { savePendingInvite } from "@/lib/invites/invites.mjs";
import { INVITE_SAVED_EVENT } from "@/components/invites/InviteClaimer";

const FEATURES = [
  { icon: Headphones, title: "Listening", text: "Real exam layout, Exam and Practice modes, instant band score." },
  { icon: BookOpen, title: "Reading", text: "Full 60-minute mocks and passages with explanations." },
  { icon: PenLine, title: "Writing", text: "Task 1 and Task 2 with free AI feedback and a band estimate." },
];

// The page a friend opens from an invite link. The code is kept in this
// browser until they sign in, then InviteClaimer sends it.
export default function InviteLanding({ code }) {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);

  useEffect(() => {
    if (savePendingInvite(window.localStorage, code)) window.dispatchEvent(new Event(INVITE_SAVED_EVENT));
  }, [code]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400"><Gift size={14} aria-hidden="true" /> Invitation</p>
      <h1 className="section-title mb-3">A friend invited you to practise IELTS</h1>
      <p className="section-subtitle mb-8 max-w-2xl">
        Practise with tests that look and work like the real computer-delivered IELTS, and see your band score straight away. It's free.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="surface-card">
            <Icon size={20} className="mb-2 text-brand-400" aria-hidden="true" />
            <h2 className="font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">{text}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400" role="status">Loading…</p>
      ) : accountUserId ? (
        <div className="surface-card">
          <p className="text-slate-200">You're signed in. Finish two practice tests and your friend's invite counts.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/full-mock" className="btn-primary">Start a full mock</Link>
            <Link href="/listening" className="btn-secondary">Try a Listening test</Link>
          </div>
        </div>
      ) : (
        <div className="surface-card">
          <p className="flex items-center gap-2 font-semibold text-slate-100"><Sparkles size={18} className="text-brand-400" aria-hidden="true" /> Create your free account</p>
          <p className="mt-2 text-sm text-slate-300">Sign up with Google to save your results and see your progress. Your friend's invite is remembered on this device.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/signup?redirect=%2Fhome" className="btn-primary">Sign up free</Link>
            <Link href="/login?redirect=%2Fhome" className="btn-secondary">I already have an account</Link>
          </div>
        </div>
      )}
      <p className="mt-6 text-xs text-slate-500">Invite code <span className="font-mono tracking-widest">{code}</span></p>
    </main>
  );
}
