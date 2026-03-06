"use client";

import { useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Legend,
} from "recharts";
import jsPDF from "jspdf";

/* ─── Types ─── */
type Habit = { id: string; name: string; color?: string; category?: string };
type HabitLog = { habitId: string; date: string; completed: boolean };
type TimeRange = "7d" | "30d" | "90d" | "year" | "custom";

/* ─── Utils ─── */
function generateDateRange(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function generateCustomDateRange(start: string, end: string) {
  const dates: string[] = [];
  let curr = new Date(start);
  const endD = new Date(end);
  while (curr <= endD) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

function calculateBestStreak(dates: string[], rangeDays?: string[]) {
  const filtered = rangeDays ? dates.filter(d => rangeDays.includes(d)) : dates;
  const sorted = [...new Set(filtered)].sort();
  let max = 0, curr = 0;
  let prev: Date | null = null;
  sorted.forEach(ds => {
    const cd = new Date(ds);
    if (prev) {
      const diff = (cd.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) curr++;
      else { max = Math.max(max, curr); curr = 1; }
    } else curr = 1;
    prev = cd;
  });
  return Math.max(max, curr);
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#0ea5e9", "#84cc16", "#d946ef", "#06b6d4"];

/* ─── Reusable Components ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-2xl">
        <p className="text-gray-900 dark:text-white font-bold text-xs mb-2 border-b border-gray-100 dark:border-gray-800 pb-1.5">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{entry.name}</span>
              </div>
              <span className="text-gray-900 dark:text-white font-black text-xs">
                {entry.value}{(entry.name?.includes("%") || entry.name?.includes("Rate") || entry.name === "Completion") ? "%" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function StatCard({ icon, title, value, subtitle, gradient, trend, small }: any) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-[#111827] rounded-2xl ${small ? 'p-4' : 'p-5'} shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}>
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.08] blur-2xl group-hover:opacity-[0.15] transition-opacity" style={{ background: gradient }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`${small ? 'p-2.5' : 'p-3'} rounded-xl text-white shadow-md flex items-center justify-center`} style={{ background: gradient }}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${trend.startsWith("↑") || trend === "On Track"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
              }`}>
              {trend}
            </div>
          )}
        </div>
        <p className={`${small ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 font-semibold mb-0.5 uppercase tracking-wider`}>{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className={`${small ? 'text-2xl' : 'text-3xl'} font-black text-gray-900 dark:text-white tracking-tight`}>{value}</h3>
          {subtitle && <span className="text-xs text-gray-400 font-bold">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children, colSpan = 1, description }: any) {
  return (
    <div className={`bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 w-full flex flex-col ${colSpan === 2 ? 'lg:col-span-2' : ''} ${colSpan === 3 ? 'lg:col-span-3' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-indigo-500 dark:text-indigo-400">{icon}</div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── GitHub Heatmap ─── */
function ActivityHeatmap({ logs, habits, rangeDays }: { logs: HabitLog[]; habits: Habit[]; rangeDays: string[] }) {
  const gridDays = useMemo(() => {
    const displayDays = rangeDays.length > 180 ? rangeDays.slice(-180) : rangeDays;
    return displayDays.map(date => {
      const dayLogs = logs.filter(l => l.date === date && l.completed);
      const intensity = habits.length === 0 ? 0 : dayLogs.length / habits.length;
      return { date, intensity, completed: dayLogs.length, total: habits.length };
    });
  }, [logs, habits, rangeDays]);

  const getColor = (i: number) => {
    if (i === 0) return 'bg-gray-100 dark:bg-gray-800/50';
    if (i <= 0.25) return 'bg-indigo-200 dark:bg-indigo-900/40';
    if (i <= 0.5) return 'bg-indigo-400 dark:bg-indigo-700/60';
    if (i <= 0.75) return 'bg-indigo-500 dark:bg-indigo-500/80';
    return 'bg-indigo-600 dark:bg-indigo-400';
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full overflow-x-auto pb-3">
        <div className="flex gap-1 sm:gap-1.5 min-w-max">
          {gridDays.map((day, i) => (
            <div key={i} title={`${new Date(day.date).toLocaleDateString()}: ${day.completed}/${day.total}`}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[3px] transition-all ${getColor(day.intensity)} hover:ring-2 ring-indigo-300/50 hover:scale-125 cursor-pointer`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <span>{new Date(gridDays[0]?.date || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {['bg-gray-100 dark:bg-gray-800/50', 'bg-indigo-200 dark:bg-indigo-900/40', 'bg-indigo-400 dark:bg-indigo-700/60', 'bg-indigo-600 dark:bg-indigo-400'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Consistency Score Ring ─── */
function ConsistencyScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', text: 'Excellent', emoji: '🏆' };
    if (score >= 60) return { stroke: '#6366f1', text: 'Good', emoji: '💪' };
    if (score >= 40) return { stroke: '#f59e0b', text: 'Average', emoji: '📈' };
    return { stroke: '#ef4444', text: 'Needs Work', emoji: '🎯' };
  };
  const { stroke, text, emoji } = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100 dark:text-gray-800" />
          <circle cx="50" cy="50" r="45" stroke={stroke} strokeWidth="6" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900 dark:text-white">{score}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-lg">{emoji}</span>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">{text}</p>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function AdvancedAnalyticsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "habits" | "patterns">("overview");

  useEffect(() => {
    if (!user) return;
    const unH = onSnapshot(collection(db, "users", user.uid, "habits"), s => {
      setHabits(s.docs.map(d => ({ id: d.id, name: d.data().name, color: d.data().color, category: d.data().category })));
    });
    const unL = onSnapshot(collection(db, "users", user.uid, "habitLogs"), s => {
      setLogs(s.docs.map(d => d.data() as HabitLog));
      setLoading(false);
    });
    return () => { unH(); unL(); };
  }, [user]);

  /* ─── Data Processing ─── */
  const rangeDays = useMemo(() => {
    if (timeRange === "custom" && customStart && customEnd) return generateCustomDateRange(customStart, customEnd);
    const map = { "7d": 7, "30d": 30, "90d": 90, "year": 365, "custom": 30 };
    return generateDateRange(map[timeRange]);
  }, [timeRange, customStart, customEnd]);

  const filteredHabits = useMemo(() =>
    selectedHabitId === "all" ? habits : habits.filter(h => h.id === selectedHabitId),
    [habits, selectedHabitId]);

  const filteredLogs = useMemo(() =>
    selectedHabitId === "all" ? logs : logs.filter(l => l.habitId === selectedHabitId),
    [logs, selectedHabitId]);

  const stats = useMemo(() => {
    const possible = filteredHabits.length * rangeDays.length;
    const completed = filteredLogs.filter(l => l.completed && rangeDays.includes(l.date)).length;
    const rate = possible === 0 ? 0 : Math.round((completed / possible) * 100);
    const allDates = filteredLogs.filter(l => l.completed).map(l => l.date);

    let perfectDays = 0;
    if (selectedHabitId === "all") {
      rangeDays.forEach(date => {
        const dayDone = logs.filter(l => l.date === date && l.completed).length;
        if (dayDone === habits.length && habits.length > 0) perfectDays++;
      });
    }

    // Consistency score (weighted metric)
    const streakWeight = 0.3;
    const rateWeight = 0.5;
    const perfectWeight = 0.2;
    const currentStreak = calculateStreak(allDates);
    const maxPossibleStreak = rangeDays.length;
    const streakScore = maxPossibleStreak > 0 ? Math.min((currentStreak / maxPossibleStreak) * 100, 100) : 0;
    const perfectScore = rangeDays.length > 0 ? (perfectDays / rangeDays.length) * 100 : 0;
    const consistencyScore = Math.round(rate * rateWeight + streakScore * streakWeight + perfectScore * perfectWeight);

    return {
      completionRate: rate,
      currentStreak,
      bestStreak: calculateBestStreak(allDates, rangeDays),
      totalCompleted: completed,
      perfectDays,
      avgDaily: rangeDays.length > 0 ? (completed / rangeDays.length).toFixed(1) : "0.0",
      consistencyScore: Math.min(consistencyScore, 100),
      totalPossible: possible,
      missedDays: rangeDays.length - perfectDays,
    };
  }, [filteredHabits, filteredLogs, rangeDays, logs, habits, selectedHabitId]);

  const trendData = useMemo(() => {
    return rangeDays.map(d => {
      const dateObj = new Date(d);
      const name = timeRange === "year"
        ? dateObj.toLocaleDateString("en-US", { month: "short" })
        : dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      const completed = filteredLogs.filter(l => l.date === d && l.completed).length;
      const rateVal = filteredHabits.length > 0 ? Math.round((completed / filteredHabits.length) * 100) : 0;
      return { name, fullDate: d, completed, rate: rateVal };
    });
  }, [filteredLogs, rangeDays, timeRange, filteredHabits]);

  const weeklyRhythmData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rhythm = days.map((day, i) => ({ day, count: 0, avg: 0 }));
    const weeksCount = Math.max(1, Math.ceil(rangeDays.length / 7));
    filteredLogs.forEach(l => {
      if (l.completed && rangeDays.includes(l.date)) {
        const dayIndex = new Date(l.date).getDay();
        rhythm[dayIndex].count += 1;
      }
    });
    rhythm.forEach(r => r.avg = Math.round(r.count / weeksCount * 10) / 10);
    return rhythm;
  }, [filteredLogs, rangeDays]);

  const habitBreakdown = useMemo(() => {
    return habits.map((h, idx) => {
      const hLogs = logs.filter(l => l.habitId === h.id && rangeDays.includes(l.date));
      const done = hLogs.filter(l => l.completed).length;
      return {
        id: h.id, name: h.name.length > 14 ? h.name.slice(0, 14) + "…" : h.name,
        fullName: h.name, completed: done,
        percent: rangeDays.length > 0 ? Math.round((done / rangeDays.length) * 100) : 0,
        color: h.color || COLORS[idx % COLORS.length],
        streak: calculateStreak(logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date)),
        bestStreak: calculateBestStreak(logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date), rangeDays),
        category: h.category || "Uncategorized",
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, rangeDays]);

  // Hourly pattern (hours when habits were completed — simulated based on data volume)
  const completionTrendByWeek = useMemo(() => {
    const weeks: { [key: string]: number } = {};
    rangeDays.forEach(d => {
      const date = new Date(d);
      const weekNum = Math.ceil(((date.getTime() - new Date(rangeDays[0]).getTime()) / (1000 * 60 * 60 * 24) + 1) / 7);
      const key = `W${weekNum}`;
      if (!weeks[key]) weeks[key] = 0;
      const dayCompleted = filteredLogs.filter(l => l.date === d && l.completed).length;
      weeks[key] += dayCompleted;
    });
    return Object.entries(weeks).map(([name, total]) => ({ name, total }));
  }, [rangeDays, filteredLogs]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const months: { [key: string]: { completed: number; total: number } } = {};
    rangeDays.forEach(d => {
      const monthKey = new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!months[monthKey]) months[monthKey] = { completed: 0, total: 0 };
      months[monthKey].total += filteredHabits.length;
      months[monthKey].completed += filteredLogs.filter(l => l.date === d && l.completed).length;
    });
    return Object.entries(months).map(([name, { completed, total }]) => ({
      name, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }));
  }, [rangeDays, filteredLogs, filteredHabits]);

  /* ─── Export Functions ─── */
  const exportCSV = useCallback(() => {
    const headers = ["Habit", "Date", "Completed"];
    const rows = logs.map(l => {
      const habit = habits.find(h => h.id === l.habitId);
      return `"${habit?.name || 'Unknown'}","${l.date}","${l.completed}"`;
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `habitflow-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [logs, habits]);

  const exportPDF = useCallback(() => {
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Title
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("HabitFlow Analytics Report", w / 2, y, { align: "center" });
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120);
    pdf.text(`Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, w / 2, y, { align: "center" });
    y += 12;

    // Key Metrics
    pdf.setTextColor(0);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Key Metrics", 14, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const metrics = [
      ["Completion Rate", `${stats.completionRate}%`],
      ["Current Streak", `${stats.currentStreak} days`],
      ["Best Streak", `${stats.bestStreak} days`],
      ["Daily Average", `${stats.avgDaily} actions`],
      ["Total Completed", `${stats.totalCompleted} / ${stats.totalPossible}`],
      ["Consistency Score", `${stats.consistencyScore}/100`],
    ];
    metrics.forEach(([label, value]) => {
      pdf.text(`${label}:`, 14, y);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, 70, y);
      pdf.setFont("helvetica", "normal");
      y += 6;
    });
    y += 6;

    // Habit Breakdown
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Habit Breakdown", 14, y);
    y += 8;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Habit", 14, y);
    pdf.text("Rate", 90, y);
    pdf.text("Done", 115, y);
    pdf.text("Streak", 140, y);
    pdf.text("Best", 165, y);
    y += 5;
    pdf.setDrawColor(200);
    pdf.line(14, y, w - 14, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    habitBreakdown.forEach(h => {
      if (y > 270) { pdf.addPage(); y = 20; }
      pdf.text(h.fullName.substring(0, 30), 14, y);
      pdf.text(`${h.percent}%`, 90, y);
      pdf.text(`${h.completed}`, 115, y);
      pdf.text(`${h.streak}d`, 140, y);
      pdf.text(`${h.bestStreak}d`, 165, y);
      y += 5;
    });

    pdf.save(`habitflow-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
  }, [stats, habitBreakdown]);

  /* ─── Render Guards ─── */
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#030712] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-bold tracking-widest uppercase animate-pulse">Crunching data…</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <TopNav />
        <main className="min-h-screen pt-24 px-4 bg-white dark:bg-[#030712] flex items-center justify-center">
          <div className="text-center bg-white dark:bg-[#111827] p-10 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Data Yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Start tracking habits to unlock powerful analytics.</p>
            <button onClick={() => window.location.href = '/dashboard'} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">
              Go to Dashboard
            </button>
          </div>
        </main>
      </>
    );
  }

  const svgIcon = (d: string, w = 5) => <svg className={`w-${w} h-${w}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-gray-900 dark:text-gray-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <TopNav />

      <main id="analytics-content" className="pt-16 sm:pt-20 lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 lg:space-y-12 transition-all duration-500 ease-out">

        {/* ═══ HEADER ═══ */}
        <header className="flex flex-col gap-5 bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
                Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400">Intelligence</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Deep analytics on your habits, patterns, and consistency.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {/* Habit filter */}
              <select
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm rounded-xl p-2.5 font-semibold outline-none w-full sm:w-44"
                value={selectedHabitId} onChange={e => setSelectedHabitId(e.target.value)}
              >
                <option value="all">⚡ All Habits</option>
                {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>

              {/* Time filter */}
              <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                {[{ id: "7d", l: "7D" }, { id: "30d", l: "30D" }, { id: "90d", l: "90D" }, { id: "year", l: "1Y" }, { id: "custom", l: "Custom" }].map(t => (
                  <button key={t.id} onClick={() => setTimeRange(t.id as TimeRange)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${timeRange === t.id ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                      }`}
                  >{t.l}</button>
                ))}
              </div>

              {timeRange === "custom" && (
                <div className="flex gap-2 items-center">
                  <input type="date" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm rounded-xl p-2 outline-none" onChange={e => setCustomStart(e.target.value)} />
                  <span className="text-gray-400 text-xs">to</span>
                  <input type="date" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm rounded-xl p-2 outline-none" onChange={e => setCustomEnd(e.target.value)} />
                </div>
              )}

              {/* Export buttons */}
              <div className="flex gap-2">
                <button onClick={exportCSV} className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-500/20">
                  CSV ↓
                </button>
                <button onClick={exportPDF} className="px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-200 dark:border-rose-500/20">
                  PDF ↓
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700 w-full sm:w-auto self-start">
            {(["overview", "habits", "patterns"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >{tab}</button>
            ))}
          </div>
        </header>

        {/* ═══ KEY METRICS ═══ */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard small icon={svgIcon("M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z")}
            title="Completion" value={`${stats.completionRate}%`} gradient="linear-gradient(135deg, #6366f1, #a855f7)" trend={stats.completionRate >= 50 ? "On Track" : "↓ Low"} />
          <StatCard small icon={svgIcon("M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z")}
            title="Fire Streak" value={stats.currentStreak} subtitle="days" gradient="linear-gradient(135deg, #f59e0b, #ef4444)" />
          <StatCard small icon={svgIcon("M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z")}
            title="Best Streak" value={stats.bestStreak} subtitle="days" gradient="linear-gradient(135deg, #10b981, #14b8a6)" />
          <StatCard small icon={svgIcon("M13 10V3L4 14h7v7l9-11h-7z")}
            title="Daily Avg" value={stats.avgDaily} subtitle="actions" gradient="linear-gradient(135deg, #ec4899, #f43f5e)" />
          <StatCard small icon={svgIcon("M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z")}
            title={selectedHabitId === "all" ? "Perfect Days" : "Completed"} value={selectedHabitId === "all" ? stats.perfectDays : stats.totalCompleted} gradient="linear-gradient(135deg, #0ea5e9, #06b6d4)" />
          <StatCard small icon={svgIcon("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z")}
            title="Total Done" value={stats.totalCompleted} subtitle={`/${stats.totalPossible}`} gradient="linear-gradient(135deg, #d946ef, #a855f7)" />
        </section>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === "overview" && (
          <>
            {/* Row 1: Consistency Score + Momentum */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              <ChartCard title="Consistency Score" description="Weighted composite metric" icon={svgIcon("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z")}>
                <ConsistencyScore score={stats.consistencyScore} />
              </ChartCard>

              <ChartCard colSpan={3} title="Momentum Overview" description="Daily completions over time" icon={svgIcon("M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z")}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={3} fill="url(#colorComp)" activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2: Completion Rate Line + Weekly Rhythm + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <ChartCard title="Completion Rate Trend" description="Daily % over time" icon={svgIcon("M13 7h8m0 0v8m0-8l-8 8-4-4-6 6")}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="rate" name="Rate %" stroke="#14b8a6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Weekly Rhythm" description="Which days you perform best" icon={svgIcon("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyRhythmData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Completions" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Activity Heatmap" description="Color intensity = completion %" icon={svgIcon("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z")}>
                <ActivityHeatmap logs={logs} habits={filteredHabits} rangeDays={rangeDays} />
              </ChartCard>
            </div>

            {/* Row 3: Weekly Trend + Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <ChartCard title="Weekly Output Trend" description="Total completions per week" icon={svgIcon("M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionTrendByWeek} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {selectedHabitId === "all" && habitBreakdown.length > 0 && (
                <ChartCard title="Habit Distribution" description="Share of total completions" icon={svgIcon("M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z")}>
                  <div className="relative h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={habitBreakdown.filter(h => h.completed > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="completed" stroke="none">
                          {habitBreakdown.map((e, i) => <Cell key={i} fill={e.color} className="hover:opacity-80 transition-opacity outline-none" />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalCompleted}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                    </div>
                  </div>
                </ChartCard>
              )}
            </div>
          </>
        )}

        {/* ═══ HABITS TAB ═══ */}
        {activeTab === "habits" && (
          <>
            {/* Performance Gap */}
            {selectedHabitId === "all" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <ChartCard title="Performance Ranking" description="Sorted by success rate" icon={svgIcon("M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12")}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={habitBreakdown.slice(0, 8)} margin={{ top: 0, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="percent" name="Rate %" radius={[0, 4, 4, 0]} barSize={20}>
                        {habitBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {habitBreakdown.length > 2 && (
                  <ChartCard title="Consistency Radar" description="Balance across habits" icon={svgIcon("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={habitBreakdown.slice(0, 6)}>
                        <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Rate %" dataKey="percent" stroke="#ec4899" strokeWidth={2.5} fill="#ec4899" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Habit Leaderboard</h2>
                <span className="text-xs text-gray-400 font-medium">{habitBreakdown.length} habits</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Habit</th>
                      <th className="px-5 py-3">Rate</th>
                      <th className="px-5 py-3">Done</th>
                      <th className="px-5 py-3">Streak</th>
                      <th className="px-5 py-3">Best</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {habitBreakdown.map((h, i) => (
                      <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${i === 0 ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' :
                            i === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                              i === 2 ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' :
                                'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>{i + 1}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{h.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 dark:text-white w-8">{h.percent}%</span>
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${h.percent}%`, backgroundColor: h.color }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-gray-500">
                          <span className="text-gray-900 dark:text-white font-bold">{h.completed}</span>/{rangeDays.length}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold">
                            🔥 {h.streak}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                          {h.bestStreak}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══ PATTERNS TAB ═══ */}
        {activeTab === "patterns" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Monthly Comparison */}
              <ChartCard title="Monthly Comparison" description="Completion rate by month" icon={svgIcon("M7 12l3-3 3 3 4-4")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name="Rate %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Heatmap (larger) */}
              <ChartCard title="Activity Intensity Map" description="Full period heatmap" icon={svgIcon("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z")}>
                <ActivityHeatmap logs={logs} habits={filteredHabits} rangeDays={rangeDays} />
              </ChartCard>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">💡 Insight</p>
                <p className="text-sm font-bold leading-relaxed">
                  {stats.completionRate >= 70
                    ? "Excellent momentum! You're completing habits consistently."
                    : stats.completionRate >= 40
                      ? "Good progress, but there's room for improvement. Try to focus on consistency."
                      : "Your completion rate needs work. Start with fewer habits and build up gradually."}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">📊 Best Day</p>
                <p className="text-sm font-bold leading-relaxed">
                  {(() => {
                    const bestDay = weeklyRhythmData.reduce((max, d) => d.count > max.count ? d : max, weeklyRhythmData[0]);
                    return `Your most productive day is ${bestDay.day} with ${bestDay.count} total completions!`;
                  })()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">🏆 Top Habit</p>
                <p className="text-sm font-bold leading-relaxed">
                  {habitBreakdown.length > 0
                    ? `"${habitBreakdown[0].fullName}" is your most consistent habit at ${habitBreakdown[0].percent}%.`
                    : "No habits tracked yet."}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">🎯 Focus Area</p>
                <p className="text-sm font-bold leading-relaxed">
                  {habitBreakdown.length > 1
                    ? `Focus on "${habitBreakdown[habitBreakdown.length - 1].fullName}" — it needs the most attention at ${habitBreakdown[habitBreakdown.length - 1].percent}%.`
                    : "Add more habits to get focus insights."}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}