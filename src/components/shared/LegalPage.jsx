import Link from "next/link";

export default function LegalPage({ title, updatedAt, intro, sections }) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 text-slate-200 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-brand-300 hover:text-brand-200">
        ← Back to home
      </Link>
      <header className="mt-8 border-b border-white/10 pb-8">
        <p className="text-sm text-slate-400">Last updated: {updatedAt}</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-4 leading-7 text-slate-300">{intro}</p>
      </header>
      <div className="space-y-8 py-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <div className="mt-3 space-y-3 leading-7 text-slate-300">
              {section.body.map((paragraph, index) => <p key={`${section.title}-${index}`}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
