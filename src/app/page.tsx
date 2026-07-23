import Link from "next/link";
import { BookOpen, Clock, Target, Highlighter, ArrowRight, Instagram, Send } from "lucide-react";
import BandGauge from "@/components/shared/BandGauge";
import { readingTests } from "@/data/readingTests_new";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
          <div className="animate-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-300 animate-pulse">
              {readingTests.length} passages &middot; exam format
            </p>
            <h1 className="section-title mb-6 text-balance">
              IELTS Reading, practiced <span className="gradient-text">on your terms</span>.
            </h1>
            <p className="section-subtitle mb-8 max-w-lg text-balance">
              Timed passages, exam-style questions, and a highlighter pen
              built right into the text — scored instantly with an
              estimated band.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reading" className="btn-primary">
                Browse passages <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="glass-card flex flex-col items-center justify-center py-10 animate-fade-in">
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">
              Sample result
            </p>
            <BandGauge band={7.5} correct={10} total={13} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Clock className="mt-1 shrink-0 text-brand-400" size={22} />
            <div>
              <h4 className="font-semibold text-slate-100">Real timing</h4>
              <p className="text-sm text-slate-400">
                Every passage runs on a 20-minute clock, so pacing becomes
                second nature.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Highlighter className="mt-1 shrink-0 text-brand-400" size={22} />
            <div>
              <h4 className="font-semibold text-slate-100">Built-in highlighter</h4>
              <p className="text-sm text-slate-400">
                Drag across words to mark key phrases in three colours,
                exactly like a paper test.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Target className="mt-1 shrink-0 text-brand-400" size={22} />
            <div>
              <h4 className="font-semibold text-slate-100">Instant band estimate</h4>
              <p className="text-sm text-slate-400">
                Submit and immediately see a band estimate with
                per-question feedback.
              </p>
            </div>
          </div>
        </div>

        <Link href="/reading" className="glass-card group mt-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="text-brand-400" size={28} />
            <div>
              <h3 className="font-display text-xl font-bold">All passages</h3>
              <p className="text-sm text-slate-400">
                Pick any of the {readingTests.length} available passages to start.
              </p>
            </div>
          </div>
          <ArrowRight className="text-brand-400 transition-transform group-hover:translate-x-1" size={22} />
        </Link>
      </section>

      {/* Contact Section */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="glass-card p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-100">
            Found a bug, mistake, or have suggestions?
          </h2>
          <p className="mb-6 text-slate-400">
            Feel free to contact me.
          </p>
          <p className="mb-8 text-sm text-slate-300 max-w-2xl mx-auto">
            If you find any mistakes or have ideas to improve this project, please let me know. I'd love to hear your feedback.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://instagram.com/mukh4mmadov_7"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full border border-brand-500/30 bg-brand-500/10 px-6 py-3 transition-all hover:border-brand-500 hover:bg-brand-500/20"
            >
              <Instagram className="text-brand-400 group-hover:text-brand-300" size={20} />
              <span className="font-semibold text-slate-100">@mukh4mmadov_7</span>
            </a>
            <a
              href="https://t.me/mukh4mmadov"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full border border-brand-500/30 bg-brand-500/10 px-6 py-3 transition-all hover:border-brand-500 hover:bg-brand-500/20"
            >
              <Send className="text-brand-400 group-hover:text-brand-300" size={20} />
              <span className="font-semibold text-slate-100">@mukh4mmadov</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
