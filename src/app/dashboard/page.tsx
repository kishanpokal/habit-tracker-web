"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import AddHabitModal from "@/components/AddHabitModal";
import HabitTemplateModal from "@/components/HabitTemplateModal";
import HabitNoteModal from "@/components/HabitNoteModal";
import StreakShareModal from "@/components/StreakShareModal";
import WeeklyReviewModal from "@/components/WeeklyReviewModal";
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
import { soundFX } from "@/lib/soundEffects";
import { triggerConfetti } from "@/lib/confetti";
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
  Sun,
  Sunset,
  Moon,
  Clock,
  Shield,
  FileText,
  Share2,
  Trophy,
  Minus,
  CheckCheck,
  ShieldAlert,
} from "lucide-react";

/* ------------------ Types ------------------ */
type HabitType = "boolean" | "numeric" | "negative";
type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

type Habit = {
  id: string;
  name: string;
  color: string;
  category?: string;
  habitType?: HabitType;
  targetValue?: number;
  unit?: string;
  costPerDay?: number;
  timeOfDay?: TimeOfDay;
};

type LogDetail = {
  completed: boolean;
  value?: number;
  note?: string;
  isFrozen?: boolean;
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

  // Modals
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [activeNoteHabit, setActiveNoteHabit] = useState<{ id: string; name: string; note?: string } | null>(null);
  const [activeShareHabit, setActiveShareHabit] = useState<{ name: string; streak: number } | null>(null);

  // Data
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedLogs, setCompletedLogs] = useState<HabitLogMap>({});
  const [frozenLogs, setFrozenLogs] = useState<HabitLogMap>({});
  const [logDetails, setLogDetails] = useState<{ [key: string]: LogDetail }>({});

  // Filters & Views
  const [view, setView] = useState<ViewMode>("week");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [activeRoutine, setActiveRoutine] = useState<"all" | TimeOfDay>("all");
  const [viewBaseDate, setViewBaseDate] = useState(getToday());
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = useMemo(getToday, []);

  // Streak shields available (2 monthly grace shields)
  const [availableShields, setAvailableShields] = useState(2);

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
      const cMap: HabitLogMap = {};
      const fMap: HabitLogMap = {};
      const dMap: { [key: string]: LogDetail } = {};

      let usedFreezesCount = 0;

      snap.docs.forEach((d) => {
        const data = d.data();
        const key = `${data.habitId}_${data.date}`;
        dMap[key] = {
          completed: !!data.completed,
          value: data.value,
          note: data.note,
          isFrozen: !!data.isFrozen,
        };

        if (data.completed) {
          if (!cMap[data.habitId]) cMap[data.habitId] = new Set();
          cMap[data.habitId].add(data.date);
        }

        if (data.isFrozen) {
          if (!fMap[data.habitId]) fMap[data.habitId] = new Set();
          fMap[data.habitId].add(data.date);
          usedFreezesCount++;
        }
      });

      setCompletedLogs(cMap);
      setFrozenLogs(fMap);
      setLogDetails(dMap);
      setAvailableShields(Math.max(0, 2 - usedFreezesCount));
    });
  }, [user]);

  /* ------------------ Actions ------------------ */
  // Toggle binary habit
  const toggleHabit = async (habitId: string, date: string, checked: boolean) => {
    if (!user) return;

    if (checked) {
      soundFX.playHabitComplete();
    } else {
      soundFX.playHabitUndo();
    }

    const key = `${habitId}_${date}`;
    const prev = logDetails[key] || {};

    await setDoc(
      doc(db, "users", user.uid, "habitLogs", key),
      {
        habitId,
        date,
        completed: checked,
        isFrozen: false, // Completing resets any freeze
        value: checked ? (habits.find((h) => h.id === habitId)?.targetValue || 1) : 0,
        note: prev.note || "",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Check if this action completes all habits for today
    if (checked) {
      const willBeAllDone = habits.every((h) => {
        if (h.id === habitId) return true;
        return completedLogs[h.id]?.has(date);
      });
      if (willBeAllDone && habits.length > 0) {
        soundFX.playVictoryFanfare();
        triggerConfetti();
      }
    }
  };

  // Adjust numeric habit counter (+ / -)
  const adjustCounter = async (habit: Habit, date: string, delta: number) => {
    if (!user) return;
    const target = habit.targetValue || 1;
    const key = `${habit.id}_${date}`;
    const prev = logDetails[key] || {};
    const currentValue = prev.value !== undefined ? prev.value : prev.completed ? target : 0;
    const newValue = Math.max(0, currentValue + delta);
    const isNowCompleted = newValue >= target;

    if (delta > 0) {
      soundFX.playCounterTick(true);
      if (isNowCompleted && !prev.completed) {
        soundFX.playHabitComplete();
      }
    } else {
      soundFX.playCounterTick(false);
    }

    await setDoc(
      doc(db, "users", user.uid, "habitLogs", key),
      {
        habitId: habit.id,
        date,
        value: newValue,
        completed: isNowCompleted,
        isFrozen: false,
        note: prev.note || "",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (isNowCompleted && !prev.completed) {
      const willBeAllDone = habits.every((h) => {
        if (h.id === habit.id) return true;
        return completedLogs[h.id]?.has(date);
      });
      if (willBeAllDone) {
        soundFX.playVictoryFanfare();
        triggerConfetti();
      }
    }
  };

  // Apply Streak Freeze Shield
  const toggleStreakFreeze = async (habitId: string, date: string) => {
    if (!user) return;
    const key = `${habitId}_${date}`;
    const prev = logDetails[key] || {};
    const willFreeze = !prev.isFrozen;

    if (willFreeze) {
      soundFX.playStreakShield();
    } else {
      soundFX.playClick();
    }

    await setDoc(
      doc(db, "users", user.uid, "habitLogs", key),
      {
        habitId,
        date,
        isFrozen: willFreeze,
        completed: false,
        note: prev.note || "",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // One-click Complete Routine for current window
  const completeCurrentRoutine = async () => {
    if (!user) return;
    const habitsToComplete = filteredHabits.filter(
      (h) => !completedLogs[h.id]?.has(selectedDate)
    );

    if (habitsToComplete.length === 0) return;

    soundFX.playVictoryFanfare();
    triggerConfetti();

    for (const h of habitsToComplete) {
      const key = `${h.id}_${selectedDate}`;
      const prev = logDetails[key] || {};
      await setDoc(
        doc(db, "users", user.uid, "habitLogs", key),
        {
          habitId: h.id,
          date: selectedDate,
          completed: true,
          isFrozen: false,
          value: h.targetValue || 1,
          note: prev.note || "",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  // Streak calculation with Streak Shield awareness
  const getStreak = (habitId: string, asOfDate: string) => {
    const cSet = completedLogs[habitId];
    const fSet = frozenLogs[habitId];
    if (!cSet && !fSet) return 0;

    let streak = 0;
    let cursor = asOfDate;

    const isSatisfied = (d: string) => (cSet?.has(d) || fSet?.has(d));

    if (!isSatisfied(cursor)) {
      const yesterday = addDays(cursor, -1);
      if (isSatisfied(yesterday)) {
        cursor = yesterday;
      } else {
        return 0;
      }
    }

    while (isSatisfied(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  /* ------------------ Filtering & Computations ------------------ */
  const filteredHabits = useMemo(() => {
    if (activeRoutine === "all") return habits;
    return habits.filter(
      (h) => h.timeOfDay === activeRoutine || (!h.timeOfDay && activeRoutine === "anytime")
    );
  }, [habits, activeRoutine]);

  const totalPossible = habits.length * dateRange.length;
  const totalCompleted = Object.values(completedLogs).reduce(
    (sum, s) => sum + [...s].filter((d) => dateRange.includes(d)).length,
    0
  );
  const progressPercent = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);

  const previousWeekRange = dateRange.map((d) => addDays(d, -7));
  const previousCompleted = Object.values(completedLogs).reduce(
    (sum, s) => sum + [...s].filter((d) => previousWeekRange.includes(d)).length,
    0
  );
  const previousPossible = habits.length * 7;
  const previousPercent = previousPossible === 0 ? 0 : Math.round((previousCompleted / previousPossible) * 100);
  const delta = progressPercent - previousPercent;
  const comparisonText = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "Even";

  const todayCompletedCount = habits.filter((h) => completedLogs[h.id]?.has(selectedDate)).length;
  const todayProgressRate = habits.length === 0 ? 0 : todayCompletedCount / habits.length;

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-stone-100 font-sans selection:bg-[#7C3AED]/25 overflow-x-hidden">
      <TopNav />

      {/* Main Container - Optimized for Phone, Laptop, and TV */}
      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1680px] mx-auto space-y-4 sm:space-y-6">
        
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
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EAB308]">
                {user.displayName || user.email?.split("@")[0]}
              </span>
            </h1>
            <p className="text-stone-500 dark:text-[#9090A0] text-xs sm:text-sm font-medium">
              {view === "week" && `Week of ${formatDate(dateRange[0])} — ${formatDate(dateRange[dateRange.length - 1])}`}
              {view === "month" && new Date(dateRange[0] + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "year" && `Year ${new Date(dateRange[0] + "T00:00:00").getFullYear()}`}
              {view === "allTime" && "All-Time Practice Records (Last 90 days)"}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setShowWeeklyReview(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-[#7C3AED] dark:text-[#C084FC] border border-violet-500/25 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs"
            >
              <Trophy className="w-4 h-4 text-[#EAB308]" />
              <span>Scorecard</span>
            </button>

            <Link
              href="/habits"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 dark:bg-[#1A1A22] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#272732] border border-stone-200 dark:border-[#272732] rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#7C3AED] dark:text-[#EAB308]" />
              <span>Manage Rituals</span>
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
              <span>New Ritual</span>
            </button>
          </div>
        </header>

        {/* Motivational Card */}
        {(() => {
          const QUOTES = [
            { text: "We are what we repeatedly do. Excellence, then, is not an act, but a ritual.", author: "Will Durant" },
            { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
            { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
            { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
            { text: "A sacred routine is an anchor in a chaotic sea.", author: "Marcus Aurelius" },
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
          
          {/* LEFT SIDEBAR: Daily Focus & Routine Stacking */}
          <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 lg:sticky lg:top-22 order-1 lg:order-none space-y-4">
            <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
              
              {/* Day Selector */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading">
                    {selectedDate === today ? "Today" : formatDate(selectedDate)}
                  </h2>
                  <p className="text-xs font-semibold text-stone-500 dark:text-[#9090A0] mt-0.5">
                    {todayCompletedCount} of {habits.length} rituals fulfilled
                  </p>
                </div>
                <div className="flex gap-1 bg-stone-100 dark:bg-[#1A1A22] p-1 rounded-xl">
                  <button
                    onClick={() => navigateDay(-1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] rounded-lg transition-all active:scale-95 text-stone-600 dark:text-stone-300"
                    title="Previous day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateDay(1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] rounded-lg transition-all active:scale-95 text-stone-600 dark:text-stone-300"
                    title="Next day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Circular Gauge */}
              {habits.length > 0 && (
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                    <svg className="transform -rotate-90 w-full h-full">
                      <circle
                        cx="50%" cy="50%" r="42%"
                        stroke="currentColor" strokeWidth="8%" fill="transparent"
                        className="text-stone-100 dark:text-[#1A1A22]"
                      />
                      <circle
                        cx="50%" cy="50%" r="42%"
                        stroke="url(#ritualisGoldGradient)" strokeWidth="8%" fill="transparent"
                        strokeDasharray="264%"
                        strokeDashoffset={`${264 - (264 * todayProgressRate)}%`}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="ritualisGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7C3AED" />
                          <stop offset="60%" stopColor="#A855F7" />
                          <stop offset="100%" stopColor="#EAB308" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
                        {Math.round(todayProgressRate * 100)}%
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-widest mt-0.5">
                        Fulfilled
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ROUTINE STACKING TABS (Morning / Afternoon / Evening) */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-[#9090A0]">
                    Routine Stacking
                  </span>
                  {filteredHabits.some((h) => !completedLogs[h.id]?.has(selectedDate)) && (
                    <button
                      onClick={completeCurrentRoutine}
                      className="text-[10px] font-bold text-[#7C3AED] dark:text-[#EAB308] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Complete Block
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-[#1A1A22] rounded-xl">
                  {[
                    { id: "all", label: "All", icon: Clock },
                    { id: "morning", label: "Morning", icon: Sun },
                    { id: "afternoon", label: "Noon", icon: Sunset },
                    { id: "evening", label: "Night", icon: Moon },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeRoutine === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveRoutine(tab.id as any)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          active
                            ? "bg-white dark:bg-[#121218] text-[#7C3AED] dark:text-[#EAB308] shadow-xs"
                            : "text-stone-500 dark:text-[#9090A0] hover:text-stone-800"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="text-[11px] hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ritual Checklist with Steppers & Notes */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-0.5">
                {filteredHabits.length === 0 ? (
                  <div className="text-center py-6 bg-stone-50 dark:bg-[#1A1A22]/40 rounded-2xl border border-dashed border-stone-200 dark:border-[#272732]">
                    <p className="text-xs font-semibold text-stone-500 mb-2">No rituals in this routine window</p>
                    <button
                      onClick={() => setShowAddHabit(true)}
                      className="text-xs font-bold text-[#7C3AED] dark:text-[#EAB308] hover:underline"
                    >
                      + Forge a new ritual
                    </button>
                  </div>
                ) : (
                  filteredHabits.map((h) => {
                    const key = `${h.id}_${selectedDate}`;
                    const detail = logDetails[key] || {};
                    const done = completedLogs[h.id]?.has(selectedDate);
                    const isFrozen = frozenLogs[h.id]?.has(selectedDate);
                    const streak = getStreak(h.id, selectedDate);
                    const isNumeric = h.habitType === "numeric";
                    const isNegative = h.habitType === "negative";
                    const target = h.targetValue || 1;
                    const currentVal = detail.value !== undefined ? detail.value : done ? target : 0;
                    const hasNote = !!detail.note;

                    return (
                      <div
                        key={h.id}
                        className={`group relative rounded-xl transition-all duration-200 border select-none p-3 ${
                          done
                            ? "bg-[#EAB308]/10 border-[#EAB308]/30 dark:border-[#EAB308]/25 shadow-xs"
                            : isFrozen
                            ? "bg-violet-500/10 border-[#7C3AED]/30"
                            : "bg-white dark:bg-[#121218] border-stone-100 dark:border-[#272732]/80 hover:border-stone-300 dark:hover:border-stone-700"
                        }`}
                      >
                        {done && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#EAB308]" />
                        )}
                        {isFrozen && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#7C3AED]" />
                        )}

                        <div className="flex items-center justify-between gap-2">
                          {/* Habit Info & Checkbox */}
                          <div
                            onClick={() => !isNumeric && toggleHabit(h.id, selectedDate, !done)}
                            className={`flex items-center gap-2.5 flex-1 min-w-0 ${!isNumeric ? "cursor-pointer" : ""}`}
                          >
                            {!isNumeric && (
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                  done
                                    ? "bg-[#EAB308] text-slate-950 font-black shadow-xs"
                                    : "border-2 border-stone-300 dark:border-stone-600 group-hover:border-stone-400"
                                }`}
                              >
                                <Check className={`w-3.5 h-3.5 transition-transform ${done ? "scale-100" : "scale-0"}`} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-xs sm:text-sm truncate ${done ? "text-stone-900 dark:text-stone-100" : "text-stone-700 dark:text-stone-300"}`}>
                                  {h.name}
                                </p>
                                {isNegative && (
                                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    Quit
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {streak > 0 && (
                                  <span className="text-[10px] font-bold text-[#EAB308] flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 fill-[#EAB308] text-[#EAB308]" />
                                    {streak}d streak
                                  </span>
                                )}
                                {isFrozen && (
                                  <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#C084FC] flex items-center gap-0.5">
                                    <Shield className="w-3 h-3" />
                                    Shielded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Stepper (for numeric) & Action Icons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Numeric Counter Steppers */}
                            {isNumeric && (
                              <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1A1A22] rounded-lg p-0.5 border border-stone-200 dark:border-[#272732]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    adjustCounter(h, selectedDate, -1);
                                  }}
                                  className="w-6 h-6 rounded-md hover:bg-white dark:hover:bg-[#272732] flex items-center justify-center text-stone-600 dark:text-stone-300 active:scale-90 transition-all"
                                  title="Subtract"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black min-w-[32px] text-center text-[#7C3AED] dark:text-[#EAB308]">
                                  {currentVal}/{target}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    adjustCounter(h, selectedDate, 1);
                                  }}
                                  className="w-6 h-6 rounded-md bg-[#7C3AED] text-white hover:brightness-110 flex items-center justify-center active:scale-90 transition-all"
                                  title="Add"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Micro-Note Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveNoteHabit({ id: h.id, name: h.name, note: detail.note });
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                hasNote
                                  ? "text-[#EAB308] bg-amber-500/10 hover:bg-amber-500/20"
                                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1A1A22]"
                              }`}
                              title={hasNote ? `Note: "${detail.note}"` : "Add reflection"}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Streak Freeze Shield Trigger (if not done) */}
                            {!done && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStreakFreeze(h.id, selectedDate);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isFrozen
                                    ? "text-[#7C3AED] bg-violet-500/15"
                                    : "text-stone-400 hover:text-[#7C3AED] hover:bg-stone-100 dark:hover:bg-[#1A1A22]"
                                }`}
                                title={isFrozen ? "Remove streak shield" : "Activate Streak Shield"}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Share Streak Modal Button */}
                            {streak > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveShareHabit({ name: h.name, streak });
                                }}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-[#EAB308] hover:bg-stone-100 dark:hover:bg-[#1A1A22] transition-colors"
                                title="Share streak card"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Numeric Progress Bar */}
                        {isNumeric && (
                          <div className="mt-2 w-full bg-stone-100 dark:bg-[#1A1A22] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EAB308] transition-all duration-300"
                              style={{ width: `${Math.min(100, (currentVal / target) * 100)}%` }}
                            />
                          </div>
                        )}
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
                    <span>Manage All Rituals</span>
                  </div>
                  <span className="text-[11px] text-[#7C3AED] dark:text-[#EAB308] group-hover:translate-x-0.5 transition-transform">
                    {habits.length} practices →
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT MAIN AREA: Multi-Device Matrix & Metrics */}
          <div className="flex-1 order-2 lg:order-none min-w-0 space-y-4 sm:space-y-6 w-full">
            
            {/* Micro-Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Consistency</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-stone-900 dark:text-white">{progressPercent}%</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    delta >= 0
                      ? "bg-violet-50 dark:bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#EAB308]"
                      : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500 dark:text-[#9090A0]"
                  }`}>
                    {comparisonText}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Active Rituals</span>
                <span className="text-2xl sm:text-3xl font-black font-heading text-stone-900 dark:text-white mt-2">{habits.length}</span>
              </div>

              <div className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider">Streak Shields</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-[#7C3AED] dark:text-[#C084FC]">
                    {availableShields}
                  </span>
                  <span className="text-xs font-bold text-stone-400">/2 ready</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#7C3AED] to-[#EAB308] rounded-2xl p-4 text-white shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">Momentum</span>
                <div className="flex items-center gap-1 mt-2">
                  <Flame className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                  <span className="text-lg sm:text-xl font-black font-heading leading-tight">
                    {todayProgressRate >= 1 ? "100% Mastered" : todayProgressRate >= 0.5 ? "Flow Active" : "In Progress"}
                  </span>
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
                    title="Previous view"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateView(1)}
                    className="p-1.5 hover:bg-white dark:hover:bg-[#272732] text-stone-600 dark:text-stone-300 rounded-lg transition-all active:scale-95"
                    title="Next view"
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
                    title="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayout("list")}
                    className={`p-1.5 rounded-lg transition-all ${
                      layout === "list" ? "bg-white dark:bg-[#1E1E28] text-[#7C3AED] dark:text-[#EAB308] shadow-xs" : "text-stone-400 hover:text-stone-700"
                    }`}
                    title="List view"
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
                  <h3 className="text-xl sm:text-2xl font-black font-heading mb-2">Forge your daily practice</h3>
                  <p className="text-stone-500 dark:text-[#9090A0] text-sm max-w-sm mx-auto mb-6">
                    Add the sacred rituals you wish to cultivate. Track your streaks and watch consistency compound over time.
                  </p>
                  <button
                    onClick={() => setShowAddHabit(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    Forge Your First Ritual
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
                                    isToday ? "bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308] font-bold" : ""
                                  }`}>
                                    <span className="text-[10px] uppercase font-bold text-stone-400 block">{getDayName(d)}</span>
                                    <span className={`text-base sm:text-lg font-black font-heading ${isToday ? "" : "text-stone-700 dark:text-stone-200"}`}>
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
                              const completedCount = dateRange.filter((d) => completedLogs[h.id]?.has(d)).length;
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
                                      const done = completedLogs[h.id]?.has(d);
                                      const isFrozen = frozenLogs[h.id]?.has(d);
                                      const isToday = d === today;
                                      return (
                                        <button
                                          key={d}
                                          onClick={() => toggleHabit(h.id, d, !done)}
                                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                            done
                                              ? "scale-102 shadow-xs text-white"
                                              : isFrozen
                                              ? "bg-violet-500/20 border border-[#7C3AED] text-[#7C3AED] dark:text-[#C084FC]"
                                              : "bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] hover:border-stone-400"
                                          } ${isToday && !done && !isFrozen ? "ring-2 ring-violet-500/20 border-[#7C3AED]" : ""}`}
                                          style={done ? { backgroundColor: h.color, borderColor: h.color } : {}}
                                          title={isFrozen ? "Streak Shield Active" : done ? "Completed" : "Not yet done"}
                                        >
                                          {done && <Check className="w-3.5 h-3.5 transition-transform scale-100" />}
                                          {isFrozen && <Shield className="w-3.5 h-3.5" />}
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
                        const completedCount = dateRange.filter((d) => completedLogs[h.id]?.has(d)).length;
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
                                const done = completedLogs[h.id]?.has(d);
                                const isFrozen = frozenLogs[h.id]?.has(d);
                                return (
                                  <div
                                    key={d}
                                    className="w-3.5 h-3.5 rounded-[3px] transition-colors"
                                    style={{ backgroundColor: done ? h.color : isFrozen ? "#7C3AED" : undefined }}
                                    title={`${formatDate(d)}${isFrozen ? " (Shielded)" : ""}`}
                                  >
                                    {!done && !isFrozen && <div className="w-full h-full bg-stone-100 dark:bg-[#1A1A22] rounded-[3px]" />}
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
                    const completedCount = dateRange.filter((d) => completedLogs[h.id]?.has(d)).length;
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
        title="Forge Ritual"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} />}
      {showTemplates && <HabitTemplateModal onClose={() => setShowTemplates(false)} />}
      {showWeeklyReview && (
        <WeeklyReviewModal
          habits={habits}
          logs={completedLogs}
          weekDates={dateRange.slice(0, 7)}
          streakFreezesAvailable={availableShields}
          onClose={() => setShowWeeklyReview(false)}
        />
      )}
      {activeNoteHabit && (
        <HabitNoteModal
          habitId={activeNoteHabit.id}
          habitName={activeNoteHabit.name}
          date={selectedDate}
          initialNote={activeNoteHabit.note}
          onClose={() => setActiveNoteHabit(null)}
          onSaved={(note) => {
            const key = `${activeNoteHabit.id}_${selectedDate}`;
            setLogDetails((prev) => ({
              ...prev,
              [key]: { ...(prev[key] || { completed: false }), note },
            }));
          }}
        />
      )}
      {activeShareHabit && (
        <StreakShareModal
          habitName={activeShareHabit.name}
          streakCount={activeShareHabit.streak}
          userName={user.displayName || user.email?.split("@")[0] || "Ritualist"}
          completionRate={progressPercent}
          onClose={() => setActiveShareHabit(null)}
        />
      )}
    </div>
  );
}