"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo, useCallback } from "react";
import TopNav from "@/components/TopNav";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { soundFX } from "@/lib/soundEffects";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Eye,
  Heart,
  Calendar,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Compass,
  ArrowRight,
  Bookmark,
  Sun,
  Moon,
  CloudSun,
  Check,
  RotateCcw,
  Zap,
  Target,
  PenTool,
  ShieldAlert,
  Copy,
  ExternalLink,
} from "lucide-react";

/* ─── Types & Definitions ─── */

type Affirmation = {
  id: string;
  text: string;
  category: "confidence" | "wealth" | "vitality" | "peace" | "mastery";
  lastPracticedDate?: string;
  practiceCount: number;
  streak: number;
  createdAt?: any;
};

type ScriptEntry = {
  id: string;
  title: string;
  dateAnchor: string;
  sensoryAnchor: string;
  content: string;
  createdAt?: any;
};

type VisionCard = {
  id: string;
  title: string;
  category: "wealth" | "vitality" | "mastery" | "lifestyle" | "relationships";
  description: string;
  imageUrl: string;
  linkedHabitText?: string;
  createdAt?: any;
};

type GratitudeEntry = {
  id: string;
  date: string;
  type: "gratitude" | "evidence";
  items?: string[];
  evidenceNote?: string;
  evidenceCategory?: string;
  createdAt?: any;
};

type ThreeSixNineData = {
  intention: string;
  startDate: string;
  currentDay: number;
  logs: Record<
    string,
    {
      morning: number;
      afternoon: number;
      evening: number;
      completed: boolean;
    }
  >;
};

/* ─── Curated Presets ─── */

const AFFIRMATION_PRESETS = [
  { text: "I have the courage, focus, and grit to create extraordinary results.", category: "confidence" as const },
  { text: "Financial abundance flows naturally into my life through service, value, and excellence.", category: "wealth" as const },
  { text: "My body is strong, resilient, energized, and healing at peak vitality every single day.", category: "vitality" as const },
  { text: "I am calm in the chaos, centered in my purpose, and unshakeable in my direction.", category: "peace" as const },
  { text: "I show up consistently; discipline is my superpower and compound growth is my reality.", category: "mastery" as const },
  { text: "Every obstacle I encounter is cognitive training designed to elevate my baseline.", category: "mastery" as const },
  { text: "I attract high-integrity collaborators, deep friendships, and reciprocal respect.", category: "confidence" as const },
  { text: "I execute effortlessly because my daily actions are completely aligned with my highest vision.", category: "wealth" as const },
];

const SCRIPTING_PROMPTS = [
  "A Day in My Dream Life 1 Year From Today: Walk through waking up, your environment, and your accomplishments.",
  "Looking Back on My Biggest Milestone: Write the journal entry the evening your most ambitious goal became reality.",
  "Unstoppable Baseline: Describe how your body feels, how your mind operates, and how you handle challenges with poise.",
  "The Letter from Future-Me: Write advice, gratitude, and reassurance from the person you are becoming 5 years out.",
];

const VISION_PRESET_IMAGES = [
  { label: "Modern Sanctuary", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" },
  { label: "High Performance Workspace", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" },
  { label: "Peak Mountain Horizon", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80" },
  { label: "Calm Oceanic Freedom", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { label: "Athletic Vitality", url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80" },
  { label: "Quiet Library Wisdom", url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80" },
];

const CATEGORY_COLORS: Record<string, { label: string; gradient: string; tag: string }> = {
  confidence: { label: "Confidence", gradient: "from-[#7C3AED] to-[#A855F7]", tag: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  wealth: { label: "Abundance", gradient: "from-[#EAB308] to-[#CA8A04]", tag: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  vitality: { label: "Vitality", gradient: "from-emerald-500 to-teal-600", tag: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  peace: { label: "Peace & Flow", gradient: "from-blue-500 to-indigo-600", tag: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  mastery: { label: "Mastery", gradient: "from-[#CA8A04] to-[#7C3AED]", tag: "bg-purple-500/15 text-purple-600 dark:text-purple-300" },
  lifestyle: { label: "Lifestyle", gradient: "from-pink-500 to-rose-600", tag: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  relationships: { label: "Connection", gradient: "from-fuchsia-500 to-pink-500", tag: "bg-pink-500/15 text-pink-600 dark:text-pink-300" },
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ManifestPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState<"affirmations" | "scripting" | "vision" | "gratitude" | "369">("affirmations");
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());
  const [permissionError, setPermissionError] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Affirmations
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [showAddAffirmation, setShowAddAffirmation] = useState(false);
  const [newAffText, setNewAffText] = useState("");
  const [newAffCat, setNewAffCat] = useState<Affirmation["category"]>("confidence");
  const [affFilter, setAffFilter] = useState("all");

  // Scripting
  const [scripts, setScripts] = useState<ScriptEntry[]>([]);
  const [showAddScript, setShowAddScript] = useState(false);
  const [newScriptTitle, setNewScriptTitle] = useState("");
  const [newScriptDateAnchor, setNewScriptDateAnchor] = useState("");
  const [newScriptSensory, setNewScriptSensory] = useState("Grounded, Victorious & Deeply Grateful");
  const [newScriptContent, setNewScriptContent] = useState("");
  const [selectedScriptPrompt, setSelectedScriptPrompt] = useState(0);

  // Vision Board
  const [visionCards, setVisionCards] = useState<VisionCard[]>([]);
  const [showAddVision, setShowAddVision] = useState(false);
  const [newVisionTitle, setNewVisionTitle] = useState("");
  const [newVisionDesc, setNewVisionDesc] = useState("");
  const [newVisionCat, setNewVisionCat] = useState<VisionCard["category"]>("wealth");
  const [newVisionImage, setNewVisionImage] = useState(VISION_PRESET_IMAGES[0].url);
  const [newVisionHabit, setNewVisionHabit] = useState("");
  const [activeImmerseCard, setActiveImmerseCard] = useState<VisionCard | null>(null);

  // Gratitude & Evidence
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceCategory, setEvidenceCategory] = useState("Synchronicity");

  // 369 Ritual
  const [threeSixNine, setThreeSixNine] = useState<ThreeSixNineData>({
    intention: "I am grateful now that boundless health, financial clarity, and deep focus flow naturally into my daily life.",
    startDate: getTodayString(),
    currentDay: 1,
    logs: {},
  });
  const [editing369Intention, setEditing369Intention] = useState(false);
  const [temp369Intention, setTemp369Intention] = useState("");

  const [loading, setLoading] = useState(true);

  const todayStr = getTodayString();

  /* ─── Audio Helper ─── */
  const toggleAudio = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    addToast("info", muted ? "Audio feedback muted" : "Audio feedback active");
  };

  /* ─── LocalStorage Persistence Fallback ─── */
  const saveLocal = useCallback((key: string, data: any) => {
    if (typeof window === "undefined" || !user) return;
    try {
      localStorage.setItem(`manifest_${user.uid}_${key}`, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }, [user]);

  const loadLocal = useCallback(<T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined" || !user) return fallback;
    try {
      const stored = localStorage.getItem(`manifest_${user.uid}_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }, [user]);

  /* ─── Real-Time Firestore Sync with Graceful Fallback ─── */
  useEffect(() => {
    if (!user) return;

    // First, load from localStorage to ensure instant rendering without blank screen
    const localAff = loadLocal<Affirmation[]>("affirmations", []);
    const localScripts = loadLocal<ScriptEntry[]>("scripts", []);
    const localVision = loadLocal<VisionCard[]>("vision", []);
    const localGrat = loadLocal<GratitudeEntry[]>("gratitude", []);
    const local369 = loadLocal<ThreeSixNineData>("369", {
      intention: "I am grateful now that boundless health, financial clarity, and deep focus flow naturally into my daily life.",
      startDate: getTodayString(),
      currentDay: 1,
      logs: {},
    });

    if (localAff.length) setAffirmations(localAff);
    if (localScripts.length) setScripts(localScripts);
    if (localVision.length) setVisionCards(localVision);
    if (localGrat.length) setGratitudeEntries(localGrat);
    if (local369) setThreeSixNine(local369);

    let hasPermError = false;
    const handleSnapshotError = (error: any) => {
      if (error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions")) {
        if (!hasPermError) {
          hasPermError = true;
          setPermissionError(true);
        }
      }
      setLoading(false);
    };

    // 1. Affirmations
    const affQuery = query(collection(db, "users", user.uid, "manifest_affirmations"), orderBy("createdAt", "desc"));
    const unsubAff = onSnapshot(
      affQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Affirmation));
        setAffirmations(items);
        saveLocal("affirmations", items);
        setPermissionError(false);
      },
      handleSnapshotError
    );

    // 2. Scripts
    const scriptQuery = query(collection(db, "users", user.uid, "manifest_scripts"), orderBy("createdAt", "desc"));
    const unsubScript = onSnapshot(
      scriptQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScriptEntry));
        setScripts(items);
        saveLocal("scripts", items);
      },
      handleSnapshotError
    );

    // 3. Vision Cards
    const visionQuery = query(collection(db, "users", user.uid, "manifest_vision"), orderBy("createdAt", "desc"));
    const unsubVision = onSnapshot(
      visionQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VisionCard));
        setVisionCards(items);
        saveLocal("vision", items);
      },
      handleSnapshotError
    );

    // 4. Gratitude & Evidence
    const gratQuery = query(collection(db, "users", user.uid, "manifest_gratitude"), orderBy("createdAt", "desc"));
    const unsubGrat = onSnapshot(
      gratQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GratitudeEntry));
        setGratitudeEntries(items);
        saveLocal("gratitude", items);
      },
      handleSnapshotError
    );

    // 5. 369 Ritual Doc
    const metaRef = doc(db, "users", user.uid, "manifest_meta", "369");
    const unsub369 = onSnapshot(
      metaRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ThreeSixNineData;
          const parsed = {
            intention: data.intention || "I am grateful now that boundless health, financial clarity, and deep focus flow naturally into my daily life.",
            startDate: data.startDate || getTodayString(),
            currentDay: data.currentDay || 1,
            logs: data.logs || {},
          };
          setThreeSixNine(parsed);
          saveLocal("369", parsed);
        }
        setLoading(false);
      },
      handleSnapshotError
    );

    // Safety timeout to ensure loading screen resolves
    const timer = setTimeout(() => setLoading(false), 800);

    return () => {
      clearTimeout(timer);
      unsubAff();
      unsubScript();
      unsubVision();
      unsubGrat();
      unsub369();
    };
  }, [user, loadLocal, saveLocal]);

  /* ─── Metric Calculations ─── */
  const stats = useMemo(() => {
    let completedTechniques = 0;
    const practicedAffirmationToday = affirmations.some((a) => a.lastPracticedDate === todayStr);
    if (practicedAffirmationToday) completedTechniques += 1;

    const scriptedToday = scripts.some((s) => {
      if (!s.createdAt) return false;
      const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return d.toISOString().split("T")[0] === todayStr;
    });
    if (scriptedToday) completedTechniques += 1;

    const gratitudeToday = gratitudeEntries.some((g) => g.type === "gratitude" && g.date === todayStr);
    if (gratitudeToday) completedTechniques += 1;

    const log369 = threeSixNine.logs[todayStr];
    const total369 = (log369?.morning || 0) + (log369?.afternoon || 0) + (log369?.evening || 0);
    if (total369 > 0) completedTechniques += 1;

    const totalProofs = gratitudeEntries.filter((g) => g.type === "evidence").length;

    return {
      completedTechniques,
      totalPractices: affirmations.reduce((acc, a) => acc + (a.practiceCount || 0), 0),
      totalProofs,
      has369Completed: total369 >= 18,
    };
  }, [affirmations, scripts, gratitudeEntries, threeSixNine, todayStr]);

  /* ─── Affirmation Actions ─── */
  const handleAddAffirmation = async () => {
    if (!user || !newAffText.trim()) return;
    const newItem: Affirmation = {
      id: "aff_" + Date.now(),
      text: newAffText.trim(),
      category: newAffCat,
      lastPracticedDate: "",
      practiceCount: 0,
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    // Immediate optimistic local update
    const updated = [newItem, ...affirmations];
    setAffirmations(updated);
    saveLocal("affirmations", updated);
    setNewAffText("");
    setShowAddAffirmation(false);
    soundFX.playStepChime(1);
    addToast("success", "Affirmation anchored to your subconscious!");

    try {
      await addDoc(collection(db, "users", user.uid, "manifest_affirmations"), {
        text: newItem.text,
        category: newItem.category,
        lastPracticedDate: "",
        practiceCount: 0,
        streak: 0,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Already saved locally
    }
  };

  const handleChargeAffirmation = async (aff: Affirmation) => {
    if (!user) return;
    const isTodayAlready = aff.lastPracticedDate === todayStr;
    const newStreak = isTodayAlready ? aff.streak : (aff.streak || 0) + 1;
    const newCount = (aff.practiceCount || 0) + 1;

    const updated = affirmations.map((a) =>
      a.id === aff.id
        ? { ...a, lastPracticedDate: todayStr, practiceCount: newCount, streak: newStreak }
        : a
    );
    setAffirmations(updated);
    saveLocal("affirmations", updated);

    soundFX.playStepChime(Math.min(newStreak, 5));
    addToast("success", `Charged! Practiced ${newCount} times (🔥 ${newStreak} day streak)`);

    try {
      if (!aff.id.startsWith("aff_")) {
        await updateDoc(doc(db, "users", user.uid, "manifest_affirmations", aff.id), {
          lastPracticedDate: todayStr,
          practiceCount: newCount,
          streak: newStreak,
        });
      }
    } catch {
      // Saved in localStorage
    }
  };

  const handleDeleteAffirmation = async (id: string) => {
    if (!user) return;
    const updated = affirmations.filter((a) => a.id !== id);
    setAffirmations(updated);
    saveLocal("affirmations", updated);
    addToast("info", "Affirmation removed");

    try {
      if (!id.startsWith("aff_")) {
        await deleteDoc(doc(db, "users", user.uid, "manifest_affirmations", id));
      }
    } catch {
      // Handled locally
    }
  };

  /* ─── Scripting Actions ─── */
  const handleAddScript = async () => {
    if (!user || !newScriptTitle.trim() || !newScriptContent.trim()) {
      addToast("error", "Please include a title and description of your future reality");
      return;
    }

    const newItem: ScriptEntry = {
      id: "script_" + Date.now(),
      title: newScriptTitle.trim(),
      dateAnchor: newScriptDateAnchor.trim() || "In the Fulfilled Future",
      sensoryAnchor: newScriptSensory.trim(),
      content: newScriptContent.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...scripts];
    setScripts(updated);
    saveLocal("scripts", updated);

    setNewScriptTitle("");
    setNewScriptDateAnchor("");
    setNewScriptContent("");
    setShowAddScript(false);
    soundFX.playHyperspaceWarp();
    addToast("success", "✨ Future Memory sealed into your neural landscape!");

    try {
      await addDoc(collection(db, "users", user.uid, "manifest_scripts"), {
        title: newItem.title,
        dateAnchor: newItem.dateAnchor,
        sensoryAnchor: newItem.sensoryAnchor,
        content: newItem.content,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Saved in localStorage
    }
  };

  const handleDeleteScript = async (id: string) => {
    if (!user) return;
    const updated = scripts.filter((s) => s.id !== id);
    setScripts(updated);
    saveLocal("scripts", updated);
    addToast("info", "Script entry removed");

    try {
      if (!id.startsWith("script_")) {
        await deleteDoc(doc(db, "users", user.uid, "manifest_scripts", id));
      }
    } catch {
      // Handled locally
    }
  };

  /* ─── Vision Board Actions ─── */
  const handleAddVision = async () => {
    if (!user || !newVisionTitle.trim()) return;

    const newItem: VisionCard = {
      id: "vision_" + Date.now(),
      title: newVisionTitle.trim(),
      category: newVisionCat,
      description: newVisionDesc.trim(),
      imageUrl: newVisionImage.trim() || VISION_PRESET_IMAGES[0].url,
      linkedHabitText: newVisionHabit.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...visionCards];
    setVisionCards(updated);
    saveLocal("vision", updated);

    setNewVisionTitle("");
    setNewVisionDesc("");
    setNewVisionHabit("");
    setShowAddVision(false);
    soundFX.playStepChime(2);
    addToast("success", "Vision card placed in your sanctuary!");

    try {
      await addDoc(collection(db, "users", user.uid, "manifest_vision"), {
        title: newItem.title,
        category: newItem.category,
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        linkedHabitText: newItem.linkedHabitText,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Handled locally
    }
  };

  const handleDeleteVision = async (id: string) => {
    if (!user) return;
    const updated = visionCards.filter((v) => v.id !== id);
    setVisionCards(updated);
    saveLocal("vision", updated);
    addToast("info", "Vision card removed");

    try {
      if (!id.startsWith("vision_")) {
        await deleteDoc(doc(db, "users", user.uid, "manifest_vision", id));
      }
    } catch {
      // Handled locally
    }
  };

  /* ─── Gratitude & Evidence Actions ─── */
  const handleSaveGratitude = async () => {
    if (!user) return;
    const items = [gratitude1.trim(), gratitude2.trim(), gratitude3.trim()].filter(Boolean);
    if (items.length === 0) {
      addToast("error", "Please write at least one gratitude reflection");
      return;
    }

    const newItem: GratitudeEntry = {
      id: "grat_" + Date.now(),
      date: todayStr,
      type: "gratitude",
      items,
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...gratitudeEntries];
    setGratitudeEntries(updated);
    saveLocal("gratitude", updated);

    setGratitude1("");
    setGratitude2("");
    setGratitude3("");
    soundFX.playStepChime(3);
    addToast("success", "🙏 Daily Gratitude anchored! Your mind is tuned to abundance.");

    try {
      await addDoc(collection(db, "users", user.uid, "manifest_gratitude"), {
        date: todayStr,
        type: "gratitude",
        items,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Handled locally
    }
  };

  const handleSaveEvidence = async () => {
    if (!user || !evidenceNote.trim()) return;

    const newItem: GratitudeEntry = {
      id: "evid_" + Date.now(),
      date: todayStr,
      type: "evidence",
      evidenceNote: evidenceNote.trim(),
      evidenceCategory,
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...gratitudeEntries];
    setGratitudeEntries(updated);
    saveLocal("gratitude", updated);

    setEvidenceNote("");
    soundFX.playStepChime(4);
    addToast("success", "✨ Synchronicity logged! RAS confirmation bias reinforced.");

    try {
      await addDoc(collection(db, "users", user.uid, "manifest_gratitude"), {
        date: todayStr,
        type: "evidence",
        evidenceNote: newItem.evidenceNote,
        evidenceCategory,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Handled locally
    }
  };

  const handleDeleteGratitudeEntry = async (id: string) => {
    if (!user) return;
    const updated = gratitudeEntries.filter((g) => g.id !== id);
    setGratitudeEntries(updated);
    saveLocal("gratitude", updated);
    addToast("info", "Entry removed");

    try {
      if (!id.startsWith("grat_") && !id.startsWith("evid_")) {
        await deleteDoc(doc(db, "users", user.uid, "manifest_gratitude", id));
      }
    } catch {
      // Handled locally
    }
  };

  /* ─── 369 Ritual Actions ─── */
  const handleUpdate369Log = async (slot: "morning" | "afternoon" | "evening", max: number) => {
    if (!user) return;
    const todayLogs = threeSixNine.logs[todayStr] || { morning: 0, afternoon: 0, evening: 0, completed: false };
    const currentVal = todayLogs[slot] || 0;
    const nextVal = currentVal >= max ? 0 : currentVal + 1;

    const updatedSlotLog = {
      ...todayLogs,
      [slot]: nextVal,
    };

    const isDone = updatedSlotLog.morning >= 3 && updatedSlotLog.afternoon >= 6 && updatedSlotLog.evening >= 9;
    updatedSlotLog.completed = isDone;

    const newLogs = {
      ...threeSixNine.logs,
      [todayStr]: updatedSlotLog,
    };

    const updated369: ThreeSixNineData = {
      ...threeSixNine,
      logs: newLogs,
    };

    setThreeSixNine(updated369);
    saveLocal("369", updated369);
    soundFX.playClick();

    if (isDone && !todayLogs.completed) {
      soundFX.playHyperspaceWarp();
      addToast("success", "🎉 3-6-9 Ritual 100% complete for today! Intention locked into the cosmos.");
    }

    try {
      await setDoc(
        doc(db, "users", user.uid, "manifest_meta", "369"),
        {
          intention: threeSixNine.intention,
          startDate: threeSixNine.startDate,
          currentDay: threeSixNine.currentDay,
          logs: newLogs,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Handled locally
    }
  };

  const handleSave369Intention = async () => {
    if (!user || !temp369Intention.trim()) return;

    const updated369: ThreeSixNineData = {
      ...threeSixNine,
      intention: temp369Intention.trim(),
    };

    setThreeSixNine(updated369);
    saveLocal("369", updated369);
    setEditing369Intention(false);
    soundFX.playStepChime(2);
    addToast("success", "Chief Aim & Intention calibrated!");

    try {
      await setDoc(
        doc(db, "users", user.uid, "manifest_meta", "369"),
        {
          intention: temp369Intention.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Handled locally
    }
  };

  const copyRuleSnippet = () => {
    const code = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;
    navigator.clipboard.writeText(code);
    addToast("success", "Firestore rule copied to clipboard!");
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  const today369 = threeSixNine.logs[todayStr] || { morning: 0, afternoon: 0, evening: 0, completed: false };
  const totalToday369Reps = (today369.morning || 0) + (today369.afternoon || 0) + (today369.evening || 0);

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-stone-900 dark:text-white selection:bg-violet-500/20">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        {/* ━━━━━ FIREBASE SECURITY RULE BANNER (If permissions not yet published) ━━━━━ */}
        {permissionError && (
          <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-[#EAB308] mt-0.5 sm:mt-0 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Firebase Security Rules Update Required for Cloud Sync</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-[#EAB308]">
                    Local Storage Active
                  </span>
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Your Manifestation entries are safely saved on this device. To sync with Firebase across devices, paste the updated security rule in your Firebase Console.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={() => setShowRuleModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-[#EAB308] font-bold text-xs transition-all"
              >
                <span>View 1-Click Fix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ━━━━━ HERO / BANNER ━━━━━ */}
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#EAB308] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-violet-500/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#EAB308]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>Neuro-Priming & Mindset Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight leading-tight">
                Manifestation Sanctuary
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">
                Rewire your Reticular Activating System (RAS) through daily affirmations, future memory scripting, 
                visual sensory anchoring, and the Tesla 3-6-9 frequency ritual.
              </p>
            </div>

            {/* Quick Ritual Progress Badge & Audio Toggle */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold text-white/75 uppercase tracking-wider block">Today&apos;s Alignment</span>
                <span className="text-xl sm:text-2xl font-black font-heading text-white">
                  {stats.completedTechniques}/5 <span className="text-xs font-normal text-white/80">Techniques</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  title={isMuted ? "Unmute audio" : "Mute audio"}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#EAB308]" />}
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAB308]/20 text-[#FACC15] font-bold text-xs rounded-xl border border-[#EAB308]/30">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{stats.totalProofs} Proofs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━ TAB NAVIGATION ━━━━━ */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { key: "affirmations", label: "Affirmations", icon: Sparkles, count: affirmations.length },
            { key: "scripting", label: "Future Scripting", icon: PenTool, count: scripts.length },
            { key: "vision", label: "Vision Board", icon: Target, count: visionCards.length },
            { key: "gratitude", label: "Gratitude & Proofs", icon: Heart, count: gratitudeEntries.length },
            { key: "369", label: "3-6-9 Ritual", icon: Zap, count: `${totalToday369Reps}/18` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  soundFX.playClick();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                  isActive
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-violet-500/25"
                    : "bg-white dark:bg-[#121218] border border-stone-200/80 dark:border-[#272732] text-stone-600 dark:text-[#9090A0] hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#EAB308]" : ""}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ━━━━━ TAB 1: AFFIRMATIONS ━━━━━ */}
        {activeTab === "affirmations" && (
          <div className="space-y-5">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121218] p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732]">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {["all", "confidence", "wealth", "vitality", "peace", "mastery"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setAffFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                      affFilter === c
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-[#1A1A22] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddAffirmation(!showAddAffirmation)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Affirmation</span>
              </button>
            </div>

            {/* Add Affirmation Drawer */}
            {showAddAffirmation && (
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Anchor New Identity Statement</h3>
                  <button onClick={() => setShowAddAffirmation(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pre-built Prompt Picker */}
                <div>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1.5 block">
                    Or select from curated neuro-linguistic bank:
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {AFFIRMATION_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewAffText(p.text);
                          setNewAffCat(p.category);
                        }}
                        className="text-left text-xs p-2.5 rounded-xl border border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] hover:border-[#7C3AED] transition-colors flex-shrink-0 max-w-[240px]"
                      >
                        <span className="text-[10px] font-bold text-[#7C3AED] uppercase block mb-1">{p.category}</span>
                        <p className="line-clamp-2 text-stone-700 dark:text-stone-300">&ldquo;{p.text}&rdquo;</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Affirmation (First-person present tense: &ldquo;I am...&rdquo; or &ldquo;I possess...&rdquo;)
                    </label>
                    <textarea
                      value={newAffText}
                      onChange={(e) => setNewAffText(e.target.value)}
                      placeholder="e.g., I effortlessly sustain extraordinary focus and clarity in all my endeavors."
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] p-3 text-xs sm:text-sm font-medium outline-none focus:border-[#7C3AED] resize-none min-h-[70px] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                        Category
                      </label>
                      <select
                        value={newAffCat}
                        onChange={(e) => setNewAffCat(e.target.value as any)}
                        className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs outline-none font-bold text-stone-800 dark:text-stone-200"
                      >
                        <option value="confidence">🦁 Confidence & Self-Trust</option>
                        <option value="wealth">💰 Abundance & Wealth</option>
                        <option value="vitality">⚡ Peak Vitality & Health</option>
                        <option value="peace">🌊 Peace & Inner Flow</option>
                        <option value="mastery">🎯 Discipline & Mastery</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleAddAffirmation}
                        className="flex-1 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs transition-all"
                      >
                        Save Affirmation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Affirmation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affirmations
                .filter((a) => (affFilter === "all" ? true : a.category === affFilter))
                .map((aff) => {
                  const practicedToday = aff.lastPracticedDate === todayStr;
                  const catData = CATEGORY_COLORS[aff.category] || CATEGORY_COLORS.confidence;

                  return (
                    <motion.div
                      key={aff.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative bg-white dark:bg-[#121218] rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                        practicedToday
                          ? "border-[#EAB308]/60 ring-1 ring-[#EAB308]/30 dark:border-[#EAB308]/40"
                          : "border-stone-200/80 dark:border-[#272732] hover:border-[#7C3AED]/40"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${catData.tag}`}>
                            {catData.label}
                          </span>
                          <button
                            onClick={() => handleDeleteAffirmation(aff.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-relaxed">
                          &ldquo;{aff.text}&rdquo;
                        </p>
                      </div>

                      <div className="pt-5 flex items-center justify-between border-t border-stone-100 dark:border-[#1E1E28] mt-4">
                        <div className="flex items-center gap-3 text-[11px] font-bold text-stone-500 dark:text-[#9090A0]">
                          <span className="flex items-center gap-1">
                            <Flame className={`w-3.5 h-3.5 ${aff.streak > 0 ? "text-[#EAB308]" : "text-stone-300"}`} />
                            {aff.streak || 0}d streak
                          </span>
                          <span>•</span>
                          <span>{aff.practiceCount || 0} times spoken</span>
                        </div>

                        <button
                          onClick={() => handleChargeAffirmation(aff)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            practicedToday
                              ? "bg-amber-500/15 text-[#EAB308] border border-[#EAB308]/30 hover:bg-amber-500/25"
                              : "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-xs hover:opacity-95"
                          }`}
                        >
                          {practicedToday ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308]" />
                              <span>Anchored</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Speak & Charge</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {affirmations.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-8">
                <Sparkles className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No affirmations anchored yet</h3>
                <p className="text-xs text-stone-400 dark:text-[#9090A0] max-w-sm mx-auto mt-1">
                  Begin by adding statements that describe the identity, mindset, and abundance you are consciously embodying.
                </p>
                <button
                  onClick={() => setShowAddAffirmation(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold"
                >
                  Load or Write Affirmation
                </button>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━ TAB 2: FUTURE SCRIPTING ━━━━━ */}
        {activeTab === "scripting" && (
          <div className="space-y-5">
            {/* Header & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121218] p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732]">
              <div>
                <h2 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Living In The End (Narrative Priming)</h2>
                <p className="text-xs text-stone-500 dark:text-[#9090A0]">
                  Write as if your outcome has already been achieved. Flood your writing with sensory details and gratitude.
                </p>
              </div>

              <button
                onClick={() => setShowAddScript(!showAddScript)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Script</span>
              </button>
            </div>

            {/* Script Writing Form */}
            {showAddScript && (
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Compose Future Memory</h3>
                  <button onClick={() => setShowAddScript(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Prompt Carousel */}
                <div className="bg-stone-50 dark:bg-[#1A1A22] p-3 rounded-xl border border-stone-200/80 dark:border-[#272732]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">Suggested Exploration Prompt</span>
                    <button
                      type="button"
                      onClick={() => setSelectedScriptPrompt((prev) => (prev + 1) % SCRIPTING_PROMPTS.length)}
                      className="text-[10px] font-bold text-[#EAB308] hover:underline"
                    >
                      Cycle Prompt ↻
                    </button>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                    &ldquo;{SCRIPTING_PROMPTS[selectedScriptPrompt]}&rdquo;
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                        Title / Theme of this Reality
                      </label>
                      <input
                        value={newScriptTitle}
                        onChange={(e) => setNewScriptTitle(e.target.value)}
                        placeholder="e.g., The Launch of My Global Platform"
                        className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm font-bold outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                        Target Date Anchor
                      </label>
                      <input
                        value={newScriptDateAnchor}
                        onChange={(e) => setNewScriptDateAnchor(e.target.value)}
                        placeholder="e.g., December 31, 2026"
                        className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Dominant Emotional / Somatic State
                    </label>
                    <input
                      value={newScriptSensory}
                      onChange={(e) => setNewScriptSensory(e.target.value)}
                      placeholder="e.g., Serene Calm, Boundless Joy, Peaceful Mastery"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Script Content (Present / Past Tense — Describe what you see, hear, and feel)
                    </label>
                    <textarea
                      value={newScriptContent}
                      onChange={(e) => setNewScriptContent(e.target.value)}
                      rows={6}
                      placeholder="I am sitting at my desk watching the morning sunlight filter through the window. It is done. The discipline we built over the last 12 months paid compounding dividends..."
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] p-3 text-xs sm:text-sm font-medium outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddScript}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs transition-all"
                    >
                      Seal Future Memory
                    </button>
                    <button
                      onClick={() => setShowAddScript(false)}
                      className="px-4 py-2.5 border border-stone-200 dark:border-[#272732] rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#1A1A22]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scripts Feed */}
            <div className="space-y-4">
              {scripts.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-bold font-heading text-stone-900 dark:text-white">{sc.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-[#EAB308]">
                          {sc.dateAnchor}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-stone-400 dark:text-[#9090A0]">
                        Somatic feeling: <span className="text-stone-700 dark:text-stone-300 font-bold">{sc.sensoryAnchor}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteScript(sc.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1A1A22] border border-stone-200/60 dark:border-[#272732] text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed font-sans">
                    {sc.content}
                  </div>
                </div>
              ))}

              {scripts.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-8">
                  <PenTool className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No future memories scripted yet</h3>
                  <p className="text-xs text-stone-400 dark:text-[#9090A0] max-w-sm mx-auto mt-1">
                    Scripting converts distant ambiguous goals into vivid episodic memory traces, lowering cognitive resistance.
                  </p>
                  <button
                    onClick={() => setShowAddScript(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold"
                  >
                    Write Your First Script
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━ TAB 3: VISION SANCTUARY ━━━━━ */}
        {activeTab === "vision" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121218] p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732]">
              <div>
                <h2 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Sensory Vision Gallery</h2>
                <p className="text-xs text-stone-500 dark:text-[#9090A0]">
                  Visual affective priming. Train your Reticular Activating System (RAS) through repeated visual engagement.
                </p>
              </div>

              <button
                onClick={() => setShowAddVision(!showAddVision)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vision Card</span>
              </button>
            </div>

            {/* Add Vision Modal / Drawer */}
            {showAddVision && (
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Curate New Vision Card</h3>
                  <button onClick={() => setShowAddVision(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                        Vision Title / Anchor
                      </label>
                      <input
                        value={newVisionTitle}
                        onChange={(e) => setNewVisionTitle(e.target.value)}
                        placeholder="e.g., Sovereign Remote Lifestyle"
                        className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm font-bold outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                        Category Quadrant
                      </label>
                      <select
                        value={newVisionCat}
                        onChange={(e) => setNewVisionCat(e.target.value as any)}
                        className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs outline-none font-bold text-stone-800 dark:text-stone-200"
                      >
                        <option value="wealth">🚀 Wealth & Empire</option>
                        <option value="vitality">🌿 Vitality & Longevity</option>
                        <option value="mastery">📚 Craft & Mastery</option>
                        <option value="lifestyle">🏝️ Freedom & Adventure</option>
                        <option value="relationships">💫 Love & Reciprocity</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Affirmation / Core Essence
                    </label>
                    <input
                      value={newVisionDesc}
                      onChange={(e) => setNewVisionDesc(e.target.value)}
                      placeholder="e.g., Owning 100% of my time, generating high impact effortlessly"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Choose Curated Backdrop or Custom Image URL
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                      {VISION_PRESET_IMAGES.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewVisionImage(img.url)}
                          className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            newVisionImage === img.url ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30 scale-95" : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      value={newVisionImage}
                      onChange={(e) => setNewVisionImage(e.target.value)}
                      placeholder="Custom Image URL (https://...)"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-1.5 text-xs outline-none text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      Linked Daily Habit (The Action Bridge)
                    </label>
                    <input
                      value={newVisionHabit}
                      onChange={(e) => setNewVisionHabit(e.target.value)}
                      placeholder="e.g., 90m Deep Work Block before noon"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddVision}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs transition-all"
                    >
                      Anchor to Vision Board
                    </button>
                    <button
                      onClick={() => setShowAddVision(false)}
                      className="px-4 py-2.5 border border-stone-200 dark:border-[#272732] rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#1A1A22]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vision Masonry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visionCards.map((card) => {
                const catData = CATEGORY_COLORS[card.category] || CATEGORY_COLORS.wealth;

                return (
                  <div
                    key={card.id}
                    className="group relative rounded-2xl overflow-hidden border border-stone-200/80 dark:border-[#272732] shadow-sm bg-white dark:bg-[#121218] flex flex-col justify-between"
                  >
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-900">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      <div className="absolute top-3 left-3">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md backdrop-blur-md ${catData.tag}`}>
                          {catData.label}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button
                          onClick={() => setActiveImmerseCard(card)}
                          title="Full-Screen Focus Meditation"
                          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVision(card.id)}
                          className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/80 text-white backdrop-blur-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-base font-bold font-heading leading-snug drop-shadow-sm">{card.title}</h3>
                        {card.description && (
                          <p className="text-xs text-stone-200 line-clamp-2 mt-0.5 font-medium drop-shadow-xs">
                            &ldquo;{card.description}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {card.linkedHabitText && (
                      <div className="p-3 bg-stone-50 dark:bg-[#16161E] border-t border-stone-100 dark:border-[#272732] flex items-center gap-2 text-[11px] font-bold text-stone-600 dark:text-stone-300">
                        <Zap className="w-3.5 h-3.5 text-[#EAB308] flex-shrink-0" />
                        <span className="truncate">Habit: {card.linkedHabitText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {visionCards.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-8">
                <Target className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">Your Vision Canvas is open</h3>
                <p className="text-xs text-stone-400 dark:text-[#9090A0] max-w-sm mx-auto mt-1">
                  Surround yourself with evocative visual beacons representing your life quadrants.
                </p>
                <button
                  onClick={() => setShowAddVision(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold"
                >
                  Create Vision Card
                </button>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━ TAB 4: GRATITUDE & RAS EVIDENCE LEDGER ━━━━━ */}
        {activeTab === "gratitude" && (
          <div className="space-y-6">
            {/* Top Explanation Card */}
            <div className="bg-white dark:bg-[#121218] p-5 rounded-2xl border border-stone-200/80 dark:border-[#272732] space-y-1">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#EAB308]" />
                <h2 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Gratitude & Evidence Logging</h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-[#9090A0]">
                Gratitude conditions dopamine and calm receptivity. The Synchronicity Ledger activates confirmation bias in your favor, proving your reality is aligning.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily 3 Gratitudes Section */}
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#EAB308]" />
                    <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Daily 3 Gratitudes</h3>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0]">{todayStr}</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      1. Subtle win or blessing from past 24h
                    </label>
                    <input
                      value={gratitude1}
                      onChange={(e) => setGratitude1(e.target.value)}
                      placeholder="e.g., Deep uninterrupted sleep and delicious morning coffee"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      2. Someone in your corner you appreciate
                    </label>
                    <input
                      value={gratitude2}
                      onChange={(e) => setGratitude2(e.target.value)}
                      placeholder="e.g., A friend who checked in or a trusted mentor"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      3. Pre-Gratitude: A future outcome you appreciate now
                    </label>
                    <input
                      value={gratitude3}
                      onChange={(e) => setGratitude3(e.target.value)}
                      placeholder="e.g., Grateful in advance for reaching my consistency milestone this month"
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <button
                    onClick={handleSaveGratitude}
                    className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs transition-all mt-2"
                  >
                    Anchor Daily Gratitudes
                  </button>
                </div>
              </div>

              {/* Synchronicity & Proof Ledger Section */}
              <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <h3 className="text-sm font-bold font-heading text-stone-900 dark:text-white">Synchronicity & Evidence Log</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-[#7C3AED] dark:text-[#C084FC]">
                    {stats.totalProofs} Proofs Logged
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 dark:text-[#9090A0] uppercase tracking-wider mb-1 block">
                      I noticed evidence today that...
                    </label>
                    <textarea
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      placeholder="e.g., A client messaged out of nowhere right after I wrote my financial intention!"
                      rows={3}
                      className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] p-3 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={evidenceCategory}
                      onChange={(e) => setEvidenceCategory(e.target.value)}
                      className="rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] px-3 py-2 text-xs font-bold outline-none text-stone-800 dark:text-stone-200"
                    >
                      <option value="Synchronicity">✨ Synchronicity</option>
                      <option value="Micro-Win">🏆 Micro-Win</option>
                      <option value="Alignment">🎯 Unexpected Alignment</option>
                      <option value="Manifested Reality">💎 Direct Manifestation</option>
                    </select>

                    <button
                      onClick={handleSaveEvidence}
                      className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Log Proof
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gratitude & Evidence History Feed */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-[#9090A0]">
                Recent Mindset & Evidence Archive
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {gratitudeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            entry.type === "gratitude"
                              ? "bg-amber-500/15 text-[#EAB308]"
                              : "bg-violet-500/15 text-[#7C3AED] dark:text-[#C084FC]"
                          }`}
                        >
                          {entry.type === "gratitude" ? "🙏 Daily Gratitude" : `✨ ${entry.evidenceCategory || "Proof"}`}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">{entry.date}</span>
                          <button
                            onClick={() => handleDeleteGratitudeEntry(entry.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {entry.type === "gratitude" && entry.items && (
                        <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 font-medium">
                          {entry.items.map((it, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#EAB308] font-bold">•</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {entry.type === "evidence" && entry.evidenceNote && (
                        <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-medium italic">
                          &ldquo;{entry.evidenceNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━ TAB 5: 3-6-9 RITUAL ━━━━━ */}
        {activeTab === "369" && (
          <div className="space-y-6">
            {/* Intention Hero Card */}
            <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#EAB308]" />
                  <h2 className="text-sm font-bold font-heading text-stone-900 dark:text-white">
                    Nikola Tesla 3-6-9 Frequency Method
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-[#1A1A22] text-stone-600 dark:text-stone-300">
                    Cycle Day #{threeSixNine.currentDay}
                  </span>
                  <button
                    onClick={() => {
                      setTemp369Intention(threeSixNine.intention);
                      setEditing369Intention(!editing369Intention);
                    }}
                    className="text-xs font-bold text-[#7C3AED] dark:text-[#EAB308] hover:underline"
                  >
                    {editing369Intention ? "Close" : "Edit Aim"}
                  </button>
                </div>
              </div>

              {editing369Intention ? (
                <div className="space-y-2">
                  <textarea
                    value={temp369Intention}
                    onChange={(e) => setTemp369Intention(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] p-3 text-xs sm:text-sm font-bold outline-none focus:border-[#7C3AED] text-stone-800 dark:text-stone-200"
                  />
                  <button
                    onClick={handleSave369Intention}
                    className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold"
                  >
                    Save Chief Intention
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-amber-500/10 to-violet-500/5 border border-violet-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#EAB308] block mb-1">
                    Your Definitive Chief Aim
                  </span>
                  <p className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-relaxed">
                    &ldquo;{threeSixNine.intention}&rdquo;
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-stone-500 dark:text-[#9090A0]">
                  <span>Today&apos;s Repetitions</span>
                  <span className="text-[#7C3AED] dark:text-[#EAB308] font-black">{totalToday369Reps} / 18</span>
                </div>
                <div className="h-2.5 bg-stone-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EAB308] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min((totalToday369Reps / 18) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3 Repetition Stations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Morning (3x) */}
              <div
                className={`bg-white dark:bg-[#121218] rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  today369.morning >= 3 ? "border-amber-500/50 bg-amber-500/5" : "border-stone-200/80 dark:border-[#272732]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#EAB308]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        1. Morning
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#EAB308]">{today369.morning || 0} / 3</span>
                  </div>

                  <p className="text-[11px] text-stone-400 dark:text-[#9090A0]">
                    Capture the hypnopompic waking state. Write or recite your intention 3 times.
                  </p>

                  <div className="flex items-center justify-center gap-2 py-3">
                    {[1, 2, 3].map((num) => (
                      <div
                        key={num}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                          (today369.morning || 0) >= num
                            ? "bg-[#EAB308] text-white shadow-xs"
                            : "bg-stone-100 dark:bg-[#1A1A22] text-stone-400"
                        }`}
                      >
                        {(today369.morning || 0) >= num ? <Check className="w-4 h-4" /> : num}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUpdate369Log("morning", 3)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    today369.morning >= 3
                      ? "bg-amber-500/15 text-[#EAB308] border border-[#EAB308]/30"
                      : "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                  }`}
                >
                  {today369.morning >= 3 ? "Morning Complete (Reset ↺)" : "+ Log Morning Repetition"}
                </button>
              </div>

              {/* Afternoon (6x) */}
              <div
                className={`bg-white dark:bg-[#121218] rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  today369.afternoon >= 6 ? "border-violet-500/50 bg-violet-500/5" : "border-stone-200/80 dark:border-[#272732]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-[#7C3AED]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        2. Afternoon
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#7C3AED]">{today369.afternoon || 0} / 6</span>
                  </div>

                  <p className="text-[11px] text-stone-400 dark:text-[#9090A0]">
                    Midday cognitive refocus. Resynchronize your mind with your outcome 6 times.
                  </p>

                  <div className="grid grid-cols-6 gap-1.5 py-3">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <div
                        key={num}
                        className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                          (today369.afternoon || 0) >= num
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "bg-stone-100 dark:bg-[#1A1A22] text-stone-400"
                        }`}
                      >
                        {(today369.afternoon || 0) >= num ? <Check className="w-3.5 h-3.5" /> : num}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUpdate369Log("afternoon", 6)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    today369.afternoon >= 6
                      ? "bg-violet-500/15 text-[#7C3AED] border border-violet-500/30"
                      : "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                  }`}
                >
                  {today369.afternoon >= 6 ? "Afternoon Complete (Reset ↺)" : "+ Log Afternoon Repetition"}
                </button>
              </div>

              {/* Evening (9x) */}
              <div
                className={`bg-white dark:bg-[#121218] rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  today369.evening >= 9 ? "border-amber-500/50 bg-amber-500/5" : "border-stone-200/80 dark:border-[#272732]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#CA8A04]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        3. Evening
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#EAB308]">{today369.evening || 0} / 9</span>
                  </div>

                  <p className="text-[11px] text-stone-400 dark:text-[#9090A0]">
                    Subconscious hypnagogic seeding before sleep. Solidify your reality 9 times.
                  </p>

                  <div className="grid grid-cols-5 gap-1.5 py-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <div
                        key={num}
                        className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                          (today369.evening || 0) >= num
                            ? "bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white shadow-xs"
                            : "bg-stone-100 dark:bg-[#1A1A22] text-stone-400"
                        }`}
                      >
                        {(today369.evening || 0) >= num ? <Check className="w-3 h-3" /> : num}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUpdate369Log("evening", 9)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    today369.evening >= 9
                      ? "bg-amber-500/15 text-[#EAB308] border border-[#EAB308]/30"
                      : "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                  }`}
                >
                  {today369.evening >= 9 ? "Evening Complete (Reset ↺)" : "+ Log Evening Repetition"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ━━━━━ FULL-SCREEN IMMERSE MODAL (VISION MEDITATION) ━━━━━ */}
      <AnimatePresence>
        {activeImmerseCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setActiveImmerseCard(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 max-h-[60vh] aspect-video">
                <img
                  src={activeImmerseCard.imageUrl}
                  alt={activeImmerseCard.title}
                  className="w-full h-full object-cover animate-pulse duration-[4000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#EAB308] block mb-1">
                    Vision Focus Anchor
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-heading">{activeImmerseCard.title}</h2>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg sm:text-xl font-medium text-stone-200 italic max-w-xl mx-auto">
                  &ldquo;{activeImmerseCard.description || activeImmerseCard.title}&rdquo;
                </p>
                <p className="text-xs text-stone-400">
                  Take three deep belly breaths. Feel this reality in your nervous system right now.
                </p>
              </div>

              <button
                onClick={() => {
                  soundFX.playStepChime(3);
                  setActiveImmerseCard(null);
                  addToast("success", "Sensory anchor integrated!");
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#EAB308] text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-500/30"
              >
                Complete Visual Meditation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━━━ 1-CLICK FIREBASE RULES FIX MODAL ━━━━━ */}
      <AnimatePresence>
        {showRuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white">
                  <ShieldAlert className="w-5 h-5 text-[#EAB308]" />
                  <h3 className="text-base font-bold font-heading">Firebase Rules Setup (2 min)</h3>
                </div>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                By default, your Firebase Firestore rules only whitelist `/habits`, `/goals`, and `/journal`. 
                Adding the recursive wildcard <code className="text-[#7C3AED] dark:text-[#C084FC] font-bold">match /{`{allPaths=**}`}</code> allows all current and future subcollections for each authenticated user.
              </p>

              <div className="relative rounded-2xl bg-stone-950 p-4 font-mono text-[11px] text-stone-200 overflow-x-auto">
                <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}</pre>
                <button
                  onClick={copyRuleSnippet}
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                <p className="font-bold text-stone-800 dark:text-stone-200">How to apply:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Open <strong className="text-stone-800 dark:text-stone-200">Firebase Console</strong> &rarr; Your Project &rarr; <strong className="text-stone-800 dark:text-stone-200">Firestore Database</strong>.</li>
                  <li>Click the <strong className="text-stone-800 dark:text-stone-200">Rules</strong> tab at the top.</li>
                  <li>Replace with the snippet above and click <strong className="text-[#7C3AED] dark:text-[#EAB308]">Publish</strong>.</li>
                </ol>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold"
                >
                  Got It, Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
