"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/hooks/useHabits";
import Link from "next/link";
import { X, Sparkles, Clock, FileText, Calendar, Target, Palette } from "lucide-react";

type AddHabitModalProps = {
  onClose: () => void;
};

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const { user } = useAuth();
  const { habits, loading: habitsLoading } = useHabits();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [targetDays, setTargetDays] = useState(7);
  const [reminderTime, setReminderTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);

  const popularColors = [
    "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  ];

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      setError("Habit name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await addDoc(collection(db, "users", user.uid, "habits"), {
        name: name.trim(),
        color,
        targetDays,
        reminderTime: reminderTime || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes,
        isArchived: false,
        createdAt: serverTimestamp(),
      });

      setSuccessAnimation(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError("Failed to save habit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in max-h-[95vh] flex flex-col">
        
        {/* Success Overlay */}
        {successAnimation && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl animate-check-bounce border-4 border-emerald-500">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                <svg className="w-14 h-14 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-center text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Habit Created!
              </p>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                Let's build this together ✨
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
          </div>

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Create New Habit</h2>
                  <p className="text-indigo-100 text-sm flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    Start building better routines today
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center group border border-white/30 shadow-lg"
            >
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* Current Habits Preview */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Your Current Habits {!habitsLoading && `(${habits.length})`}
                </label>
              </div>

              <Link
                href="/habits"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm border border-indigo-200 dark:border-indigo-800"
              >
                <span>Manage All</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="max-h-32 overflow-y-auto rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-blue-100 dark:border-gray-700 p-3 space-y-2">
              {habitsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : habits.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                  No habits yet. Create your first one!
                </p>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                      {habit.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {habit.targetDays}d/w
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Habit Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Habit Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Meditation, Drink 8 Glasses of Water, Code Daily"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 text-base focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Palette className="w-4 h-4" />
              Color Theme
            </label>
            <div className="flex flex-wrap gap-3">
              {popularColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`relative w-12 h-12 rounded-xl transition-all hover:scale-110 shadow-md ${
                    color === c
                      ? "ring-4 ring-offset-2 dark:ring-offset-gray-900 scale-110"
                      : "hover:ring-2 ring-gray-300 dark:ring-gray-600"
                  }`}
                  style={{ 
                    backgroundColor: c
                  }}
                >
                  {color === c && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
              <div className="relative w-12 h-12">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-md hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-lg font-bold text-white drop-shadow-md">+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Target Days */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Calendar className="w-4 h-4" />
              Target Days per Week
            </label>
            <div className="grid grid-cols-7 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTargetDays(day)}
                  className={`relative py-4 rounded-xl font-semibold text-base transition-all ${
                    targetDays === day
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105"
                  }`}
                >
                  {day}
                  {targetDays === day && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4" />
                Reminder Time (optional)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4" />
                Notes (optional)
              </label>
              <textarea
                placeholder="Why this habit matters to you..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 min-h-[88px] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium animate-shake flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-4 flex gap-4 bg-gradient-to-t from-gray-50/80 to-transparent dark:from-gray-900/80 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-98"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Habit
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes check-bounce {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-check-bounce { animation: check-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-shake { animation: shake 0.4s ease-in-out; }

        .bg-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,.1) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1.5px, transparent 1.5px);
          background-size: 30px 30px;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}