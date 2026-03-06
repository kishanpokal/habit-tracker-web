"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/context/AuthContext";
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, Settings2 } from "lucide-react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode; gradient: string }> = {
    focus: { label: "Focus", minutes: 25, color: "#6366f1", icon: <Brain className="w-5 h-5" />, gradient: "from-indigo-500 to-purple-600" },
    shortBreak: { label: "Short Break", minutes: 5, color: "#10b981", icon: <Coffee className="w-5 h-5" />, gradient: "from-emerald-500 to-teal-600" },
    longBreak: { label: "Long Break", minutes: 15, color: "#f59e0b", icon: <Zap className="w-5 h-5" />, gradient: "from-amber-500 to-orange-600" },
};

export default function FocusTimerPage() {
    const { user } = useAuth();
    const [mode, setMode] = useState<TimerMode>("focus");
    const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [totalFocusTime, setTotalFocusTime] = useState(0);
    const [customMinutes, setCustomMinutes] = useState<Record<TimerMode, number>>({
        focus: 25, shortBreak: 5, longBreak: 15,
    });
    const [showSettings, setShowSettings] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create a simple beep sound
        if (typeof window !== "undefined") {
            audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkKuslGE+OmaRr62WZj87apKtr5ZnQT5uk66vlmhDP3KUra+WaEQ/c5Str5ZoRD9zlK2vlmhEP3OUra+WaEQ/c5Str5ZoRD9zlK2vlmhEP3OUra+WaEQ/c5Str5ZoRA==");
        }
    }, []);

    const switchMode = useCallback((newMode: TimerMode) => {
        setMode(newMode);
        setTimeLeft(customMinutes[newMode] * 60);
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, [customMinutes]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        // Play sound
                        audioRef.current?.play().catch(() => { });
                        // Auto switch
                        if (mode === "focus") {
                            setSessions(s => s + 1);
                            setTotalFocusTime(t => t + customMinutes.focus);
                            const nextSessions = sessions + 1;
                            if (nextSessions % 4 === 0) switchMode("longBreak");
                            else switchMode("shortBreak");
                        } else {
                            switchMode("focus");
                        }
                        return 0;
                    }
                    if (mode === "focus") setTotalFocusTime(t => t + 1 / 60);
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, timeLeft, mode, sessions, customMinutes, switchMode]);

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(customMinutes[mode] * 60);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const totalSeconds = customMinutes[mode] * 60;
    const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="pt-20 sm:pt-24 pb-12 px-4 sm:px-6 max-w-2xl mx-auto">
                {/* Mode Tabs */}
                <div className="flex gap-2 justify-center mb-8">
                    {(Object.entries(MODES) as [TimerMode, typeof MODES.focus][]).map(([key, cfg]) => (
                        <button key={key} onClick={() => switchMode(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === key
                                    ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-lg`
                                    : "bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                        >
                            {cfg.icon} {cfg.label}
                        </button>
                    ))}
                </div>

                {/* Timer Ring */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-[320px] h-[320px]">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
                            <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-800" />
                            <circle cx="150" cy="150" r="140" fill="none" strokeWidth="6" strokeLinecap="round"
                                style={{ stroke: MODES[mode].color, strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl sm:text-7xl font-black tabular-nums tracking-tight">
                                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                                {MODES[mode].label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button onClick={resetTimer}
                        className="w-12 h-12 rounded-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-90"
                    >
                        <RotateCcw className="w-5 h-5 text-gray-500" />
                    </button>
                    <button onClick={toggleTimer}
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${MODES[mode].gradient} text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95`}
                    >
                        {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)}
                        className="w-12 h-12 rounded-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-90"
                    >
                        <Settings2 className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Custom Settings */}
                {showSettings && (
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6 space-y-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
                        <h3 className="text-sm font-bold">Timer Duration (minutes)</h3>
                        {(Object.entries(MODES) as [TimerMode, typeof MODES.focus][]).map(([key, cfg]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">{cfg.label}</span>
                                <input type="number" min={1} max={120} value={customMinutes[key]}
                                    onChange={e => {
                                        const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                                        setCustomMinutes(prev => ({ ...prev, [key]: val }));
                                        if (mode === key && !isRunning) setTimeLeft(val * 60);
                                    }}
                                    className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-center font-bold outline-none focus:border-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Session Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                        <div className="text-2xl font-black text-indigo-500">{sessions}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sessions</div>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                        <div className="text-2xl font-black text-emerald-500">{Math.round(totalFocusTime)}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Min Focused</div>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                        <div className="text-2xl font-black text-amber-500">{sessions > 0 ? Math.floor(sessions / 4) : 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cycles Done</div>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10 p-4">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">💡 Pomodoro Technique</h4>
                    <p className="text-[11px] text-indigo-500/70 dark:text-indigo-400/60 leading-relaxed">
                        Focus for 25 min → 5 min break → Repeat. After 4 sessions, take a 15 min break. This cycle maximizes concentration and prevents burnout.
                    </p>
                </div>
            </main>

            <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
