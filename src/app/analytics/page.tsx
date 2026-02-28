"use client";

import { useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

/* -------------------- Types -------------------- */
type Habit = {
  id: string;
  name: string;
  color?: string; // Pulled from dashboard if available
};

type HabitLog = {
  habitId: string;
  date: string;
  completed: boolean;
};

type TimeRange = "7d" | "30d" | "90d" | "year";

/* -------------------- Utils -------------------- */
function generateDateRange(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function calculateStreak(dates: string[], rangeDays?: string[]) {
  const set = new Set(dates);
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (rangeDays && !rangeDays.includes(key)) break;
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

function calculateBestStreak(dates: string[], rangeDays?: string[]) {
  const filteredDates = rangeDays ? dates.filter(d => rangeDays.includes(d)) : dates;
  const sortedDates = [...new Set(filteredDates)].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach((dateStr) => {
    const currentDate = new Date(dateStr);
    if (prevDate) {
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prevDate = currentDate;
  });
  return Math.max(maxStreak, currentStreak);
}

// Modern, professional color palette
const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#10b981", "#3b82f6", "#f43f5e",
  "#0ea5e9", "#84cc16", "#d946ef", "#06b6d4"
];

/* -------------------- Custom Recharts Components -------------------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-xl">
        <p className="text-gray-900 dark:text-white font-bold text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-gray-900 dark:text-white font-black text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/* -------------------- UI Components -------------------- */
function StatCard({ icon, title, value, subtitle, gradient, trend }: any) {
  return (
    <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      {/* Subtle background glow */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.15] blur-3xl group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: gradient }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div 
            className="p-3.5 rounded-2xl text-white shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300"
            style={{ background: gradient }}
          >
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full">
              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1 tracking-wide uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl 2xl:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {value}
            </h3>
            {subtitle && (
              <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children, action }: any) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

/* -------------------- GitHub Style Heatmap -------------------- */
function Heatmap({ logs, habits, rangeDays }: { logs: HabitLog[], habits: Habit[], rangeDays: string[] }) {
  const gridDays = useMemo(() => {
    // Show max 180 days for the heatmap to keep it performant and clean
    const displayDays = rangeDays.length > 180 ? rangeDays.slice(-180) : rangeDays;
    return displayDays.map(date => {
      const dayLogs = logs.filter(l => l.date === date && l.completed);
      const intensity = habits.length === 0 ? 0 : dayLogs.length / habits.length;
      return { date, intensity, completed: dayLogs.length, total: habits.length };
    });
  }, [logs, habits, rangeDays]);

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800/50';
    if (intensity <= 0.25) return 'bg-indigo-200 dark:bg-indigo-900/40';
    if (intensity <= 0.5) return 'bg-indigo-400 dark:bg-indigo-700/60';
    if (intensity <= 0.75) return 'bg-indigo-500 dark:bg-indigo-500/80';
    return 'bg-indigo-600 dark:bg-indigo-400';
  };

  return (
    // STRICT OVERFLOW CONTROL ensures no screen-breaking on mobile
    <div className="w-full">
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-1.5 sm:gap-2 min-w-max pr-4">
          {gridDays.map((day, i) => (
            <div 
              key={i} 
              title={`${new Date(day.date).toLocaleDateString()}: ${day.completed}/${day.total} habits`}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all duration-300 ${getColor(day.intensity)} hover:ring-4 ring-indigo-300/50 dark:ring-indigo-500/50 hover:scale-110 cursor-pointer`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-gray-400 font-bold tracking-wide uppercase">
        <span>{new Date(gridDays[0]?.date || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800/50"></div>
            <div className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-900/40"></div>
            <div className="w-3 h-3 rounded bg-indigo-400 dark:bg-indigo-700/60"></div>
            <div className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-400"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  useEffect(() => {
    if (!user) return;
    const unsubHabits = onSnapshot(collection(db, "users", user.uid, "habits"), (snap) => {
      setHabits(snap.docs.map((d) => ({ id: d.id, name: d.data().name, color: d.data().color })));
    });
    const unsubLogs = onSnapshot(collection(db, "users", user.uid, "habitLogs"), (snap) => {
      setLogs(snap.docs.map((d) => d.data() as HabitLog));
      setLoading(false);
    });
    return () => { unsubHabits(); unsubLogs(); };
  }, [user]);

  /* -------------------- Data Processing -------------------- */
  const rangeDays = useMemo(() => {
    const map = { "7d": 7, "30d": 30, "90d": 90, "year": 365 };
    return generateDateRange(map[timeRange]);
  }, [timeRange]);

  const stats = useMemo(() => {
    const possible = habits.length * rangeDays.length;
    const completedInRange = logs.filter((l) => l.completed && rangeDays.includes(l.date)).length;
    const completionRate = possible === 0 ? 0 : Math.round((completedInRange / possible) * 100);
    const allCompletedDates = logs.filter((l) => l.completed).map((l) => l.date);
    
    return {
      completionRate,
      currentStreak: calculateStreak(allCompletedDates),
      bestStreak: calculateBestStreak(allCompletedDates, rangeDays),
      totalCompleted: completedInRange,
      avgDaily: rangeDays.length > 0 ? (completedInRange / rangeDays.length).toFixed(1) : "0.0",
    };
  }, [habits, logs, rangeDays]);

  const trendData = useMemo(() => {
    return rangeDays.map((d) => {
      const dateObj = new Date(d);
      // For a year, returning only Month to avoid extreme squishing
      const name = timeRange === "year" 
        ? dateObj.toLocaleDateString("en-US", { month: "short" }) 
        : dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
        
      return {
        name,
        fullDate: d,
        completed: logs.filter((l) => l.date === d && l.completed).length,
        total: habits.length
      };
    });
  }, [logs, habits, rangeDays, timeRange]);

  const habitBreakdown = useMemo(() => {
    return habits.map((h, idx) => {
      const habitLogs = logs.filter((l) => l.habitId === h.id && rangeDays.includes(l.date));
      const done = habitLogs.filter((l) => l.completed).length;
      const streak = calculateStreak(
        logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date), 
        rangeDays
      );
      
      return {
        id: h.id,
        name: h.name.length > 15 ? h.name.slice(0, 15) + "..." : h.name,
        fullName: h.name,
        completed: done,
        percent: rangeDays.length > 0 ? Math.round((done / rangeDays.length) * 100) : 0,
        color: h.color || COLORS[idx % COLORS.length],
        streak,
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, rangeDays]);

  /* -------------------- Render Checks -------------------- */
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-lg shadow-indigo-500/20" />
        <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase animate-pulse">Analyzing Data...</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <TopNav />
        <main className="min-h-screen pt-24 px-4 bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center">
          <div className="text-center bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-indigo-50 dark:ring-indigo-900/10">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Blank Canvas</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg leading-relaxed">
              Your analytics will come to life here once you create your first habit and start tracking your daily progress.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-2xl font-bold transition-all shadow-xl active:scale-95 text-lg"
            >
              Start Your Journey
            </button>
          </div>
        </main>
      </>
    );
  }

  /* -------------------- Main UI Render -------------------- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">
      <TopNav />
      {/* Max width set to 1600px for Ultra-wide/TV support */}
      <main className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-8 lg:space-y-10">
        
        {/* ================= HEADER & FILTERS ================= */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white/50 dark:bg-gray-900/50 p-6 sm:p-8 rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-xl">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              Insights <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">& Analytics</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">
              Track your consistency, measure success, and optimize your routine.
            </p>
          </div>
          
          {/* Scrollable Mobile Filter */}
          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
            <div className="inline-flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-max">
              {[
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "90d", label: "3 Months" },
                { id: "year", label: "This Year" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as TimeRange)}
                  className={`px-5 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    timeRange === tab.id
                      ? "bg-gray-900 dark:bg-gray-700 text-white shadow-md transform scale-[1.02]"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ================= TOP STATS GRID ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            trend={stats.completionRate >= 50 ? "Solid" : undefined}
          />
          <StatCard
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            title="Active Habits"
            value={habits.length}
            gradient="linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)"
          />
          <StatCard
            icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>}
            title="Current Streak"
            value={stats.currentStreak}
            subtitle="days"
            gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
          />
          <StatCard
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            title="Daily Average"
            value={stats.avgDaily}
            subtitle="tasks/day"
            gradient="linear-gradient(135deg, #ec4899 0%, #d946ef 100%)"
          />
        </section>

        {/* ================= BENTO GRID CHARTS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Trend Chart (Takes up 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <ChartCard 
              title={`${timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : timeRange === '90d' ? 'Quarterly' : 'Yearly'} Momentum`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
            >
              <div className="h-[300px] 2xl:h-[400px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
                      minTickGap={timeRange === "year" ? 40 : 20} // Prevents overlap on long dates
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      name="Completions"
                      stroke="#6366f1" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorCompletions)" 
                      activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Donut Chart - Habit Breakdown */}
          <div className="lg:col-span-1">
            <ChartCard 
              title="Habit Distribution"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            >
              <div className="h-[300px] 2xl:h-[400px] relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={habitBreakdown.filter(h => h.completed > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="completed"
                      stroke="none"
                    >
                      {habitBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm hover:opacity-80 transition-opacity outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl 2xl:text-5xl font-black text-gray-900 dark:text-white">{stats.totalCompleted}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Done</span>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Activity Heatmap */}
          <div className="lg:col-span-2">
            <ChartCard 
              title="Activity Heatmap"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            >
              <div className="mt-4 w-full bg-gray-50/50 dark:bg-gray-800/30 rounded-[1.5rem] p-6 border border-gray-100 dark:border-gray-800">
                <Heatmap logs={logs} habits={habits} rangeDays={rangeDays} />
              </div>
            </ChartCard>
          </div>

          {/* Radar Chart */}
          <div className="lg:col-span-1">
            <ChartCard 
              title="Consistency Radar"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            >
              <div className="h-[280px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={habitBreakdown.slice(0, 6)}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Success %"
                      dataKey="percent"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* ================= LEADERBOARD SECTION ================= */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Habit Performance Leaderboard</h2>
            </div>
          </div>

          {/* Mobile View: Stacked Cards (Visible only on small screens) */}
          <div className="block md:hidden p-4 space-y-4">
            {habitBreakdown.map((habit) => (
              <div key={habit.id} className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: habit.color }} />
                    <span className="font-bold text-lg text-gray-900 dark:text-white truncate">{habit.fullName}</span>
                  </div>
                  <span className="text-xl font-black text-gray-900 dark:text-white">{habit.percent}%</span>
                </div>
                
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${habit.percent}%`, backgroundColor: habit.color }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <span>{habit.completed} / {rangeDays.length} days</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                    <span>🔥 Streak: {habit.streak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet View: Traditional Table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-8 py-5">Habit Name</th>
                  <th className="px-8 py-5">Success Rate</th>
                  <th className="px-8 py-5">Completed</th>
                  <th className="px-8 py-5">Current Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {habitBreakdown.map((habit) => (
                  <tr key={habit.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: habit.color }} />
                        <span className="font-bold text-[15px] text-gray-900 dark:text-white">{habit.fullName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap min-w-[200px]">
                      <div className="flex items-center gap-4">
                        <span className="text-[15px] font-black text-gray-900 dark:text-white w-12">{habit.percent}%</span>
                        <div className="w-full max-w-[120px] h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${habit.percent}%`, backgroundColor: habit.color }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[15px] font-semibold text-gray-500 dark:text-gray-400">
                      <span className="text-gray-900 dark:text-white font-bold">{habit.completed}</span> / {rangeDays.length} days
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                        {habit.streak}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Global Utility Styles for hiding strict scrollbars while keeping functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
      `}} />
    </div>
  );
}