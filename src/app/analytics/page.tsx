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
import {
  TrendingUp, Award, Target, Calendar, Download, Activity,
  BarChart3, PieChart as PieChartIcon, Flame,
  CheckCircle2, Zap
} from "lucide-react";

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

// Fixed export function - converts to canvas properly
const exportChartAsPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  try {
    // Dynamic import to avoid SSR issues
    // @ts-ignore
    const domToImage = (await import("dom-to-image-more")).default;

    const dataUrl = await domToImage.toPng(element, {
      bgcolor: "#1f2937",
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting chart:", error);
  }
};

/* -------------------- UI Components -------------------- */
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color = "blue",
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: string;
}) {
  const colorGradients = {
    blue: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
    green: "linear-gradient(to bottom right, #10b981, #059669)",
    orange: "linear-gradient(to bottom right, #f59e0b, #d97706)",
    purple: "linear-gradient(to bottom right, #a855f7, #9333ea)",
    indigo: "linear-gradient(to bottom right, #6366f1, #4f46e5)",
  };

  return (
    <div className="rounded-xl sm:rounded-2xl shadow-xl border p-3 sm:p-4 lg:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group" style={{ backgroundColor: "rgba(31, 41, 55, 0.5)", backdropFilter: "blur(12px)", borderColor: "#374151" }}>
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl text-white shadow-lg" style={{ background: colorGradients[color as keyof typeof colorGradients] }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-400 font-semibold flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">{trend}</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 font-medium truncate">{title}</p>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-100 group-hover:text-blue-400 transition-colors">
            {value}
          </p>
          {subtitle && <span className="text-xs sm:text-sm text-gray-500 font-medium">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  id,
  title,
  icon,
  children,
  onExport,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onExport: () => void;
}) {
  return (
    <div
      id={id}
      className="rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6 hover:shadow-2xl transition-all duration-300"
      style={{ backgroundColor: "rgba(31, 41, 55, 0.5)", backdropFilter: "blur(12px)", borderColor: "#374151" }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="p-1.5 sm:p-2 text-white rounded-lg shadow-lg flex-shrink-0" style={{ background: "linear-gradient(to bottom right, #3b82f6, #9333ea)" }}>
            {icon}
          </div>
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-100 truncate">{title}</h2>
        </div>
        <button
          onClick={onExport}
          className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-300 rounded-xl transition-all duration-300 border shadow-sm hover:shadow-lg w-full sm:w-auto justify-center"
          style={{ backgroundColor: "rgba(55, 65, 81, 0.5)", borderColor: "#4b5563" }}
          title="Export as PNG"
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-bounce" />
          <span>Export</span>
        </button>
      </div>
      <div className="chart-container overflow-x-auto">{children}</div>
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

    console.log('Computed stats:', { completionRate, currentStreak, bestStreak, totalCompleted, avgDaily }); // Debug log

    return { completionRate, currentStreak, bestStreak, totalCompleted, avgDaily };
  }, [habits, logs, timeRange, rangeDays]);

  useEffect(() => {
    console.log('Time range changed to:', timeRange);
    console.log('Range days length:', rangeDays.length);
  }, [timeRange, rangeDays]);

  const performanceData = useMemo(() => {
    return rangeDays.map((d) => {
      const dateObj = new Date(d);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const completed = logs.filter((l) => l.date === d && l.completed).length;
      const total = habits.length;
      return {
        name: timeRange === "7d" ? `${dayName} ${d.slice(5)}` : d.slice(5),
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [logs, habits, timeRange, rangeDays]);

  const monthlyData = useMemo(() => {
    return rangeDays.map((d) => ({
      date: d.slice(5),
      completed: logs.filter((l) => l.date === d && l.completed).length,
      total: habits.length,
    }));
  }, [logs, habits, rangeDays, timeRange]);

  const habitBreakdown = useMemo(() => {
    const daysInRange = rangeDays.length;
    return habits.map((h, idx) => {
      const habitLogs = logs.filter((l) => l.habitId === h.id && rangeDays.includes(l.date));
      const done = habitLogs.filter((l) => l.completed).length;
      const total = daysInRange;
      const habitCompletedDates = logs.filter(l => l.habitId === h.id && l.completed).map(l => l.date);
      const streak = calculateStreak(habitCompletedDates, rangeDays);
      return {
        name: h.name.length > 15 ? h.name.slice(0, 15) + "..." : h.name,
        fullName: h.name,
        completed: done,
        percent: Math.round((done / total) * 100),
        color: COLORS[idx % COLORS.length],
        streak,
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, logs, timeRange, rangeDays]);

  const habitsOverTimeData = useMemo(() => {
    return rangeDays.map((d) => {
      const dataPoint: any = { date: d.slice(5) };
      habits.forEach((h) => {
        const completed = logs.some(
          (l) => l.habitId === h.id && l.date === d && l.completed
        );
        dataPoint[h.name] = completed ? 1 : 0;
      });
      return dataPoint;
    });
  }, [habits, logs, timeRange, rangeDays]);

  const pieData = useMemo(() => {
    return habitBreakdown.map((h) => ({
      name: h.name,
      value: h.completed,
      fullName: h.fullName,
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
  }, [logs, habits, timeRange, rangeDays]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, #111827, #1f2937, #111827)" }}>
        <div className="text-center px-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-500 border-t-transparent mb-4" style={{ borderColor: "rgba(59, 130, 246, 0.3)", borderTopColor: "#3b82f6" }}></div>
          <p className="text-gray-300 font-medium text-sm sm:text-base">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <TopNav />
        <main className="min-h-screen pt-24 sm:pt-32 lg:pt-40 px-3 sm:px-4 pb-12" style={{ background: "linear-gradient(to bottom right, #111827, #1f2937, #111827)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12 sm:py-20 rounded-2xl shadow-2xl border" style={{ backgroundColor: "rgba(31, 41, 55, 0.5)", backdropFilter: "blur(12px)", borderColor: "#374151" }}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3 px-4">No Habits to Analyze</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md mx-auto px-4">
                Start creating habits to unlock powerful insights and track your progress over time.
              </p>
              <button className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white rounded-lg font-medium transition-all shadow-lg" style={{ background: "linear-gradient(to right, #3b82f6, #9333ea)" }}>
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
      <main className="min-h-screen pt-24 sm:pt-32 lg:pt-40 px-3 sm:px-4 lg:px-6 pb-12 sm:pb-20" style={{ background: "linear-gradient(to bottom right, #111827, #1f2937, #111827)" }}>
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2" style={{
                  background: "linear-gradient(to right, #60a5fa, #a78bfa, #f9a8d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
                  Track your progress and insights across all habits
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg shadow-lg border p-1 w-full sm:w-auto" style={{ backgroundColor: "rgba(31, 41, 55, 0.8)", backdropFilter: "blur(12px)", borderColor: "#374151", zIndex: 10 }}>
                <button
                  onClick={() => {
                    console.log('Button clicked: Set to 7d');
                    setTimeRange("7d");
                  }}
                  className="flex-1 sm:flex-none px-4 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: timeRange === "7d" ? "linear-gradient(to right, #3b82f6, #9333ea)" : "transparent",
                    color: timeRange === "7d" ? "#fff" : "#9ca3af",
                    boxShadow: timeRange === "7d" ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                  }}
                >
                  7 Days
                </button>
                <button
                  onClick={() => {
                    console.log('Button clicked: Set to 30d');
                    setTimeRange("30d");
                  }}
                  className="flex-1 sm:flex-none px-4 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: timeRange === "30d" ? "linear-gradient(to right, #3b82f6, #9333ea)" : "transparent",
                    color: timeRange === "30d" ? "#fff" : "#9ca3af",
                    boxShadow: timeRange === "30d" ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
                  }}
                >
                  30 Days
                </button>
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              icon={<Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              title="Total Habits"
              value={habits.length}
              color="blue"
              trend="+12%"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              color="green"
              trend="+5%"
            />
            <StatCard
              icon={<Flame className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              title="Current Streak"
              value={`${stats.currentStreak}`}
              subtitle="days"
              color="orange"
            />
            <StatCard
              icon={<Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              title="Best Streak"
              value={`${stats.bestStreak}`}
              subtitle="days"
              color="purple"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              title="Avg. Daily"
              value={`${stats.avgDaily}`}
              subtitle="habits"
              color="indigo"
            />
          </section>

          {/* Top Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard
              id="weekly-chart"
              title="Daily Performance Overview"
              icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
              onExport={() => exportChartAsPNG("weekly-chart", "daily-performance")}
            >
              <ResponsiveContainer width="100%" height={250} className="sm:!h-[280px] lg:!h-[300px]">
                <BarChart data={performanceData}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: timeRange === "7d" ? 10 : 8 }}
                    interval={timeRange === "7d" ? 0 : 3}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }} />
                  <Bar dataKey="completed" fill="url(#completedGradient)" radius={[8, 8, 0, 0]} name="Completed" />
                  <Bar dataKey="total" fill="#374151" radius={[8, 8, 0, 0]} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              id="pie-chart"
              title="Habit Completion Distribution"
              icon={<PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              onExport={() => exportChartAsPNG("pie-chart", "habit-distribution")}
            >
              <ResponsiveContainer width="100%" height={250} className="sm:!h-[280px] lg:!h-[300px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => {
                      const total = pieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                      return `${entry.name}: ${percent}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* 30-Day Trend */}
          <ChartCard
            id="monthly-trend"
            title={`${timeRange === "7d" ? "7" : "30"}-Day Completion Trend`}
            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
            onExport={() => exportChartAsPNG("monthly-trend", "completion-trend")}
          >
            <ResponsiveContainer width="100%" height={280} className="sm:!h-[300px] lg:!h-[320px]">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={timeRange === "7d" ? 0 : 5} angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* All Habits Timeline */}
          <ChartCard
            id="habits-timeline"
            title={`All Habits Timeline (Last ${timeRange === "7d" ? "7" : "30"} Days)`}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            onExport={() => exportChartAsPNG("habits-timeline", "habits-timeline")}
          >
            <ResponsiveContainer width="100%" height={320} className="sm:!h-[350px] lg:!h-[380px]">
              <LineChart data={habitsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={timeRange === "7d" ? 0 : 5} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(value: any) => (value === 1 ? "✓ Completed" : "✗ Not Done")}
                />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "11px" }} />
                {habits.map((habit, idx) => (
                  <Line
                    key={habit.id}
                    type="monotone"
                    dataKey={habit.name}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bottom Grid */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard
              id="radar-chart"
              title="Habit Performance Radar"
              icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
              onExport={() => exportChartAsPNG("radar-chart", "performance-radar")}
            >
              <ResponsiveContainer width="100%" height={280} className="sm:!h-[310px] lg:!h-[340px]">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="habit" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Radar
                    name="Success Rate"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              id="day-analysis"
              title="Performance by Day of Week"
              icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
              onExport={() => exportChartAsPNG("day-analysis", "day-of-week")}
            >
              <ResponsiveContainer width="100%" height={280} className="sm:!h-[310px] lg:!h-[340px]">
                <BarChart data={dayOfWeekData} layout="vertical">
                  <defs>
                    <linearGradient id="dayGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis dataKey="day" type="category" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value}% (${props.payload.completed}/${props.payload.total})`,
                      "Completion",
                    ]}
                  />
                  <Bar dataKey="rate" fill="url(#dayGradient)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Detailed Breakdown */}
          <div className="rounded-xl sm:rounded-2xl shadow-2xl border overflow-hidden" style={{ backgroundColor: "rgba(31, 41, 55, 0.5)", backdropFilter: "blur(12px)", borderColor: "#374151" }}>
            <div className="p-4 sm:p-6 border-b" style={{ background: "linear-gradient(to right, rgba(30, 58, 138, 0.5), rgba(88, 28, 135, 0.5))", borderColor: "#374151" }}>
              <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-100">Detailed Habit Breakdown</h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span>{habitBreakdown.length} Active Habits</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Habit
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Streak
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {habitBreakdown.length > 0 ? (
                    habitBreakdown.map((habit, idx) => (
                      <tr key={`${habit.fullName}-${idx}`} className="hover:bg-gray-700 transition-colors group" style={{ backgroundColor: "transparent" }}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ring-2 flex-shrink-0"
                              style={{ backgroundColor: habit.color, "--ring-color": "#1f2937" } as React.CSSProperties}
                            />
                            <span className="text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
                              {habit.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-300 font-medium">
                            {habit.completed} <span className="text-gray-500">/ {timeRange === "7d" ? "7" : "30"}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-green-400 border" style={{ background: "linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                            {habit.percent}%
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold text-gray-200">{habit.streak} days</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5 overflow-hidden">
                            <div
                              className="h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${habit.percent}%`,
                                backgroundColor: habit.color,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-sm sm:text-base text-gray-400">
                        No habit data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}