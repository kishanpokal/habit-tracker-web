"use client";

import { useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { useAuth } from "@/context/AuthContext";
import { deleteHabitWithLogs } from "@/lib/deleteHabitWithLogs";
import { ArrowLeft, Trash2, Target, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HabitList() {
  const { habits, loading } = useHabits();
  const { user } = useAuth();
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Habits
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage and track your daily habits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading your habits...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && habits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
              <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No habits yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Start building better habits today. Create your first habit to begin tracking your progress.
            </p>
          </div>
        )}

        {/* Habits List */}
        {!loading && habits.length > 0 && (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Color Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: habit.color }}
                />

                <div className="flex items-center justify-between p-5 pl-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Color Indicator */}
                    <div
                      className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                      style={{ 
                        backgroundColor: `${habit.color}15`,
                        border: `2px solid ${habit.color}30`
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                    </div>

                    {/* Habit Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1 truncate">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {habit.targetDays}
                            </span>{" "}
                            days/week
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(habit.id)}
                    disabled={deletingId === habit.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {deletingId === habit.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Habits Count */}
        {!loading && habits.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {habits.length} {habits.length === 1 ? 'habit' : 'habits'} total
            </p>
          </div>
        )}
      </div>
    </div>
  );
}