import Link from "next/link";
import { BookOpenText } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <BookOpenText className="text-brand-400" size={22} />
          Muhammadov <span className="gradient-text">IELTS Reading</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/reading" className="transition-colors hover:text-white">
            All passages
          </Link>
        </nav>
      </div>
    </header>
  );
}
