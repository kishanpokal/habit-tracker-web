"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { X, Sparkles, Check } from "lucide-react";

type EditHabitModalProps = {
  habit: {
    id: string;
    name: string;
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
  const [color, setColor] = useState(habit.color || "#7C3AED");
  const [targetDays, setTargetDays] = useState(habit.targetDays);
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
        color,
        targetDays,
        reminderTime: reminderTime || null,
        notes,
        category,
      });

      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError("Failed to update habit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#121218] shadow-2xl border border-stone-200 dark:border-[#272732] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {success && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121218] rounded-3xl p-8 border border-[#272732] shadow-2xl text-center max-w-xs w-full">
              <div className="w-14 h-14 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-white mb-1">Habit Updated!</h3>
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
              <h2 className="text-lg sm:text-xl font-black font-heading">Edit Habit</h2>
              <p className="text-white/80 text-xs font-semibold">Update your habit parameters</p>
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Habit Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
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
                      : "bg-slate-100 dark:bg-[#1A1A22] text-slate-600 dark:text-[#9090A0] hover:bg-slate-200 dark:hover:bg-[#272732]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
              Theme Color
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

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
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
                      : "bg-slate-100 dark:bg-[#1A1A22] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#272732]"
                  }`}
                >
                  {day}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED] resize-none min-h-[60px]"
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
            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-[#272732] text-xs font-bold text-slate-600 dark:text-[#9090A0] hover:bg-slate-50 dark:hover:bg-[#1A1A22] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white font-black text-xs shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
