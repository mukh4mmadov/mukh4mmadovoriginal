import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import readingTestsModule from "@/data/readingTests_new";
import { buildDrillPool, DRILL_TYPES } from "@/lib/reading/question-drills.mjs";

export const metadata = {
  title: "Practise by question type",
  description: "Short IELTS Reading drills for one question type at a time: True/False/Not Given, Yes/No/Not Given, multiple choice, sentence completion and matching headings.",
  alternates: { canonical: "/reading/practice" },
};

export default function QuestionDrillIndexPage() {
  const counts = Object.fromEntries(DRILL_TYPES.map(({ type }) => [type, buildDrillPool(readingTestsModule.readingTests, type).length]));
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Reading skills</p>
      <h1 className="section-title mb-3">Practise by question type</h1>
      <p className="section-subtitle mb-8 max-w-2xl">
        Ten quick questions of one type, each with just the paragraph you need. Check your answer and see the evidence straight away.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DRILL_TYPES.filter(({ type }) => counts[type] > 0).map((entry) => (
          <Link key={entry.type} href={`/reading/practice/${entry.type}`} className="surface-card group flex flex-col hover:border-brand-500/30">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-300">
              <Target size={14} aria-hidden="true" /> {counts[entry.type]} questions
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-100">{entry.label}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{entry.tip}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
              Start drill <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
