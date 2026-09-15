import { Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-6">
            <a
              href="https://t.me/mukh4mmadov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
              aria-label="Telegram"
            >
              <Send size={20} />
              <span className="text-sm">Telegram</span>
            </a>
          </div>
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} Muhammadov IELTS Reading. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
