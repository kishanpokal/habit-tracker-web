"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { Target, Plus, Trash2, CheckCircle, Circle, TrendingUp, Award, Calendar } from "lucide-react";

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
    { key: "health", label: "🏋️ Health", color: "from-emerald-400 to-green-600" },
    { key: "career", label: "💼 Career", color: "from-blue-400 to-indigo-600" },
    { key: "learning", label: "📚 Learning", color: "from-purple-400 to-violet-600" },
    { key: "fitness", label: "🏃 Fitness", color: "from-orange-400 to-red-600" },
    { key: "finance", label: "💰 Finance", color: "from-amber-400 to-yellow-600" },
    { key: "personal", label: "🌟 Personal", color: "from-pink-400 to-rose-600" },
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
        const unsub = onSnapshot(q, snap => {
            setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
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
                milestones: newMilestones.filter(m => m.trim()).map(m => ({ text: m.trim(), done: false })),
                completed: false,
                createdAt: serverTimestamp(),
            });
            setNewTitle(""); setNewDesc(""); setNewDate(""); setNewMilestones([""]); setShowAdd(false);
            addToast("success", "Goal created!");
        } catch { addToast("error", "Failed to create goal"); }
    };

    const toggleMilestone = async (goalId: string, idx: number) => {
        if (!user) return;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const updated = [...goal.milestones];
        updated[idx] = { ...updated[idx], done: !updated[idx].done };
        const allDone = updated.length > 0 && updated.every(m => m.done);
        await updateDoc(doc(db, "users", user.uid, "goals", goalId), { milestones: updated, completed: allDone });
        if (allDone) addToast("success", `🎉 Goal "${goal.title}" completed!`);
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "goals", id));
        addToast("info", "Goal deleted");
    };

    const filtered = filter === "all" ? goals
        : filter === "active" ? goals.filter(g => !g.completed)
            : filter === "done" ? goals.filter(g => g.completed)
                : goals.filter(g => g.category === filter);

    const activeCount = goals.filter(g => !g.completed).length;
    const doneCount = goals.filter(g => g.completed).length;

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-5">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-6 h-6" />
                                <h1 className="text-2xl font-black">Goals</h1>
                            </div>
                            <p className="text-white/70 text-sm">{activeCount} active · {doneCount} completed</p>
                        </div>
                        <button onClick={() => setShowAdd(!showAdd)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur border border-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-all"
                        >
                            <Plus className="w-4 h-4" /> New Goal
                        </button>
                    </div>
                </div>

                {/* Add Goal Form */}
                {showAdd && (
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4" style={{ animation: "fadeIn 0.3s ease-out" }}>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title"
                            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                        />
                        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Why is this goal important?"
                            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all resize-none min-h-[60px]"
                        />
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Target Date</label>
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Category</label>
                                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none"
                                >
                                    {GOAL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Milestones</label>
                            {newMilestones.map((m, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input value={m} onChange={e => { const u = [...newMilestones]; u[i] = e.target.value; setNewMilestones(u); }}
                                        placeholder={`Milestone ${i + 1}`}
                                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none"
                                    />
                                </div>
                            ))}
                            <button onClick={() => setNewMilestones([...newMilestones, ""])} className="text-xs text-indigo-500 font-bold hover:text-indigo-400">
                                + Add milestone
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAdd} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                                Create Goal
                            </button>
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                        { key: "all", label: `All (${goals.length})` },
                        { key: "active", label: `Active (${activeCount})` },
                        { key: "done", label: `Done (${doneCount})` },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f.key ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700"
                                }`}
                        >{f.label}</button>
                    ))}
                </div>

                {/* Goals List */}
                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-bold text-gray-400">No goals yet</p>
                        <p className="text-xs text-gray-400">Create your first goal to get started</p>
                    </div>
                )}

                <div className="space-y-3">
                    {filtered.map(goal => {
                        const cat = GOAL_CATEGORIES.find(c => c.key === goal.category);
                        const totalM = goal.milestones?.length || 0;
                        const doneM = goal.milestones?.filter(m => m.done).length || 0;
                        const progress = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;
                        const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000) : null;

                        return (
                            <div key={goal.id} className={`bg-white dark:bg-[#111827] rounded-2xl border shadow-sm overflow-hidden transition-all ${goal.completed ? "border-emerald-200 dark:border-emerald-800" : "border-gray-100 dark:border-gray-800"
                                }`}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {goal.completed ? <Award className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-indigo-500" />}
                                                <h3 className={`text-sm font-bold ${goal.completed ? "line-through text-gray-400" : ""}`}>{goal.title}</h3>
                                            </div>
                                            {goal.description && <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>}
                                            <div className="flex items-center gap-2 mt-2">
                                                {cat && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">{cat.label}</span>}
                                                {daysLeft !== null && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${daysLeft < 0 ? "bg-red-100 dark:bg-red-500/10 text-red-500" :
                                                            daysLeft <= 7 ? "bg-amber-100 dark:bg-amber-500/10 text-amber-500" :
                                                                "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                                        }`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Progress bar */}
                                    {totalM > 0 && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                                <span>{doneM}/{totalM} milestones</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${goal.completed ? "bg-emerald-500" : "bg-indigo-500"}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Milestones */}
                                    {goal.milestones?.length > 0 && (
                                        <div className="space-y-1.5">
                                            {goal.milestones.map((m, i) => (
                                                <button key={i} onClick={() => toggleMilestone(goal.id, i)}
                                                    className="w-full flex items-center gap-2.5 text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                                >
                                                    {m.done ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />}
                                                    <span className={`text-xs font-medium ${m.done ? "line-through text-gray-400" : ""}`}>{m.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
