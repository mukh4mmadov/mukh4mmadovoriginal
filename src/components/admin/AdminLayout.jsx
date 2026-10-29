"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Map, 
  LogOut, 
  Menu, 
  X,
  Users,
  ClipboardList,
  HeartHandshake,
  ExternalLink,
  Headphones,
  PenLine,
  Sparkles,
  Trophy,
  Megaphone,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/supabase/auth-admin';
import AdminNotifications from './AdminNotifications';
import { AdminPageError } from './AdminPageStatus';

export default function AdminLayout({ children }) {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(null);
  const [adminCheckError, setAdminCheckError] = useState('');
  const [adminCheckAttempt, setAdminCheckAttempt] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // The admin panel has its own header and navigation, so hide the public
  // site navbar and footer while it is open.
  useEffect(() => {
    document.body.classList.add('admin-active');
    setDarkMode(document.documentElement.classList.contains('dark'));
    return () => document.body.classList.remove('admin-active');
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    window.localStorage.setItem('themePreference', next ? 'dark' : 'light');
    // The (hidden) site navbar listens for this and applies the theme.
    window.dispatchEvent(new CustomEvent('app-theme-change', { detail: { darkMode: next } }));
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setAdminCheckError('');
      setIsAdminUser(null);
      setAdminCheckAttempt((attempt) => attempt + 1);
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function checkAdmin() {
      if (authLoading) return;

      if (!user || user.is_anonymous) {
        setIsAdminUser(false);
        router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setAdminCheckError('You are offline. Reconnect to verify admin access and load admin data.');
        return;
      }

      setIsAdminUser(null);
      setAdminCheckError('');
      try {
        const admin = await isAdmin(user.id);
        if (!isActive) return;
        setIsAdminUser(admin);
        if (!admin) {
          router.replace('/?noAdminAccess=1');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (!isActive) return;
        setAdminCheckError(
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'You are offline. Reconnect and retry to verify admin access.'
            : 'Admin access could not be verified. Please retry.',
        );
      }
    }

    checkAdmin();

    return () => {
      isActive = false;
    };
  }, [authLoading, user, router, adminCheckAttempt]);

  if (isOffline) {
    return (
      <div className="min-h-screen bg-surface p-4 pt-16">
        <div className="mx-auto max-w-xl rounded-xl border border-amber-300/30 bg-amber-300/10 p-6 text-center text-amber-100">
          <h1 className="text-lg font-semibold">Admin is unavailable offline</h1>
          <p className="mt-2 text-sm">Reconnect to verify administrator access and load current admin data.</p>
          <button
            type="button"
            onClick={() => {
              setIsOffline(!navigator.onLine);
              if (navigator.onLine) {
                setAdminCheckError('');
                setIsAdminUser(null);
                setAdminCheckAttempt((attempt) => attempt + 1);
              }
            }}
            className="mt-4 min-h-11 rounded-lg border border-amber-200/30 px-4 text-sm font-semibold hover:bg-amber-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (adminCheckError) {
    return (
      <div className="min-h-screen bg-surface p-4 pt-16">
        <div className="mx-auto max-w-xl">
          <AdminPageError
            message={adminCheckError}
            onRetry={() => setAdminCheckAttempt((attempt) => attempt + 1)}
          />
        </div>
      </div>
    );
  }

  if (authLoading || isAdminUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Checking admin access">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" aria-hidden="true" />
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Reading Mock Results', href: '/admin/readingmock-results', icon: ClipboardList },
    { name: 'Listening Results', href: '/admin/listening-results', icon: Headphones },
    { name: 'Writing Submissions', href: '/admin/writing', icon: PenLine },
    { name: 'AI Premium Writing', href: '/admin/writing-premium', icon: Sparkles },
    { name: 'Full Mock Results', href: '/admin/full-mocks', icon: Trophy },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Support inbox', href: '/admin/support', icon: MessageSquare },
    { name: 'Donation inbox', href: '/admin/donations', icon: HeartHandshake },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Changelog', href: '/admin/changelog', icon: FileText },
    { name: 'Roadmap', href: '/admin/roadmap', icon: Map },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-surface lg:min-h-screen">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-navigation"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-white/10 transition-transform duration-300 lg:visible lg:translate-x-0 lg:z-40 ${
          isSidebarOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-bold text-white">
              <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7" />
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Close admin navigation"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Admin navigation" className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/admin' ? pathname === '/admin' : (pathname === item.href || pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'admin-nav-active bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 p-4 border-t border-white/10">
            <Link
              href="/home"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={20} aria-hidden="true" />
              <span className="font-medium">View site</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={20} aria-hidden="true" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label={isSidebarOpen ? 'Close admin navigation' : 'Open admin navigation'}
              aria-expanded={isSidebarOpen}
              aria-controls="admin-navigation"
            >
              {isSidebarOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <p className="hidden min-w-0 truncate text-sm text-slate-400 sm:block" title={user?.email}>
                {user?.email}
              </p>
              <AdminNotifications />
              <button
                type="button"
                onClick={toggleTheme}
                className="control-button"
                aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {isOffline && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100 sm:flex-row sm:items-center sm:justify-between" role="status">
              <p className="text-sm">You are offline. Admin data and changes require an internet connection; nothing can be saved until you reconnect.</p>
              <button
                type="button"
                onClick={() => {
                  setIsOffline(!navigator.onLine);
                  if (navigator.onLine) {
                    setAdminCheckError('');
                    setIsAdminUser(null);
                    setAdminCheckAttempt((attempt) => attempt + 1);
                  }
                }}
                className="min-h-11 shrink-0 rounded-lg border border-amber-200/30 px-4 text-sm font-semibold hover:bg-amber-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                Retry connection
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

    </div>
  );
}
