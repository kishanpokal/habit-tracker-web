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

const getToday = () => getLocalDateString(new Date());

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

  /* ------------------ Navigation ------------------ */
  const navigateView = (direction: -1 | 1) => {
    const d = new Date(viewBaseDate);
    if (view === "week") d.setDate(d.getDate() + direction * 7);
    else if (view === "month") d.setMonth(d.getMonth() + direction);
    else if (view === "year") d.setFullYear(d.getFullYear() + direction);
    else if (view === "allTime") d.setDate(d.getDate() + direction * 90);
    setViewBaseDate(getLocalDateString(d));
  };

  const navigateDay = (direction: -1 | 1) => {
    setSelectedDate(addDays(selectedDate, direction));
  };

  /* ------------------ Auth & Data ------------------ */
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "users", user.uid, "habits"), orderBy("createdAt", "asc")),
      (snap) =>
        setHabits(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habit, "id">) })))
    );
  }, [user]);

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

  /* ------------------ Actions ------------------ */
  const toggleHabit = async (habitId: string, date: string, checked: boolean) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "habitLogs", `${habitId}_${date}`),
      { habitId, date, completed: checked, createdAt: serverTimestamp() },
      { merge: true }
    );
  };

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

  /* ------------------ Computations ------------------ */
  const totalPossible = habits.length * dateRange.length;
  const totalCompleted = Object.values(logs).reduce(
    (sum, s) => sum + [...s].filter((d) => dateRange.includes(d)).length, 0
  );
  const progressPercent = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);

  const previousWeekRange = dateRange.map((d) => addDays(d, -7));
  const previousCompleted = Object.values(logs).reduce(
    (sum, s) => sum + [...s].filter((d) => previousWeekRange.includes(d)).length, 0
  );
  const previousPossible = habits.length * 7;
  const previousPercent = previousPossible === 0 ? 0 : Math.round((previousCompleted / previousPossible) * 100);
  const delta = progressPercent - previousPercent;
  const comparisonText = delta > 0 ? `↑ ${delta}%` : delta < 0 ? `↓ ${Math.abs(delta)}%` : 'No change';

  const todayCompletedCount = habits.filter((h) => logs[h.id]?.has(selectedDate)).length;
  const todayProgressRate = habits.length === 0 ? 0 : todayCompletedCount / habits.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">
      <TopNav />

      {/* Main Container - Extended max width for TV/Large displays */}
      <main className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* ==================== HEADER ==================== */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 bg-white/50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-xl">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{user.email?.split("@")[0]}</span> 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">
              {view === "week" && `${formatDate(dateRange[0])} — ${formatDate(dateRange[dateRange.length - 1])}`}
              {view === "month" && new Date(dateRange[0]).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "year" && `Year of ${new Date(dateRange[0]).getFullYear()}`}
              {view === "allTime" && "Your all-time journey (Last 90 days)"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddHabit(true)}
              className="group hidden sm:flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-lg shadow-gray-900/20 dark:shadow-white/10 hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span>New Habit</span>
            </button>
          </div>
        </header>

        {/* ==================== TWO-COLUMN LAYOUT ==================== */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* LEFT SIDEBAR: Daily Focus (Order 1 on Mobile, Sticky on Desktop) */}
          <div className="w-full lg:w-[360px] xl:w-[400px] 2xl:w-[450px] flex-shrink-0 lg:sticky lg:top-24 order-1 lg:order-none space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    {selectedDate === today ? "Today" : formatDate(selectedDate)}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {todayCompletedCount} of {habits.length} completed
                  </p>
                </div>
                <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl">
                  <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl shadow-sm transition-all active:scale-95 text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => navigateDay(1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl shadow-sm transition-all active:scale-95 text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {habits.length > 0 && (
                <div className="flex items-center justify-center mb-10">
                  <div className="relative w-44 h-44 2xl:w-52 2xl:h-52">
                    <svg className="transform -rotate-90 w-full h-full filter drop-shadow-2xl">
                      <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8%" fill="transparent" className="text-gray-100 dark:text-gray-800/50" />
                      <circle
                        cx="50%" cy="50%" r="42%" stroke="url(#progressGradient)" strokeWidth="8%" fill="transparent"
                        strokeDasharray="264%" /* Approximated circumference */
                        strokeDashoffset={`${264 - (264 * todayProgressRate)}%`}
                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl 2xl:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                        {Math.round(todayProgressRate * 100)}%
                      </span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Done</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {habits.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 mb-4">Your list is empty</p>
                    <button onClick={() => setShowAddHabit(true)} className="text-sm font-bold text-indigo-500 hover:text-indigo-600">
                      + Create Habit
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
                        className={`group relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                          done 
                            ? "bg-gray-900 dark:bg-gray-800 border-gray-900 dark:border-gray-700 text-white shadow-xl shadow-gray-900/10 scale-[1.02]" 
                            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm text-gray-900 dark:text-white"
                        }`}
                      >
                        {done && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full" style={{ backgroundColor: h.color }} />}
                        <div className="flex items-center gap-4 pl-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${done ? "bg-white/20 ring-4 ring-white/5" : "border-2 border-gray-300 dark:border-gray-600 group-hover:border-gray-400"}`}>
                            <svg className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${done ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-[15px]">{h.name}</p>
                            {streak > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">🔥 {streak} Streak</span>
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

          {/* RIGHT MAIN AREA: Stats + Analytics Grid (Order 2 on Mobile) */}
          <div className="flex-1 order-2 lg:order-none min-w-0 space-y-6 lg:space-y-8">
            
            {/* Micro-Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Period Progress</p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black">{progressPercent}%</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${delta >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {comparisonText}
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Active Habits</p>
                <span className="text-3xl font-black">{habits.length}</span>
              </div>
              <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Done Today</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{habits.filter((h) => logs[h.id]?.has(today)).length}</span>
                  <span className="text-gray-400 font-medium">/{habits.length}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 shadow-lg text-white flex flex-col justify-center">
                <p className="text-sm font-medium text-white/80 mb-1">Current Focus</p>
                <span className="text-xl font-bold leading-tight">Keep the momentum going! 🔥</span>
              </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-gray-900/80 p-2 sm:p-3 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-xl overflow-x-auto w-full">
              <div className="flex w-full sm:w-auto p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl min-w-max">
                {(["week", "month", "year", "allTime"] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setView(m)}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                      view === m
                        ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-gray-900/5"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {m === "allTime" ? "All Time" : m}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <button onClick={() => navigateView(-1)} className="p-2 sm:p-2.5 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all active:scale-95 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => navigateView(1)} className="p-2 sm:p-2.5 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all active:scale-95 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                <div className="hidden sm:flex bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-2xl">
                  <button onClick={() => setLayout("list")} className={`p-2.5 rounded-xl transition-all ${layout === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button onClick={() => setLayout("grid")} className={`p-2.5 rounded-xl transition-all ${layout === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tracker Content Area */}
            <div className="w-full">
              {habits.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-12 lg:p-20 text-center border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-8 ring-8 ring-indigo-50/50 dark:ring-indigo-500/5">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Design Your Routine</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                    Start small. Build consistency. Create your first habit and let's start tracking your journey to a better you.
                  </p>
                  <button onClick={() => setShowAddHabit(true)} className="px-8 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 text-lg">
                    Add Your First Habit
                  </button>
                </div>
              ) : layout === "grid" ? (
                <>
                  {/* ---------- WEEK GRID ---------- */}
                  {view === "week" && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
                      {/* Mobile Scrollable Container */}
                      <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <div className="min-w-[600px] lg:min-w-full">
                          {/* Headers */}
                          <div className="flex gap-3 mb-6 pr-4">
                            <div className="w-[140px] lg:w-[180px] xl:w-[220px] flex-shrink-0" />
                            {dateRange.map((d) => {
                              const isToday = d === today;
                              return (
                                <div key={d} className="flex-1 text-center">
                                  <div className={`inline-flex flex-col items-center px-2 py-2 lg:px-4 rounded-2xl transition-colors ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/20' : ''}`}>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{getDayName(d)}</span>
                                    <span className={`text-lg lg:text-xl font-black mt-1 ${isToday ? '' : 'text-gray-900 dark:text-white'}`}>{new Date(d).getDate()}</span>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="w-16 flex-shrink-0 text-center flex items-center justify-center">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rate</span>
                            </div>
                          </div>

                          {/* Rows */}
                          <div className="space-y-4">
                            {habits.map((h) => {
                              const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                              const completionRate = Math.round((completedCount / dateRange.length) * 100);
                              
                              return (
                                <div key={h.id} className="group flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl p-3 sm:p-4 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors">
                                  
                                  {/* Habit Name */}
                                  <div className="flex items-center gap-3 lg:gap-4 w-[140px] lg:w-[180px] xl:w-[220px] flex-shrink-0">
                                    <div className="w-2.5 h-10 lg:h-12 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                                    <span className="font-bold text-[14px] lg:text-[15px] truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={h.name}>{h.name}</span>
                                  </div>

                                  {/* Checks */}
                                  <div className="flex-1 grid grid-cols-7 gap-2 lg:gap-3">
                                    {dateRange.map((d) => {
                                      const done = logs[h.id]?.has(d);
                                      const isToday = d === today;
                                      return (
                                        <button
                                          key={d}
                                          onClick={() => toggleHabit(h.id, d, !done)}
                                          className={`relative aspect-square rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                            done 
                                              ? "scale-105 shadow-md shadow-indigo-500/20 text-white" 
                                              : "bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-transparent hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50"
                                          } ${isToday && !done ? "ring-4 ring-indigo-500/10 border-indigo-200 dark:border-indigo-500/30" : ""}`}
                                          style={done ? { backgroundColor: h.color, borderColor: h.color } : {}}
                                        >
                                          <svg className={`w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300 ${done ? 'scale-100' : 'scale-50 opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Rate */}
                                  <div className="flex flex-col justify-center items-center w-16 flex-shrink-0">
                                    <span className="text-base lg:text-lg font-black text-gray-700 dark:text-gray-300">{completionRate}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------- MONTH / YEAR HEATMAP VIEWS ---------- */}
                  {view !== "week" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                      {habits.map((h) => {
                        const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                        const completionRate = Math.round((completedCount / dateRange.length) * 100);
                        
                        return (
                          <div key={h.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3 max-w-[65%]">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                                <h3 className="font-bold text-lg truncate" title={h.name}>{h.name}</h3>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="block text-2xl font-black leading-none">{completionRate}%</span>
                                <span className="text-xs font-semibold text-gray-400">{completedCount}/{dateRange.length}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-start max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                              {dateRange.map((d) => {
                                const done = logs[h.id]?.has(d);
                                return (
                                  <div
                                    key={d}
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-[4px] transition-colors`}
                                    style={{ backgroundColor: done ? h.color : "", opacity: done ? 1 : '' }}
                                    title={`${formatDate(d)}`}
                                  >
                                    {!done && <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-[4px]" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* ---------- LIST LAYOUT VIEW ---------- */
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {habits.map((h) => {
                    const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                    const completionRate = Math.round((completedCount / dateRange.length) * 100);
                    
                    return (
                      <div key={h.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-4 truncate">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                               <div className="w-4 h-4 rounded-full" style={{ backgroundColor: h.color }} />
                            </div>
                            <div className="truncate">
                              <h3 className="font-bold text-xl truncate" title={h.name}>{h.name}</h3>
                              <p className="text-sm font-medium text-gray-500 truncate">Completed {completedCount}x this period</p>
                            </div>
                          </div>
                          <span className="text-2xl lg:text-3xl font-black pl-2">{completionRate}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${completionRate}%`, backgroundColor: h.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => setShowAddHabit(true)}
        className="sm:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center transition-transform active:scale-90 z-50"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
      </button>

      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} />}
      
      {/* Utility Styles for specific elements like custom-scrollbar to keep things neat */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
      `}} />
    </div>
  );
}