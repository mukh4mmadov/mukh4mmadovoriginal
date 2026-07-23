import Link from "next/link";
import { readingTests } from "@/data/readingTests_new";
import { Clock, ArrowRight, FileText } from "lucide-react";

export default function ReadingListPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-400">
        Reading practice
      </p>
      <h1 className="section-title mb-4">Choose a passage</h1>
      <p className="section-subtitle mb-10 max-w-xl">
        Each passage is timed at 20 minutes and mixes question types the way
        the real Academic Reading test does.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {readingTests.map((t, index) => {
          const passage = t.passages[0];
          return (
            <Link 
              key={t.slug} 
              href={`/reading/${t.slug}`} 
              className="glass-card group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:via-brand-500/10 group-hover:to-brand-500/5 transition-all duration-500" />
              <div className="relative z-10">
                <FileText className="mb-4 text-brand-400 group-hover:scale-110 group-hover:text-brand-300 transition-all duration-300" size={26} />
                <p className="mb-1 text-xs uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
                  {t.subtitle}
                </p>
                <h3 className="mb-2 font-display text-xl font-bold group-hover:text-brand-200 transition-colors">{t.title}</h3>
                <div className="mb-4 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 group-hover:text-brand-300 transition-colors">
                    <Clock size={14} /> 20 min
                  </span>
                  <span className="group-hover:text-brand-300 transition-colors">{passage.wordCount} words</span>
                  <span className="group-hover:text-brand-300 transition-colors">{passage.questionGroups.flatMap((g: any) => g.questions).length} questions</span>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-400 group-hover:gap-2 group-hover:text-brand-300 transition-all">
                  Start test <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
