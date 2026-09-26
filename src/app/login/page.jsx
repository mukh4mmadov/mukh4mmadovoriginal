"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenText, Chrome, CheckCircle, Zap, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "@/components/shared/Toast";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const redirect = typeof window === "undefined"
    ? null
    : getSafeRedirectPath(new URLSearchParams(window.location.search).get("redirect"));

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (urlError) {
      setError(errorDescription || "Authentication failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = getSafeRedirectPath(urlParams.get("redirect"));
      if (redirect) {
        router.replace(redirect);
      } else {
        router.replace("/");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return null;
  }

  if (user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await signInWithGoogle();
    } catch (err) {
      setIsSubmitting(false);
      if (
        err.message?.includes("provider") ||
        err.message?.includes("disabled")
      ) {
        showToast("Google Sign-In is not available yet.", "error");
      } else {
        setError(err.message || "Google sign-in failed");
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #fff 1px, transparent 1px),
              linear-gradient(to bottom, #fff 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:gap-12 items-center">
            <div className="text-white space-y-8 lg:w-1/2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpenText className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold">IELTS Reading Pro</span>
              </div>

              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                <span className="lg:block">Master IELTS Reading</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Like a Pro
                </span>
              </h1>

              <p className="text-base lg:text-xl text-slate-300 leading-relaxed">
                Practice with authentic Cambridge passages, get AI-powered
                coaching, and track your progress to achieve your target band
                score.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Authentic Passages
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Real Cambridge IELTS reading tests
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      AI-Powered Coaching
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Get instant feedback and explanations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Progress Tracking
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Monitor your improvement over time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:w-1/2">
              <AuthCard
                error={error}
                isLoading={isSubmitting}
                redirect={redirect}
                onGoogleSignIn={handleGoogleSignIn}
              />
            </div>
          </div>
        </div>
      </div>

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

function AuthCard({ error, isLoading, redirect, onGoogleSignIn }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Sign in</h2>

        {error && (
          <div
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
