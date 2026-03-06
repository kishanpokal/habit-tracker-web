"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return { text: "", color: "", width: "0%" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { text: "Weak", color: "bg-red-500", width: "20%" };
    if (score <= 2) return { text: "Fair", color: "bg-orange-500", width: "40%" };
    if (score <= 3) return { text: "Good", color: "bg-amber-500", width: "60%" };
    if (score <= 4) return { text: "Strong", color: "bg-emerald-500", width: "80%" };
    return { text: "Very Strong", color: "bg-emerald-400", width: "100%" };
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    try {
      setLoading(true); setError("");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      setSuccessAnimation(true);
    } catch (err: any) { setError(err.message || "Registration failed"); setLoading(false); }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true); setError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) { setError(err.message || "Google sign up failed"); setLoading(false); }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* ─── Left Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] right-[15%] w-72 h-72 bg-white rounded-full blur-3xl" style={{ animation: "orbFloat 10s ease-in-out infinite" }} />
          <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-cyan-300 rounded-full blur-3xl" style={{ animation: "orbFloat 12s ease-in-out infinite 2s" }} />
        </div>
        <div className="relative z-10 px-12 max-w-lg text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Join HabitFlow</h1>
          <p className="text-white/70 text-lg leading-relaxed font-medium">Start your journey to building better habits. Free forever.</p>
          <div className="mt-10 space-y-3 text-left">
            {[
              "📊 Advanced analytics with 10+ chart types",
              "🏆 Gamification with 12 achievement badges",
              "🌙 Beautiful dark & light themes",
              "📱 Works on all devices as a PWA",
            ].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <span className="text-sm font-medium text-white">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative">
        {/* Success */}
        {successAnimation && (
          <div className="fixed inset-0 bg-emerald-500/10 backdrop-blur-sm z-50 flex items-center justify-center" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4" style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Account Created!</h3>
              <p className="text-sm text-gray-500">Check your email for verification, then log in.</p>
              <Link href="/login" className="inline-block mt-4 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
                Go to Login →
              </Link>
            </div>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-black text-white">HabitFlow</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Create your account</h2>
          <p className="text-gray-400 text-sm mb-8">Free forever. No credit card needed.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogleSignUp} disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-bold text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18A10.97 10.97 0 001 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" /></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className="w-full rounded-xl border-2 border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} rounded-full transition-all duration-500`} style={{ width: strength.width }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{strength.text}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1.5 block">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-xl border-2 border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                onKeyDown={e => e.key === "Enter" && handleRegister()}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1 font-semibold">Passwords don&apos;t match</p>
              )}
            </div>
          </div>

          <button onClick={handleRegister} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
            ) : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Sign in →
            </Link>
          </p>
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