"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import TopNav from "@/components/TopNav";
import { collection, doc, setDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookOpen, Smile, Meh, Frown, Zap, Heart, Cloud, Sun, Moon, Star } from "lucide-react";

const MOODS = [
    { key: "amazing", label: "Amazing", icon: <Star className="w-5 h-5" />, color: "from-amber-400 to-yellow-500", emoji: "🌟" },
    { key: "good", label: "Good", icon: <Sun className="w-5 h-5" />, color: "from-emerald-400 to-green-500", emoji: "😊" },
    { key: "okay", label: "Okay", icon: <Cloud className="w-5 h-5" />, color: "from-blue-400 to-indigo-500", emoji: "😐" },
    { key: "low", label: "Low", icon: <Meh className="w-5 h-5" />, color: "from-orange-400 to-amber-500", emoji: "😔" },
    { key: "rough", label: "Rough", icon: <Frown className="w-5 h-5" />, color: "from-red-400 to-rose-500", emoji: "😞" },
];

type JournalEntry = {
    id: string;
    date: string;
    mood: string;
    content: string;
    gratitude: string;
    tags: string[];
    createdAt: any;
};

const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function JournalPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [mood, setMood] = useState("");
    const [content, setContent] = useState("");
    const [gratitude, setGratitude] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "users", user.uid, "journal"), orderBy("date", "desc"));
        const unsub = onSnapshot(q, snap => {
            setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry)));
            setLoading(false);
        });
        return unsub;
    }, [user]);

    // Load existing entry when date changes
    useEffect(() => {
        const existing = entries.find(e => e.date === selectedDate);
        if (existing) {
            setMood(existing.mood || "");
            setContent(existing.content || "");
            setGratitude(existing.gratitude || "");
        } else {
            setMood(""); setContent(""); setGratitude("");
        }
        setSaved(false);
    }, [selectedDate, entries]);

    const handleSave = async () => {
        if (!user) return;
        try {
            setSaving(true);
            await setDoc(doc(db, "users", user.uid, "journal", selectedDate), {
                date: selectedDate,
                mood,
                content,
                gratitude,
                tags: [],
                createdAt: serverTimestamp(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Mood stats
    const moodStats = useMemo(() => {
        const counts: Record<string, number> = {};
        entries.forEach(e => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
        return counts;
    }, [entries]);

    const streakDays = useMemo(() => {
        let streak = 0;
        for (let i = 0; ; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            if (entries.find(e => e.date === key && e.content)) streak++;
            else break;
        }
        return streak;
    }, [entries]);

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
            <main className="pt-16 sm:pt-20 lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-5">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-6 h-6" />
                                <h1 className="text-2xl font-black">Daily Journal</h1>
                            </div>
                            <p className="text-white/70 text-sm">{entries.length} entries · {streakDays} day writing streak</p>
                        </div>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="bg-white/20 backdrop-blur border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
                        />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-5 gap-2">
                    {MOODS.map(m => (
                        <div key={m.key} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-gray-800 p-2.5 text-center">
                            <div className="text-lg mb-0.5">{m.emoji}</div>
                            <div className="text-sm font-black">{moodStats[m.key] || 0}</div>
                            <div className="text-[9px] text-gray-400 font-bold">{m.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Editor */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Mood */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">How are you feeling?</h3>
                            <div className="flex gap-2">
                                {MOODS.map(m => (
                                    <button key={m.key} onClick={() => setMood(m.key)}
                                        className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${mood === m.key
                                                ? `border-transparent bg-gradient-to-br ${m.color} text-white shadow-lg scale-105`
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <span className="text-xl">{m.emoji}</span>
                                        <span className="text-[10px] font-bold">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Journal Entry */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Today&apos;s Reflection</h3>
                            <textarea value={content} onChange={e => setContent(e.target.value)}
                                placeholder="How was your day? What did you accomplish? What did you learn?"
                                className="w-full min-h-[140px] rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                            />
                        </div>

                        {/* Gratitude */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🙏 Gratitude</h3>
                            <textarea value={gratitude} onChange={e => setGratitude(e.target.value)}
                                placeholder="What are you grateful for today?"
                                className="w-full min-h-[80px] rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                            />
                        </div>

                        {/* Save */}
                        <button onClick={handleSave} disabled={saving}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Entry"}
                        </button>
                    </div>

                    {/* Recent Entries Sidebar */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold">Recent Entries</h3>
                        {entries.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-8">No entries yet. Start writing!</p>
                        )}
                        {entries.slice(0, 10).map(e => {
                            const moodInfo = MOODS.find(m => m.key === e.mood);
                            return (
                                <button key={e.id} onClick={() => setSelectedDate(e.date)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedDate === e.date
                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                                            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold">{new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                                        <span className="text-sm">{moodInfo?.emoji || "📝"}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 line-clamp-2">{e.content || "No reflection"}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
