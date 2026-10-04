"use client";

import { hasUsedFullMockVariant } from "@/lib/reading/mock-test";

export default function FullMockPicker({ variants, selectedVariantId, history, onSelect }) {
  return (
    <section aria-labelledby="full-mock-picker-title" className="mt-7">
      <div className="mb-3">
        <h2 id="full-mock-picker-title" className="text-xl font-bold text-white">Choose a mock</h2>
        <p className="mt-1 text-sm text-slate-300">Pick any numbered 40-question test. Completed mocks stay marked here.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {variants.map((variant, index) => {
          const mockNumber = index + 1;
          const selected = variant.id === selectedVariantId;
          const attempt = history.find((item) => hasUsedFullMockVariant(variant, [item]));

          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={selected}
              aria-label={`Mock ${mockNumber}${attempt ? `, completed, score ${attempt.rawScore} out of 40` : ", not completed"}`}
              onClick={() => onSelect(variant)}
              className={`min-h-32 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-sky-300 bg-sky-950/70 ring-2 ring-sky-300/60" : "border-white/15 bg-slate-900 hover:border-slate-400"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-bold text-white">Mock {mockNumber}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attempt ? "bg-emerald-900 text-emerald-100" : "bg-slate-700 text-slate-200"}`}>
                  {attempt ? "Completed" : "Not completed"}
                </span>
              </div>
              {attempt && (
                <p className="mt-2 text-sm font-medium text-emerald-100">
                  {attempt.rawScore}/40 · {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : "Previously completed"}
                </p>
              )}
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-300">
                {variant.passages.map((passage) => passage.title).join(" · ")}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
