"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Award,
  Flame,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import HabitFlowLogo from "@/components/HabitFlowLogo";
import LiveHabitLab from "@/components/landing/LiveHabitLab";
import BentoTiltCard from "@/components/landing/BentoTiltCard";
import { soundFX } from "@/lib/soundEffects";
import { useAuth } from "@/context/AuthContext";

gsap.registerPlugin(ScrollTrigger);

// Dynamically load ambient Canvas & Cursor (no SSR)
const ScrollWorldCanvas = dynamic(
  () => import("@/components/landing/ScrollWorldCanvas"),
  { ssr: false }
);
const CursorFx = dynamic(
  () => import("@/components/landing/CursorFx"),
  { ssr: false }
);

const BENTO_FEATURES = [
  {
    title: "Smart Analytics",
    desc: "Weekday rhythm mapping, velocity trends, and consistency scoring — all computed in real time.",
    badge: "Intelligence",
    stat: "99.4% Accurate",
    icon: <BarChart3 className="w-5 h-5 text-[#7C3AED]" />,
    accentColor: "#7C3AED",
    className: "col-span-1 md:col-span-2",
  },
  {
    title: "Daily Journal",
    desc: "Markdown editor with mood tracking and taggable entries for mindful reflection.",
    badge: "Mindset",
    stat: "Markdown Ready",
    icon: <BookOpen className="w-5 h-5 text-[#EAB308]" />,
    accentColor: "#EAB308",
    className: "col-span-1",
  },
  {
    title: "60+ Achievements",
    desc: "Unlock badges from Bronze to Aurum as you build momentum and hit milestones.",
    badge: "Gamification",
    stat: "60+ Badges",
    icon: <Award className="w-5 h-5 text-[#A855F7]" />,
    accentColor: "#A855F7",
    className: "col-span-1",
  },
  {
    title: "Unbroken Streaks",
    desc: "Historical heatmaps, compounding counters, and daily chain tracking.",
    badge: "Discipline",
    stat: "Zero Broken Days",
    icon: <Flame className="w-5 h-5 text-[#EAB308]" />,
    accentColor: "#EAB308",
    className: "col-span-1",
  },
  {
    title: "Offline-First",
    desc: "Ultra-fast local cache. Works flawlessly in transit, on flights, anywhere.",
    badge: "Speed",
    stat: "100% Offline",
    icon: <Zap className="w-5 h-5 text-[#38BDF8]" />,
    accentColor: "#38BDF8",
    className: "col-span-1 md:col-span-2",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const labRef = useRef<HTMLElement>(null);
  const bentoRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSound = () => {
    const nextState = soundFX.toggleMute();
    setIsMuted(nextState);
    if (!nextState) soundFX.playClick();
  };

  // ━━━━━ GSAP SCROLL ANIMATIONS ━━━━━
  useGSAP(
    () => {
      // 0. Scroll progress bar
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        });
      }

      // 1. Hero stagger reveal
      if (heroRef.current) {
        const heroTl = gsap.timeline({
          defaults: { duration: 0.8, ease: "power3.out" },
        });

        heroTl
          .from("[data-hero-badge]", {
            y: -30,
            opacity: 0,
            duration: 0.5,
          })
          .from(
            "[data-hero-heading] .hero-word",
            {
              y: 60,
              opacity: 0,
              rotateX: 15,
              stagger: 0.08,
              duration: 0.7,
            },
            "-=0.2"
          )
          .from(
            "[data-hero-sub]",
            {
              y: 30,
              opacity: 0,
              duration: 0.6,
            },
            "-=0.3"
          )
          .from(
            "[data-hero-cta]",
            {
              y: 25,
              opacity: 0,
              duration: 0.5,
            },
            "-=0.2"
          );
      }

      // 2. Section divider lines draw-in
      gsap.utils.toArray<HTMLElement>("[data-divider]").forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          duration: 1.0,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: line,
            start: "top 85%",
            once: true,
          },
        });
      });

      // 3. Live Lab section reveal
      if (labRef.current) {
        const labElements = labRef.current.querySelectorAll("[data-lab-reveal]");
        gsap.from(labElements, {
          y: 50,
          opacity: 0,
          scale: 0.97,
          stagger: 0.15,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: labRef.current,
            start: "top 78%",
            once: true,
          },
        });
      }

      // 4. Bento grid stagger
      if (bentoRef.current) {
        const cards = bentoRef.current.querySelectorAll("[data-bento-card]");
        gsap.from(cards, {
          y: 60,
          opacity: 0,
          rotateX: 8,
          stagger: 0.1,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 75%",
            once: true,
          },
        });

        // Section header
        const bentoHeader = bentoRef.current.querySelectorAll("[data-bento-header]");
        gsap.from(bentoHeader, {
          y: 35,
          opacity: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }

      // 5. Final CTA
      if (ctaRef.current) {
        const ctaTl = gsap.timeline({
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 75%",
            once: true,
          },
        });

        ctaTl
          .from("[data-cta-logo]", {
            scale: 0.5,
            opacity: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
          })
          .from(
            "[data-cta-heading]",
            {
              y: 40,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
            },
            "-=0.2"
          )
          .from(
            "[data-cta-sub]",
            {
              y: 25,
              opacity: 0,
              duration: 0.5,
            },
            "-=0.3"
          )
          .from(
            "[data-cta-button]",
            {
              y: 20,
              opacity: 0,
              duration: 0.5,
            },
            "-=0.2"
          );
      }
    },
    { scope: containerRef }
  );

  // Split hero heading into words for stagger animation
  const heroWords = (text: string, isGradient = false) =>
    text.split(" ").map((word, i) => (
      <span
        key={i}
        className={`hero-word inline-block ${
          isGradient
            ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#EAB308]"
            : "text-white"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {word}
        {i < text.split(" ").length - 1 && "\u00A0"}
      </span>
    ));

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0B0B0F] text-white selection:bg-[#7C3AED]/30 selection:text-white relative overflow-x-hidden"
    >
      {/* ━━━━━ SCROLL PROGRESS BAR ━━━━━ */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EAB308] z-50 origin-left"
        style={{ transform: "scaleX(0)" }}
      />

      {/* ━━━━━ AMBIENT CANVAS BACKDROP ━━━━━ */}
      <ScrollWorldCanvas />

      {/* ━━━━━ CUSTOM CURSOR ━━━━━ */}
      <CursorFx />

      {/* ━━━━━ GLASS NAVIGATION ━━━━━ */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B0B0F]/85 backdrop-blur-2xl border-b border-[#272732] py-3.5 shadow-2xl"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <HabitFlowLogo size="sm" animated={true} />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleSound}
              aria-label="Toggle Sound Effects"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#121218] border border-[#272732] text-[#9090A0] hover:text-[#A855F7] hover:border-[#A855F7]/40 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#A855F7] animate-pulse" />
                  <span className="hidden sm:inline text-[#A855F7]">Audio ON</span>
                </>
              )}
            </button>

            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-white text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-[#121218] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-white text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ━━━━━ HERO SECTION ━━━━━ */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] flex flex-col justify-center items-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center z-10"
      >
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Badge */}
          <div
            data-hero-badge
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121218]/80 border border-[#272732] text-xs font-bold text-[#A855F7] backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span>Track habits, build momentum, stay consistent</span>
          </div>

          {/* Heading — words split for stagger */}
          <h1
            data-hero-heading
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-heading tracking-tight leading-[1.05]"
            style={{ perspective: "1000px" }}
          >
            <span className="block">
              {heroWords("Build the chain.")}
            </span>
            <span className="block">
              {heroWords("Every day compounds.", true)}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            data-hero-sub
            className="text-sm sm:text-base md:text-lg text-[#9090A0] max-w-xl mx-auto font-medium leading-relaxed"
          >
            Track streaks, analyze your rhythm, write reflections,
            and ascend through 60+ achievements — all in one place.
          </p>

          {/* CTAs */}
          <div
            data-hero-cta
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto"
          >
            <Link
              href={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] text-white text-sm font-black shadow-xl shadow-violet-500/25 hover:scale-105 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{user ? "Open Dashboard" : "Start Free"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#live-lab"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#121218] border border-[#272732] text-slate-200 text-sm font-bold hover:bg-[#1A1A22] hover:border-[#A855F7]/40 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span>See it in action</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━ DIVIDER ━━━━━ */}
      <div className="max-w-4xl mx-auto px-4">
        <div data-divider className="h-px bg-gradient-to-r from-transparent via-[#272732] to-transparent origin-center" />
      </div>

      {/* ━━━━━ LIVE INTERACTIVE SANDBOX ━━━━━ */}
      <section ref={labRef} id="live-lab" className="relative py-24 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div data-lab-reveal className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 text-[11px] font-black uppercase tracking-widest mb-3">
            <Flame className="w-3.5 h-3.5 fill-[#EAB308]" />
            <span>Interactive Demo</span>
          </div>
          <h2 data-lab-reveal className="text-3xl sm:text-5xl font-black font-heading tracking-tight mb-3">
            Try it right now.
          </h2>
          <p data-lab-reveal className="text-xs sm:text-sm text-[#9090A0] max-w-xl mx-auto">
            Click any habit below to complete it. Watch the streak count, hear the audio feedback.
          </p>
        </div>

        <div data-lab-reveal>
          <LiveHabitLab />
        </div>
      </section>

      {/* ━━━━━ DIVIDER ━━━━━ */}
      <div className="max-w-4xl mx-auto px-4">
        <div data-divider className="h-px bg-gradient-to-r from-transparent via-[#272732] to-transparent origin-center" />
      </div>

      {/* ━━━━━ FEATURES BENTO GRID ━━━━━ */}
      <section ref={bentoRef} className="relative py-28 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 data-bento-header className="text-3xl sm:text-5xl font-black font-heading tracking-tight mb-3">
              Everything you need.
            </h2>
            <p data-bento-header className="text-xs sm:text-sm text-[#9090A0] max-w-xl mx-auto">
              Built to remove friction, celebrate streaks, and cultivate daily momentum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5" style={{ perspective: "1200px" }}>
            {BENTO_FEATURES.map((feat, i) => (
              <div key={i} data-bento-card style={{ transformStyle: "preserve-3d" }}>
                <BentoTiltCard {...feat} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ DIVIDER ━━━━━ */}
      <div className="max-w-4xl mx-auto px-4">
        <div data-divider className="h-px bg-gradient-to-r from-transparent via-[#272732] to-transparent origin-center" />
      </div>

      {/* ━━━━━ FINAL CTA ━━━━━ */}
      <section ref={ctaRef} className="relative py-32 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden text-center">
        {/* Soft radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#7C3AED]/15 via-[#EAB308]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <div data-cta-logo className="inline-flex p-3 rounded-2xl bg-[#0B0B0F] border border-[#272732] shadow-2xl mb-2">
            <HabitFlowLogo size="lg" showText={false} animated={true} />
          </div>

          <h2 data-cta-heading className="text-4xl sm:text-6xl font-black font-heading tracking-tight leading-tight">
            Start today.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#EAB308]">
              Build tomorrow.
            </span>
          </h2>

          <p data-cta-sub className="text-sm sm:text-base text-[#9090A0] max-w-lg mx-auto font-medium">
            Join thousands building better habits with HabitFlow. Free forever, no credit card.
          </p>

          <div data-cta-button className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EAB308] text-white text-sm font-black shadow-2xl shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{user ? "Open Dashboard" : "Create Free Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer className="relative py-12 px-4 border-t border-[#272732] bg-[#0B0B0F]/90 z-10 text-center text-xs text-[#9090A0] space-y-3">
        <div className="flex items-center justify-center">
          <HabitFlowLogo size="xs" />
        </div>
        <p>© {new Date().getFullYear()} HabitFlow. Built for daily progress.</p>
      </footer>
    </div>
  );
}
