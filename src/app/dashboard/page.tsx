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

    // allTime - last 90 days ending at viewBaseDate
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
  if (loading) return;          // wait for auth hydration
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
  const weekPercent = weekPossible === 0 ? 0 : Math.round((weekCompleted / weekPossible) * 100);

  // For week view comparison
  const previousWeekRange = dateRange.map((d) => addDays(d, -7));
  const previousCompleted = Object.values(logs).reduce(
    (sum, s) => sum + [...s].filter((d) => previousWeekRange.includes(d)).length,
    0
  );
  const previousPossible = habits.length * 7;
  const previousPercent = previousPossible === 0 ? 0 : Math.round((previousCompleted / previousPossible) * 100);
  const delta = progressPercent - previousPercent;
  const comparisonText = delta > 0 ? `Up ${delta}%` : delta < 0 ? `Down ${Math.abs(delta)}%` : 'Same as';

  const startDate = formatDate(dateRange[0]);
  const endDate = formatDate(dateRange[dateRange.length - 1]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Hey there, {user.email?.split("@")[0]}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {view === "week" && `${startDate} - ${endDate}`}
              {view === "month" && new Date(dateRange[0]).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "year" && new Date(dateRange[0]).getFullYear()}
              {view === "allTime" && "Last 90 days"}
            </p>
          </div>

          {/* Progress Info */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercent}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">of daily goal achieved</p>
            </div>
          </div>
        </div>

        {/* View Tabs & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-800">
            {(["week", "month", "year", "allTime"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === m
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {m === "allTime" ? "All Time" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddHabit(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Habit
          </button>
        </div>

        {/* Week Progress Bar */}
        {view === "week" && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {comparisonText} week before
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {progressPercent}% achieved
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Date Range Header + Layout Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigateView(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {view === "week" && `${startDate} - ${endDate}`}
              {view === "month" && new Date(dateRange[0]).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "year" && new Date(dateRange[0]).getFullYear()}
              {view === "allTime" && "Last 90 Days"}
            </h2>
            <button onClick={() => navigateView(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setLayout("list")}
              className={`p-2 rounded-md transition-all ${
                layout === "list"
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setLayout("grid")}
              className={`p-2 rounded-md transition-all ${
                layout === "grid"
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Habits Grid/List */}
          <div className="lg:col-span-2 space-y-4">
            {habits.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No habits yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start building better habits by adding your first one!</p>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                >
                  Add Your First Habit
                </button>
              </div>
            ) : layout === "grid" ? (
              // GRID LAYOUT
              <>
  {/* Day Headers - Show for all views */}
  {view === "week" && (
    <div className="flex gap-2 px-4">
      <div className="w-32" />
      {dateRange.map((d) => (
        <div key={d} className="flex-1 text-center">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{getDayName(d)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(d).getDate()}</p>
        </div>
      ))}
      <div className="w-12" />
    </div>
  )}
  {/* Month View - Show calendar grid */}
  {view === "month" && (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-4">
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 pb-2">
            {day}
          </div>
        ))}
       
        {/* Empty cells for offset */}
        {Array.from({ length: new Date(dateRange[0]).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
       
        {/* Date cells */}
        {dateRange.map((d) => {
          const dayHabits = habits.map(h => ({
            habit: h,
            completed: logs[h.id]?.has(d)
          }));
          const completedCount = dayHabits.filter(h => h.completed).length;
         
          return (
            <div key={d} className="aspect-square">
              <div className={`w-full h-full rounded-lg border-2 p-1 ${
                d === today
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}>
                <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  {new Date(d).getDate()}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {dayHabits.map(({ habit, completed }) => (
                    <div
                      key={habit.id}
                      className={`w-2 h-2 rounded-sm ${completed ? "opacity-100" : "opacity-20"}`}
                      style={{ backgroundColor: habit.color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
  {/* Habit Rows - Week View */}
  {view === "week" && habits.map((h) => {
    const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
    return (
      <div
        key={h.id}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-2">
          {/* Habit Name */}
          <div className="w-32 flex items-center gap-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{h.name}</span>
          </div>
          {/* Day Checkboxes */}
          <div className="flex-1 flex gap-2">
            {dateRange.map((d) => {
              const done = logs[h.id]?.has(d);
              const isToday = d === today;
              return (
                <button
                  key={d}
                  onClick={() => toggleHabit(h.id, d, !done)}
                  className={`flex-1 h-10 rounded-lg transition-all ${
                    done
                      ? "opacity-100 shadow-sm"
                      : "opacity-30 hover:opacity-60 border-2 border-dashed border-gray-300 dark:border-gray-700"
                  } ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                  style={{ backgroundColor: done ? h.color : "transparent" }}
                />
              );
            })}
          </div>
          {/* Count */}
          <div className="w-12 text-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {completedCount}/{dateRange.length}
            </span>
          </div>
        </div>
      </div>
    );
  })}
  {/* Year/All Time - Heatmap style per habit */}
  {(view === "year" || view === "allTime") && habits.map((h) => {
    const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
    return (
      <div
        key={h.id}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="font-semibold text-gray-900 dark:text-white">{h.name}</span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{dateRange.length} completed
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {dateRange.map((d) => {
            const done = logs[h.id]?.has(d);
            return (
              <div
                key={d}
                className={`w-3 h-3 rounded-sm transition-all ${
                  done ? "opacity-100" : "opacity-20"
                }`}
                style={{ backgroundColor: h.color }}
                title={`${d}: ${done ? 'Completed' : 'Not completed'}`}
              />
            );
          })}
        </div>
      </div>
    );
  })}
</>
            ) : (
              // LIST LAYOUT
              habits.map((h) => {
                const completedCount = dateRange.filter((d) => logs[h.id]?.has(d)).length;
                return (
                  <div
                    key={h.id}
                    className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: h.color }} />
                        <span className="font-semibold text-gray-900 dark:text-white">{h.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {completedCount}/{dateRange.length} completed
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {dateRange.map((d) => {
                        const done = logs[h.id]?.has(d);
                        return (
                          <div
                            key={d}
                            className={`w-3 h-3 rounded-sm transition-all ${
                              done ? "opacity-100" : "opacity-20"
                            }`}
                            style={{ backgroundColor: h.color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT - Daily Habits */}
          <div className="space-y-4">
            {/* Daily Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(selectedDate)}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => navigateDay(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={() => navigateDay(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {habits.filter((h) => logs[h.id]?.has(selectedDate)).length}/{habits.length} of daily goal achieved
              </p>

              {/* Daily Habit List */}
              <div className="space-y-3">
                {habits.length === 0 ? (
                  <p className="text-center text-gray-400 dark:text-gray-500 py-8">No habits to track</p>
                ) : (
                  habits.map((h) => {
                    const done = logs[h.id]?.has(selectedDate);
                    return (
                      <div
                        key={h.id}
                        className={`rounded-xl p-4 transition-all cursor-pointer border-2 ${
                          done
                            ? "border-transparent shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        style={{ backgroundColor: done ? h.color : "transparent" }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {done ? (
                              <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 dark:border-gray-500 flex-shrink-0" />
                            )}
                            <span className={`font-medium ${done ? "text-white" : "text-gray-900 dark:text-white"}`}>
                              {h.name}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleHabit(h.id, selectedDate, !done)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              done
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {done ? "Undo" : "Mark Complete"}
                          </button>
                        </div>

                        {/* Streak indicator */}
                        {getStreak(h.id, selectedDate) > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <svg className={`w-4 h-4 ${done ? "text-white" : "text-orange-500"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            <span className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>
                              {getStreak(h.id, selectedDate)} day streak
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} />}
    </div>
  );
}