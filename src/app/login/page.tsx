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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Email and password are required"); return; }
    try {
      setLoading(true); setError(""); setInfo("");
      const result = await signInWithEmailAndPassword(auth, email, password);
      await result.user.reload();
      if (!auth.currentUser?.emailVerified) { setError("Please verify your email before logging in"); setLoading(false); return; }
      setSuccessAnimation(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err: any) { setError(err.message || "Login failed"); setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true); setError(""); setInfo("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!result.user.emailVerified) { setError("Google account email is not verified"); setLoading(false); return; }
      setSuccessAnimation(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) { setError(err.message || "Google login failed"); setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email to reset password"); return; }
    try {
      setError("");
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset link sent to your email ✓");
    } catch (err: any) { setError(err.message || "Failed to send reset email"); }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* ─── Left Panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-white rounded-full blur-3xl" style={{ animation: "orbFloat 10s ease-in-out infinite" }} />
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-pink-300 rounded-full blur-3xl" style={{ animation: "orbFloat 12s ease-in-out infinite 2s" }} />
          <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-indigo-300 rounded-full blur-3xl" style={{ animation: "orbFloat 8s ease-in-out infinite 4s" }} />
        </div>
        <div className="relative z-10 px-12 max-w-lg text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-4">HabitFlow</h1>
          <p className="text-white/70 text-lg leading-relaxed font-medium">Build better habits. Track your growth. Become your best self.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: "10+", label: "Charts" },
              { val: "12", label: "Badges" },
              { val: "∞", label: "Habits" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <div className="text-xl font-black text-white">{s.val}</div>
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative">
        {/* Success Overlay */}
        {successAnimation && (
          <div className="fixed inset-0 bg-emerald-500/10 backdrop-blur-sm z-50 flex items-center justify-center" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center" style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Welcome back!</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-black text-white">HabitFlow</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to continue your habit journey</p>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
              <span>✓</span> {info}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-bold text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18A10.97 10.97 0 001 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" /></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                onKeyDown={e => e.key === "Enter" && document.getElementById("pw")?.focus()}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input id="pw" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all pr-12"
                  onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot */}
          <div className="text-right mb-6">
            <button onClick={handleForgotPassword} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button onClick={handleEmailLogin} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
            ) : "Sign In"}
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Create one free →
            </Link>
          </p>

          {/* Back to landing */}
          <p className="text-center mt-4">
            <Link href="/landing" className="text-xs text-gray-600 hover:text-gray-400 font-semibold transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes orbFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -40px) scale(1.1); } }
      `}</style>
    </div>
  );
}