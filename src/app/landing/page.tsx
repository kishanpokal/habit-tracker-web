"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart3,
  Flame,
  Moon,
  CheckCircle2,
  ArrowRight,
  Star,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";

/* ━━━━━ FEATURES ━━━━━ */
const FEATURES = [
  {
    key: "analytics",
    icon: <BarChart3 className="w-5 h-5 text-[#7C3AED]" />,
    title: "Performance Intelligence",
    desc: "Consistency scoring, weekday rhythm charts, and streak pattern detection.",
    className: "col-span-1 md:col-span-2 lg:col-span-2 bg-[#121218] border-[#272732]",
  },
  {
    key: "journal",
    icon: <BookOpen className="w-5 h-5 text-[#EAB308]" />,
    title: "Daily Reflection Journal",
    desc: "Markdown writing tools, thought prompts, mood pulse tracking, and taggable archives.",
    className: "col-span-1 bg-[#121218] border-[#272732]",
  },
  {
    key: "streak",
    icon: <Flame className="w-5 h-5 text-[#EAB308]" />,
    title: "Streak Momentum",
    desc: "Maintain unbroken daily discipline with visual flames and historical records.",
    className: "col-span-1 bg-[#121218] border-[#272732]",
  },
  {
    key: "badges",
    icon: <Award className="w-5 h-5 text-[#A855F7]" />,
    title: "60+ Tiered Achievements",
    desc: "Unlock Stone through Aurum badges with real-time milestone tracking.",
    className: "col-span-1 md:col-span-2 lg:col-span-1 bg-[#121218] border-[#272732]",
  },
  {
    key: "darkmode",
    icon: <Moon className="w-5 h-5 text-[#EAB308]" />,
    title: "Obsidian Void Design",
    desc: "Deep Obsidian Void architecture balanced with Royal Amethyst & Luminous Gold accents.",
    className: "col-span-1 bg-[#121218] border-[#272732]",
  },
];

const STATS = [
  { end: 60, suffix: "+", label: "Achievements" },
  { end: 100, suffix: "%", label: "Free Forever" },
  { end: 7, label: "Core Modules" },
  { end: 10, suffix: "k+", label: "Habits Tracked" },
];

function AnimatedStat({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInViewport = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInViewport) return;
    let frame = 0;
    const frames = 40;
    const interval = setInterval(() => {
      frame++;
      setVal(Math.round((frame / frames) * end));
      if (frame >= frames) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [end, isInViewport]);

  return (
    <div ref={ref} className="text-center p-3">
      <div className="text-3xl sm:text-4xl font-black mb-1 font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">
        {val}{suffix}
      </div>
      <div className="text-xs text-[#9090A0] font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBlur = scrollY > 20;

  return (
    <div className="min-h-screen text-white bg-[#0B0B0F] overflow-x-hidden font-sans selection:bg-[#7C3AED]/25">
      {/* ━━━━━ NAV ━━━━━ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
          navBlur ? "bg-[#0B0B0F]/90 backdrop-blur-xl border-b border-[#272732] py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] shadow-sm shadow-violet-500/25">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-black font-heading tracking-tight">
              Habit<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Flow</span>
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-white text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] shadow-sm shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━ HERO SECTION ━━━━━ */}
      <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/12 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[#EAB308]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121218] border border-[#272732] text-xs font-semibold text-[#EAB308] mb-6 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
            <span>HabitFlow 5.0 • Royal Amethyst & Gilded Gold</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-5 font-heading"
          >
            Build Habits That <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#C084FC] to-[#EAB308]">
              Master Your Destiny
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[#9090A0] text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-medium"
          >
            A high-performance workspace engineered for consistency. Clean habit tracking, intelligent analytics, a reflective daily journal, and 60+ achievements.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-violet-500/25 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-[#121218] text-slate-200 border border-[#272732] text-xs sm:text-sm font-bold rounded-xl hover:bg-[#1A1A22] transition-all"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust Rating */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#9090A0] font-medium">
            <div className="flex text-[#EAB308]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#EAB308]" />
              ))}
            </div>
            <span>Crafted for high performers and daily builders</span>
          </div>

          {/* App Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 relative max-w-4xl mx-auto"
          >
            <div className="rounded-2xl sm:rounded-3xl border border-[#272732] bg-[#121218]/95 backdrop-blur-xl p-4 sm:p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-[#272732] pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EAB308]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600/70" />
                </div>
                <span className="text-[10px] font-bold text-[#9090A0] uppercase tracking-widest">Workspace Overview</span>
                <div className="w-12" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-1 p-3.5 rounded-xl bg-[#0B0B0F] border border-[#272732] space-y-2">
                  <span className="text-[10px] font-bold text-[#EAB308] uppercase">Today's Focus</span>
                  <div className="h-10 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center px-3 justify-between">
                    <span className="text-xs font-bold text-violet-200">Morning Meditation</span>
                    <CheckCircle2 className="w-4 h-4 text-[#EAB308]" />
                  </div>
                  <div className="h-10 rounded-lg bg-[#121218] flex items-center px-3 justify-between border border-[#272732]">
                    <span className="text-xs font-bold text-slate-300">Deep Work Session</span>
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                  </div>
                </div>

                <div className="col-span-2 p-3.5 rounded-xl bg-[#0B0B0F] border border-[#272732] space-y-2">
                  <span className="text-[10px] font-bold text-[#7C3AED] uppercase">Weekly Momentum</span>
                  <div className="h-16 flex items-end gap-2 pt-2">
                    {[45, 80, 60, 95, 75, 100, 85].map((val, idx) => (
                      <div key={idx} className="flex-1 bg-[#121218] rounded-t-md relative overflow-hidden" style={{ height: `${val}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#7C3AED] to-[#EAB308]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━ BENTO FEATURES ━━━━━ */}
      <section className="py-20 bg-[#0B0B0F] border-t border-[#272732]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black font-heading mb-2">Engineered for Relentless Focus</h2>
            <p className="text-xs sm:text-sm text-[#9090A0] max-w-lg mx-auto">
              Everything you need to form enduring routines and observe your daily growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.key}
                className={`rounded-2xl p-6 border border-[#272732] flex flex-col justify-between ${feature.className}`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0B0B0F] border border-[#272732] flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold mb-1 text-white">{feature.title}</h3>
                  <p className="text-xs text-[#9090A0] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ NUMBERS COUNTER ━━━━━ */}
      <section className="py-12 border-y border-[#272732] bg-[#121218]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <AnimatedStat key={i} {...s} />
          ))}
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer className="py-12 border-t border-[#272732] text-center text-xs text-[#9090A0] space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-bold text-slate-300 font-heading">HabitFlow</span>
        </div>
        <p>© {new Date().getFullYear()} HabitFlow. Crafted for daily progress and discipline.</p>
      </footer>
    </div>
  );
}
