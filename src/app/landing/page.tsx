"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { BarChart3, Flame, LayoutGrid, Smartphone, Moon, Download, CheckCircle2, ArrowRight, Star, Shield, Lock, Zap } from "lucide-react";

/* ━━━━━ CONSTANTS ━━━━━ */
const FEATURES = [
  {
    key: "analytics",
    icon: <BarChart3 className="w-6 h-6 text-indigo-400" />,
    title: "Smart Analytics",
    desc: "Deep insights with 10+ chart types, consistency scores, and weekly trend analysis.",
    className: "col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/5",
  },
  {
    key: "streak",
    icon: <Flame className="w-6 h-6 text-orange-400" />,
    title: "Streak Tracking",
    desc: "Keep your momentum alive. Track personal bests and build unbreakable chains.",
    className: "col-span-1 bg-gradient-to-br from-orange-500/10 to-red-500/5",
  },
  {
    key: "categories",
    icon: <LayoutGrid className="w-6 h-6 text-emerald-400" />,
    title: "Custom Categories",
    desc: "Organize habits into Health, Fitness, Productivity, Learning, and more.",
    className: "col-span-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
  },
  {
    key: "pwa",
    icon: <Smartphone className="w-6 h-6 text-blue-400" />,
    title: "Works Everywhere",
    desc: "Fully responsive PWA. Install it on your phone like a native app.",
    className: "col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-500/10 to-cyan-500/5",
  },
  {
    key: "darkmode",
    icon: <Moon className="w-6 h-6 text-purple-400" />,
    title: "Beautiful Dark Mode",
    desc: "Stunning dark and light themes crafted for focus and eye comfort.",
    className: "col-span-1 bg-gradient-to-br from-purple-500/10 to-pink-500/5",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Product Designer",
    text: "HabitFlow completely changed how I approach my daily routines. The analytics are beautiful and actually motivate me to keep my streaks alive.",
  },
  {
    name: "Marcus Chen",
    role: "Software Engineer",
    text: "Finally, a habit tracker that isn't cluttered. The UI is lightning fast, the dark mode is gorgeous, and it just works seamlessly on my phone and laptop.",
  },
  {
    name: "Elena Rodriguez",
    role: "Fitness Coach",
    text: "I recommend this to all my clients. The visual progress rings make it so easy to see daily focus at a glance. Simply the best tracker out there.",
  }
];

const STATS = [
  { end: 28, label: "Ready Templates" },
  { end: 50, label: "Achievement Badges" },
  { end: 10, suffix: "+", label: "Chart Types" },
  { end: 100, suffix: "%", label: "Free Forever" },
];

/* ━━━━━ ANIMATED COUNTER ━━━━━ */
function AnimatedStat({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInViewport = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInViewport) return;
    let frame = 0;
    const frames = 60;
    const interval = setInterval(() => {
      frame++;
      setVal(Math.round((frame / frames) * end));
      if (frame >= frames) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [end, isInViewport]);

  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-4xl sm:text-5xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif", background: "linear-gradient(135deg, #818cf8, #c084fc, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {val}{suffix}
      </div>
      <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN LANDING PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBlur = scrollY > 50;

  return (
    <div className="min-h-screen text-white bg-[#030712] overflow-x-hidden font-sans selection:bg-indigo-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .mesh-bg {
          background-color: #030712;
          background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(34, 211, 238, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%);
        }
        
        .mockup-glow {
          box-shadow: 0 0 100px -20px rgba(99, 102, 241, 0.4), 
                      0 0 60px -20px rgba(168, 85, 247, 0.3);
        }
      `}</style>

      {/* ━━━━━ NAV ━━━━━ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBlur ? "bg-[#030712]/80 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: "Outfit, sans-serif" }}>
              HabitFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 text-white text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━ HERO SECTION ━━━━━ */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mesh-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-indigo-300 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            HabitFlow 2.0 is now live — 100% Free
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
            Build Habits That <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Actually Stick</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent habit tracker designed for focus and consistency. Beautiful analytics, streak tracking, and personalized insights to help you achieve your goals.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 text-base font-bold rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
              Start Tracking Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 text-base font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center">
              Sign In to Account
            </Link>
          </motion.div>

          {/* Users Trust Badge */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="mt-12 flex items-center justify-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#030712] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 z-10" style={{ zIndex: 10 - i }}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-sm font-medium text-gray-400 flex flex-col items-start">
              <div className="flex text-yellow-400 mb-0.5"><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/><Star className="w-3.5 h-3.5 fill-current"/></div>
              <span>Join 10,000+ habit builders</span>
            </div>
          </motion.div>

          {/* App Mockup Preview */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, type: "spring" }} className="mt-20 relative max-w-5xl mx-auto perspective-[2000px]">
            <div className="rounded-3xl border border-white/10 bg-[#0B1120]/80 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl mockup-glow transform rotate-x-[5deg] scale-95 sm:scale-100 hover:rotate-x-0 hover:scale-105 transition-all duration-700">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="w-32 h-6 rounded-md bg-white/5"></div>
              </div>
              {/* Mockup Body Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {/* Left Sidebar Mock */}
                <div className="col-span-1 space-y-4">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/5 p-4 flex flex-col justify-between">
                     <div className="w-16 h-4 bg-white/20 rounded"></div>
                     <div className="w-24 h-6 bg-white/40 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 rounded-xl bg-white/5 flex items-center px-3 gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500/50"></div>
                        <div className="w-20 h-3 bg-white/20 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main Content Mock */}
                <div className="col-span-2 space-y-4">
                   <div className="h-32 rounded-2xl bg-white/5 border border-white/5 p-4 flex items-end gap-2">
                      {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                        <div key={i} className="w-full bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="h-20 rounded-xl bg-white/5 p-3"><div className="w-12 h-3 bg-white/20 rounded mb-2"></div><div className="w-16 h-6 bg-white/40 rounded"></div></div>
                     <div className="h-20 rounded-xl bg-white/5 p-3"><div className="w-12 h-3 bg-white/20 rounded mb-2"></div><div className="w-16 h-6 bg-white/40 rounded"></div></div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━ FEATURES BENTO GRID ━━━━━ */}
      <section className="py-24 bg-[#030712] relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Everything you need to succeed</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Powerful tools designed to eliminate friction and keep you focused on what matters most — building the habit.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-colors group flex flex-col ${feature.className}`}
              >
                <div className="bg-[#030712]/50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg border border-white/5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ HOW IT WORKS (STEPPER) ━━━━━ */}
      <section className="py-24 bg-[#0B1120] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Simple 3-Step Process</h2>
            <p className="text-gray-400 text-lg">Getting started is easier than ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-purple-500/0"></div>
            
            {[
              { num: "01", title: "Create", desc: "Define your habits, set target days, and pick a color.", icon: <Zap className="w-6 h-6" /> },
              { num: "02", title: "Track", desc: "Check off habits daily to build unshakeable streaks.", icon: <CheckCircle2 className="w-6 h-6" /> },
              { num: "03", title: "Analyze", desc: "Review your progress with beautiful visual insights.", icon: <BarChart3 className="w-6 h-6" /> }
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative text-center z-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#030712] border-2 border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ TESTIMONIALS ━━━━━ */}
      <section className="py-24 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-center" style={{ fontFamily: "Outfit, sans-serif" }}>Loved by achievers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
                <div className="flex gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-300 mb-8 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ STATS BAND ━━━━━ */}
      <section className="py-16 border-y border-white/5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => <AnimatedStat key={i} {...s} />)}
        </div>
      </section>

      {/* ━━━━━ CTA SECTION ━━━━━ */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-700/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Ready to transform your life?</h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">Start tracking your habits today. It takes less than a minute to set up your first goal.</p>
          
          <Link href="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-gray-900 text-lg font-bold rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95 mb-8">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
          
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-medium text-indigo-200/80">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> 100% Free</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> No Credit Card</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Secure Data</span>
          </div>
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer className="bg-[#030712] border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-black" style={{ fontFamily: "Outfit, sans-serif" }}>HabitFlow</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">The smartest way to build consistency and achieve your personal goals.</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-indigo-400 transition-colors">Sign Up</Link></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Connect</h4>
              <div className="flex gap-4">
                <a href="https://github.com/KishanPokal" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} HabitFlow. All rights reserved.</p>
            <p className="text-xs text-gray-600">Designed with ❤️ for better habits</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
