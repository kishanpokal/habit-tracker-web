"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ─── Floating Orb ─── */
function Orb({ size, color, top, left, delay }: { size: number; color: string; top: string; left: string; delay: number }) {
    return (
        <div className="absolute rounded-full mix-blend-screen pointer-events-none"
            style={{ width: size, height: size, top, left, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: `blur(${size / 3}px)`, animation: `orbFloat ${8 + delay}s ease-in-out infinite`, animationDelay: `${delay}s`, opacity: 0.4 }}
        />
    );
}

/* ─── Stats Counter ─── */
function AnimatedStat({ end, label, suffix }: { end: number; label: string; suffix?: string }) {
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
            <div className="text-3xl sm:text-4xl font-black text-white mb-1">{val}{suffix}</div>
            <div className="text-xs text-white/50 font-bold uppercase tracking-widest">{label}</div>
        </div>
    );
}

/* ─── Feature Card ─── */
function Feature({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
    return (
        <div className="bg-white/[0.04] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg" style={{ background: gradient }}>{icon}</div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
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

    const features = [
        { icon: "📊", title: "Smart Analytics", desc: "Deep insights with 10+ chart types, consistency scores, and AI-powered recommendations.", gradient: "linear-gradient(135deg, #6366f1, #a855f7)" },
        { icon: "🔥", title: "Streak Tracking", desc: "Track your daily streaks, personal bests, and momentum to stay motivated.", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" },
        { icon: "🏷️", title: "Categories & Tags", desc: "Organize habits into Health, Fitness, Productivity, Learning, and more.", gradient: "linear-gradient(135deg, #10b981, #14b8a6)" },
        { icon: "📱", title: "Works Everywhere", desc: "Fully responsive PWA that works on desktop, tablet, and mobile. Install it like a native app.", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)" },
        { icon: "🌙", title: "Dark Mode", desc: "Beautiful dark and light themes with one-click toggle. Easy on the eyes, day or night.", gradient: "linear-gradient(135deg, #3b82f6, #0ea5e9)" },
        { icon: "📤", title: "Export Data", desc: "Export your habit data as CSV or PDF for reporting, analysis, or portfolio projects.", gradient: "linear-gradient(135deg, #d946ef, #a855f7)" },
    ];

    return (
        <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
            {/* ─── Animated Background ─── */}
            <div className="fixed inset-0 pointer-events-none">
                <Orb size={400} color="rgba(99,102,241,0.3)" top="10%" left="10%" delay={0} />
                <Orb size={350} color="rgba(139,92,246,0.25)" top="60%" left="70%" delay={2} />
                <Orb size={300} color="rgba(236,72,153,0.2)" top="30%" left="80%" delay={4} />
                <Orb size={250} color="rgba(14,184,166,0.2)" top="80%" left="20%" delay={3} />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            </div>

            {/* ─── Nav ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/60 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">HabitFlow</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all active:scale-95">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-indigo-300 mb-6" style={{ animation: "fadeUp 0.6s ease-out 0.1s both" }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Now with PWA support & offline access
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6" style={{ animation: "fadeUp 0.8s ease-out 0.3s both" }}>
                    Build Better Habits<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Track Your Growth
                    </span>
                </h1>

                <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium" style={{ animation: "fadeUp 0.8s ease-out 0.5s both" }}>
                    The most powerful habit tracking app. Build consistency with advanced analytics,
                    streak tracking, and beautiful data visualizations — all in a stunning interface.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16" style={{ animation: "fadeUp 0.8s ease-out 0.7s both" }}>
                    <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-base font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all active:scale-95 w-full sm:w-auto">
                        Start Tracking Free →
                    </Link>
                    <Link href="/login" className="px-8 py-4 bg-white/[0.05] border border-white/[0.1] text-white text-base font-bold rounded-2xl hover:bg-white/[0.1] transition-all w-full sm:w-auto">
                        Sign In
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto" style={{ animation: "fadeUp 0.8s ease-out 0.9s both" }}>
                    <AnimatedStat end={10} suffix="+" label="Chart Types" />
                    <AnimatedStat end={100} suffix="%" label="Free" />
                    <AnimatedStat end={24} suffix="/7" label="Access" />
                </div>
            </section>

            {/* ─── Features Grid ─── */}
            <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20 sm:pb-28">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black mb-3">Everything You Need</h2>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">Powerful features designed to help you build lasting habits and achieve your goals.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((f, i) => <Feature key={i} {...f} />)}
                </div>
            </section>

            {/* ─── How it works ─── */}
            <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-20 sm:pb-28">
                <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">Simple 3-Step Process</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { step: "01", title: "Create Habits", desc: "Define your habits with custom colors, categories, and target days per week." },
                        { step: "02", title: "Track Daily", desc: "Check off habits each day. Build streaks and watch your consistency grow." },
                        { step: "03", title: "Analyze & Grow", desc: "Dive into advanced analytics to understand your patterns and optimize." },
                    ].map((s, i) => (
                        <div key={i} className="text-center sm:text-left">
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-3">{s.step}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="relative px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-20 sm:pb-28">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to Transform Your Life?</h2>
                        <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-8">
                            Join HabitFlow today and start building the habits that matter most to you. It&apos;s completely free.
                        </p>
                        <Link href="/register" className="inline-flex px-8 py-4 bg-white text-gray-900 text-base font-black rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all active:scale-95">
                            Get Started Now →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-black text-gray-400">HabitFlow</span>
                    </div>
                    <p className="text-xs text-gray-500">© {new Date().getFullYear()} HabitFlow. Built with Next.js & Firebase.</p>
                </div>
            </footer>

            {/* Animations */}
            <style jsx>{`
        @keyframes orbFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 25% { transform: translate(40px, -60px) scale(1.1); } 50% { transform: translate(-30px, 40px) scale(0.9); } 75% { transform: translate(50px, 20px) scale(1.05); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
