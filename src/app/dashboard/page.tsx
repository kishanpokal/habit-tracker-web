"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import AddHabitModal from "@/components/AddHabitModal";
import HabitTemplateModal from "@/components/HabitTemplateModal";
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
import Link from "next/link";
import {
  Plus,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

/* ------------------ Types ------------------ */
type Habit = {
  id: string;
  name: string;
  color: string;
  category?: string;
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
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const getDayName = (date: string) => {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/* ------------------ Component ------------------ */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLogMap>({});
  const [view, setView] = useState<ViewMode>("week");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [viewBaseDate, setViewBaseDate] = useState(getToday());
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = useMemo(getToday, []);

  /* ------------------ Date range ------------------ */
  const dateRange = useMemo(() => {
    const base = new Date(viewBaseDate + "T00:00:00");
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
    const d = new Date(viewBaseDate + "T00:00:00");
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
    if (!set.has(cursor)) {
      const yesterday = addDays(cursor, -1);
      if (set.has(yesterday)) {
        cursor = yesterday;
      } else {
        return 0;
      }
    }
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
  const comparisonText = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : 'Even';

  const todayCompletedCount = habits.filter((h) => logs[h.id]?.has(selectedDate)).length;
  const todayProgressRate = habits.length === 0 ? 0 : todayCompletedCount / habits.length;

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-stone-100 font-sans selection:bg-violet-500/25 overflow-x-hidden">
      <TopNav />

      {/* Main Container */}
      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1540px] mx-auto space-y-4 sm:space-y-6">

        {/* ==================== WELCOME BANNER ==================== */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-[#121218]/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-[#272732] backdrop-blur-xl shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#EAB308] bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                {getTimeGreeting()}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                {formatDate(today)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">{user.displayName || user.email?.split("@")[0]}</span>
            </h1>
            <p className="text-stone-500 dark:text-[#9090A0] text-xs sm:text-sm font-medium">
              {view === "week" && `Week of ${formatDate(dateRange[0])} — ${formatDate(dateRange[dateRange.length - 1])}`}
              {view === "month" && new Date(dateRange[0] + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "year" && `Year ${new Date(dateRange[0] + "T00:00:00").getFullYear()}`}
              {view === "allTime" && "All-Time Habit Records (Last 90 days)"}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Link
              href="/habits"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 dark:bg-[#1A1A22] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#272732] border border-stone-200 dark:border-[#272732] rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#7C3AED] dark:text-[#EAB308]" />
              <span>Manage Habits</span>
            </Link>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 dark:bg-[#1A1A22] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#272732] border border-stone-200 dark:border-[#272732] rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs"
            >
              <Layers className="w-4 h-4 text-[#EAB308]" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setShowAddHabit(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-violet-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Habit</span>
            </button>
          </div>
        </header>

        {/* Motivational Card */}
        {(() => {
          const QUOTES = [
            { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
            { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
            { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
            { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
            { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
          ];
          const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;
          const q = QUOTES[dayIndex];
          return (
            <div className="bg-gradient-to-r from-[#7C3AED]/10 to-[#EAB308]/10 rounded-2xl border border-[#7C3AED]/20 p-4 sm:p-4.5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic font-medium leading-relaxed">
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="text-[11px] text-[#7C3AED] dark:text-[#EAB308] font-bold">
                  — {q.author}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-[#EAB308] flex-shrink-0 opacity-90" />
            </div>
          );
        })()}

        {/* ==================== TWO-COLUMN LAYOUT ==================== */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

          {/* LEFT SIDEBAR: Daily Focus */}
          <div className="w-full lg:w-[350px] xl:w-[380px] flex-shrink-0 lg:sticky lg:top-22 order-1 lg:order-none space-y-4">
            <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs">
              
              {/* Day Selector */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading">
                    {selectedDate === today ? "Today" : formatDate(selectedDate)}
                  </h2>
                  <p className="text-xs font-semibold text-stone-500 dark:text-[#9090A0] mt-0.5">
                    {todayCompletedCount} of {habits.length} completed
                  </p>
                </div>
                <div className="flex gap-1 bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl">
                  <button
                    onClick={() => navigateDay(-1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] rounded-lg transition-all active:scale-95 text-stone-600 dark:text-stone-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateDay(1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] rounded-lg transition-all active:scale-95 text-stone-600 dark:text-stone-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Circular Gauge */}
              {habits.length > 0 && (
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                    <svg className="transform -rotate-90 w-full h-full">
                      <circle
                        cx="50%" cy="50%" r="42%"
                        stroke="currentColor" strokeWidth="8%" fill="transparent"
                        className="text-stone-100 dark:text-[#1A1A22]"
                      />
                      <circle
                        cx="50%" cy="50%" r="42%"
                        stroke="url(#amethystGoldGradient)" strokeWidth="8%" fill="transparent"
                        strokeDasharray="264%"
                        strokeDashoffset={`${264 - (264 * todayProgressRate)}%`}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="amethystGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7C3AED" />
                          <stop offset="100%" stopColor="#EAB308" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
                        {Math.round(todayProgressRate * 100)}%
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-widest mt-0.5">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Habit Checklist */}
              <div className="space-y-2.5">
                {habits.length === 0 ? (
                  <div className="text-center py-6 bg-stone-50 dark:bg-[#1A1A22]/40 rounded-2xl border border-dashed border-stone-200 dark:border-[#272732]">
                    <p className="text-xs font-semibold text-stone-500 mb-2">No habits tracked yet</p>
                    <button
                      onClick={() => setShowAddHabit(true)}
                      className="text-xs font-bold text-[#7C3AED] dark:text-[#EAB308] hover:underline"
                    >
                      + Create your first habit
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
                        className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 border select-none ${
                          done
                            ? "bg-[#EAB308]/10 border-[#EAB308]/30 dark:border-[#EAB308]/25 shadow-xs"
                            : "bg-white dark:bg-[#121218] border-stone-100 dark:border-[#272732]/80 hover:border-stone-300 dark:hover:border-stone-700"
                        }`}
                      >
                        {done && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#EAB308]"
                          />
                        )}
                        <div className="flex items-center gap-3 pl-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              done
                                ? "bg-[#EAB308] text-slate-950 font-black shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 group-hover:border-stone-400"
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 transition-transform ${done ? 'scale-100' : 'scale-0'}`} />
                          </div>
                          <div>
                            <p className={`font-bold text-xs sm:text-sm ${done ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                              {h.name}
                            </p>
                            {streak > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-bold text-[#EAB308] flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 fill-[#EAB308] text-[#EAB308]" />
                                  {streak}d streak
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

              {habits.length > 0 && (
                <Link
                  href="/habits"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 mt-4 rounded-xl bg-stone-50 dark:bg-[#1A1A22] hover:bg-stone-100 dark:hover:bg-[#272732] border border-stone-200/80 dark:border-[#272732] text-xs font-bold text-stone-700 dark:text-stone-200 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#EAB308]" />
                    <span>Manage All Habits</span>
                  </div>
                  <span className="text-[11px] text-[#7C3AED] dark:text-[#EAB308] group-hover:translate-x-0.5 transition-transform">
                    {habits.length} routines →
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT MAIN AREA */}
          <div className="flex-1 order-2 lg:order-none min-w-0 space-y-4 sm:space-y-6 w-full">

            {/* Micro-Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Completion</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-stone-900 dark:text-white">{progressPercent}%</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    delta >= 0
                      ? 'bg-violet-50 dark:bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#EAB308]'
                      : 'bg-stone-100 dark:bg-[#1A1A22] text-stone-500 dark:text-[#9090A0]'
                  }`}>
                    {comparisonText}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Active Habits</span>
                <span className="text-2xl sm:text-3xl font-black font-heading text-stone-900 dark:text-white mt-2">{habits.length}</span>
              </div>

              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Done Today</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-[#7C3AED] dark:text-[#EAB308]">
                    {habits.filter((h) => logs[h.id]?.has(today)).length}
                  </span>
                  <span className="text-xs font-bold text-stone-400">/{habits.length}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#7C3AED] to-[#EAB308] rounded-2xl p-4 text-white shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">Consistency</span>
                <div className="flex items-center gap-1 mt-2">
                  <Flame className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                  <span className="text-lg sm:text-xl font-black font-heading leading-tight">Momentum High</span>
                </div>
              </div>
            </div>

            {/* Toolbar Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 dark:bg-[#121218]/80 p-2 sm:p-2.5 rounded-2xl border border-stone-200/80 dark:border-[#272732] backdrop-blur-md overflow-x-auto w-full">
              {/* View Selector */}
              <div className="flex w-full sm:w-auto p-1 bg-stone-100 dark:bg-[#1A1A22] rounded-xl overflow-x-auto">
                {(["week", "month", "year", "allTime"] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setView(m)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      view === m
                        ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs"
                        : "text-stone-500 hover:text-stone-900 dark:text-[#9090A0]"
                    }`}
                  >
                    {m === "allTime" ? "All Time" : m}
                  </button>
                ))}
              </div>

              {/* Navigation Arrows + Layout Toggles */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl">
                  <button
                    onClick={() => navigateView(-1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] text-stone-600 dark:text-stone-300 rounded-lg transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateView(1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] text-stone-600 dark:text-stone-300 rounded-lg transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="hidden sm:flex bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl">
                  <button
                    onClick={() => setLayout("grid")}
                    className={`p-1.5 rounded-lg transition-all ${
                      layout === "grid" ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs" : "text-stone-400 hover:text-stone-700"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayout("list")}
                    className={`p-1.5 rounded-lg transition-all ${
                      layout === "list" ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs" : "text-stone-400 hover:text-stone-700"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tracker Matrix Content */}
            <div className="w-full">
              {habits.length === 0 ? (
                <div className="bg-white dark:bg-[#121218] rounded-3xl p-8 sm:p-14 text-center border border-stone-200/80 dark:border-[#272732] shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308] flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading mb-2">Build your daily system</h3>
                  <p className="text-stone-500 dark:text-[#9090A0] text-sm max-w-sm mx-auto mb-6">
                    Add the habits you want to cultivate. Track your streaks and see consistency compound over time.
                  </p>
                  <button
                    onClick={() => setShowAddHabit(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    Add Your First Habit
                  </button>
                </div>
              ) : layout === "grid" ? (
                <>
                  {/* ---------- WEEK GRID MATRIX ---------- */}
                  {view === "week" && (
                    <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden p-3.5 sm:p-6">
                      <div className="overflow-x-auto pb-2 custom-scrollbar">
                        <div className="min-w-[500px] lg:min-w-full">
                          {/* Headers */}
                          <div className="flex gap-2.5 mb-4 pr-3">
                            <div className="w-[140px] sm:w-[190px] flex-shrink-0" />
                            {dateRange.map((d) => {
                              const isToday = d === today;
                              return (
                                <div key={d} className="flex-1 text-center">
                                  <div className={`py-1.5 px-2 rounded-xl transition-colors ${
                                    isToday ? 'bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308] font-bold' : ''
                                  }`}>
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block">{getDayName(d)}</span>
                                    <span className={`text-base sm:text-lg font-black font-heading ${isToday ? '' : 'text-stone-700 dark:text-stone-200'}`}>
                                      {new Date(d + "T00:00:00").getDate()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="w-14 flex-shrink-0 text-center flex items-center justify-center">
                              <span className="text-[10px] uppercase font-bold text-stone-400">Rate</span>
                            </div>
                          </div>

                          {/* Rows */}
                          <div className="space-y-2.5">
                            {habits.map((h) => {
                              const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                              const completionRate = Math.round((completedCount / dateRange.length) * 100);

                              return (
                                <div
                                  key={h.id}
                                  className="group flex items-center gap-2.5 bg-stone-50/70 dark:bg-[#1A1A22]/40 rounded-2xl p-2.5 sm:p-3 border border-stone-100 dark:border-[#272732]/70 hover:border-stone-200 dark:hover:border-[#383848] transition-colors"
                                >
                                  {/* Habit Label */}
                                  <div className="flex items-center gap-2.5 w-[140px] sm:w-[190px] flex-shrink-0 pr-2">
                                    <div className="w-2 h-7 sm:h-8 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                                    <span className="font-bold text-xs sm:text-sm truncate text-stone-800 dark:text-stone-200" title={h.name}>
                                      {h.name}
                                    </span>
                                  </div>

                                  {/* Checkboxes */}
                                  <div className="flex-1 grid grid-cols-7 gap-2">
                                    {dateRange.map((d) => {
                                      const done = logs[h.id]?.has(d);
                                      const isToday = d === today;
                                      return (
                                        <button
                                          key={d}
                                          onClick={() => toggleHabit(h.id, d, !done)}
                                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                            done
                                              ? "scale-102 shadow-xs text-white"
                                              : "bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] hover:border-stone-400"
                                          } ${isToday && !done ? "ring-2 ring-violet-500/20 border-[#7C3AED]" : ""}`}
                                          style={done ? { backgroundColor: h.color, borderColor: h.color } : {}}
                                        >
                                          <Check className={`w-3.5 h-3.5 transition-transform ${done ? 'scale-100' : 'scale-0'}`} />
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Rate Badge */}
                                  <div className="w-14 flex-shrink-0 text-center">
                                    <span className="text-xs font-black font-heading text-stone-700 dark:text-stone-300">{completionRate}%</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {habits.map((h) => {
                        const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                        const completionRate = Math.round((completedCount / dateRange.length) * 100);

                        return (
                          <div key={h.id} className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5 max-w-[65%]">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                                <h3 className="font-bold text-sm truncate text-stone-800 dark:text-stone-200" title={h.name}>{h.name}</h3>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-black font-heading text-stone-900 dark:text-white leading-none">{completionRate}%</span>
                                <span className="text-[10px] text-stone-400 block font-semibold">{completedCount}/{dateRange.length}d</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                              {dateRange.map((d) => {
                                const done = logs[h.id]?.has(d);
                                return (
                                  <div
                                    key={d}
                                    className="w-3.5 h-3.5 rounded-[3px] transition-colors"
                                    style={{ backgroundColor: done ? h.color : undefined }}
                                    title={`${formatDate(d)}`}
                                  >
                                    {!done && <div className="w-full h-full bg-stone-100 dark:bg-[#1A1A22] rounded-[3px]" />}
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
                /* ---------- LIST VIEW ---------- */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {habits.map((h) => {
                    const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                    const completionRate = Math.round((completedCount / dateRange.length) * 100);

                    return (
                      <div key={h.id} className="bg-white dark:bg-[#121218] rounded-2xl p-5 border border-stone-200/80 dark:border-[#272732] shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
                            <div>
                              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200 truncate">{h.name}</h3>
                              <p className="text-[11px] text-stone-400">{completedCount} times completed</p>
                            </div>
                          </div>
                          <span className="text-lg font-black font-heading text-stone-900 dark:text-white">{completionRate}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
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
        className="sm:hidden fixed bottom-20 right-5 w-13 h-13 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-full shadow-lg shadow-violet-500/35 flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} />}
      {showTemplates && <HabitTemplateModal onClose={() => setShowTemplates(false)} />}
    </div>
  );
}