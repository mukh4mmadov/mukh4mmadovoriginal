"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenText, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { signInWithGoogle, createGuestAccount } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  const handleGuestAccess = async () => {
    try {
      await createGuestAccount();
      router.push('/');
    } catch (err) {
      console.error('Guest access failed:', err);
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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpenText className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">IELTS Reading Pro</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Email authentication disabled</h1>
            <p className="text-slate-400">Please use Google sign-in or continue as guest</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-3"
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>

              <button
                onClick={handleGuestAccess}
                className="w-full py-3 px-4 bg-white/5 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
              >
                Continue as Guest
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}