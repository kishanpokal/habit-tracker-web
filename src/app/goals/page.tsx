"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react";

type Goal = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: string;
  milestones: { text: string; done: boolean }[];
  completed: boolean;
  createdAt: any;
};

const GOAL_CATEGORIES = [
  { key: "health", label: "🏋️ Health", color: "from-[#7C3AED] to-[#6D28D9]" },
  { key: "career", label: "💼 Career", color: "from-[#EAB308] to-[#CA8A04]" },
  { key: "learning", label: "📚 Learning", color: "from-[#A855F7] to-[#7C3AED]" },
  { key: "fitness", label: "🏃 Fitness", color: "from-[#FACC15] to-[#EAB308]" },
  { key: "finance", label: "💰 Finance", color: "from-[#CA8A04] to-[#EAB308]" },
  { key: "personal", label: "🌟 Personal", color: "from-[#6D28D9] to-[#7C3AED]" },
];

export default function GoalsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("personal");
  const [newMilestones, setNewMilestones] = useState<string[]>([""]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newTitle.trim()) return;
    try {
      await addDoc(collection(db, "users", user.uid, "goals"), {
        title: newTitle.trim(),
        description: newDesc.trim(),
        targetDate: newDate,
        category: newCategory,
        milestones: newMilestones.filter((m) => m.trim()).map((m) => ({ text: m.trim(), done: false })),
        completed: false,
        createdAt: serverTimestamp(),
      });
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      setNewMilestones([""]);
      setShowAdd(false);
      addToast("success", "Goal created successfully!");
    } catch {
      addToast("error", "Failed to create goal");
    }
  };

  const toggleMilestone = async (goalId: string, idx: number) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updated = [...goal.milestones];
    updated[idx] = { ...updated[idx], done: !updated[idx].done };
    const allDone = updated.length > 0 && updated.every((m) => m.done);
    await updateDoc(doc(db, "users", user.uid, "goals", goalId), { milestones: updated, completed: allDone });
    if (allDone) addToast("success", `🎉 Goal "${goal.title}" completed!`);
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "goals", id));
    addToast("info", "Goal removed");
  };

  const filtered = filter === "all"
    ? goals
    : filter === "active"
    ? goals.filter((g) => !g.completed)
    : filter === "done"
    ? goals.filter((g) => g.completed)
    : goals.filter((g) => g.category === filter);

  const activeCount = goals.filter((g) => !g.completed).length;
  const doneCount = goals.filter((g) => g.completed).length;

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-white selection:bg-violet-500/20">
      <TopNav />
      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg shadow-violet-500/25">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">Milestone Goals</h1>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium">
                {activeCount} active targets · {doneCount} completed objectives
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Add Goal Form */}
        {showAdd && (
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Define Target Objective</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you want to accomplish?"
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-4 py-2.5 text-xs sm:text-sm font-bold outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Why is this important to your growth?"
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[#7C3AED] resize-none min-h-[60px] text-stone-800 dark:text-stone-200"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">Target Deadline</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs outline-none text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs outline-none font-bold text-stone-800 dark:text-stone-200"
                >
                  {GOAL_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1.5 block">Sub-Milestones</label>
              {newMilestones.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={m}
                    onChange={(e) => {
                      const u = [...newMilestones];
                      u[i] = e.target.value;
                      setNewMilestones(u);
                    }}
                    placeholder={`Milestone ${i + 1}`}
                    className="flex-1 rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs outline-none text-stone-800 dark:text-stone-200"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewMilestones([...newMilestones, ""])}
                className="text-xs text-[#7C3AED] dark:text-[#EAB308] font-bold hover:underline"
              >
                + Add another milestone
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.99]"
              >
                Create Target
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 border border-stone-200 dark:border-[#272732] rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#1A1A22]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: `All (${goals.length})` },
            { key: "active", label: `Active (${activeCount})` },
            { key: "done", label: `Completed (${doneCount})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === f.key
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                  : "bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] text-stone-600 dark:text-[#9090A0]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        {filtered.length === 0 && (
          <div className="text-center py-14 bg-white dark:bg-[#121218] rounded-3xl border border-stone-200/80 dark:border-[#272732] p-8 shadow-xs">
            <Target className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">No goals found</h3>
            <p className="text-xs text-stone-400 dark:text-[#9090A0] max-w-xs mx-auto">
              Set your target milestones to keep your long-term ambitions organized.
            </p>
          </div>
        )}

        <div className="space-y-3.5">
          {filtered.map((goal) => {
            const cat = GOAL_CATEGORIES.find((c) => c.key === goal.category);
            const totalM = goal.milestones?.length || 0;
            const doneM = goal.milestones?.filter((m) => m.done).length || 0;
            const progress = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
            const daysLeft = goal.targetDate
              ? Math.ceil((new Date(goal.targetDate + "T00:00:00").getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div
                key={goal.id}
                className={`bg-white dark:bg-[#121218] rounded-2xl border shadow-xs transition-all p-5 ${
                  goal.completed
                    ? "border-[#EAB308]/40 bg-[#EAB308]/5"
                    : "border-stone-200/80 dark:border-[#272732]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {goal.completed ? (
                        <Award className="w-4 h-4 text-[#EAB308] flex-shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                      )}
                      <h3 className={`text-sm sm:text-base font-bold ${goal.completed ? "line-through text-stone-400" : "text-stone-900 dark:text-white"}`}>
                        {goal.title}
                      </h3>
                    </div>
                    {goal.description && <p className="text-xs text-stone-500 dark:text-[#9090A0] mt-0.5">{goal.description}</p>}
                    <div className="flex items-center gap-2 mt-2.5">
                      {cat && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#1A1A22] text-stone-600 dark:text-stone-300">
                          {cat.label}
                        </span>
                      )}
                      {daysLeft !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          daysLeft < 0
                            ? "bg-violet-500/15 text-[#7C3AED] dark:text-[#C084FC]"
                            : daysLeft <= 7
                            ? "bg-[#EAB308]/15 text-[#EAB308]"
                            : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500"
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-stone-400 hover:text-[#7C3AED] transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                {totalM > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-bold text-stone-400 mb-1">
                      <span>{doneM}/{totalM} milestones reached</span>
                      <span className="text-[#7C3AED] dark:text-[#EAB308] font-black">{progress}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.completed ? "bg-[#EAB308]" : "bg-gradient-to-r from-[#7C3AED] to-[#EAB308]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Milestones Checklist */}
                {goal.milestones?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {goal.milestones.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => toggleMilestone(goal.id, i)}
                        className="w-full flex items-center gap-2.5 text-left p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-[#1A1A22]/60 transition-colors group"
                      >
                        {m.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#EAB308] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-[#7C3AED] flex-shrink-0 transition-colors" />
                        )}
                        <span className={`text-xs font-medium ${m.done ? "line-through text-stone-400" : "text-stone-700 dark:text-stone-300"}`}>
                          {m.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
