"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/app/landing/page";
import { motion } from "framer-motion";
import { Flame, Sparkles, ArrowRight } from "lucide-react";

/* ━━━━━ FAST, SLEEK KINETIC LAUNCHER ━━━━━ */
function FastLoader() {
  const router = useRouter();
  const [progress, setProgress] = useState(15);
  const [stage, setStage] = useState("Syncing habits...");

  const launchDashboard = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStage("Calculating streaks...");
    }, 250);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStage("Preparing workspace...");
    }, 550);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStage("Ready!");
    }, 850);

    const timer4 = setTimeout(() => {
      launchDashboard();
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [launchDashboard]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0B0F] text-white relative overflow-hidden select-none px-4">
      {/* Amethyst & Gold Ambient Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
      >
        {/* Emblem Logo */}
        <div className="relative mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[2px] shadow-2xl shadow-violet-500/25">
            <div className="w-full h-full bg-[#0B0B0F] rounded-2xl flex items-center justify-center">
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-[#7C3AED] fill-[#EAB308]" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#EAB308] animate-ping" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 font-heading">
          Habit<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Flow</span>
        </h1>
        <p className="text-[#9090A0] text-xs sm:text-sm font-medium mb-6">
          Daily discipline · High performance tracking
        </p>

        {/* Progress Bar Container */}
        <div className="w-full space-y-3">
          <div className="h-2 w-full bg-[#121218] rounded-full overflow-hidden p-[1px] border border-[#272732]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EAB308] relative"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#9090A0] px-1">
            <span className="text-[#9090A0] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#EAB308] animate-spin" />
              {stage}
            </span>
            <span className="text-[#EAB308] font-bold tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* Skip Action */}
        <button
          onClick={launchDashboard}
          className="mt-8 flex items-center gap-1.5 text-xs text-[#9090A0] hover:text-[#EAB308] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#121218]"
        >
          <span>Skip to dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
}

/* ━━━━━ MAIN AUTH GATEWAY ━━━━━ */
export default function AuthGatePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated user → show fast kinetic loader into dashboard
  if (user && user.emailVerified) {
    return <FastLoader />;
  }

  // Guest user → show redesigned landing page
  return <LandingPage />;
}