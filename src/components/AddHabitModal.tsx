"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { soundFX } from "@/lib/soundEffects";
import {
  X,
  Sparkles,
  Target,
  Check,
  Sun,
  Sunset,
  Moon,
  Clock,
  Hash,
  CheckSquare,
  ShieldAlert,
} from "lucide-react";

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

type HabitType = "boolean" | "numeric" | "negative";
type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

type AddHabitModalProps = {
  onClose: () => void;
};

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [habitType, setHabitType] = useState<HabitType>("boolean");
  const [targetValue, setTargetValue] = useState<number>(8);
  const [unit, setUnit] = useState<string>("glasses");
  const [costPerDay, setCostPerDay] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("anytime");
  const [color, setColor] = useState("#7C3AED");
  const [targetDays, setTargetDays] = useState(7);
  const [reminderTime, setReminderTime] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Health");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("Please specify a habit name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await addDoc(collection(db, "users", user.uid, "habits"), {
        name: name.trim(),
        habitType,
        targetValue: habitType === "numeric" ? Number(targetValue) || 1 : 1,
        unit: habitType === "numeric" ? (unit.trim() || "times") : habitType === "negative" ? (unit.trim() || "days") : "",
        costPerDay: habitType === "negative" ? Number(costPerDay) || 0 : 0,
        timeOfDay,
        color,
        targetDays,
        category,
        reminderTime: reminderTime || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes,
        isArchived: false,
        createdAt: serverTimestamp(),
      });

      soundFX.playHabitComplete();
      setSuccessAnimation(true);
      setTimeout(() => {
        onClose();
      }, 850);
    } catch {
      setError("Failed to create habit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#121218] shadow-2xl border border-stone-200 dark:border-[#272732] overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Success Splash */}
        {successAnimation && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121218] rounded-3xl p-8 border border-[#272732] shadow-2xl text-center max-w-xs w-full animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-white mb-1">Ritual Initialized!</h3>
              <p className="text-xs text-[#9090A0]">Your sacred practice is underway ✨</p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-5 sm:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-heading">New Sacred Ritual</h2>
              <p className="text-white/80 text-xs font-semibold">Define your daily practice</p>
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
          {/* Ritual Name */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 block">
              Ritual Name *
            </label>
            <input
              type="text"
              placeholder="e.g. 20-minute Workout, Read 15 Pages, Drink Water..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          {/* Tracking Mode: Checkbox vs Counter vs Bad Habit */}
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

          {/* Numeric Target Configuration */}
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
                  Unit (e.g. glasses, pages, mins)
                </label>
                <input
                  type="text"
                  placeholder="glasses, pages, mins, reps"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#121218] px-3 py-2 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Negative Habit Savings Configuration */}
          {habitType === "negative" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <label className="text-[11px] font-bold text-[#EAB308] block">
                Estimated Daily Cost Avoided (Optional $)
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 15 (dollars saved per day smoke-free)"
                value={costPerDay || ""}
                onChange={(e) => setCostPerDay(Number(e.target.value))}
                className="w-full rounded-xl border border-amber-500/30 bg-white dark:bg-[#121218] px-3 py-2 text-xs sm:text-sm outline-none"
              />
              <p className="text-[11px] text-stone-500 dark:text-[#9090A0]">
                Ritualis will track your clean streak and total wealth reclaimed.
              </p>
            </div>
          )}

          {/* Time of Day Habit Stacking */}
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

          {/* Frequency */}
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
              Sacred Intention (Optional)
            </label>
            <textarea
              placeholder="Why this daily practice matters for your growth..."
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
            {loading ? "Creating..." : "Forge Ritual"}
          </button>
        </div>
      </div>
    </div>
  );
}