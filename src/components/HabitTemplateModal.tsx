"use client";

import { useState, useMemo } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { X, Sparkles, Dumbbell, BookOpen, Brain, Heart, Moon, Coffee, Palette, Music, Code, Users } from "lucide-react";

const TEMPLATE_GROUPS = [
    {
        name: "🏋️ Health & Fitness",
        templates: [
            { name: "Drink 8 glasses of water", color: "#0ea5e9", category: "Health", targetDays: 7 },
            { name: "30 min exercise", color: "#ef4444", category: "Fitness", targetDays: 5 },
            { name: "10,000 steps", color: "#f59e0b", category: "Fitness", targetDays: 6 },
            { name: "No junk food", color: "#22c55e", category: "Health", targetDays: 7 },
            { name: "Stretch for 10 min", color: "#14b8a6", category: "Fitness", targetDays: 5 },
            { name: "Take vitamins", color: "#8b5cf6", category: "Health", targetDays: 7 },
        ],
    },
    {
        name: "🧠 Productivity",
        templates: [
            { name: "Wake up before 7 AM", color: "#f97316", category: "Productivity", targetDays: 6 },
            { name: "No social media for 2 hours", color: "#ec4899", category: "Productivity", targetDays: 5 },
            { name: "Make a to-do list", color: "#6366f1", category: "Productivity", targetDays: 7 },
            { name: "Deep work session (2h)", color: "#3b82f6", category: "Productivity", targetDays: 5 },
            { name: "Inbox zero", color: "#10b981", category: "Productivity", targetDays: 5 },
            { name: "Plan tomorrow tonight", color: "#7c3aed", category: "Productivity", targetDays: 7 },
        ],
    },
    {
        name: "📚 Learning",
        templates: [
            { name: "Read for 30 minutes", color: "#8b5cf6", category: "Learning", targetDays: 6 },
            { name: "Learn a new word", color: "#22c55e", category: "Learning", targetDays: 7 },
            { name: "Practice coding", color: "#0ea5e9", category: "Learning", targetDays: 5 },
            { name: "Watch educational video", color: "#ef4444", category: "Learning", targetDays: 3 },
            { name: "Write in journal", color: "#f59e0b", category: "Learning", targetDays: 5 },
            { name: "Study for 1 hour", color: "#6366f1", category: "Learning", targetDays: 6 },
        ],
    },
    {
        name: "🧘 Mindfulness",
        templates: [
            { name: "Meditate for 10 min", color: "#14b8a6", category: "Mindfulness", targetDays: 7 },
            { name: "Gratitude journaling", color: "#ec4899", category: "Mindfulness", targetDays: 7 },
            { name: "Digital detox (1h)", color: "#3b82f6", category: "Mindfulness", targetDays: 5 },
            { name: "Deep breathing exercises", color: "#7c3aed", category: "Mindfulness", targetDays: 7 },
            { name: "No phone before bed", color: "#f97316", category: "Mindfulness", targetDays: 6 },
        ],
    },
    {
        name: "💰 Finance & Social",
        templates: [
            { name: "Track expenses", color: "#22c55e", category: "Finance", targetDays: 7 },
            { name: "No unnecessary purchases", color: "#f59e0b", category: "Finance", targetDays: 7 },
            { name: "Save money ($5 minimum)", color: "#10b981", category: "Finance", targetDays: 5 },
            { name: "Call a friend or family", color: "#ec4899", category: "Social", targetDays: 3 },
            { name: "Random act of kindness", color: "#8b5cf6", category: "Social", targetDays: 2 },
        ],
    },
];

type HabitTemplateModalProps = {
    onClose: () => void;
};

export default function HabitTemplateModal({ onClose }: HabitTemplateModalProps) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [adding, setAdding] = useState<string | null>(null);
    const [addedHabits, setAddedHabits] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return TEMPLATE_GROUPS;
        const q = search.toLowerCase();
        return TEMPLATE_GROUPS.map(g => ({
            ...g,
            templates: g.templates.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
        })).filter(g => g.templates.length > 0);
    }, [search]);

    const handleAdd = async (template: typeof TEMPLATE_GROUPS[0]["templates"][0]) => {
        if (!user) return;
        try {
            setAdding(template.name);
            await addDoc(collection(db, "users", user.uid, "habits"), {
                name: template.name,
                color: template.color,
                targetDays: template.targetDays,
                category: template.category,
                reminderTime: null,
                notes: "",
                isArchived: false,
                createdAt: serverTimestamp(),
            });
            setAddedHabits(prev => new Set(prev).add(template.name));
            addToast("success", `"${template.name}" added!`);
        } catch (err) {
            addToast("error", "Failed to add habit");
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col" style={{ animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-white" />
                        <div>
                            <h2 className="text-lg font-bold text-white">Habit Templates</h2>
                            <p className="text-white/70 text-xs">One-click to add pre-built habits</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 transition flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pt-4 flex-shrink-0">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search habits..."
                        className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Templates */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {filteredGroups.map(group => (
                        <div key={group.name}>
                            <h3 className="text-sm font-bold mb-2">{group.name}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.templates.map(t => {
                                    const isAdded = addedHabits.has(t.name);
                                    return (
                                        <button key={t.name} onClick={() => !isAdded && handleAdd(t)}
                                            disabled={adding === t.name || isAdded}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${isAdded
                                                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/5"
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98]"
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${t.color}20`, border: `2px solid ${t.color}40` }}>
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{t.name}</p>
                                                <p className="text-[10px] text-gray-400">{t.category} · {t.targetDays}d/wk</p>
                                            </div>
                                            {isAdded ? (
                                                <span className="text-[10px] font-bold text-emerald-500">✓ Added</span>
                                            ) : adding === t.name ? (
                                                <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-indigo-500">+ Add</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
        </div>
    );
}
