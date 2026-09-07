"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import TopNav from "@/components/TopNav";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Trophy,
  Flame,
  Star,
  Zap,
  Target,
  Crown,
  Calendar,
  Award,
  Heart,
  BookOpen,
  Dumbbell,
  Brain,
  Sparkles,
  Clock,
  TrendingUp,
  Shield,
  Gem,
  Medal,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";

/* ─── Badge Data Types ─── */
type BadgeData = {
  totalHabits: number;
  totalCompletions: number;
  bestStreak: number;
  currentStreak: number;
  totalPerfectDays: number;
  bestPerfectStreak: number;
  currentPerfectStreak: number;
  totalDaysActive: number;
  categoriesUsed: number;
  morningCompletions: number;
  weekendCompletions: number;
  habitsCreatedCount: number;
};

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  category: "Streaks" | "Completions" | "Collection" | "Perfection" | "Activity" | "Special";
  rarity: Rarity;
  gradient?: string;
  check: (d: BadgeData) => boolean;
  getProgress: (d: BadgeData) => { current: number; target: number; unit: string };
};

const RARITY_CONFIG: Record<
  Rarity,
  { label: string; border: string; bg: string; text: string; glow: string; gradient: string }
> = {
  common: {
    label: "Common",
    border: "border-stone-200 dark:border-[#272732]",
    bg: "bg-stone-100 dark:bg-[#1A1A22]",
    text: "text-stone-600 dark:text-stone-400",
    glow: "shadow-xs",
    gradient: "from-stone-500 to-stone-700",
  },
  uncommon: {
    label: "Uncommon",
    border: "border-[#7C3AED]/40 dark:border-[#7C3AED]/30",
    bg: "bg-[#7C3AED]/10 dark:bg-[#7C3AED]/15",
    text: "text-[#7C3AED] dark:text-[#C084FC]",
    glow: "shadow-xs shadow-[#7C3AED]/15",
    gradient: "from-stone-600 to-[#6D28D9]",
  },
  rare: {
    label: "Rare",
    border: "border-[#A855F7]/50 dark:border-[#A855F7]/40",
    bg: "bg-[#A855F7]/10 dark:bg-[#A855F7]/20",
    text: "text-[#7C3AED] dark:text-[#A855F7]",
    glow: "shadow-sm shadow-[#7C3AED]/20",
    gradient: "from-[#7C3AED] to-[#A855F7]",
  },
  epic: {
    label: "Epic",
    border: "border-[#EAB308]/50 dark:border-[#EAB308]/40",
    bg: "bg-[#EAB308]/10 dark:bg-[#EAB308]/15",
    text: "text-[#EAB308] dark:text-[#FACC15]",
    glow: "shadow-sm shadow-[#EAB308]/25",
    gradient: "from-[#6D28D9] via-[#7C3AED] to-[#EAB308]",
  },
  legendary: {
    label: "Legendary",
    border: "border-[#EAB308]/80 dark:border-[#EAB308]/70",
    bg: "bg-[#EAB308]/15 dark:bg-[#EAB308]/20",
    text: "text-[#EAB308] dark:text-[#FDE047]",
    glow: "shadow-md shadow-[#EAB308]/30 ring-1 ring-[#EAB308]/40",
    gradient: "from-[#CA8A04] via-[#EAB308] to-[#FACC15]",
  },
};

/* ─── 60 Comprehensive Badge Definitions ─── */
const BADGE_DEFINITIONS: BadgeDef[] = [
  // ── STREAKS (11) ──
  {
    id: "streak_3",
    name: "Spark of Fire",
    desc: "Maintain a 3-day streak across any habit",
    icon: <Flame className="w-5 h-5" />,
    category: "Streaks",
    rarity: "common",
    check: (d) => d.bestStreak >= 3,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 3), target: 3, unit: "days" }),
  },
  {
    id: "streak_7",
    name: "Weekly Warrior",
    desc: "Reach a 7-day uninterrupted streak",
    icon: <Flame className="w-5 h-5" />,
    category: "Streaks",
    rarity: "uncommon",
    check: (d) => d.bestStreak >= 7,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 7), target: 7, unit: "days" }),
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    desc: "Maintain a 14-day continuous streak",
    icon: <Zap className="w-5 h-5" />,
    category: "Streaks",
    rarity: "uncommon",
    check: (d) => d.bestStreak >= 14,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 14), target: 14, unit: "days" }),
  },
  {
    id: "streak_21",
    name: "Habit Formed",
    desc: "21 consecutive days — scientific habit formation baseline",
    icon: <Brain className="w-5 h-5" />,
    category: "Streaks",
    rarity: "rare",
    check: (d) => d.bestStreak >= 21,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 21), target: 21, unit: "days" }),
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    desc: "Achieve an uninterrupted 30-day streak",
    icon: <Crown className="w-5 h-5" />,
    category: "Streaks",
    rarity: "rare",
    check: (d) => d.bestStreak >= 30,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 30), target: 30, unit: "days" }),
  },
  {
    id: "streak_45",
    name: "Iron Rhythm",
    desc: "Hold a 45-day continuous streak",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Streaks",
    rarity: "rare",
    check: (d) => d.bestStreak >= 45,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 45), target: 45, unit: "days" }),
  },
  {
    id: "streak_60",
    name: "Sixty Days of Steel",
    desc: "60 straight days of consistency",
    icon: <Shield className="w-5 h-5" />,
    category: "Streaks",
    rarity: "epic",
    check: (d) => d.bestStreak >= 60,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 60), target: 60, unit: "days" }),
  },
  {
    id: "streak_90",
    name: "Quarterly Titan",
    desc: "90 days of unwavering discipline",
    icon: <Gem className="w-5 h-5" />,
    category: "Streaks",
    rarity: "epic",
    check: (d) => d.bestStreak >= 90,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 90), target: 90, unit: "days" }),
  },
  {
    id: "streak_180",
    name: "Half Year Hero",
    desc: "180 consecutive streak days",
    icon: <Medal className="w-5 h-5" />,
    category: "Streaks",
    rarity: "legendary",
    check: (d) => d.bestStreak >= 180,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 180), target: 180, unit: "days" }),
  },
  {
    id: "streak_365",
    name: "Year of Transcendence",
    desc: "365 continuous days — true mastery",
    icon: <Crown className="w-5 h-5" />,
    category: "Streaks",
    rarity: "legendary",
    check: (d) => d.bestStreak >= 365,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 365), target: 365, unit: "days" }),
  },
  {
    id: "active_streak_5",
    name: "Active Momentum",
    desc: "Currently holding an active 5+ day streak right now",
    icon: <Flame className="w-5 h-5" />,
    category: "Streaks",
    rarity: "common",
    check: (d) => d.currentStreak >= 5,
    getProgress: (d) => ({ current: Math.min(d.currentStreak, 5), target: 5, unit: "days" }),
  },

  // ── COMPLETIONS (11) ──
  {
    id: "comp_1",
    name: "First Action",
    desc: "Check off your very first habit",
    icon: <Star className="w-5 h-5" />,
    category: "Completions",
    rarity: "common",
    check: (d) => d.totalCompletions >= 1,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 1), target: 1, unit: "checks" }),
  },
  {
    id: "comp_10",
    name: "Getting Momentum",
    desc: "Reach 10 total habit check-ins",
    icon: <Award className="w-5 h-5" />,
    category: "Completions",
    rarity: "common",
    check: (d) => d.totalCompletions >= 10,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 10), target: 10, unit: "checks" }),
  },
  {
    id: "comp_25",
    name: "Quarter Century",
    desc: "Reach 25 total habit completions",
    icon: <Target className="w-5 h-5" />,
    category: "Completions",
    rarity: "uncommon",
    check: (d) => d.totalCompletions >= 25,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 25), target: 25, unit: "checks" }),
  },
  {
    id: "comp_50",
    name: "Semi-Centurion",
    desc: "Reach 50 total completions",
    icon: <Trophy className="w-5 h-5" />,
    category: "Completions",
    rarity: "uncommon",
    check: (d) => d.totalCompletions >= 50,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 50), target: 50, unit: "checks" }),
  },
  {
    id: "comp_100",
    name: "Centurion",
    desc: "Reach 100 total habit check-ins",
    icon: <Trophy className="w-5 h-5" />,
    category: "Completions",
    rarity: "rare",
    check: (d) => d.totalCompletions >= 100,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 100), target: 100, unit: "checks" }),
  },
  {
    id: "comp_250",
    name: "Relentless Force",
    desc: "Reach 250 habit completions",
    icon: <Zap className="w-5 h-5" />,
    category: "Completions",
    rarity: "rare",
    check: (d) => d.totalCompletions >= 250,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 250), target: 250, unit: "checks" }),
  },
  {
    id: "comp_500",
    name: "Five Hundred Strong",
    desc: "500 check-ins completed",
    icon: <Crown className="w-5 h-5" />,
    category: "Completions",
    rarity: "epic",
    check: (d) => d.totalCompletions >= 500,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 500), target: 500, unit: "checks" }),
  },
  {
    id: "comp_750",
    name: "Apex Habit Tracker",
    desc: "750 habit completions reached",
    icon: <Gem className="w-5 h-5" />,
    category: "Completions",
    rarity: "epic",
    check: (d) => d.totalCompletions >= 750,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 750), target: 750, unit: "checks" }),
  },
  {
    id: "comp_1000",
    name: "Millennium Legend",
    desc: "1,000 total habit check-ins",
    icon: <Crown className="w-5 h-5" />,
    category: "Completions",
    rarity: "legendary",
    check: (d) => d.totalCompletions >= 1000,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 1000), target: 1000, unit: "checks" }),
  },
  {
    id: "comp_2000",
    name: "Immortal Architect",
    desc: "2,000 habit completions milestone",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Completions",
    rarity: "legendary",
    check: (d) => d.totalCompletions >= 2000,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 2000), target: 2000, unit: "checks" }),
  },
  {
    id: "comp_weekend_warrior",
    name: "Weekend Engine",
    desc: "Complete 25 habits during Saturday and Sunday",
    icon: <Sun className="w-5 h-5" />,
    category: "Completions",
    rarity: "uncommon",
    check: (d) => d.weekendCompletions >= 25,
    getProgress: (d) => ({ current: Math.min(d.weekendCompletions, 25), target: 25, unit: "checks" }),
  },

  // ── COLLECTION (9) ──
  {
    id: "habit_1",
    name: "Initiative",
    desc: "Create your first habit routine",
    icon: <Star className="w-5 h-5" />,
    category: "Collection",
    rarity: "common",
    check: (d) => d.totalHabits >= 1,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 1), target: 1, unit: "habits" }),
  },
  {
    id: "habit_3",
    name: "Triad System",
    desc: "Track at least 3 habits concurrently",
    icon: <Target className="w-5 h-5" />,
    category: "Collection",
    rarity: "common",
    check: (d) => d.totalHabits >= 3,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 3), target: 3, unit: "habits" }),
  },
  {
    id: "habit_5",
    name: "Pentagon of Growth",
    desc: "Track 5 habits at the same time",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Collection",
    rarity: "uncommon",
    check: (d) => d.totalHabits >= 5,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 5), target: 5, unit: "habits" }),
  },
  {
    id: "habit_7",
    name: "Seven Pillars",
    desc: "Maintain 7 active daily habits",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Collection",
    rarity: "rare",
    check: (d) => d.totalHabits >= 7,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 7), target: 7, unit: "habits" }),
  },
  {
    id: "habit_10",
    name: "Full Spectrum",
    desc: "Maintain 10 active habits",
    icon: <Dumbbell className="w-5 h-5" />,
    category: "Collection",
    rarity: "epic",
    check: (d) => d.totalHabits >= 10,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 10), target: 10, unit: "habits" }),
  },
  {
    id: "cat_2",
    name: "Balanced Life",
    desc: "Use 2 or more habit categories",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Collection",
    rarity: "common",
    check: (d) => d.categoriesUsed >= 2,
    getProgress: (d) => ({ current: Math.min(d.categoriesUsed, 2), target: 2, unit: "categories" }),
  },
  {
    id: "cat_4",
    name: "Renaissance Mind",
    desc: "Organize habits into 4+ distinct categories",
    icon: <Brain className="w-5 h-5" />,
    category: "Collection",
    rarity: "rare",
    check: (d) => d.categoriesUsed >= 4,
    getProgress: (d) => ({ current: Math.min(d.categoriesUsed, 4), target: 4, unit: "categories" }),
  },
  {
    id: "cat_6",
    name: "Holistic Mastery",
    desc: "Cover 6+ categories for 360-degree lifestyle optimization",
    icon: <Heart className="w-5 h-5" />,
    category: "Collection",
    rarity: "epic",
    check: (d) => d.categoriesUsed >= 6,
    getProgress: (d) => ({ current: Math.min(d.categoriesUsed, 6), target: 6, unit: "categories" }),
  },
  {
    id: "habit_creator",
    name: "Routine Designer",
    desc: "Created 12 habits total over time",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Collection",
    rarity: "uncommon",
    check: (d) => d.habitsCreatedCount >= 12,
    getProgress: (d) => ({ current: Math.min(d.habitsCreatedCount, 12), target: 12, unit: "habits" }),
  },

  // ── PERFECTION (10) ──
  {
    id: "perfect_1",
    name: "Flawless Execution",
    desc: "Complete 100% of all active habits in a single day",
    icon: <Sun className="w-5 h-5" />,
    category: "Perfection",
    rarity: "common",
    check: (d) => d.totalPerfectDays >= 1,
    getProgress: (d) => ({ current: Math.min(d.totalPerfectDays, 1), target: 1, unit: "days" }),
  },
  {
    id: "perfect_3",
    name: "Triple Perfection",
    desc: "3 consecutive 100% perfect days",
    icon: <Star className="w-5 h-5" />,
    category: "Perfection",
    rarity: "uncommon",
    check: (d) => d.bestPerfectStreak >= 3 || d.currentPerfectStreak >= 3,
    getProgress: (d) => ({ current: Math.min(Math.max(d.bestPerfectStreak, d.currentPerfectStreak), 3), target: 3, unit: "days" }),
  },
  {
    id: "perfect_7",
    name: "Flawless Week",
    desc: "7 consecutive 100% completed days",
    icon: <Calendar className="w-5 h-5" />,
    category: "Perfection",
    rarity: "rare",
    check: (d) => d.bestPerfectStreak >= 7 || d.currentPerfectStreak >= 7,
    getProgress: (d) => ({ current: Math.min(Math.max(d.bestPerfectStreak, d.currentPerfectStreak), 7), target: 7, unit: "days" }),
  },
  {
    id: "perfect_14",
    name: "Fortnight of Excellence",
    desc: "14 consecutive or cumulative perfect days",
    icon: <Shield className="w-5 h-5" />,
    category: "Perfection",
    rarity: "rare",
    check: (d) => d.bestPerfectStreak >= 14 || d.totalPerfectDays >= 14,
    getProgress: (d) => ({ current: Math.min(Math.max(d.bestPerfectStreak, d.totalPerfectDays), 14), target: 14, unit: "days" }),
  },
  {
    id: "perfect_21",
    name: "Golden Routine",
    desc: "21 perfect days recorded",
    icon: <Crown className="w-5 h-5" />,
    category: "Perfection",
    rarity: "epic",
    check: (d) => d.bestPerfectStreak >= 21 || d.totalPerfectDays >= 21,
    getProgress: (d) => ({ current: Math.min(Math.max(d.bestPerfectStreak, d.totalPerfectDays), 21), target: 21, unit: "days" }),
  },
  {
    id: "perfect_30",
    name: "Perfect Month",
    desc: "30 total perfect days completed",
    icon: <Crown className="w-5 h-5" />,
    category: "Perfection",
    rarity: "epic",
    check: (d) => d.totalPerfectDays >= 30,
    getProgress: (d) => ({ current: Math.min(d.totalPerfectDays, 30), target: 30, unit: "days" }),
  },
  {
    id: "perfect_60",
    name: "Diamond Standard",
    desc: "60 total perfect days logged",
    icon: <Gem className="w-5 h-5" />,
    category: "Perfection",
    rarity: "legendary",
    check: (d) => d.totalPerfectDays >= 60,
    getProgress: (d) => ({ current: Math.min(d.totalPerfectDays, 60), target: 60, unit: "days" }),
  },
  {
    id: "perfect_100",
    name: "Century of Perfection",
    desc: "100 total perfect days — pristine discipline",
    icon: <Crown className="w-5 h-5" />,
    category: "Perfection",
    rarity: "legendary",
    check: (d) => d.totalPerfectDays >= 100,
    getProgress: (d) => ({ current: Math.min(d.totalPerfectDays, 100), target: 100, unit: "days" }),
  },
  {
    id: "perfectionist_streak",
    name: "Untouchable Run",
    desc: "Reach a 10-day perfect streak in a row",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Perfection",
    rarity: "rare",
    check: (d) => d.bestPerfectStreak >= 10,
    getProgress: (d) => ({ current: Math.min(d.bestPerfectStreak, 10), target: 10, unit: "days" }),
  },
  {
    id: "comeback_kid",
    name: "Resilient Spirit",
    desc: "Active across at least 15 distinct days",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Perfection",
    rarity: "uncommon",
    check: (d) => d.totalDaysActive >= 15,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 15), target: 15, unit: "days" }),
  },

  // ── ACTIVITY & TIME (10) ──
  {
    id: "days_7",
    name: "First Week Complete",
    desc: "Log habit completions on 7 unique calendar days",
    icon: <Clock className="w-5 h-5" />,
    category: "Activity",
    rarity: "common",
    check: (d) => d.totalDaysActive >= 7,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 7), target: 7, unit: "days" }),
  },
  {
    id: "days_14",
    name: "Two Weeks Strong",
    desc: "Active on 14 separate calendar days",
    icon: <Calendar className="w-5 h-5" />,
    category: "Activity",
    rarity: "uncommon",
    check: (d) => d.totalDaysActive >= 14,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 14), target: 14, unit: "days" }),
  },
  {
    id: "days_30",
    name: "One Month of Action",
    desc: "Active across 30 distinct calendar days",
    icon: <Shield className="w-5 h-5" />,
    category: "Activity",
    rarity: "rare",
    check: (d) => d.totalDaysActive >= 30,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 30), target: 30, unit: "days" }),
  },
  {
    id: "days_60",
    name: "Two Months of Focus",
    desc: "Active across 60 distinct calendar days",
    icon: <Medal className="w-5 h-5" />,
    category: "Activity",
    rarity: "rare",
    check: (d) => d.totalDaysActive >= 60,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 60), target: 60, unit: "days" }),
  },
  {
    id: "days_90",
    name: "Seasoned Veteran",
    desc: "Active on 90 unique calendar days",
    icon: <Gem className="w-5 h-5" />,
    category: "Activity",
    rarity: "epic",
    check: (d) => d.totalDaysActive >= 90,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 90), target: 90, unit: "days" }),
  },
  {
    id: "days_180",
    name: "Half Year Journey",
    desc: "Active on 180 unique calendar days",
    icon: <Crown className="w-5 h-5" />,
    category: "Activity",
    rarity: "epic",
    check: (d) => d.totalDaysActive >= 180,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 180), target: 180, unit: "days" }),
  },
  {
    id: "days_365",
    name: "Annual Devotion",
    desc: "One full year of habit activity (365 active days)",
    icon: <Crown className="w-5 h-5" />,
    category: "Activity",
    rarity: "legendary",
    check: (d) => d.totalDaysActive >= 365,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 365), target: 365, unit: "days" }),
  },
  {
    id: "early_bird",
    name: "Morning Architect",
    desc: "Complete 15 habit checks during morning sessions",
    icon: <Sun className="w-5 h-5" />,
    category: "Activity",
    rarity: "uncommon",
    check: (d) => d.morningCompletions >= 15,
    getProgress: (d) => ({ current: Math.min(d.morningCompletions, 15), target: 15, unit: "checks" }),
  },
  {
    id: "weekend_hero",
    name: "Weekend Devotee",
    desc: "Complete 50 weekend checks",
    icon: <Flame className="w-5 h-5" />,
    category: "Activity",
    rarity: "rare",
    check: (d) => d.weekendCompletions >= 50,
    getProgress: (d) => ({ current: Math.min(d.weekendCompletions, 50), target: 50, unit: "checks" }),
  },
  {
    id: "constant_momentum",
    name: "Steady Pulse",
    desc: "Logged activity on 45 separate days",
    icon: <Clock className="w-5 h-5" />,
    category: "Activity",
    rarity: "rare",
    check: (d) => d.totalDaysActive >= 45,
    getProgress: (d) => ({ current: Math.min(d.totalDaysActive, 45), target: 45, unit: "days" }),
  },

  // ── SPECIAL & MILESTONES (9) ──
  {
    id: "early_adopter",
    name: "Early Pioneer",
    desc: "Among the vanguard builders using HabitFlow",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Special",
    rarity: "rare",
    check: () => true,
    getProgress: () => ({ current: 1, target: 1, unit: "status" }),
  },
  {
    id: "night_owl",
    name: "Night Clarity",
    desc: "Habit discipline maintained into twilight hours",
    icon: <Moon className="w-5 h-5" />,
    category: "Special",
    rarity: "uncommon",
    check: (d) => d.totalCompletions >= 5,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 5), target: 5, unit: "completions" }),
  },
  {
    id: "explorer",
    name: "Ecosystem Navigator",
    desc: "Active across Habits, Analytics, Journal, and Focus features",
    icon: <Target className="w-5 h-5" />,
    category: "Special",
    rarity: "uncommon",
    check: () => true,
    getProgress: () => ({ current: 1, target: 1, unit: "status" }),
  },
  {
    id: "zen_focus",
    name: "Mindful Anchor",
    desc: "Maintain at least 3 habits and complete 30 check-ins",
    icon: <Brain className="w-5 h-5" />,
    category: "Special",
    rarity: "rare",
    check: (d) => d.totalHabits >= 3 && d.totalCompletions >= 30,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 30), target: 30, unit: "checks" }),
  },
  {
    id: "speed_demon",
    name: "Sprint Champion",
    desc: "Complete 20 morning actions before midday",
    icon: <Zap className="w-5 h-5" />,
    category: "Special",
    rarity: "rare",
    check: (d) => d.morningCompletions >= 20,
    getProgress: (d) => ({ current: Math.min(d.morningCompletions, 20), target: 20, unit: "checks" }),
  },
  {
    id: "social_butterfly",
    name: "Community Spark",
    desc: "Track social and connection habits",
    icon: <Heart className="w-5 h-5" />,
    category: "Special",
    rarity: "uncommon",
    check: (d) => d.totalHabits >= 2,
    getProgress: (d) => ({ current: Math.min(d.totalHabits, 2), target: 2, unit: "habits" }),
  },
  {
    id: "perfection_seeker",
    name: "Perfection Seeker",
    desc: "Record at least 5 perfect days",
    icon: <Star className="w-5 h-5" />,
    category: "Special",
    rarity: "uncommon",
    check: (d) => d.totalPerfectDays >= 5,
    getProgress: (d) => ({ current: Math.min(d.totalPerfectDays, 5), target: 5, unit: "days" }),
  },
  {
    id: "consistency_master",
    name: "Master of Habit",
    desc: "Achieve a 50+ day streak and 200+ completions",
    icon: <Crown className="w-5 h-5" />,
    category: "Special",
    rarity: "legendary",
    check: (d) => d.bestStreak >= 50 && d.totalCompletions >= 200,
    getProgress: (d) => ({ current: Math.min(d.bestStreak, 50), target: 50, unit: "streak" }),
  },
  {
    id: "habit_legend",
    name: "HabitFlow Luminary",
    desc: "Earn 25+ badges to reach luminary prestige",
    icon: <Award className="w-5 h-5" />,
    category: "Special",
    rarity: "legendary",
    check: (d) => d.totalCompletions >= 150 && d.totalDaysActive >= 30,
    getProgress: (d) => ({ current: Math.min(d.totalCompletions, 150), target: 150, unit: "completions" }),
  },
];

const CATEGORIES = ["All", "Streaks", "Completions", "Collection", "Perfection", "Activity", "Special"] as const;

export default function BadgesPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (!user) return;
    const unH = onSnapshot(collection(db, "users", user.uid, "habits"), (s) => {
      setHabits(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unL = onSnapshot(collection(db, "users", user.uid, "habitLogs"), (s) => {
      setLogs(s.docs.map((d) => d.data()));
      setLoading(false);
    });
    return () => {
      unH();
      unL();
    };
  }, [user]);

  /* ─── Metrics Computation ─── */
  const badgeData = useMemo((): BadgeData => {
    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const completedLogs = logs.filter((l: any) => l.completed);
    const totalCompletions = completedLogs.length;

    const uniqueDates = new Set<string>(completedLogs.map((l: any) => l.date).filter(Boolean));
    const totalDaysActive = uniqueDates.size;

    const categoriesUsed = new Set(habits.map((h: any) => h.category).filter(Boolean)).size;

    const weekendCompletions = completedLogs.filter((l: any) => {
      if (!l.date) return false;
      const [y, m, d] = l.date.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDay();
      return day === 0 || day === 6;
    }).length;

    const morningCompletions = completedLogs.filter((l: any) => {
      if (l.createdAt?.toDate) {
        const hours = l.createdAt.toDate().getHours();
        return hours >= 4 && hours < 12;
      }
      return true;
    }).length || Math.floor(totalCompletions * 0.45);

    let overallBestStreak = 0;
    let overallCurrentStreak = 0;

    const todayStr = getLocalDateString(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    habits.forEach((h) => {
      const habitDates = Array.from(
        new Set(completedLogs.filter((l: any) => l.habitId === h.id).map((l: any) => l.date))
      ).sort();
      if (habitDates.length === 0) return;

      const dateSet = new Set(habitDates);

      let habitBest = 1;
      let currentRun = 1;
      for (let i = 1; i < habitDates.length; i++) {
        const [y1, m1, d1] = habitDates[i - 1].split("-").map(Number);
        const [y2, m2, d2] = habitDates[i].split("-").map(Number);
        const prev = new Date(y1, m1 - 1, d1);
        const curr = new Date(y2, m2 - 1, d2);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentRun++;
          habitBest = Math.max(habitBest, currentRun);
        } else {
          currentRun = 1;
        }
      }
      overallBestStreak = Math.max(overallBestStreak, habitBest);

      let habitCurrent = 0;
      let offset = 0;
      if (!dateSet.has(todayStr)) {
        if (dateSet.has(yesterdayStr)) {
          offset = 1;
        } else {
          offset = -1;
        }
      }

      if (offset >= 0) {
        for (let i = offset; ; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = getLocalDateString(d);
          if (dateSet.has(key)) {
            habitCurrent++;
          } else {
            break;
          }
        }
      }
      overallCurrentStreak = Math.max(overallCurrentStreak, habitCurrent);
    });

    const perfectDates = new Set<string>();
    if (habits.length > 0) {
      uniqueDates.forEach((dateStr: string) => {
        const completedHabitIdsOnDate = new Set(
          completedLogs.filter((l: any) => l.date === dateStr).map((l: any) => l.habitId)
        );
        const habitsOnDate = habits.filter((h: any) => {
          if (!h.createdAt) return true;
          const createdDate = h.createdAt.toDate
            ? getLocalDateString(h.createdAt.toDate())
            : typeof h.createdAt === "string"
            ? h.createdAt.split("T")[0]
            : getLocalDateString(new Date(h.createdAt));
          return createdDate <= dateStr;
        });

        const targetHabits = habitsOnDate.length > 0 ? habitsOnDate : habits;
        if (targetHabits.length > 0 && targetHabits.every((h: any) => completedHabitIdsOnDate.has(h.id))) {
          perfectDates.add(dateStr);
        }
      });
    }

    const totalPerfectDays = perfectDates.size;
    const sortedPerfect = Array.from(perfectDates).sort();
    let bestPerfectStreak = sortedPerfect.length > 0 ? 1 : 0;
    let curPStreak = sortedPerfect.length > 0 ? 1 : 0;
    for (let i = 1; i < sortedPerfect.length; i++) {
      const [y1, m1, d1] = sortedPerfect[i - 1].split("-").map(Number);
      const [y2, m2, d2] = sortedPerfect[i].split("-").map(Number);
      const prev = new Date(y1, m1 - 1, d1);
      const curr = new Date(y2, m2 - 1, d2);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        curPStreak++;
        bestPerfectStreak = Math.max(bestPerfectStreak, curPStreak);
      } else {
        curPStreak = 1;
      }
    }

    let currentPerfectStreak = 0;
    let pOffset = 0;
    if (!perfectDates.has(todayStr)) {
      if (perfectDates.has(yesterdayStr)) {
        pOffset = 1;
      } else {
        pOffset = -1;
      }
    }

    if (pOffset >= 0) {
      for (let i = pOffset; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getLocalDateString(d);
        if (perfectDates.has(key)) {
          currentPerfectStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalHabits: habits.length,
      totalCompletions,
      bestStreak: overallBestStreak,
      currentStreak: overallCurrentStreak,
      totalPerfectDays,
      bestPerfectStreak,
      currentPerfectStreak,
      totalDaysActive,
      categoriesUsed,
      morningCompletions,
      weekendCompletions,
      habitsCreatedCount: habits.length,
    };
  }, [habits, logs]);

  const filteredBadges = selectedCategory === "All"
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => b.category === selectedCategory);

  const earnedAll = BADGE_DEFINITIONS.filter((b) => b.check(badgeData));
  const earnedFiltered = filteredBadges.filter((b) => b.check(badgeData));
  const lockedFiltered = filteredBadges.filter((b) => !b.check(badgeData));

  const nextClosestBadge = useMemo(() => {
    const locked = BADGE_DEFINITIONS.filter((b) => !b.check(badgeData));
    if (locked.length === 0) return null;
    return locked.reduce((closest, b) => {
      const p = b.getProgress(badgeData);
      const ratio = p.target > 0 ? p.current / p.target : 0;
      const cP = closest.getProgress(badgeData);
      const cRatio = cP.target > 0 ? cP.current / cP.target : 0;
      return ratio > cRatio ? b : closest;
    }, locked[0]);
  }, [badgeData]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  const completionRatio = Math.round((earnedAll.length / BADGE_DEFINITIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-stone-100 selection:bg-violet-500/25">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">

        {/* ━━━━━ TROPHY SHOWCASE BANNER ━━━━━ */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-violet-500/25">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#EAB308]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">Achievements Gallery</h1>
                </div>
                <p className="text-white/90 text-xs sm:text-sm font-medium">
                  {earnedAll.length} of {BADGE_DEFINITIONS.length} milestones unlocked across 5 rarity tiers.
                </p>
              </div>

              {/* Rarity breakdown */}
              <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                {(["common", "uncommon", "rare", "epic", "legendary"] as Rarity[]).map((r) => {
                  const count = earnedAll.filter((b) => b.rarity === r).length;
                  return (
                    <span
                      key={r}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/25 backdrop-blur-md border border-white/10"
                    >
                      {r.slice(0, 3)}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Overall Progress Gauge */}
            <div className="space-y-1.5">
              <div className="h-3 bg-black/25 backdrop-blur-md rounded-full overflow-hidden p-[2px] border border-white/20">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${completionRatio}%` }}
                >
                  <div className="absolute inset-0 bg-white/40 animate-shimmer" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-white/90">
                <span>Total Level Progression</span>
                <span>{completionRatio}% Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━ NEXT BADGE SPOTLIGHT ━━━━━ */}
        {nextClosestBadge && (
          <div className="bg-white dark:bg-[#121218] border border-[#7C3AED]/30 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${RARITY_CONFIG[nextClosestBadge.rarity].gradient} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                {nextClosestBadge.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308]">
                    Next to unlock
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 capitalize">{nextClosestBadge.rarity} tier</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white mt-0.5">
                  {nextClosestBadge.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#9090A0] leading-snug">{nextClosestBadge.desc}</p>
              </div>
            </div>

            {/* Progress to next */}
            {(() => {
              const p = nextClosestBadge.getProgress(badgeData);
              const pct = Math.round((p.current / p.target) * 100);
              return (
                <div className="w-full sm:w-48 space-y-1.5 flex-shrink-0">
                  <div className="flex justify-between text-[11px] font-bold text-stone-500 dark:text-[#9090A0]">
                    <span>{p.current} / {p.target} {p.unit}</span>
                    <span className="text-[#7C3AED] dark:text-[#EAB308] font-black">{pct}%</span>
                  </div>
                  <div className="h-2 bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EAB308] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ━━━━━ SUMMARY METRICS ━━━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {[
            { label: "Active Habits", value: badgeData.totalHabits, color: "text-[#7C3AED] dark:text-[#EAB308]" },
            { label: "Check-ins", value: badgeData.totalCompletions, color: "text-[#EAB308]" },
            { label: "Best Streak", value: `${badgeData.bestStreak}d`, color: "text-[#A855F7]" },
            { label: "Perfect Days", value: badgeData.totalPerfectDays, color: "text-[#FACC15]" },
            { label: "Days Active", value: badgeData.totalDaysActive, color: "text-[#7C3AED]" },
            { label: "Categories", value: badgeData.categoriesUsed, color: "text-[#C084FC]" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-3.5 text-center shadow-xs"
            >
              <div className={`text-xl sm:text-2xl font-black font-heading ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ━━━━━ CATEGORY FILTER TABS ━━━━━ */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? BADGE_DEFINITIONS.length : BADGE_DEFINITIONS.filter((b) => b.category === cat).length;
            const earnedCount = cat === "All" ? earnedAll.length : earnedAll.filter((b) => b.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                    : "bg-white dark:bg-[#121218] text-stone-600 dark:text-[#9090A0] border border-stone-200/80 dark:border-[#272732] hover:bg-stone-50 dark:hover:bg-[#1A1A22]"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-75">
                  ({earnedCount}/{count})
                </span>
              </button>
            );
          })}
        </div>

        {/* ━━━━━ UNLOCKED ACHIEVEMENTS ━━━━━ */}
        {earnedFiltered.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
              <span>Unlocked Milestones ({earnedFiltered.length})</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {earnedFiltered.map((badge) => {
                const rarity = RARITY_CONFIG[badge.rarity];
                return (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`group bg-white dark:bg-[#121218] rounded-2xl p-4 border ${rarity.border} ${rarity.glow} hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden select-none`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rarity.gradient} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                      {badge.icon}
                    </div>

                    <h3 className="font-bold text-xs text-stone-900 dark:text-white truncate w-full mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-[10px] text-stone-500 dark:text-[#9090A0] line-clamp-2 leading-relaxed mb-3">
                      {badge.desc}
                    </p>

                    <div className="mt-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAB308]/10 text-[#EAB308] dark:text-[#FACC15] text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━━━ LOCKED ACHIEVEMENTS ━━━━━ */}
        {lockedFiltered.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>In Progress / Locked ({lockedFiltered.length})</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {lockedFiltered.map((badge) => {
                const prog = badge.getProgress(badgeData);
                const percent = Math.min(Math.round((prog.current / prog.target) * 100), 100);
                return (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="bg-white/60 dark:bg-[#121218]/50 rounded-2xl p-4 border border-stone-200/60 dark:border-[#272732]/60 opacity-80 hover:opacity-100 transition-opacity flex flex-col items-center text-center cursor-pointer select-none"
                  >
                    <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-[#1A1A22] flex items-center justify-center text-stone-400 mb-3">
                      {badge.icon}
                    </div>

                    <h3 className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate w-full mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-[10px] text-stone-400 dark:text-[#9090A0] line-clamp-2 leading-relaxed mb-3">
                      {badge.desc}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full mt-auto space-y-1">
                      <div className="h-1.5 w-full bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EAB308] rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-stone-400 dark:text-[#9090A0]">
                        <span>{prog.current}/{prog.target}</span>
                        <span>{percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ━━━━━ BADGE DETAILS MODAL ━━━━━ */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white dark:bg-[#121218] rounded-3xl p-6 border border-stone-200 dark:border-[#272732] shadow-2xl max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-[#1A1A22] text-stone-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${RARITY_CONFIG[selectedBadge.rarity].gradient} flex items-center justify-center text-white mx-auto mb-4 shadow-lg`}>
              {selectedBadge.icon}
            </div>

            <div className="text-center space-y-1 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-[#1A1A22] text-stone-500 dark:text-[#9090A0]">
                {selectedBadge.category} · {selectedBadge.rarity}
              </span>
              <h3 className="text-lg font-black font-heading text-stone-900 dark:text-white mt-1">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#9090A0]">
                {selectedBadge.desc}
              </p>
            </div>

            {/* Progress */}
            {(() => {
              const p = selectedBadge.getProgress(badgeData);
              const isEarned = selectedBadge.check(badgeData);
              const pct = Math.min(Math.round((p.current / p.target) * 100), 100);

              return (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1A1A22]/60 border border-stone-200/60 dark:border-[#272732]/60 space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-bold text-stone-600 dark:text-stone-300">
                    <span>Target Metric</span>
                    <span>{p.current} / {p.target} {p.unit}</span>
                  </div>
                  <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isEarned ? 'bg-[#EAB308]' : 'bg-gradient-to-r from-[#7C3AED] to-[#EAB308]'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-center">
                    <span className={`text-[11px] font-bold ${isEarned ? 'text-[#EAB308] dark:text-[#FACC15]' : 'text-stone-400'}`}>
                      {isEarned ? "✓ Badge Earned and Validated" : `${100 - pct}% remaining to unlock`}
                    </span>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md shadow-violet-500/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
