"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/app/landing/page";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

/* ━━━━━ DYNAMIC 3D IMPORT (SSR-safe) ━━━━━ */
const DynamicSplashCanvas = dynamic(
  () => import("./SplashScene").then((m) => m.SplashCanvas),
  { ssr: false }
);

/* ━━━━━ LOADING SCREEN (for authenticated users) ━━━━━ */
function LoadingScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  /* ─── Refs for 3D scene (avoids re-renders) ─── */
  const progressRef = useRef(0);
  const stepRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const steps = useMemo(
    () => [
      "Initializing secure connection",
      "Loading your workspace",
      "Syncing habit data",
      "Preparing dashboard",
    ],
    []
  );

  /* ─── ORIGINAL AUTH/TIMER LOGIC (unchanged) ─── */
  useEffect(() => {
    const duration = 12000;
    const intervalTime = 16;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const progressInterval = setInterval(() => {
      step++;
      const newProgress = Math.min((step / totalSteps) * 100, 100);
      setProgress(newProgress);

      if (newProgress > 25 && newProgress < 50) setCurrentStep(1);
      else if (newProgress >= 50 && newProgress < 75) setCurrentStep(2);
      else if (newProgress >= 75) setCurrentStep(3);
    }, intervalTime);

    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative selection:bg-indigo-500/30"
      style={{ background: "#030712", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* ─── Google Fonts ─── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* ─── CSS Animations ─── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.7); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes orbFloat { 0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); } 25% { transform: translate(40px, -60px) scale(1.1) rotate(90deg); } 50% { transform: translate(-30px, 40px) scale(0.9) rotate(180deg); } 75% { transform: translate(50px, 20px) scale(1.05) rotate(270deg); } }
        .logo-ring-spin { animation: spin 8s linear infinite; }
        .logo-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .shimmer-pass { animation: shimmer 1.5s ease-in-out infinite; }
      `}</style>

      {/* ━━━━━ 3D BACKGROUND ━━━━━ */}
      <Suspense
        fallback={<div className="fixed inset-0 bg-[#030712]" />}
      >
        <DynamicSplashCanvas
          progressRef={progressRef}
          stepRef={stepRef}
          isMobile={isMobile}
        />
      </Suspense>

      {/* ━━━━━ DARK OVERLAY for text readability ━━━━━ */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(3,7,18,0.35) 0%, rgba(3,7,18,0.65) 100%)",
          zIndex: 1,
        }}
      />

      {/* ━━━━━ CENTERED LOGO ━━━━━ */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            {/* Rotating outer ring */}
            <div
              className="absolute inset-[-18px] rounded-full border-t-2 border-indigo-400/60 logo-ring-spin"
              style={{ width: "calc(100% + 36px)", height: "calc(100% + 36px)" }}
            />
            {/* Pulsing glow ring */}
            <div className="absolute inset-[-10px] rounded-[2rem] logo-glow" />
            {/* Glow blurs */}
            <div className="absolute inset-[-14px] rounded-[2rem] bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-xl animate-pulse" />
            <div className="absolute inset-[-7px] rounded-[1.75rem] bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-md" />
            {/* Logo box */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <div className="absolute inset-0.5 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
              <svg
                className="w-12 h-12 text-white relative z-10 drop-shadow-lg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-0"
                style={{ animation: "orbFloat 3s ease-in-out infinite" }}
              />
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-300 rounded-full opacity-0"
                style={{ animation: "orbFloat 4s ease-in-out 1s infinite" }}
              />
            </div>
          </div>

          <h1
            className="text-[52px] sm:text-6xl font-black tracking-tight mb-2"
            style={{
              fontFamily: "Outfit, sans-serif",
              background: "linear-gradient(135deg, #ffffff, #e2e8f0, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HabitFlow
          </h1>
          <p
            className="text-gray-400 text-base sm:text-lg font-medium text-center max-w-xs"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Build consistency. Track progress. Achieve greatness.
          </p>
        </motion.div>
      </div>

      {/* ━━━━━ BOTTOM-RIGHT GLASS CARD ━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 40, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="fixed bottom-6 right-6 z-10 w-[340px] sm:w-[380px] rounded-2xl p-5 sm:p-6 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Top edge gradient line */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Checklist items */}
        <div className="space-y-3 mb-5">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
              className="flex items-center gap-2.5"
            >
              <div className="relative flex-shrink-0">
                <AnimatePresence mode="wait">
                  {currentStep > i ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #22c55e)",
                        boxShadow: "0 0 12px rgba(16,185,129,0.4)",
                      }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      className="w-5 h-5 rounded-md border-2 border-white/20"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span
                className={`text-xs font-medium transition-all duration-500 ${currentStep > i
                  ? "text-white/90 line-through"
                  : "text-white/50"
                  }`}
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {step}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div
            className="h-2.5 w-full rounded-full overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #6366f1, #a855f7, #22d3ee, #ec4899)",
                backgroundSize: "300% 100%",
                animation: "gradientShift 3s linear infinite",
                transition: "width 50ms linear",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer-pass" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  {steps[currentStep] || "Ready"}
                </motion.span>
              </AnimatePresence>
            </div>
            <span
              className="text-xs font-black tabular-nums"
              style={{
                fontFamily: "Outfit, sans-serif",
                background: "linear-gradient(135deg, #818cf8, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── BOTTOM-LEFT FOOTER ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="fixed bottom-6 left-6 z-10 flex items-center gap-2 text-gray-600"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          End-to-end encrypted
        </span>
      </motion.div>
    </div>
  );
}

/* ━━━━━ MAIN AUTH GATE (logic preserved exactly) ━━━━━ */
export default function AuthGatePage() {
  const { user, loading } = useAuth();

  // While auth is loading, show a minimal dark screen to avoid flash
  if (loading) {
    return <div className="min-h-screen bg-[#030712]" />;
  }

  // Authenticated + verified → show 3D loading animation then redirect to dashboard
  if (user && user.emailVerified) {
    return <LoadingScreen />;
  }

  // Not authenticated (first-time visitor) → show landing page directly
  return <LandingPage />;
}