"use client";

import { useState, useMemo } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { X, Sparkles, Check, Search } from "lucide-react";

const TEMPLATE_GROUPS = [
  {
    name: "🏋️ Health & Vitality",
    templates: [
      { name: "Drink 2.5L mineral water", color: "#71717A", category: "Health", targetDays: 7 },
      { name: "30 min workout / training", color: "#7C3AED", category: "Fitness", targetDays: 5 },
      { name: "10,000 steps walked", color: "#EAB308", category: "Fitness", targetDays: 6 },
      { name: "Zero processed sugar", color: "#A855F7", category: "Health", targetDays: 6 },
      { name: "10 min posture stretch", color: "#6D28D9", category: "Fitness", targetDays: 5 },
      { name: "Essential multivitamins", color: "#FACC15", category: "Health", targetDays: 7 },
    ],
  },
  {
    name: "🧠 Deep Execution",
    templates: [
      { name: "Wake up by 6:30 AM", color: "#EAB308", category: "Productivity", targetDays: 6 },
      { name: "Zero social media before 11 AM", color: "#7C3AED", category: "Productivity", targetDays: 5 },
      { name: "Daily priority list written", color: "#C084FC", category: "Productivity", targetDays: 7 },
      { name: "2 hours uninterrupted deep work", color: "#EAB308", category: "Productivity", targetDays: 5 },
      { name: "Inbox zero / communication sweep", color: "#A855F7", category: "Productivity", targetDays: 5 },
      { name: "Plan tomorrow evening protocol", color: "#6D28D9", category: "Productivity", targetDays: 7 },
    ],
  },
  {
    name: "📚 Knowledge & Intellect",
    templates: [
      { name: "Read 25 pages non-fiction", color: "#EAB308", category: "Learning", targetDays: 6 },
      { name: "Practice coding / building", color: "#7C3AED", category: "Learning", targetDays: 5 },
      { name: "Write daily journal entry", color: "#FACC15", category: "Learning", targetDays: 7 },
      { name: "Review technical papers or audio", color: "#6D28D9", category: "Learning", targetDays: 4 },
      { name: "Language practice (15 min)", color: "#CA8A04", category: "Learning", targetDays: 6 },
    ],
  },
  {
    name: "🧘 Mindfulness & Balance",
    templates: [
      { name: "15 min morning breathwork", color: "#7C3AED", category: "Mindfulness", targetDays: 7 },
      { name: "Evening gratitude reflection", color: "#EAB308", category: "Mindfulness", targetDays: 7 },
      { name: "Digital sunset by 10 PM", color: "#71717A", category: "Mindfulness", targetDays: 6 },
      { name: "Walk in open air", color: "#A855F7", category: "Mindfulness", targetDays: 4 },
      { name: "Cold shower / recovery reset", color: "#6D28D9", category: "Mindfulness", targetDays: 5 },
    ],
  },
];

type HabitTemplateModalProps = {
  onClose: () => void;
};

export default function HabitTemplateModal({ onClose }: HabitTemplateModalProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [addedHabits, setAddedHabits] = useState<Set<string>>(new Set());

  const filteredGroups = TEMPLATE_GROUPS.map((g) => ({
    ...g,
    templates: g.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.templates.length > 0);

  const handleAdd = async (template: (typeof TEMPLATE_GROUPS)[0]["templates"][0]) => {
    if (!user) return;
    try {
      setAdding(template.name);
      await addDoc(collection(db, "users", user.uid, "habits"), {
        name: template.name,
        color: template.color,
        category: template.category,
        targetDays: template.targetDays,
        reminderTime: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: "Added from curated template library",
        isArchived: false,
        createdAt: serverTimestamp(),
      });
      setAddedHabits((prev) => new Set(prev).add(template.name));
      addToast("success", `Added "${template.name}"!`);
    } catch (err) {
      addToast("error", "Failed to add habit template");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#121218] shadow-2xl border border-stone-200 dark:border-[#272732] overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading">Habit Library</h2>
              <p className="text-white/80 text-xs font-semibold">Curated high-performance routines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-100 dark:border-[#272732] flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g. sleep, focus, water)..."
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Templates List */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {filteredGroups.map((group) => (
            <div key={group.name} className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-[#9090A0] uppercase tracking-wider">{group.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.templates.map((t) => {
                  const isAdded = addedHabits.has(t.name);
                  return (
                    <button
                      key={t.name}
                      onClick={() => !isAdded && handleAdd(t)}
                      disabled={adding === t.name || isAdded}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isAdded
                          ? "bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#EAB308]"
                          : "bg-white dark:bg-[#1A1A22] border-stone-200/80 dark:border-[#272732] hover:border-[#7C3AED]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: t.color }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-[#9090A0]">{t.targetDays} days/wk</p>
                        </div>
                      </div>

                      {isAdded ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#EAB308]">
                          <Check className="w-3 h-3" /> Added
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-[#9090A0] font-bold hover:text-[#7C3AED]">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
