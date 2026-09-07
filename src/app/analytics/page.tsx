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
  LineChart, Line,
} from "recharts";
import jsPDF from "jspdf";
import {
  TrendingUp,
  Award,
  Zap,
  Calendar,
  FileSpreadsheet,
  FileText,
  Sparkles,
  PieChart as PieIcon,
  Layers,
  ShieldCheck,
  Flame,
} from "lucide-react";

/* ─── Types ─── */
type Habit = { id: string; name: string; color?: string; category?: string };
type HabitLog = { habitId: string; date: string; completed: boolean };
type TimeRange = "7d" | "30d" | "90d" | "year" | "custom";

/* ─── Utils ─── */
function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDateRange(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return getLocalDateString(d);
  });
}

function generateCustomDateRange(start: string, end: string) {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const curr = new Date(sy, sm - 1, sd);
  const endD = new Date(ey, em - 1, ed);
  while (curr <= endD) {
    dates.push(getLocalDateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let startOffset = 0;
  if (!set.has(todayStr)) {
    if (set.has(yesterdayStr)) {
      startOffset = 1;
    } else {
      return 0;
    }
  }

  let streak = 0;
  for (let i = startOffset; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

function calculateBestStreak(dates: string[], rangeDays?: string[]) {
  const filtered = rangeDays ? dates.filter((d) => rangeDays.includes(d)) : dates;
  const sorted = Array.from(new Set(filtered)).sort();
  if (sorted.length === 0) return 0;
  let max = 1, curr = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [y1, m1, d1] = sorted[i - 1].split("-").map(Number);
    const [y2, m2, d2] = sorted[i].split("-").map(Number);
    const prev = new Date(y1, m1 - 1, d1);
    const cd = new Date(y2, m2 - 1, d2);
    const diff = Math.round((cd.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      curr++;
      max = Math.max(max, curr);
    } else {
      curr = 1;
    }
  }
  return max;
}

/* 60-30-10 Royal Amethyst & Luminous Gilded Gold Palette (Zero Red/Green/Blue/Orange) */
const AMETHYST_GOLD_COLORS = [
  "#7C3AED", // Royal Amethyst (Primary hero)
  "#EAB308", // Luminous Gilded Gold (Complementary accent)
  "#A855F7", // Bright Amethyst Orchid
  "#FACC15", // Warm Radiant Gold
  "#6D28D9", // Deep Imperial Violet
  "#CA8A04", // Antique Burnished Aurum
  "#71717A", // Smoked Titanium Slate
  "#C084FC", // Soft Amethyst Glow
];

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl border border-stone-200 dark:border-[#272732] rounded-xl p-3 shadow-xl text-xs">
        <p className="text-stone-900 dark:text-white font-bold mb-1.5 border-b border-stone-100 dark:border-[#272732] pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-stone-500 dark:text-[#9090A0] font-medium">{entry.name}</span>
              </div>
              <span className="text-stone-900 dark:text-white font-black">
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

function ChartCard({ title, icon, children, colSpan = 1, description }: any) {
  return (
    <div className={`bg-white dark:bg-[#121218] rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200/80 dark:border-[#272732] flex flex-col overflow-hidden ${
      colSpan === 2 ? 'lg:col-span-2' : ''
    } ${colSpan === 3 ? 'lg:col-span-3' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308] border border-violet-500/20">
            {icon}
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">{title}</h2>
            {description && <p className="text-[10px] text-stone-400 dark:text-[#9090A0] font-medium">{description}</p>}
          </div>
        </div>
      </div>
      <div className="w-full flex-1 min-h-[250px] overflow-x-auto custom-scrollbar">
        <div className="min-w-[340px] h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ logs, habits, rangeDays }: { logs: HabitLog[]; habits: Habit[]; rangeDays: string[] }) {
  const gridDays = useMemo(() => {
    const displayDays = rangeDays.length > 180 ? rangeDays.slice(-180) : rangeDays;
    return displayDays.map((date) => {
      const dayLogs = logs.filter((l) => l.date === date && l.completed);
      const intensity = habits.length === 0 ? 0 : dayLogs.length / habits.length;
      return { date, intensity, completed: dayLogs.length, total: habits.length };
    });
  }, [logs, habits, rangeDays]);

  const getColor = (i: number) => {
    if (i === 0) return 'bg-slate-100 dark:bg-[#1A1A22]';
    if (i <= 0.25) return 'bg-[#7C3AED]/25 dark:bg-[#7C3AED]/20';
    if (i <= 0.5) return 'bg-[#7C3AED]/60 dark:bg-[#7C3AED]/50';
    if (i <= 0.75) return 'bg-[#EAB308]/75 dark:bg-[#EAB308]/70';
    return 'bg-[#EAB308] dark:bg-[#EAB308]';
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-2">
      <div className="w-full overflow-x-auto pb-3 custom-scrollbar">
        <div className="flex gap-1 sm:gap-1.5 min-w-max">
          {gridDays.map((day, i) => (
            <div
              key={i}
              title={`${new Date(day.date + "T00:00:00").toLocaleDateString()}: ${day.completed}/${day.total} habits completed`}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-all ${getColor(day.intensity)} hover:ring-2 ring-violet-400/50 hover:scale-125 cursor-pointer`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 dark:text-[#9090A0] font-bold uppercase tracking-wider">
        <span>{new Date((gridDays[0]?.date || "") + "T00:00:00").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {['bg-slate-100 dark:bg-[#1A1A22]', 'bg-[#7C3AED]/25 dark:bg-[#7C3AED]/20', 'bg-[#7C3AED]/60 dark:bg-[#7C3AED]/50', 'bg-[#EAB308]'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-xs ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function ConsistencyScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return { stroke: '#EAB308', text: 'Elite Consistency', emoji: '👑' };
    if (score >= 60) return { stroke: '#7C3AED', text: 'Strong Rhythm', emoji: '⚡' };
    if (score >= 40) return { stroke: '#A855F7', text: 'Building Pace', emoji: '📈' };
    return { stroke: '#6D28D9', text: 'Needs Alignment', emoji: '🎯' };
  };
  const { stroke, text, emoji } = getColor();

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative w-30 h-30 sm:w-34 sm:h-34">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-stone-100 dark:text-[#1A1A22]" />
          <circle
            cx="50" cy="50" r="45" stroke={stroke} strokeWidth="6" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black font-heading text-stone-900 dark:text-white">{score}</span>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Score</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1">
          <span>{emoji}</span>
          <span>{text}</span>
        </p>
      </div>
    </div>
  );
}

export default function AdvancedAnalyticsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "habits" | "insights">("overview");

  useEffect(() => {
    if (!user) return;
    const unH = onSnapshot(collection(db, "users", user.uid, "habits"), (s) => {
      setHabits(s.docs.map((d) => ({ id: d.id, name: d.data().name, color: d.data().color, category: d.data().category })));
    });
    const unL = onSnapshot(collection(db, "users", user.uid, "habitLogs"), (s) => {
      setLogs(s.docs.map((d) => d.data() as HabitLog));
      setLoading(false);
    });
    return () => {
      unH();
      unL();
    };
  }, [user]);

  const rangeDays = useMemo(() => {
    if (timeRange === "custom" && customStart && customEnd) return generateCustomDateRange(customStart, customEnd);
    const map = { "7d": 7, "30d": 30, "90d": 90, "year": 365, "custom": 30 };
    return generateDateRange(map[timeRange]);
  }, [timeRange, customStart, customEnd]);

  const filteredHabits = useMemo(() =>
    selectedHabitId === "all" ? habits : habits.filter((h) => h.id === selectedHabitId),
    [habits, selectedHabitId]);

  const filteredLogs = useMemo(() =>
    selectedHabitId === "all" ? logs : logs.filter((l) => l.habitId === selectedHabitId),
    [logs, selectedHabitId]);

  const stats = useMemo(() => {
    const possible = filteredHabits.length * rangeDays.length;
    const completed = filteredLogs.filter((l) => l.completed && rangeDays.includes(l.date)).length;
    const rate = possible === 0 ? 0 : Math.round((completed / possible) * 100);
    const allDates = filteredLogs.filter((l) => l.completed).map((l) => l.date);

    let perfectDays = 0;
    if (selectedHabitId === "all" && habits.length > 0) {
      rangeDays.forEach((date) => {
        const completedHabitIds = new Set(
          logs.filter((l) => l.date === date && l.completed).map((l) => l.habitId)
        );
        const habitsOnDate = habits.filter((h: any) => {
          if (!h.createdAt) return true;
          const createdDate = h.createdAt.toDate
            ? getLocalDateString(h.createdAt.toDate())
            : typeof h.createdAt === "string"
            ? h.createdAt.split("T")[0]
            : getLocalDateString(new Date(h.createdAt));
          return createdDate <= date;
        });
        const targetHabits = habitsOnDate.length > 0 ? habitsOnDate : habits;
        if (targetHabits.length > 0 && targetHabits.every((h: any) => completedHabitIds.has(h.id))) {
          perfectDays++;
        }
      });
    }

    const currentStreak = calculateStreak(allDates);
    const maxPossibleStreak = rangeDays.length;
    const streakScore = maxPossibleStreak > 0 ? Math.min((currentStreak / maxPossibleStreak) * 100, 100) : 0;
    const perfectScore = rangeDays.length > 0 ? (perfectDays / rangeDays.length) * 100 : 0;
    const consistencyScore = Math.round(rate * 0.5 + streakScore * 0.3 + perfectScore * 0.2);

    return {
      completionRate: rate,
      currentStreak,
      bestStreak: calculateBestStreak(allDates, rangeDays),
      totalCompleted: completed,
      perfectDays,
      avgDaily: rangeDays.length > 0 ? (completed / rangeDays.length).toFixed(1) : "0.0",
      consistencyScore: Math.min(consistencyScore, 100),
      totalPossible: possible,
    };
  }, [filteredHabits, filteredLogs, rangeDays, logs, habits, selectedHabitId]);

  const trendData = useMemo(() => {
    return rangeDays.map((d) => {
      const dateObj = new Date(d + "T00:00:00");
      const name = timeRange === "year"
        ? dateObj.toLocaleDateString("en-US", { month: "short" })
        : dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      const completed = filteredLogs.filter((l) => l.date === d && l.completed).length;
      const rateVal = filteredHabits.length > 0 ? Math.round((completed / filteredHabits.length) * 100) : 0;
      return { name, fullDate: d, completed, rate: rateVal };
    });
  }, [filteredLogs, rangeDays, timeRange, filteredHabits]);

  const weeklyRhythmData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rhythm = days.map((day) => ({ day, count: 0, avg: 0 }));
    const weeksCount = Math.max(1, Math.ceil(rangeDays.length / 7));
    filteredLogs.forEach((l) => {
      if (l.completed && rangeDays.includes(l.date)) {
        const dayIndex = new Date(l.date + "T00:00:00").getDay();
        rhythm[dayIndex].count += 1;
      }
    });
    rhythm.forEach((r) => r.avg = Math.round((r.count / weeksCount) * 10) / 10);
    return rhythm;
  }, [filteredLogs, rangeDays]);

  const habitBreakdown = useMemo(() => {
    return habits.map((h, idx) => {
      const hLogs = logs.filter((l) => l.habitId === h.id && rangeDays.includes(l.date));
      const done = hLogs.filter((l) => l.completed).length;
      return {
        id: h.id,
        name: h.name.length > 14 ? h.name.slice(0, 14) + "…" : h.name,
        fullName: h.name,
        completed: done,
        percent: rangeDays.length > 0 ? Math.round((done / rangeDays.length) * 100) : 0,
        color: h.color || AMETHYST_GOLD_COLORS[idx % AMETHYST_GOLD_COLORS.length],
        streak: calculateStreak(logs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date)),
        bestStreak: calculateBestStreak(logs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date), rangeDays),
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, rangeDays]);

  const generatedInsights = useMemo(() => {
    const insights: { title: string; desc: string; type: "positive" | "warning" | "tip" }[] = [];

    const bestDay = [...weeklyRhythmData].sort((a, b) => b.count - a.count)[0];
    const lowestDay = [...weeklyRhythmData].sort((a, b) => a.count - b.count)[0];
    if (bestDay && bestDay.count > 0) {
      insights.push({
        title: `Peak Momentum: ${bestDay.day}`,
        desc: `You register the highest habit completion volume on ${bestDay.day}s with an average of ${bestDay.avg} daily check-ins.`,
        type: "positive",
      });
    }
    if (lowestDay && lowestDay.count < bestDay?.count * 0.6) {
      insights.push({
        title: `Downtime Dip: ${lowestDay.day}`,
        desc: `Activity dips on ${lowestDay.day}s. Consider scheduling lighter micro-habits on this day to avoid breaking streaks.`,
        type: "warning",
      });
    }

    if (habitBreakdown.length > 0) {
      const topHabit = habitBreakdown[0];
      if (topHabit.percent >= 70) {
        insights.push({
          title: `Anchor Habit: "${topHabit.fullName}"`,
          desc: `Outstanding ${topHabit.percent}% completion rate. Use this anchor habit to stack other emerging habits right after it.`,
          type: "positive",
        });
      }
      const lowestHabit = habitBreakdown[habitBreakdown.length - 1];
      if (lowestHabit && lowestHabit.percent < 40) {
        insights.push({
          title: `Needs Attention: "${lowestHabit.fullName}"`,
          desc: `Currently at ${lowestHabit.percent}% completion. Try reducing its scope to 2 minutes daily to re-ignite consistency.`,
          type: "tip",
        });
      }
    }

    if (stats.consistencyScore >= 75) {
      insights.push({
        title: "Elite Consistency Tier",
        desc: `Your consistency score of ${stats.consistencyScore}/100 places your daily systems in the top tier of habit builders.`,
        type: "positive",
      });
    } else {
      insights.push({
        title: "Compound Growth Opportunity",
        desc: "Small daily improvements yield exponential results over 30 days. Prioritize checking off at least 1 habit early in the day.",
        type: "tip",
      });
    }

    return insights;
  }, [weeklyRhythmData, habitBreakdown, stats]);

  const exportCSV = useCallback(() => {
    const headers = ["Habit", "Date", "Completed"];
    const rows = logs.map((l) => {
      const habit = habits.find((h) => h.id === l.habitId);
      return `"${habit?.name || 'Unknown'}","${l.date}","${l.completed}"`;
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitflow-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, habits]);

  const exportPDF = useCallback(() => {
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("HabitFlow Analytics Performance Report", w / 2, y, { align: "center" });
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120);
    pdf.text(`Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, w / 2, y, { align: "center" });
    y += 12;

    pdf.setTextColor(0);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.text("Executive Metrics", 14, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const metrics = [
      ["Completion Rate", `${stats.completionRate}%`],
      ["Current Active Streak", `${stats.currentStreak} days`],
      ["Best Historical Streak", `${stats.bestStreak} days`],
      ["Daily Average", `${stats.avgDaily} completions/day`],
      ["Total Completed", `${stats.totalCompleted} / ${stats.totalPossible}`],
      ["Consistency Score", `${stats.consistencyScore} / 100`],
    ];

    metrics.forEach(([label, value]) => {
      pdf.text(`${label}:`, 14, y);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, 80, y);
      pdf.setFont("helvetica", "normal");
      y += 6;
    });

    y += 8;
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.text("Habit Leaderboard", 14, y);
    y += 8;

    pdf.setFontSize(9);
    habitBreakdown.forEach((h) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(h.fullName.substring(0, 30), 14, y);
      pdf.text(`${h.percent}%`, 90, y);
      pdf.text(`${h.completed} completions`, 120, y);
      pdf.text(`${h.streak}d streak`, 165, y);
      y += 6;
    });

    pdf.save(`habitflow-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
  }, [stats, habitBreakdown]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-stone-100 selection:bg-violet-500/25">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1540px] mx-auto space-y-6">

        {/* ━━━━━ HEADER & CONTROLS ━━━━━ */}
        <header className="flex flex-col gap-4 bg-white/80 dark:bg-[#121218] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-[#272732] backdrop-blur-xl shadow-xs">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308]">
                  Performance Analytics
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                Habit <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Intelligence</span>
              </h1>
              <p className="text-stone-500 dark:text-[#9090A0] text-xs sm:text-sm font-medium">
                Deep data analysis, habit correlations, and AI-driven growth patterns.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                className="bg-stone-100 dark:bg-[#1A1A22] border border-stone-200 dark:border-[#272732] text-xs sm:text-sm rounded-xl px-3 py-2 font-bold outline-none cursor-pointer text-stone-800 dark:text-stone-200"
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
              >
                <option value="all">⚡ All Active Habits</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>

              <div className="flex bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl border border-stone-200 dark:border-[#272732] overflow-x-auto">
                {[
                  { id: "7d", l: "7D" },
                  { id: "30d", l: "30D" },
                  { id: "90d", l: "90D" },
                  { id: "year", l: "1Y" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeRange(t.id as TimeRange)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeRange === t.id
                        ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs"
                        : "text-stone-500 hover:text-stone-900 dark:text-[#9090A0]"
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-[#1A1A22] hover:bg-stone-200 dark:hover:bg-[#272732] border border-stone-200 dark:border-[#272732] text-stone-700 dark:text-stone-300 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#EAB308]" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-[#1A1A22] hover:bg-stone-200 dark:hover:bg-[#272732] border border-stone-200 dark:border-[#272732] text-stone-700 dark:text-stone-300 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl border border-stone-200/50 dark:border-[#272732]/50 self-start">
            {[
              { id: "overview", label: "Overview" },
              { id: "habits", label: "Habit Breakdown" },
              { id: "insights", label: "AI Insights" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs"
                    : "text-stone-500 hover:text-stone-900 dark:text-[#9090A0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* ━━━━━ KEY PERFORMANCE METRICS ━━━━━ */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Completion Rate</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#7C3AED] dark:text-[#EAB308]">{stats.completionRate}%</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Active Streak</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#EAB308]">{stats.currentStreak}d</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Best Historical</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#A855F7]">{stats.bestStreak}d</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Daily Average</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#7C3AED]">{stats.avgDaily}</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Total Checked</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#EAB308]">{stats.totalCompleted}</div>
          </div>
          <div className="bg-white dark:bg-[#121218] rounded-2xl p-4 border border-stone-200/80 dark:border-[#272732] shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Perfect Days</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-[#FACC15]">{stats.perfectDays}d</div>
          </div>
        </section>

        {/* ━━━━━ TAB 1: OVERVIEW ━━━━━ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              <ChartCard
                title="Consistency Score"
                description="Composite weighted reliability index"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                <ConsistencyScoreGauge score={stats.consistencyScore} />
              </ChartCard>

              <ChartCard
                colSpan={3}
                title="Habit Momentum Trajectory"
                description="Daily completed habit volume across time"
                icon={<TrendingUp className="w-4 h-4" />}
              >
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="amethystGoldArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-[#272732]" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} minTickGap={25} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      fill="url(#amethystGoldArea)"
                      activeDot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <ChartCard
                title="Weekly Rhythm"
                description="Performance distribution by weekday"
                icon={<Calendar className="w-4 h-4" />}
              >
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={weeklyRhythmData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-[#272732]" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Completions" fill="#EAB308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Completion Rate Curve"
                description="Daily % execution rate"
                icon={<Zap className="w-4 h-4" />}
              >
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-[#272732]" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="rate" name="Rate %" stroke="#A855F7" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Activity Heatmap"
                description="Color saturation indicates daily density"
                icon={<Layers className="w-4 h-4" />}
              >
                <ActivityHeatmap logs={logs} habits={filteredHabits} rangeDays={rangeDays} />
              </ChartCard>
            </div>
          </div>
        )}

        {/* ━━━━━ TAB 2: HABIT BREAKDOWN ━━━━━ */}
        {activeTab === "habits" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {habitBreakdown.length > 0 && (
                <ChartCard
                  title="Habit Volume Distribution"
                  description="Share of total completed actions"
                  icon={<PieIcon className="w-4 h-4" />}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={habitBreakdown.filter((h) => h.completed > 0)}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        paddingAngle={3} dataKey="completed" stroke="none"
                      >
                        {habitBreakdown.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {habitBreakdown.length > 2 && (
                <ChartCard
                  title="Routine Balance Radar"
                  description="Symmetry across top habits"
                  icon={<Award className="w-4 h-4" />}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={habitBreakdown.slice(0, 6)}>
                      <PolarGrid stroke="#e5e7eb" className="dark:stroke-[#272732]" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Rate %" dataKey="percent" stroke="#7C3AED" strokeWidth={2} fill="#7C3AED" fillOpacity={0.25} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-[#272732] flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Habit Performance Leaderboard</h3>
                <span className="text-xs text-stone-400 font-semibold">{habitBreakdown.length} total habits</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-[#1A1A22] text-[10px] uppercase font-bold text-stone-400 border-b border-stone-100 dark:border-[#272732]">
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Habit</th>
                      <th className="px-5 py-3">Rate</th>
                      <th className="px-5 py-3">Completions</th>
                      <th className="px-5 py-3">Current Streak</th>
                      <th className="px-5 py-3">Best Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-[#272732] text-xs">
                    {habitBreakdown.map((h, i) => (
                      <tr key={h.id} className="hover:bg-stone-50 dark:hover:bg-[#1A1A22]/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-stone-400">{i + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-stone-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                            <span>{h.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{h.percent}%</span>
                            <div className="w-16 h-1.5 bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${h.percent}%`, backgroundColor: h.color }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-stone-500 dark:text-[#9090A0]">
                          {h.completed} / {rangeDays.length}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[#EAB308]">
                            <Flame className="w-3 h-3" />
                            {h.streak}d
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-stone-500 dark:text-[#9090A0]">{h.bestStreak}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━ TAB 3: AI INSIGHTS ━━━━━ */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedInsights.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
                    item.type === "positive"
                      ? "bg-[#7C3AED]/10 border-[#7C3AED]/25"
                      : item.type === "warning"
                      ? "bg-[#EAB308]/10 border-[#EAB308]/25"
                      : "bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${
                      item.type === "positive" ? "text-[#7C3AED]" : item.type === "warning" ? "text-[#EAB308]" : "text-stone-400"
                    }`} />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}