"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ArrowLeft, Bell, Moon, Sun, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function decodeApplicationServerKey(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);

  const [formData, setFormData] = useState({
    theme: 'dark',
    language: 'en',
    auto_save_enabled: true,
    reading_font_size: 16,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent('/settings')}`);
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('themePreference');
    if (savedTheme) setFormData((current) => ({ ...current, theme: savedTheme }));
  }, []);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushSupported(supported);
    if (!supported) return;

    navigator.serviceWorker.getRegistration().then(async (registration) => {
      if (!registration) return;
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    }).catch(() => setPushEnabled(false));
  }, []);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Settings page error:', error);
      router.push(`/login?redirect=${encodeURIComponent('/settings')}`);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      window.localStorage.setItem('themePreference', formData.theme);
      const darkMode = formData.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : formData.theme === 'dark';
      window.localStorage.setItem('darkMode', String(darkMode));
      document.documentElement.classList.toggle('dark', darkMode);
      document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
      window.dispatchEvent(new CustomEvent('app-theme-change', { detail: { darkMode } }));
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePushToggle = async () => {
    if (pushBusy || !pushSupported) return;
    setError('');
    setSuccess('');
    setPushBusy(true);

    try {
      if (pushEnabled) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          setPushEnabled(false);
          return;
        }
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          if (!response.ok) throw new Error('Could not turn off study reminders. Please try again.');
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        setSuccess('Study reminders turned off.');
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('Study reminders are not configured yet.');
      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked in your browser settings. Allow them for this site, then try again.');
      }

      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission was not granted.');

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(publicKey),
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error('Could not save your reminder preference. Please try again.');

      setPushEnabled(true);
      setSuccess('Study reminders enabled. You can turn them off here anytime.');
    } catch (err) {
      setError(err.message || 'Could not update notification settings.');
    } finally {
      setPushBusy(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950" aria-busy="true">
        <div role="status" aria-label="Loading settings">
          <span className="sr-only">Loading settings</span>
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white" aria-hidden="true" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Manage your preferences</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Moon size={18} />
                Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <label htmlFor="theme" className="text-white font-medium">Theme</label>
                    <p id="theme-description" className="text-sm text-slate-400">Choose your preferred theme</p>
                  </div>
                  <select
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    aria-describedby="theme-description"
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe size={18} />
                Language & Region
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <label htmlFor="language" className="text-white font-medium">Language</label>
                    <p id="language-description" className="text-sm text-slate-400">Select your language</p>
                  </div>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    aria-describedby="language-description"
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell size={18} />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Study reminders</p>
                    <p id="notifications-description" className="max-w-xl text-sm text-slate-400">
                      Get one browser notification after at least 24 hours away. Reminders are checked once a day, and you can turn them off anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePushToggle}
                    disabled={pushBusy || !pushSupported}
                    aria-describedby="notifications-description"
                    className="shrink-0 rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pushBusy ? 'Please wait…' : pushEnabled ? 'Turn off' : 'Turn on'}
                  </button>
                </div>
                {pushSupported === false && (
                  <p className="text-sm text-amber-300" role="status">
                    This browser does not support push notifications. Try a supported browser or install the site as an app on your device.
                  </p>
                )}
                {pushSupported && Notification.permission === 'denied' && (
                  <p className="text-sm text-amber-300" role="status">
                    Notifications are blocked for this site in your browser settings.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Reading</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <label htmlFor="auto-save-enabled" className="text-white font-medium">Auto Save Progress</label>
                    <p id="auto-save-description" className="text-sm text-slate-400">Automatically save your reading progress</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="auto-save-enabled"
                      type="checkbox"
                      checked={formData.auto_save_enabled}
                      onChange={(e) => setFormData({ ...formData, auto_save_enabled: e.target.checked })}
                      className="sr-only peer"
                      aria-describedby="auto-save-description"
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <label htmlFor="reading-font-size" className="text-white font-medium">Reading Font Size</label>
                    <p id="reading-font-size-description" className="text-sm text-slate-400">Adjust text size for reading passages</p>
                  </div>
                  <select
                    id="reading-font-size"
                    value={formData.reading_font_size}
                    onChange={(e) => setFormData({ ...formData, reading_font_size: parseInt(e.target.value) })}
                    aria-describedby="reading-font-size-description"
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="14">Small</option>
                    <option value="16">Medium</option>
                    <option value="18">Large</option>
                    <option value="20">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Settings size={18} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
