import Link from "next/link";
import {
  BookOpen,
  Clock,
  Target,
  Highlighter,
  ArrowRight,
  Instagram,
  Send,
} from "lucide-react";
import BandGauge from "@/components/shared/BandGauge";
import DailyInspiration from "@/components/shared/DailyInspiration";
import { readingTests } from "@/data/readingTests_new";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-36 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="animate-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-300">
              Exam format
            </p>
            <h1 className="section-title mb-6 text-balance">
              IELTS Reading, practiced{" "}
              <span className="gradient-text">on your terms</span>.
            </h1>
            <p className="section-subtitle mb-8 max-w-xl text-balance">
              Timed passages, exam-style questions, and a highlighter built into
              the text — scored instantly with an estimated band.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reading" className="btn-primary">
                Browse passages <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="surface-panel animate-fade-in">
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-400">
              Sample result
            </p>
            <BandGauge band={7.5} correct={10} total={13} />
          </div>
        </div>
      </section>

      {/* Daily Inspiration */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <DailyInspiration />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Real timing",
              body: "Every passage runs on a 20-minute clock, so pacing becomes second nature.",
            },
            {
              icon: Highlighter,
              title: "Built-in highlighter",
              body: "Drag across words to mark key phrases in three colours, just like a paper test.",
            },
            {
              icon: Target,
              title: "Instant band estimate",
              body: "Submit and immediately see a band estimate with per-question feedback.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="surface-card">
                <Icon className="mb-3 text-brand-400" size={22} />
                <h4 className="font-semibold text-slate-100">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>

        <Link
          href="/reading"
          className="surface-card group mt-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="text-brand-400" size={28} />
            <div>
              <h3 className="font-display text-xl font-bold">All passages</h3>
              <p className="text-sm text-slate-400">
                Pick any passage to start.
              </p>
            </div>
          </div>
          <ArrowRight
            className="text-brand-400 transition-transform group-hover:translate-x-1"
            size={22}
          />
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="surface-panel p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-100">
            Found a bug or have suggestions?
          </h2>
          <p className="mb-6 text-slate-400">I’d love to hear your feedback.</p>
          <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-slate-300">
            If you find any mistakes or have ideas to improve this project,
            please let me know.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://instagram.com/mukh4mmadov_7"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full border border-brand-500/30 bg-brand-500/10 px-6 py-3 transition-all hover:border-brand-500 hover:bg-brand-500/20"
            >
              <Instagram
                className="text-brand-400 group-hover:text-brand-300"
                size={20}
              />
              <span className="font-semibold text-slate-100">
                @mukh4mmadov_7
              </span>
            </a>
            <a
              href="https://t.me/mukh4mmadov"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full border border-brand-500/30 bg-brand-500/10 px-6 py-3 transition-all hover:border-brand-500 hover:bg-brand-500/20"
            >
              <Send
                className="text-brand-400 group-hover:text-brand-300"
                size={20}
              />
              <span className="font-semibold text-slate-100">@mukh4mmadov</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
