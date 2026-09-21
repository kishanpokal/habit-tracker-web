"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { soundFX } from "@/lib/soundEffects";
import {
  X,
  Sparkles,
  Check,
  Sun,
  Sunset,
  Moon,
  Clock,
  Hash,
  CheckSquare,
  ShieldAlert,
} from "lucide-react";

type HabitType = "boolean" | "numeric" | "negative";
type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

type EditHabitModalProps = {
  habit: {
    id: string;
    name: string;
    habitType?: HabitType;
    targetValue?: number;
    unit?: string;
    costPerDay?: number;
    timeOfDay?: TimeOfDay;
    color: string;
    targetDays: number;
    reminderTime: string | null;
    notes: string;
    category?: string;
  };
  onClose: () => void;
};

const CATEGORIES = [
  "Health",
  "Productivity",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Social",
  "Finance",
  "Creative",
  "Other",
];

const AMETHYST_GOLD_COLORS = [
  "#7C3AED", // Royal Amethyst
  "#EAB308", // Luminous Gold
  "#A855F7", // Vivid Purple
  "#FACC15", // Brilliant Aurum
  "#6D28D9", // Deep Violet
  "#CA8A04", // Antique Bronze Gold
  "#C084FC", // Soft Amethyst
  "#71717A", // Smoked Titanium
];

export default function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState(habit.name);
  const [habitType, setHabitType] = useState<HabitType>(habit.habitType || "boolean");
  const [targetValue, setTargetValue] = useState<number>(habit.targetValue || 8);
  const [unit, setUnit] = useState<string>(habit.unit || "glasses");
  const [costPerDay, setCostPerDay] = useState<number>(habit.costPerDay || 0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit.timeOfDay || "anytime");
  const [color, setColor] = useState(habit.color || "#7C3AED");
  const [targetDays, setTargetDays] = useState(habit.targetDays || 7);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || "");
  const [notes, setNotes] = useState(habit.notes || "");
  const [category, setCategory] = useState(habit.category || "Health");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("Habit name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
        name: name.trim(),
        habitType,
        targetValue: habitType === "numeric" ? Number(targetValue) || 1 : 1,
        unit: habitType === "numeric" ? (unit.trim() || "times") : habitType === "negative" ? (unit.trim() || "days") : "",
        costPerDay: habitType === "negative" ? Number(costPerDay) || 0 : 0,
        timeOfDay,
        color,
        targetDays,
        reminderTime: reminderTime || null,
        notes,
        category,
      });

      soundFX.playClick();
      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch {
      setError("Failed to update habit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#121218] shadow-2xl border border-stone-200 dark:border-[#272732] overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {success && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121218] rounded-3xl p-8 border border-[#272732] shadow-2xl text-center max-w-xs w-full animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-white mb-1">Ritual Updated!</h3>
              <p className="text-xs text-[#9090A0]">Settings saved successfully.</p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-5 sm:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-heading">Edit Ritual</h2>
              <p className="text-white/80 text-xs font-semibold">Refine your daily practice parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Ritual Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          {/* Tracking Method */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Tracking Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHabitType("boolean")}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                  habitType === "boolean"
                    ? "bg-violet-500/10 border-[#7C3AED] text-[#7C3AED] dark:text-[#C084FC] font-bold"
                    : "border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] text-stone-600 dark:text-[#9090A0]"
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-xs">Yes / No</span>
              </button>
              <button
                type="button"
                onClick={() => setHabitType("numeric")}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                  habitType === "numeric"
                    ? "bg-violet-500/10 border-[#7C3AED] text-[#7C3AED] dark:text-[#C084FC] font-bold"
                    : "border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] text-stone-600 dark:text-[#9090A0]"
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="text-xs">Counter (+/−)</span>
              </button>
              <button
                type="button"
                onClick={() => setHabitType("negative")}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                  habitType === "negative"
                    ? "bg-amber-500/10 border-[#EAB308] text-[#EAB308] font-bold"
                    : "border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] text-stone-600 dark:text-[#9090A0]"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs">Quit Bad Habit</span>
              </button>
            </div>
          </div>

          {/* Target Value if Numeric */}
          {habitType === "numeric" && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#1A1A22]/70 border border-stone-200 dark:border-[#272732]">
              <div>
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1 block">
                  Daily Target
                </label>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#121218] px-3 py-2 text-xs sm:text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1 block">
                  Unit (e.g. glasses, pages)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#121218] px-3 py-2 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Time of Day */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Routine Window (Habit Stacking)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "anytime", label: "Anytime", icon: Clock },
                { id: "morning", label: "Morning", icon: Sun },
                { id: "afternoon", label: "Afternoon", icon: Sunset },
                { id: "evening", label: "Evening", icon: Moon },
              ].map((t) => {
                const Icon = t.icon;
                const active = timeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeOfDay(t.id as TimeOfDay)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                        : "bg-stone-100 dark:bg-[#1A1A22] text-stone-600 dark:text-[#9090A0] hover:bg-stone-200 dark:hover:bg-[#272732]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    category === cat
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                      : "bg-stone-100 dark:bg-[#1A1A22] text-stone-600 dark:text-[#9090A0] hover:bg-stone-200 dark:hover:bg-[#272732]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color Accent */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 block">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {AMETHYST_GOLD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-xl transition-transform hover:scale-105 flex items-center justify-center shadow-xs ${
                    color === c ? "ring-3 ring-offset-2 dark:ring-offset-[#121218] scale-105" : ""
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Target Days */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Target Frequency (Days / Week)
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTargetDays(day)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    targetDays === day
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                      : "bg-stone-100 dark:bg-[#1A1A22] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#272732]"
                  }`}
                >
                  {day}d
                </button>
              ))}
            </div>
          </div>

          {/* Intention Notes */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Intention Notes
            </label>
            <textarea
              placeholder="Why this routine matters for your goals..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#7C3AED] resize-none min-h-[60px]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-[#7C3AED]/10 border border-purple-200 dark:border-[#7C3AED]/20 text-purple-600 dark:text-[#A855F7] text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-5 sm:p-6 pt-3 border-t border-stone-100 dark:border-[#272732] flex gap-2.5 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-[#272732] text-xs font-bold text-stone-600 dark:text-[#9090A0] hover:bg-stone-50 dark:hover:bg-[#1A1A22] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white font-black text-xs shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Ritual"}
          </button>
        </div>
      </div>
    </div>
  );
}
