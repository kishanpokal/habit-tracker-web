"use client";

import { useMemo } from "react";
import { X, Calendar, Trophy, Zap, Shield, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  color: string;
  category?: string;
}

interface WeeklyReviewModalProps {
  habits: Habit[];
  logs: { [habitId: string]: Set<string> };
  weekDates: string[]; // 7 dates YYYY-MM-DD
  streakFreezesAvailable?: number;
  onClose: () => void;
}

export default function WeeklyReviewModal({
  habits,
  logs,
  weekDates,
  streakFreezesAvailable = 2,
  onClose,
}: WeeklyReviewModalProps) {
  // Compute weekly statistics
  const stats = useMemo(() => {
    const totalPossible = habits.length * 7;
    let totalCompleted = 0;
    const dayTotals: { [date: string]: number } = {};
    const habitTotals: { [habitId: string]: number } = {};

    weekDates.forEach((d) => {
      dayTotals[d] = 0;
    });

    habits.forEach((h) => {
      habitTotals[h.id] = 0;
      const logSet = logs[h.id];
      if (logSet) {
        weekDates.forEach((d) => {
          if (logSet.has(d)) {
            totalCompleted++;
            dayTotals[d] = (dayTotals[d] || 0) + 1;
            habitTotals[h.id] = (habitTotals[h.id] || 0) + 1;
          }
        });
      }
    });

    const completionRate = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);

    // Find best day
    let bestDayDate = weekDates[0];
    let maxDayCompletions = -1;
    weekDates.forEach((d) => {
      if (dayTotals[d] > maxDayCompletions) {
        maxDayCompletions = dayTotals[d];
        bestDayDate = d;
      }
    });

    const bestDayName = new Date(bestDayDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });

    // Find top habit
    let topHabit = habits[0] || null;
    let maxHabitCompletions = -1;
    habits.forEach((h) => {
      if (habitTotals[h.id] > maxHabitCompletions) {
        maxHabitCompletions = habitTotals[h.id];
        topHabit = h;
      }
    });

    return {
      totalPossible,
      totalCompleted,
      completionRate,
      bestDayName,
      maxDayCompletions,
      topHabit,
      maxHabitCompletions,
    };
  }, [habits, logs, weekDates]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FEF08A] bg-black/20 px-2 py-0.5 rounded-full">
                Weekly Digest
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-heading mt-0.5">Your Ritual Scorecard</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Main Score Hero Card */}
          <div className="bg-gradient-to-br from-[#7C3AED]/10 via-[#1A1A22]/50 to-[#EAB308]/10 rounded-2xl border border-[#7C3AED]/20 p-5 text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-4xl sm:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#C084FC] to-[#EAB308]">
                {stats.completionRate}%
              </span>
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mt-1">
                Weekly Consistency Index
              </p>
              <p className="text-xs text-stone-500 dark:text-[#9090A0] mt-1">
                {stats.totalCompleted} of {stats.totalPossible} scheduled rituals fulfilled this week
              </p>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1A1A22] border border-stone-200/80 dark:border-[#272732] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-[#9090A0]">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Peak Day</span>
              </div>
              <p className="text-base font-black font-heading text-stone-900 dark:text-white">
                {stats.bestDayName}
              </p>
              <p className="text-[11px] text-[#7C3AED] dark:text-[#C084FC] font-semibold">
                {stats.maxDayCompletions} rituals performed
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1A1A22] border border-stone-200/80 dark:border-[#272732] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-[#9090A0]">
                <Zap className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Top Ritual</span>
              </div>
              <p className="text-base font-black font-heading text-stone-900 dark:text-white truncate">
                {stats.topHabit?.name || "None yet"}
              </p>
              <p className="text-[11px] text-[#EAB308] font-semibold">
                {stats.maxHabitCompletions > 0 ? `${stats.maxHabitCompletions}/7 days active` : "Start today"}
              </p>
            </div>
          </div>

          {/* Streak Shield Status */}
          <div className="p-4 rounded-2xl bg-violet-500/5 dark:bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C084FC] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-white">Streak Shields Active</p>
                <p className="text-[11px] text-stone-500 dark:text-[#9090A0]">
                  {streakFreezesAvailable} freeze safeguard{streakFreezesAvailable === 1 ? "" : "s"} ready to protect momentum
                </p>
              </div>
            </div>
            <span className="text-sm font-black font-heading text-[#7C3AED] dark:text-[#EAB308]">
              {streakFreezesAvailable} Left
            </span>
          </div>

          {/* Motivational Insight */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1A1A22] border border-stone-200 dark:border-[#272732] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#EAB308]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next Week&apos;s Focus Focus</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              {stats.completionRate >= 80
                ? "Phenomenal momentum! You operated at master level consistency. Maintain your keystone routine as your anchor for next week."
                : stats.completionRate >= 50
                ? "Solid progress! Focus on habit stacking in the morning hours to boost early-day completion velocity."
                : "Every day is an altar of self-creation. Pick your single most critical keystone ritual and focus on winning that first."}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-violet-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready for Tomorrow&apos;s Rituals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
