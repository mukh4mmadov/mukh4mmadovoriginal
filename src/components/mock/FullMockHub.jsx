"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, Clock, Headphones, Lock, PenLine, Share2, Trophy } from "lucide-react";
import listeningTests, { getListeningTest } from "@/data/listeningTests";
import writingTasks, { getWritingTask } from "@/data/writingTasks";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { findFullMockVariants, hasUsedFullMockVariant, MOCK_STORAGE_KEY } from "@/lib/reading/mock-test";
import { readListeningHistory } from "@/lib/listening/listening-results.mjs";
import { combinedWritingBand, pickWritingTestPair } from "@/lib/writing/writing-feedback.mjs";
import { listMyPremiumRequests } from "@/lib/writing/premium-requests";
import { supabase } from "@/lib/supabase/client";
import {
  createFullMock, FULL_MOCK_KEY, FULL_MOCK_PARTS, fullMockOverall, readFullMock, recordPartResult, writeFullMock,
} from "@/lib/mock/full-mock.mjs";

const ICONS = { listening: Headphones, reading: BookOpen, writing: PenLine };
const formatBand = (band) => (band == null ? "—" : Number(band).toFixed(1));

export function fullMockPartHref(session, partId) {
  if (partId === "listening") return `/listening/${session.listeningSlug}?fullmock=1`;
  if (partId === "reading") return "/readingmock?fullmock=1";
  return "/writing/test?fullmock=1";
}

function partDetail(session, partId) {
  if (partId === "listening") return getListeningTest(session.listeningSlug)?.title || "Listening test";
  if (partId === "reading") return "3 passages · 40 questions";
  return session.writingSlugs.map((slug) => getWritingTask(slug)?.title).filter(Boolean).join(" + ");
}

// Prefer tests this browser has not done yet, so a full mock feels new.
function chooseTests() {
  let listeningDone = new Set();
  let readingResults = [];
  try {
    listeningDone = new Set(readListeningHistory(window.localStorage).map((item) => item.testSlug));
    readingResults = JSON.parse(window.localStorage.getItem(MOCK_STORAGE_KEY) || "null")?.results || [];
  } catch {
    // Without history every test is a candidate.
  }
  const freshListening = listeningTests.filter((test) => !listeningDone.has(test.slug));
  const variants = findFullMockVariants();
  const freshReading = variants.filter((variant) => !hasUsedFullMockVariant(variant, readingResults));
  return {
    listeningSlugs: (freshListening.length ? freshListening : listeningTests).map((test) => test.slug),
    readingVariantIds: (freshReading.length ? freshReading : variants).map((variant) => variant.id),
    writingSlugs: (pickWritingTestPair(writingTasks) || []).map((task) => task.slug),
  };
}

function ResultCard({ session, name }) {
  const { overall, count } = fullMockOverall(session);
  const [shared, setShared] = useState(false);
  const writing = session.results.writing;
  const share = async () => {
    const text = `I scored an estimated overall band ${formatBand(overall)} on a full IELTS mock test (Listening ${formatBand(session.results.listening?.band)}, Reading ${formatBand(session.results.reading?.band)}, Writing ${formatBand(writing?.band)}).`;
    const url = `${window.location.origin}/full-mock`;
    try {
      if (navigator.share) await navigator.share({ title: "My IELTS mock result", text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setShared(true); }
    } catch {
      // Sharing was cancelled.
    }
  };
  return (
    <section className="rounded-3xl border border-brand-400/30 bg-gradient-to-br from-brand-500/15 via-white/[0.03] to-transparent p-6 sm:p-8" aria-labelledby={`full-mock-result-${session.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-300"><Trophy size={14} aria-hidden="true" /> Full mock result</p>
          <h2 id={`full-mock-result-${session.id}`} className="mt-1 text-lg font-bold text-white">{name ? `${name} · ` : ""}{new Date(session.completedAt || session.startedAt).toLocaleDateString()}</h2>
        </div>
        <button type="button" onClick={() => void share()} className="btn-secondary"><Share2 size={16} aria-hidden="true" /> {shared ? "Copied" : "Share result"}</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pr-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated overall</p>
          <p className="font-display text-7xl font-black text-white">{formatBand(overall)}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {FULL_MOCK_PARTS.map((part) => {
            const result = session.results[part.id];
            const Icon = ICONS[part.id];
            return (
              <div key={part.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <Icon size={18} className="mx-auto text-brand-400" aria-hidden="true" />
                <p className="mt-1 text-xs text-slate-400">{part.label}</p>
                <p className="text-2xl font-bold text-white">{formatBand(result?.band)}</p>
                {part.id !== "writing" && result?.score != null && <p className="text-xs text-slate-400">{result.score}/{result.total || 40}</p>}
                {part.id === "writing" && result?.pending && <p className="text-xs text-amber-300">AI Premium pending</p>}
                {part.id === "writing" && result?.skipped && <p className="text-xs text-slate-400">Not marked</p>}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {count < 3 ? `Based on ${count} of 3 parts. ` : ""}Speaking is not included. A practice estimate, not an official IELTS score.
      </p>
    </section>
  );
}

export default function FullMockHub() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [state, setState] = useState(null);

  const refresh = useCallback(() => setState(readFullMock(window.localStorage)), []);
  useEffect(() => { refresh(); }, [refresh]);

  // A Writing part sent for AI Premium gets its band once the check is published.
  useEffect(() => {
    if (!accountUserId || !state) return;
    const waiting = [state.active, ...state.history].filter((session) => session?.results?.writing?.pending);
    if (!waiting.length) return;
    let active = true;
    listMyPremiumRequests(accountUserId).then((requests) => {
      if (!active) return;
      for (const session of waiting) {
        const request = requests.find((item) => item.id === session.results.writing.premiumRequestId);
        if (request?.status !== "done" || !Array.isArray(request.feedback)) continue;
        const bands = request.feedback.map((item) => item?.overall);
        const band = bands.length === 2 ? combinedWritingBand(bands[0], bands[1]) : bands[0] ?? null;
        writeFullMock(window.localStorage, { ...session, results: { ...session.results, writing: { ...session.results.writing, band, pending: false } } });
      }
      refresh();
    }).catch(() => { /* try again next visit */ });
    return () => { active = false; };
  }, [accountUserId, state, refresh]);

  // Finished mocks are copied to the account (and so to the admin panel).
  useEffect(() => {
    if (!accountUserId || !supabase || !state?.history.length) return;
    const band = (value) => (value == null || !Number.isFinite(Number(value)) ? null : Number(value));
    const rows = state.history.map((session) => ({
      id: session.id,
      user_id: accountUserId,
      overall_band: fullMockOverall(session).overall,
      listening_band: band(session.results.listening?.band),
      reading_band: band(session.results.reading?.band),
      writing_band: band(session.results.writing?.band),
      result_data: session,
      started_at: session.startedAt,
      completed_at: session.completedAt || session.startedAt,
    }));
    supabase.from("full_mock_results").upsert(rows, { onConflict: "user_id,id" }).then(({ error }) => {
      if (error) console.warn("Full mock results could not be synced:", error.message);
    });
  }, [accountUserId, state]);

  if (!state) return null;
  const { active, history } = state;
  const name = profile?.full_name || profile?.username || "";

  const start = () => {
    const session = createFullMock(chooseTests());
    if (!session) return;
    writeFullMock(window.localStorage, session);
    router.push(fullMockPartHref(session, "listening"));
  };
  const abandon = () => {
    if (!window.confirm("Stop this full mock? Results of the parts you finished stay in each part's history.")) return;
    try { window.localStorage.setItem(FULL_MOCK_KEY, JSON.stringify({ active: null, history })); } catch { /* fine */ }
    refresh();
  };
  const skipWriting = () => {
    writeFullMock(window.localStorage, recordPartResult(active, "writing", { band: null, skipped: true }));
    refresh();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Exam day practice</p>
      <h1 className="section-title mb-3">Full IELTS mock test</h1>
      <p className="section-subtitle mb-8 max-w-2xl">Listening, Reading and Writing in the same order as the real computer-delivered exam, about 2.5 hours in total. At the end you get a band for each part and an estimated overall band.</p>

      {active ? (
        <section className="surface-card mb-8" aria-labelledby="full-mock-progress">
          <h2 id="full-mock-progress" className="mb-4 text-lg font-bold text-slate-100">Your mock in progress</h2>
          <ol className="space-y-3">
            {FULL_MOCK_PARTS.map((part, index) => {
              const Icon = ICONS[part.id];
              const result = active.results[part.id];
              const due = active.stage === part.id;
              return (
                <li key={part.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${due ? "border-brand-400/50 bg-brand-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${result ? "bg-emerald-500/20 text-emerald-300" : due ? "bg-brand-500/20 text-brand-300" : "bg-white/5 text-slate-500"}`}>
                    {result ? <Check size={18} aria-hidden="true" /> : due ? <Icon size={18} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-100">Part {index + 1}: {part.label} <span className="font-normal text-slate-400">· {part.minutes} min</span></p>
                    <p className="truncate text-sm text-slate-400">{partDetail(active, part.id)}</p>
                  </div>
                  {result && <p className="text-sm font-semibold text-emerald-300">Band {formatBand(result.band)}</p>}
                  {due && <Link href={fullMockPartHref(active, part.id)} className="btn-primary">{index === 0 && !Object.keys(active.results).length ? "Start" : "Continue"} <ArrowRight size={16} aria-hidden="true" /></Link>}
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {active.stage === "writing" && <button type="button" onClick={skipWriting} className="text-slate-400 underline hover:text-white">Finish without Writing</button>}
            <button type="button" onClick={abandon} className="text-slate-400 underline hover:text-white">Stop this mock</button>
          </div>
        </section>
      ) : (
        <section className="surface-card mb-8" aria-labelledby="full-mock-start">
          <h2 id="full-mock-start" className="mb-4 text-lg font-bold text-slate-100">How it works</h2>
          <ol className="mb-5 grid gap-3 sm:grid-cols-3">
            {FULL_MOCK_PARTS.map((part, index) => {
              const Icon = ICONS[part.id];
              return (
                <li key={part.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <Icon size={20} className="mb-2 text-brand-400" aria-hidden="true" />
                  <p className="font-semibold text-slate-100">Part {index + 1}: {part.label}</p>
                  <p className="flex items-center gap-1 text-sm text-slate-400"><Clock size={13} aria-hidden="true" /> {part.minutes} minutes</p>
                </li>
              );
            })}
          </ol>
          <ul className="mb-5 space-y-1 text-sm text-slate-300">
            <li>· Tests you haven&apos;t done yet are chosen for you.</li>
            <li>· Use headphones for Listening. You can take a break between parts, though the real exam has none.</li>
            <li>· Writing is marked by AI and needs you to {accountUserId ? "be signed in (you are)" : <Link href="/login?redirect=%2Ffull-mock" className="font-semibold text-brand-300 underline">sign in</Link>}. Speaking is not included.</li>
          </ul>
          <button type="button" onClick={start} className="btn-primary">Start the full mock <ArrowRight size={18} aria-hidden="true" /></button>
        </section>
      )}

      {history.length > 0 && (
        <section aria-labelledby="full-mock-history" className="space-y-4">
          <h2 id="full-mock-history" className="text-xl font-bold text-slate-100">{history.length === 1 ? "Your result" : "Your results"}</h2>
          {history.map((session) => <ResultCard key={session.id} session={session} name={name} />)}
        </section>
      )}
    </main>
  );
}
