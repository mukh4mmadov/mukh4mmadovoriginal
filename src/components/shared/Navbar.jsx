"use client";

import Link from "next/link";
import { BookOpenText, Moon, Sun, LogOut, User, ChevronDown, Settings, BarChart3, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, profile, signOut, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
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

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-white"
        >
          <BookOpenText className="text-brand-400" size={22} />
          <span className="hidden sm:inline">Muhammadov</span> <span className="gradient-text">IELTS Reading</span>
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-3 text-sm font-medium text-slate-300 sm:gap-6">
          <Link
            href="/reading"
            className="rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white"
          >
            All passages
          </Link>
          <Link
            href="/changelog"
            className="rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white"
          >
            Changelog
          </Link>
          <Link
            href="/roadmap"
            className="rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white"
          >
            Roadmap
          </Link>

          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-2 transition-all hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={getDisplayName()}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <span className="hidden sm:block">{getDisplayName()}</span>
                <ChevronDown size={16} className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/10 bg-surface py-2 shadow-xl">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <User size={16} />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <Link
                    href="/statistics"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <BarChart3 size={16} />
                    Statistics
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-600"
              >
                Sign in
              </Link>
            </div>
          )}

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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/reading"
              className="block rounded-lg px-4 py-3 text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              All passages
            </Link>
            <Link
              href="/changelog"
              className="block rounded-lg px-4 py-3 text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Changelog
            </Link>
            <Link
              href="/roadmap"
              className="block rounded-lg px-4 py-3 text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Roadmap
            </Link>

            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="px-4 py-2 mb-3">
                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                  <Link
                    href="/statistics"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 size={18} />
                    Statistics
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="block rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-brand-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
              <span className="text-sm text-slate-400">Theme</span>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle theme"
                aria-pressed={darkMode}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
