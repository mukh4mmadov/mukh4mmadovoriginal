import Link from "next/link";
import { ArrowRight, Clock3, Headphones, ListChecks } from "lucide-react";
import listeningTests from "@/data/listeningTests";
import { ListeningCardStats, ListeningHistory } from "@/components/listening/ListeningProgress";

const cardColors = {
  sky: "border-sky-400/20 from-sky-500/15 to-sky-500/[0.03] text-sky-200",
  violet: "border-violet-400/20 from-violet-500/15 to-violet-500/[0.03] text-violet-200",
  emerald: "border-emerald-400/20 from-emerald-500/15 to-emerald-500/[0.03] text-emerald-200",
  amber: "border-amber-400/20 from-amber-500/15 to-amber-500/[0.03] text-amber-200",
};

export default function ListeningPage() {
  return (
    <main className="listening-library mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400"><Headphones size={15} aria-hidden="true" /> IELTS Listening</p>
      <h1 className="section-title mb-3">Listening tests</h1>
      <p className="section-subtitle mb-6 max-w-2xl">Four full tests in the computer-delivered exam layout. Choose <b className="text-slate-100">Exam mode</b> (the recording plays once, like the real test) or <b className="text-slate-100">Practice mode</b> (pause, rewind and change the speed).</p>

      <section className="mt-6" aria-labelledby="listening-tests-title">
        <h2 id="listening-tests-title" className="sr-only">Choose a test</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {listeningTests.map((test, index) => (
            <article key={test.slug} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] sm:p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br ${cardColors[test.accent]}`}>
                  <span className="text-lg font-bold">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-slate-100">{test.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1"><ListChecks size={14} aria-hidden="true" /> {test.questionCount} questions</span>
                    <span className="inline-flex items-center gap-1"><Clock3 size={14} aria-hidden="true" /> about {test.durationMinutes} minutes</span>
                  </p>
                </div>
              </div>
              <ol aria-label={`${test.title} part topics`} className="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-xs text-slate-400 sm:grid-cols-2">
                {test.sectionTitles.map((title, sectionIndex) => (
                  <li key={title} className="flex min-w-0 items-start gap-2">
                    <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] font-bold text-slate-300">{sectionIndex + 1}</span>
                    <span className="leading-5">{title}</span>
                  </li>
                ))}
              </ol>
              <ListeningCardStats slug={test.slug} />
              <Link href={`/listening/${test.slug}`} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-950/40 transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300">
                Start test <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-6 text-sm text-slate-400">Want the whole exam? <Link href="/full-mock" className="font-semibold text-brand-300 underline">Take a full IELTS mock</Link>: Listening, Reading and Writing with an overall band.</p>

      <ListeningHistory />

      <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-slate-400">
        These are independent practice materials. They are not official IELTS tests and are not affiliated with Cambridge English, the British Council, or IDP.
      </p>
    </main>
  );
}
