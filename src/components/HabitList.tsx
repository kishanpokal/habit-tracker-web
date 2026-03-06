"use client";

import { useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { useAuth } from "@/context/AuthContext";
import { deleteHabitWithLogs } from "@/lib/deleteHabitWithLogs";
import EditHabitModal from "@/components/EditHabitModal";
import { ArrowLeft, Trash2, Target, Calendar, Edit3, Tag } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">My Habits</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Manage, edit, and organize your habits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading habits...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && habits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No habits yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">Create your first habit to start tracking.</p>
          </div>
        )}

        {/* Habits */}
        {!loading && habits.length > 0 && (
          <div className="space-y-3">
            {habits.map(habit => (
              <div key={habit.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: habit.color }} />

                <div className="flex items-center justify-between p-4 sm:p-5 pl-5 sm:pl-6">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${habit.color}15`, border: `2px solid ${habit.color}30` }}
                    >
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: habit.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">{habit.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span><span className="font-bold text-gray-700 dark:text-gray-300">{habit.targetDays}</span> days/wk</span>
                        </div>
                        {habit.category && habit.category !== "Other" && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold">
                            <Tag className="w-3 h-3" />
                            <span>{habit.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button onClick={() => setEditingHabit(habit)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {confirmDeleteId === habit.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(habit.id)} disabled={deletingId === habit.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === habit.id ? "..." : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(habit.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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

        {/* Count */}
        {!loading && habits.length > 0 && (
          <p className="text-center text-xs text-gray-400 font-medium pt-4">
            {habits.length} {habits.length === 1 ? "habit" : "habits"} total
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {editingHabit && (
        <EditHabitModal
          habit={{
            id: editingHabit.id,
            name: editingHabit.name,
            color: editingHabit.color || "#6366f1",
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