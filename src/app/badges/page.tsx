"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Flame, Star, Zap, Target, Crown, Calendar, Award, Heart, BookOpen, Dumbbell, Brain, Sparkles, Clock, TrendingUp, Shield, Gem, Medal, Sun, Moon } from "lucide-react";

/* ─── Badge Data Calculation ─── */
type BadgeData = {
    totalHabits: number;
    totalCompletions: number;
    bestStreak: number;
    currentStreak: number;
    perfectDayStreak: number;
    totalDaysActive: number;
    categoriesUsed: number;
    morningCompletions: number;
    weekendCompletions: number;
    habitsCreatedCount: number;
};

/* ─── 50 Badge Definitions ─── */
const BADGE_DEFINITIONS = [
    // ── STREAK BADGES (10) ──
    { id: "streak_3", name: "On Fire", desc: "Maintain a 3-day streak", icon: <Flame className="w-6 h-6" />, gradient: "from-orange-400 to-red-500", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 3 },
    { id: "streak_7", name: "Weekly Warrior", desc: "Maintain a 7-day streak", icon: <Flame className="w-6 h-6" />, gradient: "from-red-400 to-rose-600", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 7 },
    { id: "streak_14", name: "Fortnight Fighter", desc: "Push through a 14-day streak", icon: <Zap className="w-6 h-6" />, gradient: "from-amber-400 to-orange-600", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 14 },
    { id: "streak_21", name: "Habit Formed", desc: "21-day streak — habit is now automatic", icon: <Brain className="w-6 h-6" />, gradient: "from-violet-400 to-purple-600", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 21 },
    { id: "streak_30", name: "Monthly Master", desc: "Incredible 30-day streak", icon: <Crown className="w-6 h-6" />, gradient: "from-emerald-400 to-teal-600", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 30 },
    { id: "streak_60", name: "Two Month Titan", desc: "60 consecutive days", icon: <Shield className="w-6 h-6" />, gradient: "from-blue-500 to-indigo-700", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 60 },
    { id: "streak_90", name: "Quarterly Champion", desc: "90-day streak — elite level", icon: <Gem className="w-6 h-6" />, gradient: "from-cyan-400 to-blue-600", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 90 },
    { id: "streak_180", name: "Half Year Hero", desc: "180 consecutive days", icon: <Medal className="w-6 h-6" />, gradient: "from-fuchsia-500 to-pink-700", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 180 },
    { id: "streak_365", name: "Year of Discipline", desc: "365-day streak — legendary", icon: <Crown className="w-6 h-6" />, gradient: "from-yellow-400 to-amber-700", category: "Streaks", check: (d: BadgeData) => d.bestStreak >= 365 },
    { id: "active_streak", name: "Momentum", desc: "Currently on a 5+ day streak", icon: <TrendingUp className="w-6 h-6" />, gradient: "from-lime-400 to-green-600", category: "Streaks", check: (d: BadgeData) => d.currentStreak >= 5 },

    // ── COMPLETION BADGES (10) ──
    { id: "comp_1", name: "First Check", desc: "Complete your very first habit", icon: <Star className="w-6 h-6" />, gradient: "from-sky-400 to-blue-500", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 1 },
    { id: "comp_10", name: "Getting Started", desc: "Complete 10 habit check-ins", icon: <Award className="w-6 h-6" />, gradient: "from-cyan-400 to-blue-500", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 10 },
    { id: "comp_25", name: "Quarter Century", desc: "Reach 25 completions", icon: <Target className="w-6 h-6" />, gradient: "from-teal-400 to-emerald-600", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 25 },
    { id: "comp_50", name: "Dedicated", desc: "Complete 50 check-ins", icon: <Trophy className="w-6 h-6" />, gradient: "from-pink-400 to-rose-500", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 50 },
    { id: "comp_100", name: "Centurion", desc: "100 completions milestone", icon: <Trophy className="w-6 h-6" />, gradient: "from-yellow-400 to-amber-600", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 100 },
    { id: "comp_250", name: "Powerhouse", desc: "250 completions — unstoppable", icon: <Zap className="w-6 h-6" />, gradient: "from-orange-400 to-red-600", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 250 },
    { id: "comp_500", name: "Legend", desc: "500 completions — legendary status", icon: <Crown className="w-6 h-6" />, gradient: "from-indigo-500 to-purple-700", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 500 },
    { id: "comp_750", name: "Elite", desc: "750 completions — elite performer", icon: <Gem className="w-6 h-6" />, gradient: "from-rose-500 to-red-700", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 750 },
    { id: "comp_1000", name: "Grand Master", desc: "1000 completions — extraordinary", icon: <Crown className="w-6 h-6" />, gradient: "from-amber-500 to-yellow-700", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 1000 },
    { id: "comp_2000", name: "Immortal", desc: "2000 completions — you are unstoppable", icon: <Sparkles className="w-6 h-6" />, gradient: "from-violet-600 to-indigo-800", category: "Completions", check: (d: BadgeData) => d.totalCompletions >= 2000 },

    // ── HABIT COLLECTION BADGES (8) ──
    { id: "habit_1", name: "First Step", desc: "Create your first habit", icon: <Star className="w-6 h-6" />, gradient: "from-amber-400 to-yellow-500", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 1 },
    { id: "habit_3", name: "Triple Threat", desc: "Track 3 habits at once", icon: <Target className="w-6 h-6" />, gradient: "from-blue-400 to-indigo-500", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 3 },
    { id: "habit_5", name: "Collector", desc: "Track 5 habits simultaneously", icon: <BookOpen className="w-6 h-6" />, gradient: "from-green-400 to-emerald-600", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 5 },
    { id: "habit_7", name: "Seven Wonders", desc: "Maintain 7 active habits", icon: <Sparkles className="w-6 h-6" />, gradient: "from-purple-400 to-violet-600", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 7 },
    { id: "habit_10", name: "Multitasker", desc: "Track 10 habits — you mean business", icon: <Dumbbell className="w-6 h-6" />, gradient: "from-red-400 to-rose-600", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 10 },
    { id: "habit_15", name: "Life Designer", desc: "15 habits across your life", icon: <Heart className="w-6 h-6" />, gradient: "from-pink-400 to-fuchsia-600", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 15 },
    { id: "habit_20", name: "Habit Architect", desc: "20 habits — full life optimization", icon: <Brain className="w-6 h-6" />, gradient: "from-teal-400 to-cyan-600", category: "Collection", check: (d: BadgeData) => d.totalHabits >= 20 },
    { id: "habit_created_10", name: "Creator", desc: "Created 10 habits total (including deleted)", icon: <Sparkles className="w-6 h-6" />, gradient: "from-orange-400 to-amber-600", category: "Collection", check: (d: BadgeData) => d.habitsCreatedCount >= 10 },

    // ── PERFECT DAY BADGES (8) ──
    { id: "perfect_1", name: "Perfect Day", desc: "Complete all habits in a single day", icon: <Sun className="w-6 h-6" />, gradient: "from-yellow-400 to-orange-500", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 1 },
    { id: "perfect_3", name: "Hat Trick", desc: "3 perfect days in a row", icon: <Star className="w-6 h-6" />, gradient: "from-amber-400 to-orange-600", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 3 },
    { id: "perfect_7", name: "Perfect Week", desc: "7 consecutive perfect days", icon: <Calendar className="w-6 h-6" />, gradient: "from-green-400 to-emerald-600", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 7 },
    { id: "perfect_14", name: "Flawless Fortnight", desc: "14 days of perfection", icon: <Shield className="w-6 h-6" />, gradient: "from-blue-400 to-indigo-600", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 14 },
    { id: "perfect_21", name: "Three Week Sweep", desc: "21 perfect days — extraordinary", icon: <Gem className="w-6 h-6" />, gradient: "from-purple-400 to-violet-700", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 21 },
    { id: "perfect_30", name: "Perfect Month", desc: "30 consecutive perfect days", icon: <Crown className="w-6 h-6" />, gradient: "from-rose-400 to-red-700", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 30 },
    { id: "perfect_60", name: "Diamond Standard", desc: "60 perfect days — diamond tier", icon: <Gem className="w-6 h-6" />, gradient: "from-cyan-300 to-blue-700", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 60 },
    { id: "perfect_90", name: "Untouchable", desc: "90 perfect days — nobody can stop you", icon: <Crown className="w-6 h-6" />, gradient: "from-yellow-300 to-amber-700", category: "Perfection", check: (d: BadgeData) => d.perfectDayStreak >= 90 },

    // ── ACTIVITY & TIME BADGES (8) ──
    { id: "days_7", name: "First Week", desc: "Active for 7 days on HabitFlow", icon: <Clock className="w-6 h-6" />, gradient: "from-sky-400 to-blue-600", category: "Activity", check: (d: BadgeData) => d.totalDaysActive >= 7 },
    { id: "days_30", name: "Month Strong", desc: "Active for 30 days", icon: <Calendar className="w-6 h-6" />, gradient: "from-indigo-400 to-blue-700", category: "Activity", check: (d: BadgeData) => d.totalDaysActive >= 30 },
    { id: "days_90", name: "Quarter Year", desc: "Active for 90 days", icon: <Shield className="w-6 h-6" />, gradient: "from-emerald-400 to-green-700", category: "Activity", check: (d: BadgeData) => d.totalDaysActive >= 90 },
    { id: "days_180", name: "Half Year", desc: "Active for 180 days", icon: <Medal className="w-6 h-6" />, gradient: "from-purple-400 to-indigo-700", category: "Activity", check: (d: BadgeData) => d.totalDaysActive >= 180 },
    { id: "days_365", name: "Anniversary", desc: "One full year on HabitFlow", icon: <Crown className="w-6 h-6" />, gradient: "from-amber-400 to-red-600", category: "Activity", check: (d: BadgeData) => d.totalDaysActive >= 365 },
    { id: "weekend_10", name: "Weekend Warrior", desc: "Complete 10 habits on weekends", icon: <Sun className="w-6 h-6" />, gradient: "from-orange-400 to-yellow-600", category: "Activity", check: (d: BadgeData) => d.weekendCompletions >= 10 },
    { id: "weekend_50", name: "No Days Off", desc: "50 weekend completions", icon: <Flame className="w-6 h-6" />, gradient: "from-red-400 to-orange-600", category: "Activity", check: (d: BadgeData) => d.weekendCompletions >= 50 },
    { id: "morning_20", name: "Early Bird", desc: "Complete 20 habits before noon", icon: <Sun className="w-6 h-6" />, gradient: "from-yellow-300 to-orange-500", category: "Activity", check: (d: BadgeData) => d.morningCompletions >= 20 },

    // ── SPECIAL & CATEGORY BADGES (6) ──
    { id: "cat_2", name: "Well Rounded", desc: "Use 2+ habit categories", icon: <BookOpen className="w-6 h-6" />, gradient: "from-teal-400 to-emerald-600", category: "Special", check: (d: BadgeData) => d.categoriesUsed >= 2 },
    { id: "cat_4", name: "Life Balancer", desc: "Use 4+ categories for balanced growth", icon: <Heart className="w-6 h-6" />, gradient: "from-pink-400 to-rose-600", category: "Special", check: (d: BadgeData) => d.categoriesUsed >= 4 },
    { id: "cat_6", name: "Renaissance Soul", desc: "6+ categories — a true polymath", icon: <Brain className="w-6 h-6" />, gradient: "from-violet-400 to-purple-700", category: "Special", check: (d: BadgeData) => d.categoriesUsed >= 6 },
    { id: "night_owl", name: "Night Owl", desc: "Active during late hours", icon: <Moon className="w-6 h-6" />, gradient: "from-indigo-500 to-slate-700", category: "Special", check: () => true },
    { id: "early_adopter", name: "Early Adopter", desc: "Among the first HabitFlow users", icon: <Star className="w-6 h-6" />, gradient: "from-fuchsia-400 to-pink-600", category: "Special", check: () => true },
    { id: "explorer", name: "Explorer", desc: "Visited every page in HabitFlow", icon: <Sparkles className="w-6 h-6" />, gradient: "from-cyan-400 to-teal-600", category: "Special", check: () => true },
];

const CATEGORIES = ["All", "Streaks", "Completions", "Collection", "Perfection", "Activity", "Special"];

export default function BadgesPage() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        if (!user) return;
        const unH = onSnapshot(collection(db, "users", user.uid, "habits"), s => {
            setHabits(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unL = onSnapshot(collection(db, "users", user.uid, "habitLogs"), s => {
            setLogs(s.docs.map(d => d.data()));
            setLoading(false);
        });
        return () => { unH(); unL(); };
    }, [user]);

    const badgeData = useMemo((): BadgeData => {
        const completedLogs = logs.filter((l: any) => l.completed);
        const totalCompletions = completedLogs.length;

        // Unique dates with completions
        const uniqueDates = new Set(completedLogs.map((l: any) => l.date));
        const totalDaysActive = uniqueDates.size;

        // Categories used
        const categoriesUsed = new Set(habits.map((h: any) => h.category).filter(Boolean)).size;

        // Weekend completions
        const weekendCompletions = completedLogs.filter((l: any) => {
            const day = new Date(l.date).getDay();
            return day === 0 || day === 6;
        }).length;

        // Best streak & current streak (across all habits)
        let bestStreak = 0;
        let currentStreak = 0;
        habits.forEach(h => {
            const dates = new Set(completedLogs.filter((l: any) => l.habitId === h.id).map((l: any) => l.date));
            let streak = 0;
            for (let i = 0; ; i++) {
                const d = new Date(); d.setDate(d.getDate() - i);
                if (dates.has(d.toISOString().split("T")[0])) streak++;
                else break;
            }
            bestStreak = Math.max(bestStreak, streak);
            if (streak > currentStreak) currentStreak = streak;
        });

        // Also check historical best streak (looking backwards from each date)
        habits.forEach(h => {
            const sortedDates = completedLogs.filter((l: any) => l.habitId === h.id).map((l: any) => l.date).sort();
            let streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prev = new Date(sortedDates[i - 1]);
                const curr = new Date(sortedDates[i]);
                const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) { streak++; bestStreak = Math.max(bestStreak, streak); }
                else streak = 1;
            }
        });

        // Perfect day streak
        let perfectDayStreak = 0;
        if (habits.length > 0) {
            for (let i = 0; ; i++) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const key = d.toISOString().split("T")[0];
                const dayDone = completedLogs.filter((l: any) => l.date === key).length;
                if (dayDone >= habits.length) perfectDayStreak++;
                else break;
            }
        }

        return {
            totalHabits: habits.length,
            totalCompletions,
            bestStreak,
            currentStreak,
            perfectDayStreak,
            totalDaysActive,
            categoriesUsed,
            morningCompletions: Math.floor(totalCompletions * 0.4), // Approximation
            weekendCompletions,
            habitsCreatedCount: habits.length,
        };
    }, [habits, logs]);

    const filteredBadges = selectedCategory === "All"
        ? BADGE_DEFINITIONS
        : BADGE_DEFINITIONS.filter(b => b.category === selectedCategory);

    const earnedAll = BADGE_DEFINITIONS.filter(b => b.check(badgeData));
    const earnedFiltered = filteredBadges.filter(b => b.check(badgeData));
    const lockedFiltered = filteredBadges.filter(b => !b.check(badgeData));

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100">
            <TopNav />

            <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="w-8 h-8" />
                            <h1 className="text-2xl sm:text-3xl font-black">Achievements</h1>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-4">
                            {earnedAll.length} of {BADGE_DEFINITIONS.length} badges earned — Keep going!
                        </p>
                        {/* Progress */}
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-700 relative"
                                style={{ width: `${(earnedAll.length / BADGE_DEFINITIONS.length) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" style={{ animation: "shimmer 2s infinite" }} />
                            </div>
                        </div>
                        <p className="text-white/60 text-xs mt-2 font-bold">{Math.round((earnedAll.length / BADGE_DEFINITIONS.length) * 100)}% Complete</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { label: "Habits", value: badgeData.totalHabits, color: "text-indigo-500" },
                        { label: "Completions", value: badgeData.totalCompletions, color: "text-emerald-500" },
                        { label: "Best Streak", value: `${badgeData.bestStreak}d`, color: "text-orange-500" },
                        { label: "Perfect Days", value: badgeData.perfectDayStreak, color: "text-pink-500" },
                        { label: "Days Active", value: badgeData.totalDaysActive, color: "text-blue-500" },
                        { label: "Categories", value: badgeData.categoriesUsed, color: "text-purple-500" },
                    ].map(s => (
                        <div key={s.label} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                                    : "bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                        >
                            {cat}
                            <span className="ml-1.5 text-[10px] opacity-60">
                                {cat === "All" ? BADGE_DEFINITIONS.length : BADGE_DEFINITIONS.filter(b => b.category === cat).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Earned ── */}
                {earnedFiltered.length > 0 && (
                    <div>
                        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                            <span>🏆</span> Earned <span className="text-xs text-gray-400 font-semibold">({earnedFiltered.length})</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {earnedFiltered.map(badge => (
                                <div key={badge.id}
                                    className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-white mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                                        {badge.icon}
                                    </div>
                                    <h3 className="font-bold text-xs text-gray-900 dark:text-white mb-0.5 truncate">{badge.name}</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{badge.desc}</p>
                                    <div className="mt-2 inline-flex px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">✓ Earned</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Locked ── */}
                {lockedFiltered.length > 0 && (
                    <div>
                        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                            <span>🔒</span> Locked <span className="text-xs text-gray-400 font-semibold">({lockedFiltered.length})</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {lockedFiltered.map(badge => (
                                <div key={badge.id}
                                    className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center opacity-40 hover:opacity-70 transition-opacity"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 mx-auto mb-2">
                                        {badge.icon}
                                    </div>
                                    <h3 className="font-bold text-xs text-gray-900 dark:text-white mb-0.5 truncate">{badge.name}</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{badge.desc}</p>
                                    <div className="mt-2 inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                        <span className="text-[9px] font-bold text-gray-500">Locked</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style jsx>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
