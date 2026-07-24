"use client";

import Link from "next/link";
import { BookOpenText, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("darkMode");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialMode = saved !== null ? saved === "true" : systemPrefersDark;
    setDarkMode(initialMode);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode, mounted]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-white"
        >
          <BookOpenText className="text-brand-400" size={22} />
          Muhammadov <span className="gradient-text">IELTS Reading</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-300 sm:gap-6">
          <Link
            href="/reading"
            className="rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white"
          >
            All passages
          </Link>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            aria-pressed={darkMode}
            className="control-button"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
