import Link from "next/link";
import { ArrowRight, Clock3, Headphones, ListChecks, Music2 } from "lucide-react";
import listeningTests from "@/data/listeningTests";

const cardColors = {
  sky: "border-sky-400/20 from-sky-500/15 to-sky-500/[0.03] text-sky-200",
  violet: "border-violet-400/20 from-violet-500/15 to-violet-500/[0.03] text-violet-200",
  emerald: "border-emerald-400/20 from-emerald-500/15 to-emerald-500/[0.03] text-emerald-200",
  amber: "border-amber-400/20 from-amber-500/15 to-amber-500/[0.03] text-amber-200",
};

export default function ListeningPage() {
  return (
    <main className="listening-library mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_48%)] bg-white/[0.04] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.16)] sm:p-9 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
            <Headphones size={15} aria-hidden="true" /> IELTS Listening
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            Listen closely. Build confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Choose a full listening test, use the audio controls at your pace, and check your answers when you finish.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-200 sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2"><Music2 size={15} aria-hidden="true" /> Audio control</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2"><Clock3 size={15} aria-hidden="true" /> Timed practice</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2"><ListChecks size={15} aria-hidden="true" /> 40 questions</span>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="listening-tests-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Practice library</p>
            <h2 id="listening-tests-title" className="mt-1 text-2xl font-bold text-slate-100">Choose a test</h2>
          </div>
          <p className="text-sm text-slate-400">{listeningTests.length} tests available</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {listeningTests.map((test, index) => (
            <article key={test.slug} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] sm:p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br ${cardColors[test.accent]}`}>
                  <span className="text-lg font-bold">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Listening practice</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-100">{test.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{test.description}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-300">
                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">4 sections</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"><ListChecks size={14} aria-hidden="true" /> {test.questionCount} questions</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"><Clock3 size={14} aria-hidden="true" /> {test.durationMinutes} minutes</span>
              </div>
              <ol aria-label={`${test.title} section topics`} className="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-xs text-slate-400 sm:grid-cols-2">
                {test.sectionTitles.map((title, sectionIndex) => (
                  <li key={title} className="flex min-w-0 items-start gap-2">
                    <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] font-bold text-slate-300">{sectionIndex + 1}</span>
                    <span className="leading-5">{title}</span>
                  </li>
                ))}
              </ol>
              <Link href={`/listening/${test.slug}`} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-950/40 transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300">
                Start listening test <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-slate-400">
        These are independent practice materials. They are not official IELTS tests and are not affiliated with Cambridge English, the British Council, or IDP.
      </p>
    </main>
  );
}
