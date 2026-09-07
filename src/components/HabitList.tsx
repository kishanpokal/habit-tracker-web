"use client";

import { useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { useAuth } from "@/context/AuthContext";
import { deleteHabitWithLogs } from "@/lib/deleteHabitWithLogs";
import EditHabitModal from "@/components/EditHabitModal";
import TopNav from "@/components/TopNav";
import { ArrowLeft, Trash2, Target, Calendar, Edit3, Tag, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HabitList() {
  const { habits, loading } = useHabits();
  const { user } = useAuth();
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (habitId: string) => {
    if (!user) return;
    try {
      setDeletingId(habitId);
      setError("");
      await deleteHabitWithLogs(user.uid, habitId);
    } catch (err) {
      console.error(err);
      setError("Failed to delete habit. Check permissions.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-slate-900 dark:text-white selection:bg-[#7C3AED]/20">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white dark:bg-[#121218] hover:bg-slate-100 dark:hover:bg-[#1A1A22] border border-stone-200/80 dark:border-[#272732] text-slate-600 dark:text-[#9090A0] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">Manage Habits</h1>
              <p className="text-xs text-slate-500 dark:text-[#9090A0]">
                Edit parameters or remove completed routines
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-[#9090A0]">
            {habits.length} {habits.length === 1 ? "habit" : "habits"}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-[#7C3AED]/10 border border-purple-200 dark:border-[#7C3AED]/30 text-purple-600 dark:text-[#A855F7] text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-400 dark:text-[#9090A0]">Loading habits...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && (
          <div className="bg-white dark:bg-[#121218] rounded-3xl border border-stone-200/80 dark:border-[#272732] p-10 text-center shadow-xs">
            <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">No habits registered</h3>
            <p className="text-xs text-slate-400 dark:text-[#9090A0] max-w-xs mx-auto mb-4">
              Return to your dashboard to create habits or pick from templates.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-black shadow-md shadow-violet-500/20 hover:brightness-110 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Habit Card List */}
        {!loading && habits.length > 0 && (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-[#272732] bg-white dark:bg-[#121218] shadow-xs hover:shadow-sm transition-all"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: habit.color }} />

                <div className="flex items-center justify-between p-4 sm:p-5 pl-5 sm:pl-6 gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${habit.color}15`, border: `1.5px solid ${habit.color}35` }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: habit.color }} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-slate-400 dark:text-[#9090A0] font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <strong className="text-slate-700 dark:text-slate-300">{habit.targetDays}</strong> days/wk
                        </span>
                        {habit.category && (
                          <span className="flex items-center gap-1 text-[#EAB308] font-bold">
                            <Tag className="w-3 h-3" />
                            {habit.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A1A22] border border-stone-200 dark:border-[#272732] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {confirmDeleteId === habit.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(habit.id)}
                          disabled={deletingId === habit.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 transition-colors disabled:opacity-50"
                        >
                          {deletingId === habit.id ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1A1A22]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(habit.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-[#EAB308] hover:bg-slate-100 dark:hover:bg-[#1A1A22] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingHabit && (
        <EditHabitModal
          habit={{
            id: editingHabit.id,
            name: editingHabit.name,
            color: editingHabit.color || "#7C3AED",
            targetDays: editingHabit.targetDays || 7,
            reminderTime: editingHabit.reminderTime || null,
            notes: editingHabit.notes || "",
            category: editingHabit.category || "Other",
          }}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}