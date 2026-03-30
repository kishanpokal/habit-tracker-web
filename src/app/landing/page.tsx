"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";

/* ━━━━━ DYNAMIC 3D IMPORTS (SSR-safe) ━━━━━ */
const DynamicHeroCanvas = dynamic(
  () => import("./ThreeScenes").then((m) => m.HeroCanvas),
  { ssr: false }
);
const DynamicMiniCanvas = dynamic(
  () => import("./ThreeScenes").then((m) => m.MiniCanvas),
  { ssr: false }
);
const DynamicCtaCanvas = dynamic(
  () => import("./ThreeScenes").then((m) => m.CtaCanvas),
  { ssr: false }
);

/* ━━━━━ CONSTANTS ━━━━━ */
const FEATURES = [
  {
    key: "analytics",
    icon: "📊",
    title: "Smart Analytics",
    desc: "Deep insights with 10+ chart types, consistency scores, and AI-powered recommendations.",
  },
  {
    key: "streak",
    icon: "🔥",
    title: "Streak Tracking",
    desc: "Track your daily streaks, personal bests, and momentum to stay motivated.",
  },
  {
    key: "categories",
    icon: "🏷️",
    title: "Categories & Tags",
    desc: "Organize habits into Health, Fitness, Productivity, Learning, and more.",
  },
  {
    key: "pwa",
    icon: "📱",
    title: "Works Everywhere",
    desc: "Fully responsive PWA that works on desktop, tablet, and mobile. Install it like a native app.",
  },
  {
    key: "darkmode",
    icon: "🌙",
    title: "Dark Mode",
    desc: "Beautiful dark and light themes with one-click toggle. Easy on the eyes, day or night.",
  },
  {
    key: "export",
    icon: "📤",
    title: "Export Data",
    desc: "Export your habit data as CSV or PDF for reporting, analysis, or portfolio projects.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create Habits",
    desc: "Define your habits with custom colors, categories, and target days per week.",
    animType: "check" as const,
  },
  {
    num: "02",
    title: "Track Daily",
    desc: "Check off habits each day. Build streaks and watch your consistency grow.",
    animType: "bars" as const,
  },
  {
    num: "03",
    title: "Analyze & Grow",
    desc: "Dive into advanced analytics to understand your patterns and optimize.",
    animType: "wave" as const,
  },
];

const STATS = [
  { end: 28, suffix: "", label: "Templates" },
  { end: 50, suffix: "", label: "Badges" },
  { end: 10, suffix: "+", label: "Charts" },
  { end: 0, suffix: "∞", label: "Streaks", isInfinity: true },
];

/* ━━━━━ ANIMATED COUNTER ━━━━━ */
function AnimatedStat({
  end,
  label,
  suffix,
  isInfinity,
}: {
  end: number;
  label: string;
  suffix?: string;
  isInfinity?: boolean;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInViewport = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInViewport || isInfinity) return;
    let frame = 0;
    const frames = 60;
    const interval = setInterval(() => {
      frame++;
      setVal(Math.round((frame / frames) * end));
      if (frame >= frames) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [end, isInViewport, isInfinity]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-4xl sm:text-5xl lg:text-6xl font-black mb-2"
        style={{
          fontFamily: "Outfit, sans-serif",
          background: "linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {isInfinity ? "∞" : `${val}${suffix || ""}`}
      </div>
      <div className="text-xs sm:text-sm text-white/50 font-bold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

/* ━━━━━ HERO STAT ROW ━━━━━ */
function HeroStat({ end, label, suffix }: { end: number; label: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const frames = 60;
    const interval = setInterval(() => {
      frame++;
      setVal(Math.round((frame / frames) * end));
      if (frame >= frames) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [end]);

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
        {val}
        {suffix}
      </div>
      <div className="text-xs text-white/50 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* ━━━━━ STEP SVG ANIMATIONS ━━━━━ */
function CheckSvg({ inView }: { inView: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="#22d3ee"
        strokeWidth="2"
        fill="none"
        opacity={0.3}
      />
      <path
        d="M14 24L22 32L34 16"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: inView ? 0 : 40,
          transition: "stroke-dashoffset 1s ease-out 0.5s",
        }}
      />
    </svg>
  );
}

function BarsSvg({ inView }: { inView: boolean }) {
  const heights = [12, 24, 18, 32, 28];
  return (
    <svg width="80" height="48" viewBox="0 0 80 48" fill="none">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={4 + i * 16}
          y={48 - h}
          width="10"
          height={h}
          rx="2"
          fill={i % 2 === 0 ? "#6366f1" : "#a855f7"}
          style={{
            transform: inView ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "bottom",
            transition: `transform 0.6s ease-out ${0.3 + i * 0.1}s`,
          }}
        />
      ))}
    </svg>
  );
}

function WaveSvg({ inView }: { inView: boolean }) {
  return (
    <svg width="120" height="48" viewBox="0 0 120 48" fill="none">
      <path
        d="M0 24 C10 10, 20 38, 30 24 C40 10, 50 38, 60 24 C70 10, 80 38, 90 24 C100 10, 110 38, 120 24"
        stroke="#22d3ee"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: inView ? 0 : 200,
          transition: "stroke-dashoffset 1.5s ease-out 0.3s",
        }}
      />
    </svg>
  );
}

/* ━━━━━ TIMELINE STEP CARD ━━━━━ */
function TimelineCard({
  step,
  index,
}: {
  step: (typeof STEPS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative flex items-center w-full ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      } flex-col md:gap-12 gap-6`}
    >
      {/* connector dot */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:block z-10">
        <div
          className="w-4 h-4 rounded-full"
          style={{
            background: "#22d3ee",
            boxShadow: "0 0 16px #22d3ee, 0 0 32px rgba(34,211,238,0.3)",
            animation: "pulseGlow 2s infinite",
          }}
        />
      </div>

      {/* spacer for layout */}
      <div className="hidden md:block md:w-1/2" />

      {/* card */}
      <motion.div
        className="md:w-1/2 w-full"
        initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div
          className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="text-5xl font-black mb-3"
            style={{
              fontFamily: "Outfit, sans-serif",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {step.num}
          </div>
          <h3
            className="text-xl sm:text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {step.title}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
            {step.desc}
          </p>
          <div className="flex items-center">
            {step.animType === "check" && <CheckSvg inView={inView} />}
            {step.animType === "bars" && <BarsSvg inView={inView} />}
            {step.animType === "wave" && <WaveSvg inView={inView} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ━━━━━ FEATURE CARD ━━━━━ */
function FeatureCard({
  feature,
  index,
  isMobile,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
  isMobile: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="group relative rounded-2xl p-6 border border-white/[0.08] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2"
      style={{
        background: "rgba(255,255,255,0.04)",
        perspective: "1000px",
      }}
      whileHover={{
        boxShadow: "0 0 30px rgba(99,102,241,0.3)",
        borderColor: "rgba(255,255,255,0.2)",
      }}
    >
      {/* Mini 3D Canvas */}
      {!isMobile && (
        <div className="mb-4 rounded-xl overflow-hidden bg-white/[0.02]">
          <Suspense
            fallback={
              <div className="w-full h-[80px] bg-white/[0.02] rounded-xl" />
            }
          >
            <DynamicMiniCanvas shapeKey={feature.key} />
          </Suspense>
        </div>
      )}

      {/* mobile fallback icon */}
      {isMobile && (
        <div className="text-3xl mb-4">{feature.icon}</div>
      )}

      <h3
        className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {feature.title}
      </h3>
      <p
        className="text-sm text-gray-400 leading-relaxed"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {feature.desc}
      </p>
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN LANDING PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"],
  });
  const timelineScale = useTransform(timelineProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navBlur = scrollY > 50;

  return (
    <div
      className="min-h-screen text-white overflow-hidden"
      style={{ background: "#020408", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* ─── Google Fonts ─── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* ─── Global Animations ─── */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -60px) scale(1.1); }
          50% { transform: translate(-30px, 40px) scale(0.9); }
          75% { transform: translate(50px, 20px) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px #22d3ee, 0 0 16px rgba(34,211,238,0.3); }
          50% { box-shadow: 0 0 20px #22d3ee, 0 0 40px rgba(34,211,238,0.5); }
        }
      `}</style>

      {/* ━━━━━ NAV ━━━━━ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
        style={{
          background: navBlur
            ? "rgba(2,4,8,0.85)"
            : "rgba(2,4,8,0.7)",
          backdropFilter: navBlur ? "blur(24px)" : "blur(16px)",
          borderColor: "rgba(255,255,255,0.06)",
          boxShadow: navBlur ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span
              className="text-lg font-black"
              style={{
                fontFamily: "Outfit, sans-serif",
                background: "linear-gradient(135deg, #818cf8, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HabitFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(99,102,241,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
              }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━ SECTION 1: HERO ━━━━━ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Canvas Background */}
        <Suspense
          fallback={
            <div
              className="absolute inset-0"
              style={{ background: "#020408" }}
            />
          }
        >
          <DynamicHeroCanvas isMobile={isMobile} />
        </Suspense>

        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(2,4,8,0.3) 0%, rgba(2,4,8,0.7) 70%, rgba(2,4,8,0.9) 100%)",
          }}
        />

        {/* Hero Text Overlay */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-xs sm:text-sm font-bold text-indigo-300 mb-8"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: "#4ade80",
                animation: "pulseGlow 2s infinite",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            ✦ 100% Free — No credit card required
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            <span className="text-[#f1f5f9]">Build Habits That</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% 200%",
                animation: "gradientShift 4s ease infinite",
              }}
            >
              Actually Stick
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-gray-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            The most powerful habit tracking app. Build consistency with
            advanced analytics, streak tracking, and beautiful data
            visualizations — all in a stunning interface.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link
              href="/register"
              className="px-8 py-4 text-white text-base font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95 w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                boxShadow: "0 8px 40px rgba(99,102,241,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 50px rgba(99,102,241,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(99,102,241,0.4)";
              }}
            >
              Start Tracking Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-white text-base font-bold rounded-2xl hover:bg-white/[0.1] transition-all w-full sm:w-auto"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              Sign In
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            <HeroStat end={10} suffix="+" label="Chart Types" />
            <HeroStat end={50} suffix="" label="Badges" />
            <HeroStat end={100} suffix="%" label="Free" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ━━━━━ SECTION 2: FEATURES ━━━━━ */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-[#f1f5f9]"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Everything You Need
          </h2>
          <p
            className="text-gray-400 text-sm sm:text-base max-w-md mx-auto"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Powerful features designed to help you build lasting habits and
            achieve your goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.key} feature={f} index={i} isMobile={isMobile} />
          ))}
        </div>
      </section>

      {/* ━━━━━ SECTION 3: TIMELINE ━━━━━ */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-20 sm:py-32">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-20 text-[#f1f5f9]"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Simple 3-Step Process
        </motion.h2>

        <div ref={timelineRef} className="relative">
          {/* Center vertical line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px]">
            <motion.div
              className="w-full h-full origin-top"
              style={{
                scaleY: timelineScale,
                background: "linear-gradient(to bottom, #6366f1, #22d3ee)",
              }}
            />
          </div>

          <div className="space-y-16 md:space-y-24">
            {STEPS.map((step, i) => (
              <TimelineCard key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ SECTION 4: STATS BAND ━━━━━ */}
      <section
        className="relative py-16 sm:py-24"
        style={{
          borderTop: "1px solid rgba(99,102,241,0.2)",
          borderBottom: "1px solid rgba(99,102,241,0.2)",
          background:
            "linear-gradient(to right, rgba(99,102,241,0.03), rgba(168,85,247,0.03), rgba(99,102,241,0.03))",
        }}
      >
        {/* subtle glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
            style={{
              background: "linear-gradient(to right, transparent, #6366f1, transparent)",
              boxShadow: "0 0 30px rgba(99,102,241,0.5)",
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
            style={{
              background: "linear-gradient(to right, transparent, #22d3ee, transparent)",
              boxShadow: "0 0 30px rgba(34,211,238,0.3)",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="relative">
              <AnimatedStat {...s} />
              {i < STATS.length - 1 && (
                <div
                  className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.4), transparent)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━ SECTION 5: CTA ━━━━━ */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-20 sm:py-32">
        <div
          className="relative rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center"
          style={{
            border: "1px solid rgba(99,102,241,0.3)",
            boxShadow: "0 0 60px rgba(99,102,241,0.15), inset 0 0 60px rgba(99,102,241,0.05)",
          }}
        >
          {/* 3D Background */}
          <Suspense
            fallback={
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                }}
              />
            }
          >
            <DynamicCtaCanvas />
          </Suspense>

          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(2,4,8,0.5) 0%, rgba(2,4,8,0.8) 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center px-8 py-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-[#f1f5f9]"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Ready to Transform Your Life?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-8"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Join HabitFlow today and start building the habits that matter
              most to you. It&apos;s completely free.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href="/register"
                className="inline-flex px-8 py-4 bg-white text-gray-900 text-base font-black rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
                style={{
                  boxShadow: "0 8px 40px rgba(255,255,255,0.15)",
                }}
              >
                Get Started Now →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer
        className="py-8 px-4 sm:px-6 lg:px-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span
              className="text-sm font-black text-gray-400"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              HabitFlow
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* GitHub icon */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            {/* Twitter/X icon */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          <p className="text-xs text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
            © {new Date().getFullYear()} HabitFlow. Built with Next.js, Firebase & Three.js
          </p>
        </div>
      </footer>
    </div>
  );
}
