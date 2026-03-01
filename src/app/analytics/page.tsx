"use client";

import { useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

/* -------------------- Types -------------------- */
type Habit = { id: string; name: string; color?: string; };
type HabitLog = { habitId: string; date: string; completed: boolean; };
type TimeRange = "7d" | "30d" | "90d" | "year" | "custom";

/* -------------------- Utils -------------------- */
function generateDateRange(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function generateCustomDateRange(start: string, end: string) {
  const dates = [];
  let curr = new Date(start);
  const endD = new Date(end);
  while (curr <= endD) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
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
      if (diffDays === 1) currentStreak++;
      else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    } else currentStreak = 1;
    prevDate = currentDate;
  });
  return Math.max(maxStreak, currentStreak);
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#0ea5e9", "#84cc16", "#d946ef", "#06b6d4"];

/* -------------------- Custom Components -------------------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-2xl z-50">
        <p className="text-gray-900 dark:text-white font-bold text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-gray-900 dark:text-white font-black text-sm">
                {entry.value}{entry.name === "Success %" || entry.name === "Completion" ? "%" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function StatCard({ icon, title, value, subtitle, gradient, trend }: any) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#111827] rounded-[1.5rem] p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.1] blur-3xl group-hover:opacity-20 transition-opacity duration-500" style={{ background: gradient }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3.5 rounded-2xl text-white shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300" style={{ background: gradient }}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full">
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h3>
            {subtitle && <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children, colSpan = 1 }: any) {
  return (
    <div className={`bg-white dark:bg-[#111827] rounded-[1.5rem] p-5 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-800 w-full flex flex-col ${colSpan === 2 ? 'lg:col-span-2' : ''} ${colSpan === 3 ? 'lg:col-span-3' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-gray-700">
          {icon}
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
      </div>
      <div className="w-full flex-1 min-h-[300px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* -------------------- GitHub Style Heatmap -------------------- */
function ActivityHeatmap({ logs, habits, rangeDays }: { logs: HabitLog[], habits: Habit[], rangeDays: string[] }) {
  const gridDays = useMemo(() => {
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
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-1.5 sm:gap-2 min-w-max pr-4">
          {gridDays.map((day, i) => (
            <div 
              key={i} 
              title={`${new Date(day.date).toLocaleDateString()}: ${day.completed}/${day.total} habits`}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-all duration-300 ${getColor(day.intensity)} hover:ring-4 ring-indigo-300/50 dark:ring-indigo-500/50 hover:scale-110 cursor-pointer`}
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
export default function AdvancedAnalyticsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters State
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");

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
    if (timeRange === "custom" && customStart && customEnd) {
      return generateCustomDateRange(customStart, customEnd);
    }
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
    const completedInRange = filteredLogs.filter((l) => l.completed && rangeDays.includes(l.date)).length;
    const completionRate = possible === 0 ? 0 : Math.round((completedInRange / possible) * 100);
    const allCompletedDates = filteredLogs.filter((l) => l.completed).map((l) => l.date);
    
    let perfectDaysCount = 0;
    if (selectedHabitId === "all") {
      rangeDays.forEach(date => {
        const completedThatDay = logs.filter(l => l.date === date && l.completed).length;
        if (completedThatDay === habits.length && habits.length > 0) perfectDaysCount++;
      });
    }

    return {
      completionRate,
      currentStreak: calculateStreak(allCompletedDates),
      bestStreak: calculateBestStreak(allCompletedDates, rangeDays),
      totalCompleted: completedInRange,
      perfectDays: perfectDaysCount,
      avgDaily: rangeDays.length > 0 ? (completedInRange / rangeDays.length).toFixed(1) : "0.0",
    };
  }, [filteredHabits, filteredLogs, rangeDays, logs, habits, selectedHabitId]);

  const trendData = useMemo(() => {
    return rangeDays.map((d) => {
      const dateObj = new Date(d);
      const name = timeRange === "year" 
        ? dateObj.toLocaleDateString("en-US", { month: "short" }) 
        : dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
        
      return {
        name, fullDate: d,
        completed: filteredLogs.filter((l) => l.date === d && l.completed).length,
      };
    });
  }, [filteredLogs, rangeDays, timeRange]);

  const weeklyRhythmData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rhythm = Array(7).fill(0).map((_, i) => ({ day: days[i], count: 0 }));
    
    filteredLogs.forEach(l => {
      if (l.completed && rangeDays.includes(l.date)) {
        const dayIndex = new Date(l.date).getDay();
        rhythm[dayIndex].count += 1;
      }
    });
    return rhythm;
  }, [filteredLogs, rangeDays]);

  const habitBreakdown = useMemo(() => {
    return habits.map((h, idx) => {
      const habitLogs = logs.filter((l) => l.habitId === h.id && rangeDays.includes(l.date));
      const done = habitLogs.filter((l) => l.completed).length;
      return {
        id: h.id,
        name: h.name.length > 15 ? h.name.slice(0, 15) + "..." : h.name,
        fullName: h.name,
        completed: done,
        percent: rangeDays.length > 0 ? Math.round((done / rangeDays.length) * 100) : 0,
        color: h.color || COLORS[idx % COLORS.length],
        streak: calculateStreak(logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date), rangeDays),
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, rangeDays]);

  /* -------------------- Render Checks -------------------- */
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase animate-pulse text-sm">Processing Intelligence...</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <TopNav />
        <main className="min-h-screen pt-24 px-4 bg-[#F8FAFC] dark:bg-[#030712] flex items-center justify-center">
          <div className="text-center bg-white dark:bg-[#111827] p-10 rounded-[2rem] shadow-xl border border-gray-200 dark:border-gray-800 max-w-md w-full">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Data Available</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Start tracking habits to generate powerful insights.</p>
            <button onClick={() => window.location.href = '/dashboard'} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">Go to Dashboard</button>
          </div>
        </main>
      </>
    );
  }

  /* -------------------- Main UI Render -------------------- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">
      <TopNav />
      {/* Notice pb-12 is kept minimal to not conflict with layout navs */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 lg:space-y-8">
        
        {/* ================= ADVANCED FILTERS ================= */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white dark:bg-[#111827] p-6 lg:p-8 rounded-[1.5rem] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400">Intelligence</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Deep-dive into your consistency and patterns.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Habit Filter */}
            <select 
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 p-3 font-semibold outline-none"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
            >
              <option value="all">⚡ All Habits</option>
              {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>

            {/* Time Range Filter */}
            <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto custom-scrollbar">
              {[
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "90d", label: "90D" },
                { id: "year", label: "1Y" },
                { id: "custom", label: "Custom" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as TimeRange)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    timeRange === tab.id
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            {timeRange === "custom" && (
              <div className="flex gap-2 items-center">
                <input type="date" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl p-2.5 outline-none" onChange={(e) => setCustomStart(e.target.value)} />
                <span className="text-gray-400">to</span>
                <input type="date" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl p-2.5 outline-none" onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            )}
          </div>
        </header>

        {/* ================= KEY METRICS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            gradient="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
            trend={stats.completionRate >= 50 ? "On Track" : undefined}
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>}
            title="Fire Streak"
            value={stats.currentStreak}
            subtitle="days"
            gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            title={selectedHabitId === "all" ? "Perfect Days" : "Total Completed"}
            value={selectedHabitId === "all" ? stats.perfectDays : stats.totalCompleted}
            gradient="linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            title="Daily Output"
            value={stats.avgDaily}
            subtitle="actions/day"
            gradient="linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)"
          />
        </section>

        {/* ================= CHARTS GRID ROW 1 ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Area Chart */}
          <ChartCard colSpan={2} title="Momentum Overview" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="completed" name="Completion" stroke="#6366f1" strokeWidth={4} fill="url(#colorCompletions)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weekly Rhythm Chart */}
          <ChartCard title="Weekly Rhythm" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRhythmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6', className: "dark:fill-gray-800" }} content={<CustomTooltip />} />
                <Bar dataKey="count" name="Completions" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ================= CHARTS GRID ROW 2 ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* NEW: Activity Heatmap */}
          <ChartCard colSpan={selectedHabitId === "all" ? 2 : 3} title="Activity Intensity" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>
            <ActivityHeatmap logs={logs} habits={filteredHabits} rangeDays={rangeDays} />
          </ChartCard>

          {/* NEW: Performance Gap (Horizontal Bar) OR Donut Chart depending on space */}
          {selectedHabitId === "all" && (
            <ChartCard title="Performance Gap" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={habitBreakdown.slice(0, 5)} margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:stroke-gray-800/80" />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} width={80} />
                  <Tooltip cursor={{ fill: '#f3f4f6', className: "dark:fill-gray-800" }} content={<CustomTooltip />} />
                  <Bar dataKey="percent" name="Success %" radius={[0, 6, 6, 0]} barSize={24}>
                    {habitBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* ================= CHARTS GRID ROW 3 ================= */}
        {selectedHabitId === "all" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Donut Chart */}
            <ChartCard title="Distribution" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}>
              <div className="relative h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={habitBreakdown.filter(h => h.completed > 0)} cx="50%" cy="50%" innerRadius={85} outerRadius={120} paddingAngle={5} dataKey="completed" stroke="none">
                      {habitBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalCompleted}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>
            </ChartCard>

            {/* Radar Chart */}
            {habitBreakdown.length > 2 && (
              <ChartCard title="Consistency Radar" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={habitBreakdown.slice(0, 6)}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Success %" dataKey="percent" stroke="#ec4899" strokeWidth={3} fill="#ec4899" fillOpacity={0.4} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* ================= LEADERBOARD TABLE ================= */}
        {selectedHabitId === "all" && (
          <div className="bg-white dark:bg-[#111827] rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Performance Leaderboard</h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4">Habit Name</th>
                    <th className="px-6 py-4">Success Rate</th>
                    <th className="px-6 py-4">Completed</th>
                    <th className="px-6 py-4">Current Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {habitBreakdown.map((habit) => (
                    <tr key={habit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: habit.color }} />
                          <span className="font-bold text-[15px] text-gray-900 dark:text-white">{habit.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-black text-gray-900 dark:text-white w-10">{habit.percent}%</span>
                          <div className="w-full max-w-[120px] h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${habit.percent}%`, backgroundColor: habit.color }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-semibold text-gray-500 dark:text-gray-400">
                        <span className="text-gray-900 dark:text-white font-bold">{habit.completed}</span> / {rangeDays.length} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-bold">
                          🔥 {habit.streak}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.6); }
      `}} />
    </div>
  );
}