"use client";

import Link from "next/link";
import { Moon, Sun, LogOut, User, ChevronDown, Settings, BarChart3, Menu, X, MessageSquare, LifeBuoy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { requestHelpDialog } from "@/lib/help-dialog";

const NAV_LINKS = [
  { href: "/reading", label: "Reading" },
  { href: "/readingmock", label: "Mock test" },
  { href: "/listening", label: "Listening" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("themePreference");
    const saved = window.localStorage.getItem("darkMode");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialMode = savedTheme
      ? savedTheme === "system" ? systemPrefersDark : savedTheme === "dark"
      : saved !== null ? saved === "true" : systemPrefersDark;
    setDarkMode(initialMode);
    setMounted(true);

    const handleThemeChange = (event) => setDarkMode(event.detail.darkMode);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (event) => {
      if (window.localStorage.getItem("themePreference") === "system") setDarkMode(event.matches);
    };
    window.addEventListener("app-theme-change", handleThemeChange);
    mediaQuery.addEventListener("change", handleSystemChange);
    return () => {
      window.removeEventListener("app-theme-change", handleThemeChange);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
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
    const nextState = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextState);
    if (!nextState) {
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    window.localStorage.setItem("themePreference", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
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
    <>
    <header className="ielts-site-navbar sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-white"
        >
          <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="gradient-text">Mukh4mmadov IELTS</span>
        </Link>

        <div className="flex items-center gap-2 lg:hidden">
          {!isLoading && !user && (
            <Link
              href="/login"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-600"
            >
              Login
            </Link>
          )}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={toggleMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
          </button>
        </div>

        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300 xl:gap-3">
          <button type="button" onClick={(event) => requestHelpDialog(event.currentTarget)} className="rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white">Help</button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 transition-all hover:bg-white/10 hover:text-white ${isActive(link.href) ? "bg-white/10 text-white" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <div className="relative profile-dropdown">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                aria-expanded={isProfileDropdownOpen}
                aria-controls="profile-menu"
                aria-label={`Account menu for ${getDisplayName()}`}
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
                <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div id="profile-menu" className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/10 bg-surface py-2 shadow-xl">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
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
                  <Link href="/my-feedback" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white" onClick={() => setIsProfileDropdownOpen(false)}>
                    <MessageSquare size={16} /> My feedback
                  </Link>
                  <button type="button" onClick={(event) => requestHelpDialog(event.currentTarget)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                    <LifeBuoy size={16} /> Help
                  </button>
                  <button
                    type="button"
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
                Login
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            className="control-button ml-2"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>

      <div
        id="mobile-navigation"
        hidden={!isMobileMenuOpen}
        className="lg:hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl"
      >
          <nav aria-label="Mobile navigation" className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`block rounded-lg px-4 py-3 text-white hover:bg-white/10 transition-colors ${isActive(link.href) ? "bg-white/10 font-semibold" : ""}`}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <button type="button" onClick={(event) => requestHelpDialog(event.currentTarget)} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-white hover:bg-white/10 transition-colors">
              <LifeBuoy size={18} /> Help
            </button>

            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="px-4 py-2 mb-3">
                    <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <User size={18} />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                  <Link
                    href="/statistics"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <BarChart3 size={18} />
                    Statistics
                  </Link>
                  <Link href="/my-feedback" className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors" onClick={closeMobileMenu}>
                    <MessageSquare size={18} /> My feedback
                  </Link>
                  <button
                    type="button"
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
                onClick={closeMobileMenu}
              >
                Login
              </Link>
            )}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
              <span className="text-sm text-slate-400">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
              </button>
            </div>
          </nav>
      </div>
    </header>

    </>
  );
}
