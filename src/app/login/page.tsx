"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Flame, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setInfo("");
      const result = await signInWithEmailAndPassword(auth, email, password);
      await result.user.reload();
      if (!auth.currentUser?.emailVerified) {
        setError("Please verify your email before logging in. Check your inbox.");
        setLoading(false);
        return;
      }
      setSuccessAnimation(true);
      setTimeout(() => router.replace("/dashboard"), 900);
    } catch (err: any) {
      setError(err.message || "Login failed. Please verify credentials.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!result.user.emailVerified) {
        setError("Google account email is not verified");
        setLoading(false);
        return;
      }
      setSuccessAnimation(true);
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email address to receive password reset instructions");
      return;
    }
    try {
      setError("");
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setInfo("Password reset link has been dispatched to your email address ✓");
    } catch (err: any) {
      setError(err.message || "Failed to transmit password reset email");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex overflow-x-hidden selection:bg-violet-500/20">
      {/* Left Branding Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-[#0B0B0F] border-r border-[#272732]">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[2px] mx-auto mb-6 shadow-2xl shadow-violet-500/25">
            <div className="w-full h-full bg-[#0B0B0F] rounded-[22px] flex items-center justify-center">
              <Flame className="w-10 h-10 text-[#7C3AED] fill-[#EAB308]" />
            </div>
          </div>

          <h2 className="text-3xl font-black font-heading tracking-tight mb-3">
            Habit<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Flow</span>
          </h2>
          <p className="text-[#9090A0] text-sm leading-relaxed mb-8 font-medium">
            The precision habit architecture designed for long-term consistency, streak momentum, and compound personal growth.
          </p>

          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#272732]">
              <span className="text-lg font-black text-[#7C3AED]">01</span>
              <h4 className="text-xs font-bold text-white mt-1">Streaks</h4>
              <p className="text-[10px] text-[#9090A0]">Daily momentum</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#272732]">
              <span className="text-lg font-black text-[#EAB308]">60+</span>
              <h4 className="text-xs font-bold text-white mt-1">Badges</h4>
              <p className="text-[10px] text-[#9090A0]">Tiered rewards</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#272732]">
              <span className="text-lg font-black text-[#A855F7]">AI</span>
              <h4 className="text-xs font-bold text-white mt-1">Insights</h4>
              <p className="text-[10px] text-[#9090A0]">Pattern intelligence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {successAnimation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121218] rounded-3xl p-8 border border-[#272732] shadow-2xl text-center max-w-xs w-full">
              <div className="w-16 h-16 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black font-heading mb-1">Authenticated</h3>
              <p className="text-xs text-[#9090A0]">Entering your workspace...</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm">
          {/* Mobile Header Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[1.5px]">
              <div className="w-full h-full bg-[#0B0B0F] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#7C3AED] fill-[#EAB308]" />
              </div>
            </div>
            <span className="font-heading font-black text-lg tracking-tight">
              Habit<span className="text-[#EAB308]">Flow</span>
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-black font-heading tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[#9090A0] text-xs sm:text-sm mt-1">
              Sign in to resume tracking your habits and streaks
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="mb-4 p-3 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/30 text-yellow-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Password reset link sent to your email.</span>
            </div>
          )}

          {/* Google One-Tap */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#121218] hover:bg-[#1A1A22] border border-[#272732] text-stone-200 font-bold text-xs sm:text-sm transition-all active:scale-[0.99] disabled:opacity-50 mb-5 shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#272732]" />
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-[#272732]" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="w-full rounded-xl border border-[#272732] bg-[#121218] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[#EAB308] hover:underline font-semibold transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-[#272732] bg-[#121218] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#9090A0] mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#EAB308] hover:underline font-bold transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}