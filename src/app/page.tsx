"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ─── Particle blob component ─── */
function FloatingOrb({
  size,
  color,
  top,
  left,
  delay,
}: {
  size: number;
  color: string;
  top: string;
  left: string;
  delay: number;
}) {
  return (
    <div
      className="absolute rounded-full mix-blend-screen pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${size / 3}px)`,
        animation: `orbFloat ${8 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.6,
      }}
    />
  );
}

/* ─── Animated checklist item ─── */
function ChecklistItem({
  text,
  delay,
  checked,
}: {
  text: string;
  delay: number;
  checked: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 opacity-0"
      style={{
        animation: `slideUp 0.5s ease-out ${delay}s forwards`,
      }}
    >
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-500 ${checked
          ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30"
          : "border-2 border-white/20"
          }`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-sm font-medium transition-all duration-500 ${checked ? "text-white/90 line-through" : "text-white/50"
          }`}
      >
        {text}
      </span>
    </div>
  );
}

/* ─── Main Component ─── */
export default function AuthGatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () => [
      "Initializing secure connection",
      "Loading your workspace",
      "Syncing habit data",
      "Preparing dashboard",
    ],
    []
  );

  useEffect(() => {
    const duration = 3000;
    const intervalTime = 16;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const progressInterval = setInterval(() => {
      step++;
      const newProgress = Math.min((step / totalSteps) * 100, 100);
      setProgress(newProgress);

      // Update step text at 25%, 50%, 75%
      if (newProgress > 25 && newProgress < 50) setCurrentStep(1);
      else if (newProgress >= 50 && newProgress < 75) setCurrentStep(2);
      else if (newProgress >= 75) setCurrentStep(3);
    }, intervalTime);

    const timer = setTimeout(() => {
      if (loading) return;
      if (!user || !user.emailVerified) {
        router.replace("/landing");
        return;
      }
      router.replace("/dashboard");
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [user, loading, router]);

  // Fixed positions to avoid hydration mismatch (no Math.random)
  const orbs = [
    { size: 380, color: "rgba(99,102,241,0.4)", top: "5%", left: "10%", delay: 0 },
    { size: 320, color: "rgba(139,92,246,0.35)", top: "60%", left: "75%", delay: 1.5 },
    { size: 280, color: "rgba(236,72,153,0.3)", top: "25%", left: "55%", delay: 3 },
    { size: 350, color: "rgba(14,165,233,0.3)", top: "70%", left: "25%", delay: 4.5 },
    { size: 260, color: "rgba(20,184,166,0.25)", top: "15%", left: "85%", delay: 6 },
    { size: 300, color: "rgba(168,85,247,0.35)", top: "85%", left: "45%", delay: 7.5 },
  ];

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center overflow-hidden relative selection:bg-indigo-500/30">
      {/* ───── Dynamic Background ───── */}
      <div className="absolute inset-0 overflow-hidden">
        {orbs.map((orb, i) => (
          <FloatingOrb key={i} {...orb} />
        ))}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.6)_100%)]" />
      </div>

      {/* ───── Main Content ───── */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
        {/* Logo + Brand */}
        <div
          className="mb-12 flex flex-col items-center opacity-0"
          style={{ animation: "fadeUp 0.8s ease-out 0.2s forwards" }}
        >
          {/* Animated Logo */}
          <div className="relative mb-6">
            {/* Glow rings */}
            <div className="absolute inset-[-12px] rounded-[2rem] bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-xl animate-pulse" />
            <div className="absolute inset-[-6px] rounded-[1.75rem] bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-md" />

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
                  className="animate-draw"
                />
              </svg>

              {/* Sparkle effects */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-sparkle opacity-0" />
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-300 rounded-full animate-sparkle opacity-0"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 mb-3">
            HabitFlow
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-medium text-center max-w-xs">
            Build consistency. Track progress. Achieve greatness.
          </p>
        </div>

        {/* ───── Glass Card ───── */}
        <div
          className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-8 shadow-2xl opacity-0"
          style={{ animation: "fadeUp 0.8s ease-out 0.5s forwards" }}
        >
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Checklist animation */}
          <div className="space-y-4 mb-8">
            {steps.map((step, i) => (
              <ChecklistItem
                key={i}
                text={step}
                delay={0.8 + i * 0.4}
                checked={currentStep > i}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden backdrop-blur-sm border border-white/[0.05]">
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #06b6d4)",
                  backgroundSize: "200% 100%",
                  animation: "gradientMove 2s linear infinite",
                  transition: "width 50ms linear",
                }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                  {steps[currentStep] || "Ready"}
                </span>
              </div>
              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-8 flex items-center gap-2 text-gray-600 opacity-0"
          style={{ animation: "fadeUp 0.6s ease-out 1s forwards" }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            End-to-end encrypted
          </span>
        </div>
      </div>

      {/* ───── Animations ───── */}
      <style jsx>{`
        @keyframes orbFloat {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(40px, -60px) scale(1.1) rotate(90deg);
          }
          50% {
            transform: translate(-30px, 40px) scale(0.9) rotate(180deg);
          }
          75% {
            transform: translate(50px, 20px) scale(1.05) rotate(270deg);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes draw {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-draw {
          stroke-dasharray: 100;
          animation: draw 2s ease-out 0.5s forwards;
        }
      `}</style>
    </div>
  );
}