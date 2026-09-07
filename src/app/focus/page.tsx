"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/context/AuthContext";
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, Settings2, Sparkles } from "lucide-react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode; gradient: string }> = {
  focus: { label: "Deep Focus", minutes: 25, color: "#7C3AED", icon: <Brain className="w-4 h-4" />, gradient: "from-[#7C3AED] to-[#6D28D9]" },
  shortBreak: { label: "Short Break", minutes: 5, color: "#EAB308", icon: <Coffee className="w-4 h-4" />, gradient: "from-[#EAB308] to-[#CA8A04]" },
  longBreak: { label: "Long Break", minutes: 15, color: "#A855F7", icon: <Zap className="w-4 h-4" />, gradient: "from-[#A855F7] to-[#7C3AED]" },
};

export default function FocusTimerPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [customMinutes, setCustomMinutes] = useState<Record<TimerMode, number>>({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkKuslGE+OmaRr62WZj87apKtr5ZnQT5uk66vlmhDP3KUra+WaEQ/c5Str5ZoRD9zlK2vlmhEP3OUra+WaEQ/c5Str5ZoRD9zlK2vlmhEP3OUra+WaEQ/c5Str5ZoRA=="
      );
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
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            audioRef.current?.play().catch(() => {});
            if (mode === "focus") {
              setSessions((s) => s + 1);
              setTotalFocusTime((t) => t + customMinutes.focus);
              const nextSessions = sessions + 1;
              if (nextSessions % 4 === 0) switchMode("longBreak");
              else switchMode("shortBreak");
            } else {
              switchMode("focus");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, sessions, customMinutes, switchMode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customMinutes[mode] * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const totalTime = customMinutes[mode] * 60;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const circumference = 2 * Math.PI * 135;
  const strokeDashoffset = circumference - progress * circumference;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-white selection:bg-violet-500/20">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 justify-center">
          {(Object.entries(MODES) as [TimerMode, typeof MODES.focus][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === key
                  ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md shadow-violet-500/20`
                  : "bg-white dark:bg-[#121218] text-stone-600 dark:text-[#9090A0] border border-stone-200/80 dark:border-[#272732] hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              {cfg.icon}
              <span>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Circular Clock Display */}
        <div className="flex justify-center my-4">
          <div className="relative w-64 h-64 sm:w-76 sm:h-76">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
              <circle
                cx="150" cy="150" r="135"
                fill="none" stroke="currentColor" strokeWidth="6"
                className="text-stone-200 dark:text-[#1A1A22]"
              />
              <circle
                cx="150" cy="150" r="135"
                fill="none" strokeWidth="6" strokeLinecap="round"
                style={{
                  stroke: MODES[mode].color,
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: "stroke-dashoffset 0.5s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl sm:text-6xl font-black font-heading tabular-nums tracking-tight text-stone-900 dark:text-white">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                {MODES[mode].label}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className="w-11 h-11 rounded-xl bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#1A1A22] transition-all active:scale-95 shadow-xs text-stone-500 dark:text-stone-400"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTimer}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 hover:scale-105 transition-all active:scale-95"
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-11 h-11 rounded-xl bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#1A1A22] transition-all active:scale-95 shadow-xs text-stone-500 dark:text-stone-400"
            title="Timer options"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Duration Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Durations (Minutes)</h3>
            {(Object.entries(MODES) as [TimerMode, typeof MODES.focus][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{cfg.label}</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={customMinutes[key]}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                    setCustomMinutes((prev) => ({ ...prev, [key]: val }));
                    if (mode === key && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-18 rounded-lg border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#0B0B0F] px-3 py-1 text-xs text-center font-bold text-stone-900 dark:text-white outline-none focus:border-[#7C3AED]"
                />
              </div>
            ))}
          </div>
        )}

        {/* Productivity Counters */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 text-center shadow-xs">
            <div className="text-2xl font-black font-heading text-[#7C3AED]">{sessions}</div>
            <div className="text-[10px] text-stone-400 dark:text-[#9090A0] font-bold uppercase tracking-wider mt-0.5">Sessions</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 text-center shadow-xs">
            <div className="text-2xl font-black font-heading text-[#EAB308]">{Math.round(totalFocusTime)}</div>
            <div className="text-[10px] text-stone-400 dark:text-[#9090A0] font-bold uppercase tracking-wider mt-0.5">Min Focused</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 text-center shadow-xs">
            <div className="text-2xl font-black font-heading text-[#A855F7]">{sessions > 0 ? Math.floor(sessions / 4) : 0}</div>
            <div className="text-[10px] text-stone-400 dark:text-[#9090A0] font-bold uppercase tracking-wider mt-0.5">Full Cycles</div>
          </div>
        </div>
      </main>
    </div>
  );
}
