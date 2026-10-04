import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
          <BookOpenText size={28} aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
          404 · Page not found
        </p>
        <h1 className="mb-3 text-3xl font-bold text-slate-100">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mb-7 max-w-md text-slate-400">
          The link may be incorrect or the page may have moved. You can return to the reading catalog or go back home.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/reading" className="btn-primary">
            <BookOpenText size={18} aria-hidden="true" />
            Browse passages
          </Link>
          <Link href="/home" className="btn-secondary">
            <ArrowLeft size={18} aria-hidden="true" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
