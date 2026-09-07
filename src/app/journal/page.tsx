"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo, useRef } from "react";
import TopNav from "@/components/TopNav";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BookOpen,
  Sparkles,
  Search,
  Calendar,
  Flame,
  RotateCcw,
  Bold,
  Italic,
  List,
  Quote,
  Trash2,
  CheckCircle2,
} from "lucide-react";

/* ─── Mood Definitions (Amethyst & Gold Theme) ─── */
const MOODS = [
  { key: "ecstatic", label: "Ecstatic", emoji: "🌟", color: "from-[#7C3AED] to-[#EAB308]", bg: "bg-violet-500/15 border-[#7C3AED]" },
  { key: "energized", label: "Energized", emoji: "⚡", color: "from-[#EAB308] to-[#FACC15]", bg: "bg-[#EAB308]/15 border-[#EAB308]" },
  { key: "content", label: "Content", emoji: "😊", color: "from-[#A855F7] to-[#7C3AED]", bg: "bg-[#A855F7]/15 border-[#A855F7]" },
  { key: "neutral", label: "Neutral", emoji: "😐", color: "from-[#71717A] to-[#52525B]", bg: "bg-zinc-500/15 border-zinc-400" },
  { key: "fatigued", label: "Tired", emoji: "🥱", color: "from-stone-500 to-stone-700", bg: "bg-stone-500/15 border-stone-400" },
  { key: "stressed", label: "Stressed", emoji: "🌧️", color: "from-[#6D28D9] to-[#4C1D95]", bg: "bg-[#6D28D9]/15 border-[#6D28D9]" },
];

/* ─── Backward Compatibility & Mood Normalization ─── */
// Preserves all historical journal entries recorded under older scales
// (e.g., "amazing", "good", "okay", "low", "rough", "tired", or raw emojis)
// so that user data is never lost or miscounted in stats, pulse bar, or filters.
const MOOD_ALIASES: Record<string, string> = {
  amazing: "ecstatic",
  great: "ecstatic",
  awesome: "ecstatic",
  fantastic: "ecstatic",
  superb: "ecstatic",

  good: "energized",
  excited: "energized",
  motivated: "energized",
  productive: "energized",
  high: "energized",

  happy: "content",
  peaceful: "content",
  calm: "content",
  relaxed: "content",
  satisfied: "content",
  grateful: "content",
  serene: "content",

  okay: "neutral",
  fine: "neutral",
  normal: "neutral",
  average: "neutral",
  meh: "neutral",

  tired: "fatigued",
  low: "fatigued",
  exhausted: "fatigued",
  sleepy: "fatigued",
  drained: "fatigued",
  burnout: "fatigued",

  rough: "stressed",
  bad: "stressed",
  anxious: "stressed",
  overwhelmed: "stressed",
  down: "stressed",
  sad: "stressed",
  frustrated: "stressed",
  upset: "stressed",
};

const EMOJI_MOOD_MAP: Record<string, string> = {
  "🌟": "ecstatic",
  "⭐": "ecstatic",
  "✨": "ecstatic",
  "⚡": "energized",
  "🔥": "energized",
  "💪": "energized",
  "😊": "content",
  "🙂": "content",
  "😌": "content",
  "😐": "neutral",
  "😶": "neutral",
  "🥱": "fatigued",
  "😴": "fatigued",
  "😔": "fatigued",
  "🌧️": "stressed",
  "😞": "stressed",
  "😫": "stressed",
  "😡": "stressed",
  "🤯": "stressed",
};

export const normalizeMood = (rawMood?: string | null): string => {
  if (!rawMood) return "";
  const trimmed = rawMood.trim();
  if (EMOJI_MOOD_MAP[trimmed]) return EMOJI_MOOD_MAP[trimmed];
  const cleaned = trimmed.toLowerCase();
  if (MOODS.some((m) => m.key === cleaned)) return cleaned;
  if (MOOD_ALIASES[cleaned]) return MOOD_ALIASES[cleaned];
  const byLabel = MOODS.find((m) => m.label.toLowerCase() === cleaned);
  if (byLabel) return byLabel.key;
  return cleaned;
};

export const getMoodInfo = (rawMood?: string | null) => {
  if (!rawMood) return null;
  const canonical = normalizeMood(rawMood);
  const found = MOODS.find((m) => m.key === canonical);
  if (found) return found;

  // Fallback so any legacy custom string or emoji still renders gracefully
  return {
    key: canonical,
    label: rawMood.charAt(0).toUpperCase() + rawMood.slice(1),
    emoji: EMOJI_MOOD_MAP[rawMood.trim()] || "📝",
    color: "from-[#7C3AED] to-[#EAB308]",
    bg: "bg-violet-500/15 border-[#7C3AED]",
  };
};

const WRITING_PROMPTS = [
  "What is the single most meaningful win you achieved today?",
  "What was one unexpected challenge, and how did you handle it?",
  "Who is someone you felt grateful for today, and why?",
  "What habit felt effortless today, and which one required resistance?",
  "If you could replay one moment from today, what would it be?",
  "What is one intention you want to carry into tomorrow?",
];

type JournalEntry = {
  id: string;
  date: string;
  mood: string;
  content: string;
  gratitude: string;
  tags?: string[];
  createdAt: any;
};

const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [mood, setMood] = useState("");
  const [content, setContent] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [promptIndex, setPromptIndex] = useState(0);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "journal"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const existing = entries.find((e) => e.date === selectedDate);
    if (existing) {
      setMood(normalizeMood(existing.mood));
      setContent(existing.content || "");
      setGratitude(existing.gratitude || "");
      setTags(existing.tags || []);
    } else {
      setMood("");
      setContent("");
      setGratitude("");
      setTags([]);
    }
    setSaveStatus("idle");
  }, [selectedDate, entries]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid, "journal", selectedDate),
        {
          date: selectedDate,
          mood,
          content,
          gratitude,
          tags,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (date: string) => {
    if (!user || !confirm(`Delete journal reflection for ${date}?`)) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "journal", date));
      if (selectedDate === date) {
        setContent("");
        setGratitude("");
        setMood("");
        setTags([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const insertFormatting = (prefix: string, suffix = "") => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTime };
  }, [content]);

  const streakDays = useMemo(() => {
    let streak = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (entries.find((e) => e.date === key && e.content)) streak++;
      else break;
    }
    return streak;
  }, [entries]);

  const moodStats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const canonical = normalizeMood(e.mood);
      if (canonical) counts[canonical] = (counts[canonical] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !searchQuery.trim() ||
        e.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.gratitude?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const canonical = normalizeMood(e.mood);
      const matchesMood = moodFilter === "all" || canonical === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, moodFilter]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-stone-100 selection:bg-violet-500/25">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">

        {/* ━━━━━ HEADER BANNER ━━━━━ */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg shadow-violet-500/25">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">Daily Reflection Journal</h1>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium flex items-center gap-3">
                <span>{entries.length} reflections recorded</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-yellow-200">
                  <Flame className="w-4 h-4 fill-[#EAB308] text-[#EAB308]" />
                  {streakDays}-day writing streak
                </span>
              </p>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <Calendar className="w-4 h-4 text-[#EAB308]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs sm:text-sm font-bold outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* ━━━━━ MOOD PULSE BAR ━━━━━ */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MOODS.map((m) => (
            <div
              key={m.key}
              className="bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] rounded-xl p-2.5 text-center shadow-xs"
            >
              <div className="text-lg mb-0.5">{m.emoji}</div>
              <div className="text-sm font-black font-heading text-stone-900 dark:text-white">
                {moodStats[m.key] || 0}
              </div>
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </div>

        {/* ━━━━━ TWO COLUMN WORKSPACE ━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 8 COLS: EDITOR */}
          <div className="lg:col-span-8 space-y-4">

            {/* 1. Mood Selection */}
            <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider block">
                  How are you feeling right now?
                </span>
                {mood && (
                  <span className="text-xs font-bold text-[#7C3AED] dark:text-[#EAB308] flex items-center gap-1.5">
                    <span>{getMoodInfo(mood)?.emoji}</span>
                    <span>{getMoodInfo(mood)?.label}</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MOODS.map((m) => {
                  const isSelected = normalizeMood(mood) === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMood(m.key)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all select-none ${
                        isSelected
                          ? `${m.bg} shadow-xs scale-102`
                          : "border-stone-100 dark:border-[#272732] hover:bg-stone-50 dark:hover:bg-[#1A1A22]"
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Writing Prompt */}
            <div className="bg-gradient-to-r from-[#7C3AED]/10 to-[#EAB308]/10 border border-[#7C3AED]/20 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#EAB308] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Prompt of the Day
                </span>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {WRITING_PROMPTS[promptIndex]}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    const promptText = `\n\n**${WRITING_PROMPTS[promptIndex]}**\n`;
                    setContent((prev) => prev + promptText);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-violet-500/20 hover:bg-violet-500/30 text-[#7C3AED] dark:text-[#EAB308] rounded-lg transition-colors"
                >
                  Insert
                </button>
                <button
                  onClick={() => setPromptIndex((prev) => (prev + 1) % WRITING_PROMPTS.length)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  title="Next prompt"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Main Editor */}
            <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#272732] pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#1A1A22] text-stone-600 dark:text-stone-300"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#1A1A22] text-stone-600 dark:text-stone-300"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("- ")}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#1A1A22] text-stone-600 dark:text-stone-300"
                    title="List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("> ")}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-[#1A1A22] text-stone-600 dark:text-stone-300"
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400 font-semibold">
                  <span>{stats.words} words</span>
                  <span>•</span>
                  <span>{stats.readTime} min read</span>
                </div>
              </div>

              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What happened today? What went well? What could be improved tomorrow?"
                className="w-full min-h-[220px] rounded-xl border-0 bg-stone-50/60 dark:bg-[#1A1A22]/40 p-4 text-xs sm:text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none placeholder:text-stone-400 leading-relaxed font-sans"
              />
            </div>

            {/* 4. Gratitude & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 shadow-xs space-y-2">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider block">
                  🙏 Today I am grateful for...
                </span>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="1. My morning routine&#10;2. A good conversation&#10;3. Peace of mind"
                  className="w-full min-h-[90px] rounded-xl border border-stone-100 dark:border-[#272732] bg-stone-50/60 dark:bg-[#1A1A22]/40 p-3 text-xs sm:text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none placeholder:text-stone-400"
                />
              </div>

              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 shadow-xs space-y-2.5">
                <span className="text-xs font-bold text-stone-500 dark:text-[#9090A0] uppercase tracking-wider block">
                  🏷️ Reflection Tags
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="e.g. deepwork, health, focus"
                    className="flex-1 rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-1.5 text-xs outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-[#7C3AED] dark:text-[#EAB308] text-[11px] font-bold border border-violet-500/20"
                    >
                      #{t}
                      <button onClick={() => handleRemoveTag(t)} className="hover:text-violet-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save CTA */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-violet-500/25 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving reflection...</span>
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                    <span>Saved successfully!</span>
                  </>
                ) : (
                  <>
                    <span>Save Journal Entry</span>
                  </>
                )}
              </button>

              {entries.some((e) => e.date === selectedDate) && (
                <button
                  onClick={() => handleDeleteEntry(selectedDate)}
                  className="p-3 rounded-xl border border-stone-200 dark:border-[#272732] text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete this entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT 4 COLS: ARCHIVE */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-heading">Past Reflections</h3>
                <span className="text-xs text-stone-400 font-semibold">{filteredEntries.length} found</span>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reflections..."
                  className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] pl-8 pr-3 py-2 text-xs outline-none focus:border-[#7C3AED]"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Mood Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                <button
                  onClick={() => setMoodFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                    moodFilter === "all"
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                      : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500 dark:text-[#9090A0]"
                  }`}
                >
                  All
                </button>
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMoodFilter(m.key)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap flex items-center gap-1 ${
                      moodFilter === m.key
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs"
                        : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500"
                    }`}
                  >
                    <span>{m.emoji}</span>
                  </button>
                ))}
              </div>

              {/* Entry List */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {filteredEntries.length === 0 ? (
                  <p className="text-center text-xs text-stone-400 py-8">No reflections matching criteria.</p>
                ) : (
                  filteredEntries.map((e) => {
                    const moodItem = getMoodInfo(e.mood);
                    const isSelected = selectedDate === e.date;
                    const dateObj = new Date(e.date + "T00:00:00");
                    const dateLabel = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    });

                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedDate(e.date)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-violet-500/10 border-[#7C3AED]/50 shadow-xs"
                            : "bg-stone-50/50 dark:bg-[#1A1A22]/40 border-stone-100 dark:border-[#272732] hover:border-stone-200 dark:hover:border-[#383848]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            {dateLabel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {moodItem && (
                              <span className="text-[10px] font-semibold text-stone-400 dark:text-[#9090A0]">
                                {moodItem.label}
                              </span>
                            )}
                            <span className="text-sm" title={moodItem?.label || "Reflection"}>
                              {moodItem?.emoji || "📝"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-[#9090A0] line-clamp-2 leading-relaxed">
                          {e.content || "Empty reflection"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
