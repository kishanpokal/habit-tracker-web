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
import { Flame, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

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
    if (score <= 1) return { text: "Basic", color: "bg-[#71717A]", width: "20%" };
    if (score <= 2) return { text: "Fair", color: "bg-[#A855F7]", width: "40%" };
    if (score <= 3) return { text: "Good", color: "bg-[#7C3AED]", width: "60%" };
    if (score <= 4) return { text: "Strong", color: "bg-[#EAB308]", width: "80%" };
    return { text: "Unbreakable", color: "bg-[#FACC15]", width: "100%" };
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      setSuccessAnimation(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google registration failed");
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex overflow-x-hidden selection:bg-violet-500/20">
      {/* ━━━━━ LEFT PANEL (Desktop) ━━━━━ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-[#0B0B0F] border-r border-[#272732]">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[2px] mx-auto mb-6 shadow-2xl shadow-violet-500/25">
            <div className="w-full h-full bg-[#0B0B0F] rounded-[22px] flex items-center justify-center">
              <Flame className="w-10 h-10 text-[#7C3AED] fill-[#EAB308]" />
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-3 font-heading">
            Join Habit<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Flow</span>
          </h1>
          <p className="text-[#9090A0] text-sm leading-relaxed mb-8 font-medium">
            Create your space for daily discipline, thoughtful reflections, and habit mastery. Free forever.
          </p>

          <div className="space-y-2.5 text-left">
            {[
              "Real-time streak analytics & consistency index",
              "Interactive daily reflection journal with mood pulse tracking",
              "60+ unlockable achievement badges across 5 rarity tiers",
              "100% private and synchronized across all your devices",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-[#121218] border border-[#272732] text-xs font-semibold text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-[#EAB308] flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━━ RIGHT REGISTER FORM ━━━━━ */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 relative">
        {successAnimation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121218] rounded-3xl p-8 border border-[#272732] shadow-2xl text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-heading mb-1 text-white">Account Created!</h3>
              <p className="text-xs text-[#9090A0] mb-5 leading-relaxed">
                A verification link has been sent to your email. Please verify your email, then sign in.
              </p>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl font-black text-xs inline-block transition-transform hover:scale-105 shadow-lg shadow-violet-500/25"
              >
                Proceed to Sign In →
              </Link>
            </div>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[1.5px]">
              <div className="w-full h-full bg-[#0B0B0F] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#7C3AED] fill-[#EAB308]" />
              </div>
            </div>
            <span className="text-xl font-black font-heading">
              Habit<span className="text-[#EAB308]">Flow</span>
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-white">
              Create Account
            </h2>
            <p className="text-[#9090A0] text-xs sm:text-sm mt-1">
              Start your habit journey in less than 30 seconds
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#A855F7] text-xs font-semibold flex items-center gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#121218] hover:bg-[#1A1A22] border border-[#272732] text-slate-200 font-bold text-xs sm:text-sm transition-all active:scale-[0.99] disabled:opacity-50 mb-5 shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18A10.97 10.97 0 001 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#272732]" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">or email</span>
            <div className="flex-1 h-px bg-[#272732]" />
          </div>

          <div className="space-y-3.5 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-xl border border-[#272732] bg-[#121218] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all pl-9"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-[#272732] bg-[#121218] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all pl-9 pr-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#272732] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#9090A0]">{strength.text}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-[#272732] bg-[#121218] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-[#FACC15] mt-1 font-semibold">Passwords do not match</p>
              )}
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#9090A0] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#EAB308] hover:underline font-bold transition-colors">
              Sign in →
            </Link>
          </p>

          <p className="text-center mt-3">
            <Link href="/landing" className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors">
              ← Return to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}