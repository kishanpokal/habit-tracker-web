"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/app/landing/page";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { soundFX } from "@/lib/soundEffects";
import {
  Sparkles,
  Zap,
  Target,
  Crown,
  Rocket,
  Volume2,
  VolumeX,
  FastForward,
} from "lucide-react";

/* ━━━━━ DYNAMIC 3D IMPORT (SSR-safe) ━━━━━ */
const DynamicSplashCanvas = dynamic(
  () => import("./SplashScene").then((m) => m.SplashCanvas),
  { ssr: false }
);

/* ━━━━━ 5 SLEEK STEP PHASES (Minimal Text, Maximum Animation) ━━━━━ */
const ANIMATION_STAGES = [
  {
    step: 1,
    phase: "01 • SPARK",
    icon: Sparkles,
    color: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.45)",
  },
  {
    step: 2,
    phase: "02 • MOMENTUM",
    icon: Zap,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.45)",
  },
  {
    step: 3,
    phase: "03 • CONSISTENCY",
    icon: Target,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.45)",
  },
  {
    step: 4,
    phase: "04 • MASTERY",
    icon: Crown,
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.45)",
  },
  {
    step: 5,
    phase: "05 • LAUNCH",
    icon: Rocket,
    color: "#ec4899",
    glow: "rgba(236, 72, 153, 0.55)",
  },
];

/* ━━━━━ HIGH-TECH LOADING SCREEN ━━━━━ */
function LoadingScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWarpingOut, setIsWarpingOut] = useState(false);

  const progressRef = useRef(0);
  const stepRef = useRef(1);
  const lastChimedStep = useRef(0);
  const isNavigating = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trigger hyperspace exit into /dashboard
  const triggerDashboardLaunch = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    soundFX.playHyperspaceWarp();
    setIsWarpingOut(true);
    setProgress(100);
    setCurrentStep(5);

    setTimeout(() => {
      router.replace("/dashboard");
    }, 850);
  }, [router]);

  // Main 5-step animation timer (~6 seconds total)
  useEffect(() => {
    const duration = 6000;
    const intervalTime = 16;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const progressInterval = setInterval(() => {
      step++;
      const rawProgress = Math.min((step / totalSteps) * 100, 100);
      setProgress(rawProgress);

      // Determine the active step (1 to 5)
      let active = 1;
      if (rawProgress >= 80) active = 5;
      else if (rawProgress >= 60) active = 4;
      else if (rawProgress >= 40) active = 3;
      else if (rawProgress >= 20) active = 2;
      else active = 1;

      setCurrentStep(active);

      // Play audio chime on step milestone
      if (active !== lastChimedStep.current) {
        lastChimedStep.current = active;
        soundFX.playStepChime(active - 1);
      }

      if (rawProgress >= 100) {
        clearInterval(progressInterval);
        triggerDashboardLaunch();
      }
    }, intervalTime);

    return () => clearInterval(progressInterval);
  }, [triggerDashboardLaunch]);

  // Keyboard shortcut: Press SPACE or ENTER to launch immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        triggerDashboardLaunch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerDashboardLaunch]);

  const toggleSound = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFX.playClick();
  };

  const activeStage = ANIMATION_STAGES[currentStep - 1] || ANIMATION_STAGES[0];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden relative select-none"
      style={{
        background: "#02040a",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* ─── Google Fonts ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ─── Keyframe Animations ─── */}
      <style>{`
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes laserScan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes cyberShimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .spin-slow { animation: spinSlow 14s linear infinite; }
        .spin-reverse { animation: spinReverse 9s linear infinite; }
        .laser-sweep { animation: laserScan 2.5s ease-in-out infinite; }
        .cyber-shimmer { animation: cyberShimmer 2s infinite ease-in-out; }
      `}</style>

      {/* ━━━━━ 1. THREE.JS 3D QUANTUM WEBGL CANVAS ━━━━━ */}
      <Suspense fallback={<div className="fixed inset-0 bg-[#02040a]" />}>
        <DynamicSplashCanvas
          progressRef={progressRef}
          stepRef={stepRef}
          isMobile={isMobile}
        />
      </Suspense>

      {/* ━━━━━ 2. SUBTLE COSMIC GRID OVERLAY ━━━━━ */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "gridScroll 22s linear infinite",
        }}
      />

      {/* Radial Vignette Mask */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2,4,10,0.05) 0%, rgba(2,4,10,0.85) 100%)",
        }}
      />

      {/* ━━━━━ 3. TOP MINIMAL HEADER BAR ━━━━━ */}
      <header className="fixed top-0 left-0 right-0 z-20 px-5 sm:px-8 py-5 flex items-center justify-between pointer-events-auto">
        {/* Left: Live Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span
            className="text-[11px] font-bold tracking-widest text-cyan-300 uppercase"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            HabitFlow Loading
          </span>
        </motion.div>

        {/* Right: Sound Control & Skip Action */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white transition-all text-xs backdrop-blur-md group"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            )}
            <span className="hidden sm:inline text-[11px] font-medium">
              {isMuted ? "Muted" : "Sound On"}
            </span>
          </button>

          {/* Instant Launch (Skip) */}
          <button
            onClick={() => {
              soundFX.playClick();
              triggerDashboardLaunch();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 border border-cyan-500/30 text-white text-xs font-semibold tracking-wider transition-all backdrop-blur-md shadow-lg shadow-cyan-500/10 hover:scale-105 active:scale-95 group"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Launch [Space]</span>
          </button>
        </motion.div>
      </header>

      {/* ━━━━━ 4. CENTER MINIMALIST HERO (Animation Hero) ━━━━━ */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none px-4 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center w-full"
        >
          {/* Floating Emblem Box */}
          <div className="relative mb-5 flex items-center justify-center">
            {/* Outer Rotating Halo */}
            <div
              className="absolute -inset-6 rounded-full border border-dashed border-cyan-500/30 spin-slow pointer-events-none"
              style={{ width: "calc(100% + 48px)", height: "calc(100% + 48px)" }}
            />
            {/* Counter-rotating Segment Ring */}
            <div
              className="absolute -inset-3 rounded-full border-t-2 border-r-2 border-pink-500/40 spin-reverse pointer-events-none"
              style={{ width: "calc(100% + 24px)", height: "calc(100% + 24px)" }}
            />

            {/* Glowing Aura Reactor */}
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl transition-all duration-700"
              style={{ background: activeStage.glow }}
            />

            {/* Corner Sci-Fi Brackets */}
            <div className="absolute -top-2.5 -left-2.5 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute -top-2.5 -right-2.5 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute -bottom-2.5 -left-2.5 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute -bottom-2.5 -right-2.5 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

            {/* Emblem Core */}
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-900/90 via-black/80 to-gray-950/90 flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-xl overflow-hidden"
              style={{
                boxShadow: `0 0 35px ${activeStage.glow}, inset 0 0 20px rgba(255,255,255,0.05)`,
              }}
            >
              {/* Laser Scanning Line */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent h-10 w-full laser-sweep pointer-events-none" />

              {/* Dynamic Step Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <activeStage.icon
                    className="w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                    style={{ color: activeStage.color }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* HabitFlow Title */}
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
            style={{
              fontFamily: "Outfit, sans-serif",
              background: "linear-gradient(135deg, #ffffff 40%, #cbd5e1 75%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HabitFlow
          </h1>

          {/* Minimal Kinetic Phase Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.phase}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md mb-8 shadow-lg"
            >
              <div
                className="w-2 h-2 rounded-full animate-ping"
                style={{ background: activeStage.color }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  color: activeStage.color,
                }}
              >
                {activeStage.phase}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* ━━━━━ 5-STAGE PROGRESSION DOCK (Ultra-Clean) ━━━━━ */}
          <div className="w-full max-w-sm px-2 flex flex-col items-center gap-3">
            {/* 5 Milestone Step Pills */}
            <div className="flex items-center justify-between w-full px-1">
              {ANIMATION_STAGES.map((s) => {
                const isCompleted = currentStep > s.step || progress >= 100;
                const isCurrent = currentStep === s.step && progress < 100;

                return (
                  <div key={s.step} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/40"
                          : isCurrent
                          ? "bg-white text-black font-extrabold scale-110 shadow-lg"
                          : "bg-white/[0.08] text-gray-500 border border-white/[0.08]"
                      }`}
                      style={{
                        boxShadow: isCurrent ? `0 0 16px ${s.color}` : undefined,
                      }}
                    >
                      {isCompleted ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        `0${s.step}`
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Glowing Neon Progress Bar */}
            <div className="relative h-2 w-full rounded-full bg-white/[0.08] border border-white/[0.1] overflow-hidden p-[1px]">
              <div
                className="h-full rounded-full transition-all duration-75 relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #22d3ee, #10b981, #f59e0b, #a855f7, #ec4899)",
                  boxShadow: `0 0 16px ${activeStage.color}`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent cyber-shimmer" />
              </div>
            </div>

            {/* Percentage Readout */}
            <div className="flex items-center justify-between w-full text-xs font-semibold px-1 text-gray-400">
              <span className="text-[11px] tracking-wider uppercase text-gray-500">Loading Workspace</span>
              <span
                className="tabular-nums font-bold text-sm"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  color: activeStage.color,
                }}
              >
                {Math.min(Math.round(progress), 100)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ━━━━━ 5. FULLSCREEN CINEMATIC EXIT FLASH ━━━━━ */}
      <AnimatePresence>
        {isWarpingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center px-4 text-center"
            style={{
              background:
                "radial-gradient(circle at center, rgba(15,23,42,0.92) 0%, rgba(2,4,10,0.98) 100%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50 mb-4 animate-bounce">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h2
                className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Ready To Achieve Greatness
              </h2>
              <p
                className="text-cyan-400 text-sm font-medium tracking-wide"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                Opening your dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ━━━━━ MAIN AUTH GATE ━━━━━ */
export default function AuthGatePage() {
  const { user, loading } = useAuth();

  // While auth is loading, show a minimal dark screen to avoid flash
  if (loading) {
    return <div className="min-h-screen bg-[#02040a]" />;
  }

  // Authenticated + verified → show 5-step 3D loading animation then redirect to dashboard
  if (user && user.emailVerified) {
    return <LoadingScreen />;
  }

  // Not authenticated (first-time visitor) → show landing page directly
  return <LandingPage />;
}