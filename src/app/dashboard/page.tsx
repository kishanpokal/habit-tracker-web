"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import AddHabitModal from "@/components/AddHabitModal";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ------------------ Types ------------------ */
type Habit = {
  id: string;
  name: string;
  color: string;
};

type HabitLogMap = {
  [habitId: string]: Set<string>;
};

type ViewMode = "week" | "month" | "year" | "allTime";
type LayoutMode = "grid" | "list";

/* ------------------ Helpers ------------------ */
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getToday = () => {
  return getLocalDateString(new Date());
};

const addDays = (dateStr: string, days: number) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const getDayName = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", { weekday: "short" });
};

/* ------------------ Component ------------------ */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLogMap>({});
  const [view, setView] = useState<ViewMode>("week");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [viewBaseDate, setViewBaseDate] = useState(getToday());
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = useMemo(getToday, []);

  /* ------------------ Date range ------------------ */
  const dateRange = useMemo(() => {
    const base = new Date(viewBaseDate);

    if (view === "week") {
      const day = base.getDay() || 7;
      base.setDate(base.getDate() - day + 1);
      const startDateStr = getLocalDateString(base);
      return Array.from({ length: 7 }).map((_, i) => addDays(startDateStr, i));
    }

    if (view === "month") {
      const year = base.getFullYear();
      const month = base.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: days }).map((_, i) =>
        getLocalDateString(new Date(year, month, i + 1))
      );
    }

    if (view === "year") {
      const year = base.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const days: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(getLocalDateString(d));
      }
      return days;
    }

    return Array.from({ length: 90 }).map((_, i) => addDays(viewBaseDate, -89 + i));
  }, [viewBaseDate, view]);

  const weekDateRange = useMemo(() => {
    const base = new Date(today);
    const day = base.getDay() || 7;
    base.setDate(base.getDate() - day + 1);
    const startDateStr = getLocalDateString(base);
    return Array.from({ length: 7 }).map((_, i) => addDays(startDateStr, i));
  }, [today]);

  /* ------------------ Navigation ------------------ */
  const navigateView = (direction: -1 | 1) => {
    const d = new Date(viewBaseDate);
    if (view === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else if (view === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (view === "year") {
      d.setFullYear(d.getFullYear() + direction);
    } else if (view === "allTime") {
      d.setDate(d.getDate() + direction * 90);
    }
    setViewBaseDate(getLocalDateString(d));
  };

  const navigateDay = (direction: -1 | 1) => {
    setSelectedDate(addDays(selectedDate, direction));
  };

  /* ------------------ Auth ------------------ */
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  /* ------------------ Habits ------------------ */
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "users", user.uid, "habits"), orderBy("createdAt", "asc")),
      (snap) =>
        setHabits(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Habit, "id">),
          }))
        )
    );
  }, [user]);

  /* ------------------ Logs ------------------ */
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "habitLogs"), (snap) => {
      const map: HabitLogMap = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.completed) return;
        if (!map[data.habitId]) map[data.habitId] = new Set();
        map[data.habitId].add(data.date);
      });
      setLogs(map);
    });
  }, [user]);

  /* ------------------ Toggle ------------------ */
  const toggleHabit = async (habitId: string, date: string, checked: boolean) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "habitLogs", `${habitId}_${date}`),
      {
        habitId,
        date: date,
        completed: checked,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  /* ------------------ Streak ------------------ */
  const getStreak = (habitId: string, asOfDate: string) => {
    const set = logs[habitId];
    if (!set) return 0;
    let streak = 0;
    let cursor = asOfDate;
    while (set.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  if (loading || !user) return null;

  /* ------------------ Progress calculations ------------------ */
  const totalPossible = habits.length * dateRange.length;
  const totalCompleted = Object.values(logs).reduce(
    (sum, s) => sum + [...s].filter((d) => dateRange.includes(d)).length,
    0
  );
  const progressPercent = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);

  const weekCompleted = habits.reduce((sum, h) => {
    return sum + weekDateRange.filter((d) => logs[h.id]?.has(d)).length;
  }, 0);
  const weekPossible = habits.length * 7;

  const previousWeekRange = dateRange.map((d) => addDays(d, -7));
  const previousCompleted = Object.values(logs).reduce(
    (sum, s) => sum + [...s].filter((d) => previousWeekRange.includes(d)).length,
    0
  );
  const previousPossible = habits.length * 7;
  const previousPercent = previousPossible === 0 ? 0 : Math.round((previousCompleted / previousPossible) * 100);
  const delta = progressPercent - previousPercent;
  const comparisonText = delta > 0 ? `↑ ${delta}%` : delta < 0 ? `↓ ${Math.abs(delta)}%` : 'No change';

  const startDate = formatDate(dateRange[0]);
  const endDate = formatDate(dateRange[dateRange.length - 1]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <TopNav />

      <main className="pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* ==================== HEADER SECTION ==================== */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-1 truncate">
                Welcome back, {user.email?.split("@")[0]}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                {view === "week" && `${startDate} - ${endDate}`}
                {view === "month" && new Date(dateRange[0]).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                {view === "year" && new Date(dateRange[0]).getFullYear()}
                {view === "allTime" && "Last 90 days overview"}
              </p>
            </div>

            {/* Add Habit Button - Desktop */}
            <button
              onClick={() => setShowAddHabit(true)}
              className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Habit</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{progressPercent}%</p>
                </div>
              </div>
            </div>

            {/* Habits Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">Total Habits</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{habits.length}</p>
                </div>
              </div>
            </div>

            {/* Completed Today Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {habits.filter((h) => logs[h.id]?.has(today)).length}/{habits.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${delta >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={delta >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">Trend</p>
                  <p className={`text-xl sm:text-2xl font-bold truncate ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {comparisonText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== VIEW TABS & CONTROLS ==================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* View Mode Tabs */}
          <div className="flex-1 flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-800 overflow-x-auto">
            {(["week", "month", "year", "allTime"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  view === m
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {m === "allTime" ? "All Time" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Layout Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setLayout("list")}
              title="List view"
              className={`p-2.5 rounded-lg transition-all ${
                layout === "list"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setLayout("grid")}
              title="Grid view"
              className={`p-2.5 rounded-lg transition-all ${
                layout === "grid"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ==================== PROGRESS BAR (Week View) ==================== */}
        {view === "week" && habits.length > 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${delta >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                  <svg className={`w-4 h-4 ${delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {comparisonText} from last week
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {progressPercent}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {totalCompleted} of {totalPossible} habits completed this week
            </p>
          </div>
        )}

        {/* ==================== DATE RANGE NAVIGATION ==================== */}
        <div className="flex items-center justify-between mb-5 bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => navigateView(-1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Previous period"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center">
            {view === "week" && <span>{startDate} - {endDate}</span>}
            {view === "month" && new Date(dateRange[0]).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            {view === "year" && new Date(dateRange[0]).getFullYear()}
            {view === "allTime" && "Last 90 Days"}
          </h2>
          
          <button 
            onClick={() => navigateView(1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Next period"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ==================== MAIN CONTENT AREA ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Habits Tracker (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {habits.length === 0 ? (
              /* Empty State */
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Start Your Journey
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first habit and begin tracking your progress towards a better you!
                </p>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Habit
                </button>
              </div>
            ) : layout === "grid" ? (
              /* GRID LAYOUT */
              <>
                {/* ========== WEEK VIEW ========== */}
                {view === "week" && (
                  <div className="space-y-3">
                    {/* Desktop: Day Headers */}
                    <div className="hidden md:flex gap-2 px-4">
                      <div className="w-40" />
                      {dateRange.map((d) => {
                        const isToday = d === today;
                        return (
                          <div key={d} className="flex-1 text-center">
                            <div className={`inline-flex flex-col items-center px-3 py-2 rounded-xl ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                              <p className={`text-sm font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                {getDayName(d)}
                              </p>
                              <p className={`text-xs ${isToday ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {new Date(d).getDate()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="w-16" />
                    </div>

                    {/* Habit Rows */}
                    {habits.map((h) => {
                      const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                      const completionRate = Math.round((completedCount / dateRange.length) * 100);
                      
                      return (
                        <div
                          key={h.id}
                          className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200"
                        >
                          {/* Mobile: Habit Name + Stats */}
                          <div className="md:hidden flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                              <span className="font-semibold text-gray-900 dark:text-white truncate">{h.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{completedCount}/7</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({completionRate}%)</span>
                            </div>
                          </div>

                          {/* Desktop + Mobile: Day Cells */}
                          <div className="flex items-center gap-2">
                            {/* Desktop: Habit Name */}
                            <div className="hidden md:flex items-center gap-3 w-40">
                              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                              <span className="font-semibold text-gray-900 dark:text-white truncate">{h.name}</span>
                            </div>

                            {/* Day Checkboxes */}
                            <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-2">
                              {dateRange.map((d) => {
                                const done = logs[h.id]?.has(d);
                                const isToday = d === today;
                                return (
                                  <button
                                    key={d}
                                    onClick={() => toggleHabit(h.id, d, !done)}
                                    className={`aspect-square rounded-xl transition-all duration-200 ${
                                      done
                                        ? "opacity-100 shadow-md transform hover:scale-105"
                                        : "opacity-30 hover:opacity-60 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                                    } ${isToday && !done ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                                    style={{ backgroundColor: done ? h.color : "transparent" }}
                                    aria-label={`${done ? 'Unmark' : 'Mark'} ${h.name} on ${formatDate(d)}`}
                                  >
                                    {done && (
                                      <svg className="w-full h-full p-1.5 sm:p-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Desktop: Count */}
                            <div className="hidden md:flex flex-col items-center w-16">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">{completedCount}/7</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{completionRate}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ========== MONTH VIEW ========== */}
                {view === "month" && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-7 gap-2">
                      {/* Day Headers */}
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <div key={i} className="text-center pb-2">
                          <span className="hidden sm:inline text-xs font-bold text-gray-600 dark:text-gray-400">{day}</span>
                          <span className="sm:hidden text-xs font-bold text-gray-600 dark:text-gray-400">{day.charAt(0)}</span>
                        </div>
                      ))}

                      {/* Empty cells for offset */}
                      {Array.from({ length: new Date(dateRange[0]).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}

                      {/* Date cells */}
                      {dateRange.map((d) => {
                        const dayHabits = habits.map(h => ({
                          habit: h,
                          completed: logs[h.id]?.has(d)
                        }));
                        const completedCount = dayHabits.filter(h => h.completed).length;
                        const isToday = d === today;

                        return (
                          <div key={d} className="aspect-square">
                            <div className={`w-full h-full rounded-xl p-2 transition-all ${
                              isToday
                                ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                                : "border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}>
                              <div className="flex flex-col h-full">
                                <span className={`text-xs font-bold mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                  {new Date(d).getDate()}
                                </span>
                                <div className="flex-1 grid grid-cols-2 gap-0.5">
                                  {dayHabits.slice(0, 4).map(({ habit, completed }) => (
                                    <div
                                      key={habit.id}
                                      className={`rounded-sm ${completed ? "opacity-100" : "opacity-20"}`}
                                      style={{ backgroundColor: habit.color }}
                                    />
                                  ))}
                                </div>
                                {completedCount > 0 && (
                                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center mt-1">
                                    {completedCount}/{habits.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========== YEAR / ALL TIME VIEW ========== */}
                {(view === "year" || view === "allTime") && habits.map((h) => {
                  const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                  const completionRate = Math.round((completedCount / dateRange.length) * 100);
                  
                  return (
                    <div
                      key={h.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{h.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {completedCount} of {dateRange.length} days ({completionRate}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                          {getStreak(h.id, today) > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {getStreak(h.id, today)} day streak
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Heatmap */}
                      <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                        {dateRange.map((d) => {
                          const done = logs[h.id]?.has(d);
                          const isToday = d === today;
                          return (
                            <div
                              key={d}
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm transition-all ${
                                done ? "opacity-100" : "opacity-20"
                              } ${isToday ? "ring-1 ring-blue-500" : ""}`}
                              style={{ backgroundColor: h.color }}
                              title={`${formatDate(d)}: ${done ? 'Completed' : 'Not completed'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* ========== LIST LAYOUT ========== */
              habits.map((h) => {
                const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                const completionRate = Math.round((completedCount / dateRange.length) * 100);
                
                return (
                  <div
                    key={h.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{h.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {completedCount}/{dateRange.length} completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${completionRate}%`,
                            backgroundColor: h.color
                          }}
                        />
                      </div>
                    </div>

                    {/* Heatmap */}
                    <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                      {dateRange.map((d) => {
                        const done = logs[h.id]?.has(d);
                        const isToday = d === today;
                        return (
                          <div
                            key={d}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-all ${
                              done ? "opacity-100" : "opacity-20"
                            } ${isToday ? "ring-1 ring-blue-500" : ""}`}
                            style={{ backgroundColor: h.color }}
                            title={`${formatDate(d)}: ${done ? 'Completed' : 'Not completed'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT - Daily Tracker Sidebar (1/3 width on desktop) */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 lg:sticky lg:top-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedDate === today ? "Today" : formatDate(selectedDate)}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {habits.filter((h) => logs[h.id]?.has(selectedDate)).length} of {habits.length} completed
                  </p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => navigateDay(-1)} 
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Previous day"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => navigateDay(1)} 
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Next day"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress Ring */}
              {habits.length > 0 && (
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 56}
                        strokeDashoffset={2 * Math.PI * 56 * (1 - (habits.filter((h) => logs[h.id]?.has(selectedDate)).length / habits.length))}
                        className="transition-all duration-500"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {habits.filter((h) => logs[h.id]?.has(selectedDate)).length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">of {habits.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Habit List */}
              <div className="space-y-2.5">
                {habits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">No habits yet</p>
                    <button
                      onClick={() => setShowAddHabit(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Add your first habit
                    </button>
                  </div>
                ) : (
                  habits.map((h) => {
                    const done = logs[h.id]?.has(selectedDate);
                    const streak = getStreak(h.id, selectedDate);
                    
                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleHabit(h.id, selectedDate, !done)}
                        className={`rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          done
                            ? "shadow-md transform hover:scale-[1.02]"
                            : "border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                        }`}
                        style={{ backgroundColor: done ? h.color : "transparent" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            done ? "bg-white/30" : "border-2 border-gray-400 dark:border-gray-500"
                          }`}>
                            {done && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${done ? "text-white" : "text-gray-900 dark:text-white"}`}>
                              {h.name}
                            </p>
                            {streak > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg className={`w-3.5 h-3.5 ${done ? "text-white/80" : "text-orange-500"}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                </svg>
                                <span className={`text-xs font-semibold ${done ? "text-white/90" : "text-gray-600 dark:text-gray-400"}`}>
                                  {streak} day{streak !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Add Button (Mobile Only) */}
      <button
        onClick={() => setShowAddHabit(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 z-50"
        aria-label="Add habit"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} />}
    </div>
  );
}