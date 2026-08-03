"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, BookOpenText, CheckCircle, Zap, Shield, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/shared/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, createGuestAccount, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Don't render anything while auth status is being determined
  // This prevents the flash of login UI for authenticated users
  if (authLoading) {
    return null;
  }

  // If user is already authenticated, redirect immediately without rendering
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.message?.includes('provider') || err.message?.includes('disabled')) {
        showToast('Google Sign-In is not available yet.', 'error');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    }
  };

  const handleGuestAccess = async () => {
    setIsSubmitting(true);
    try {
      await createGuestAccount();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create guest account');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Dark blue gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
        
        {/* Glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #fff 1px, transparent 1px),
              linear-gradient(to bottom, #fff 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Desktop: Split layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left side - Hero */}
            <div className="text-white space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpenText className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold">IELTS Reading Pro</span>
              </div>
              
              <h1 className="text-5xl font-bold leading-tight">
                Master IELTS Reading
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Like a Pro
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed">
                Practice with authentic Cambridge passages, get AI-powered coaching, and track your progress to achieve your target band score.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Authentic Passages</h3>
                    <p className="text-slate-400 text-sm">Real Cambridge IELTS reading tests</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI-Powered Coaching</h3>
                    <p className="text-slate-400 text-sm">Get instant feedback and explanations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Progress Tracking</h3>
                    <p className="text-slate-400 text-sm">Monitor your improvement over time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login card */}
            <div className="flex justify-center">
              <AuthCard
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                isLoading={isSubmitting}
                onSubmit={handleSubmit}
                onGoogleSignIn={handleGoogleSignIn}
                onGuestAccess={handleGuestAccess}
                isLogin={true}
              />
            </div>
          </div>

          {/* Mobile: Centered card */}
          <div className="lg:hidden flex justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BookOpenText className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">IELTS Reading Pro</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                <p className="text-slate-400">Sign in to continue your IELTS journey</p>
              </div>
              
              <AuthCard
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                isLoading={isSubmitting}
                onSubmit={handleSubmit}
                onGoogleSignIn={handleGoogleSignIn}
                onGuestAccess={handleGuestAccess}
                isLogin={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function AuthCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  isLoading,
  onSubmit,
  onGoogleSignIn,
  onGuestAccess,
  isLogin,
}: {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onGuestAccess: () => void;
  isLogin: boolean;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Sign in' : 'Create account'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
                aria-label="Email address"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                aria-label="Password"
                disabled={isLoading}
              />
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              onClick={onGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={onGuestAccess}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white/5 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link 
            href={isLogin ? "/signup" : "/login"} 
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
