"use client";

import { LifeBuoy, Send } from "lucide-react";
import Link from "next/link";
import { requestHelpDialog } from "@/lib/help-dialog";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={(event) => requestHelpDialog(event.currentTarget)}
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <LifeBuoy size={20} aria-hidden="true" />
              <span className="text-sm">Help</span>
            </button>
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
          <nav aria-label="Legal information" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} Muhammadov IELTS Reading. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
