"use client";

import { useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from "recharts";

/* -------------------- Types -------------------- */
type Habit = {
  id: string;
  name: string;
};

type HabitLog = {
  habitId: string;
  date: string;
  completed: boolean;
};

/* -------------------- Utils -------------------- */
function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
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

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#f43f5e", "#a855f7", "#059669"
];

/* -------------------- Custom Tooltip Components -------------------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-800 border-2 border-gray-700 dark:border-gray-600 rounded-xl p-4 shadow-2xl">
        <p className="text-white font-bold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-gray-200 text-sm" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-900 dark:bg-gray-800 border-2 border-gray-700 dark:border-gray-600 rounded-xl p-4 shadow-2xl">
        <p className="text-white font-bold text-sm mb-1">{data.payload.fullName || data.name}</p>
        <p className="text-gray-200 text-sm">
          <span className="font-semibold">Completed:</span> {data.value} times
        </p>
        <p className="text-gray-200 text-sm">
          <span className="font-semibold">Percentage:</span> {data.payload.percent}%
        </p>
      </div>
    );
  }
  return null;
};

/* -------------------- Custom Pie Label -------------------- */
const renderCustomizedLabel = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, percent, index } = props;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is above 5% to avoid clutter
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      className="dark:fill-gray-300"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* -------------------- UI Components -------------------- */
function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
  trend?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div 
          className="p-2.5 sm:p-3 rounded-xl shadow-lg text-white"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
            {value}
          </p>
          {subtitle && (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div 
          className="p-2 sm:p-2.5 rounded-xl shadow-lg text-white"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
        >
          {icon}
        </div>
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        {children}
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
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "habits");
    return onSnapshot(ref, (snap) => {
      setHabits(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "habitLogs");
    const unsub = onSnapshot(ref, (snap) => {
      setLogs(snap.docs.map((d) => d.data() as HabitLog));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* -------------------- Analytics Data -------------------- */
  const rangeDays = useMemo(() => timeRange === "7d" ? last7Days() : last30Days(), [timeRange]);

  const stats = useMemo(() => {
    const daysInRange = rangeDays.length;
    const possible = habits.length * daysInRange;
    const completedInRange = logs.filter((l) => l.completed && rangeDays.includes(l.date)).length;
    const completionRate = possible === 0 ? 0 : Math.round((completedInRange / possible) * 100);
    const allCompletedDates = logs.filter((l) => l.completed).map((l) => l.date);
    const currentStreak = calculateStreak(allCompletedDates);
    const bestStreak = calculateBestStreak(allCompletedDates, rangeDays);
    const totalCompleted = completedInRange;
    const avgDaily = daysInRange > 0 ? Math.round(completedInRange / daysInRange) : 0;

    return { completionRate, currentStreak, bestStreak, totalCompleted, avgDaily };
  }, [habits, logs, rangeDays]);

  const performanceData = useMemo(() => {
    return rangeDays.map((d) => {
      const dateObj = new Date(d);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const completed = logs.filter((l) => l.date === d && l.completed).length;
      const total = habits.length;
      return {
        name: timeRange === "7d" ? `${dayName} ${d.slice(8)}` : d.slice(5),
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [logs, habits, timeRange, rangeDays]);

  const trendData = useMemo(() => {
    return rangeDays.map((d) => ({
      date: d.slice(5),
      completed: logs.filter((l) => l.date === d && l.completed).length,
    }));
  }, [logs, rangeDays]);

  const habitBreakdown = useMemo(() => {
    const daysInRange = rangeDays.length;
    return habits.map((h, idx) => {
      const habitLogs = logs.filter((l) => l.habitId === h.id && rangeDays.includes(l.date));
      const done = habitLogs.filter((l) => l.completed).length;
      const total = daysInRange;
      const habitCompletedDates = logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date);
      const streak = calculateStreak(habitCompletedDates, rangeDays);
      return {
        name: h.name.length > 20 ? h.name.slice(0, 20) + "..." : h.name,
        fullName: h.name,
        completed: done,
        percent: Math.round((done / total) * 100),
        color: COLORS[idx % COLORS.length],
        streak,
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, rangeDays]);

  const pieData = useMemo(() => {
    const totalCompleted = habitBreakdown.reduce((sum, h) => sum + h.completed, 0);
    return habitBreakdown.map((h) => ({
      name: h.name,
      value: h.completed,
      fullName: h.fullName,
      percent: totalCompleted > 0 ? ((h.completed / totalCompleted) * 100).toFixed(1) : 0,
    }));
  }, [habitBreakdown]);

  const radarData = useMemo(() => {
    return habitBreakdown.slice(0, 6).map((h) => ({
      habit: h.name,
      score: h.percent,
    }));
  }, [habitBreakdown]);

  const dayOfWeekData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = Array(7).fill(0);
    rangeDays.forEach((d) => {
      const dayIndex = new Date(d).getDay();
      dayCounts[dayIndex]++;
    });
    const completedCounts = Array(7).fill(0);
    logs.forEach((log) => {
      if (log.completed && rangeDays.includes(log.date)) {
        const dayIndex = new Date(log.date).getDay();
        completedCounts[dayIndex]++;
      }
    });
    return dayNames.map((day, index) => {
      const total = dayCounts[index] * habits.length;
      const completed = completedCounts[index];
      return {
        day,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      };
    });
  }, [logs, habits, rangeDays]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-base sm:text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <TopNav />
        <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-12 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16 sm:py-24 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-6">
                <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                No Analytics Yet
              </h2>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto px-4">
                Start creating habits to unlock powerful insights and visualize your progress!
              </p>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Habit
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* -------------------- UI Render -------------------- */
  return (
    <>
      <TopNav />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
          {/* ==================== HEADER ==================== */}
          <header className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                  Track your progress and gain insights across all habits
                </p>
              </div>
              
              {/* Time Range Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-800 w-full sm:w-auto">
                <button
                  onClick={() => setTimeRange("7d")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    timeRange === "7d"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeRange("30d")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    timeRange === "30d"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </header>

          {/* ==================== STATS GRID ==================== */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              icon={
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Total Habits"
              value={habits.length}
              gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              trend="+5%"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              }
              title="Current Streak"
              value={stats.currentStreak}
              subtitle="days"
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              title="Best Streak"
              value={stats.bestStreak}
              subtitle="days"
              gradient="linear-gradient(135deg, #a855f7 0%, #9333ea 100%)"
            />
            <StatCard
              icon={
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              title="Avg. Daily"
              value={stats.avgDaily}
              subtitle="habits"
              gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            />
          </section>

          {/* ==================== CHARTS GRID ==================== */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Performance Chart */}
            <ChartCard
              title="Daily Performance"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    interval={timeRange === "7d" ? 0 : 4}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar 
                    dataKey="completed" 
                    fill="url(#completedGradient)" 
                    radius={[8, 8, 0, 0]} 
                    name="Completed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Habit Distribution Pie */}
            <ChartCard
              title="Habit Distribution"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: '#9ca3af',
                      strokeWidth: 1,
                    }}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Completion Trend */}
          <ChartCard
            title={`${timeRange === "7d" ? "7" : "30"}-Day Completion Trend`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "#6b7280", fontSize: 11 }} 
                  interval={timeRange === "7d" ? 0 : 4}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bottom Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <ChartCard
              title="Habit Performance Radar"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <PolarAngleAxis 
                    dataKey="habit" 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                  />
                  <Radar
                    name="Success Rate"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Day of Week Analysis */}
            <ChartCard
              title="Performance by Day"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dayOfWeekData} layout="vertical">
                  <defs>
                    <linearGradient id="dayGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis 
                    dataKey="day" 
                    type="category" 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar 
                    dataKey="rate" 
                    fill="url(#dayGradient)" 
                    radius={[0, 8, 8, 0]}
                    name="Completion Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ==================== DETAILED BREAKDOWN TABLE ==================== */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Detailed Habit Breakdown
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {habitBreakdown.length} Active
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Habit
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Streak
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {habitBreakdown.map((habit, idx) => (
                    <tr 
                      key={`${habit.fullName}-${idx}`} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900 flex-shrink-0"
                            style={{ backgroundColor: habit.color }}
                          />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
                            {habit.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {habit.completed} <span className="text-gray-400">/ {timeRange === "7d" ? "7" : "30"}</span>
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                          {habit.percent}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {habit.streak}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="w-full max-w-[120px] sm:max-w-[200px] bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${habit.percent}%`,
                              backgroundColor: habit.color,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}