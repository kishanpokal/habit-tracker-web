"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { X, Sparkles, Clock, FileText, Calendar, Palette, Tag } from "lucide-react";

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

const CATEGORIES = ["Health", "Productivity", "Fitness", "Learning", "Mindfulness", "Social", "Finance", "Creative", "Other"];

export default function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
    const { user } = useAuth();

    const [name, setName] = useState(habit.name);
    const [color, setColor] = useState(habit.color);
    const [targetDays, setTargetDays] = useState(habit.targetDays);
    const [reminderTime, setReminderTime] = useState(habit.reminderTime || "");
    const [notes, setNotes] = useState(habit.notes || "");
    const [category, setCategory] = useState(habit.category || "Other");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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

            await updateDoc(doc(db, "users", user.uid, "habits", habit.id), {
                name: name.trim(),
                color,
                targetDays,
                reminderTime: reminderTime || null,
                notes,
                category,
            });

            setSuccess(true);
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            setError("Failed to update habit. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[95vh] flex flex-col" style={{ animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>

                {/* Success Overlay */}
                {success && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm z-50 flex items-center justify-center" style={{ animation: "fadeIn 0.2s ease-out" }}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Habit Updated!</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Edit Habit</h2>
                            <p className="text-white/70 text-xs">Update your habit settings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            <FileText className="w-3.5 h-3.5" /> Habit Name *
                        </label>
                        <input
                            type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            <Tag className="w-3.5 h-3.5" /> Category
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${category === cat
                                            ? "bg-orange-500 text-white shadow-md"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                >{cat}</button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Palette className="w-3.5 h-3.5" /> Color
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {popularColors.map(c => (
                                <button key={c} onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-xl transition-all hover:scale-110 shadow-sm ${color === c ? "ring-3 ring-offset-2 dark:ring-offset-gray-900 scale-110" : ""
                                        }`}
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && (
                                        <svg className="w-5 h-5 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                            <div className="relative w-10 h-10">
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center" style={{ backgroundColor: color }}>
                                    <span className="text-base font-bold text-white drop-shadow">+</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Target Days */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-3.5 h-3.5" /> Target Days / Week
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <button key={day} onClick={() => setTargetDays(day)}
                                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${targetDays === day
                                            ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg scale-105"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                >{day}</button>
                            ))}
                        </div>
                    </div>

                    {/* Reminder & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                <Clock className="w-3.5 h-3.5" /> Reminder Time
                            </label>
                            <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                <FileText className="w-3.5 h-3.5" /> Notes
                            </label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why this habit matters..."
                                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 min-h-[76px] text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                            <span>⚠</span> {error}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={loading || !name.trim()}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
        </div>
    );
}
