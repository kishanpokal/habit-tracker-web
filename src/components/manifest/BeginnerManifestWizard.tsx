"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Heart,
  Target,
  Smile,
  Flame,
  Volume2,
} from "lucide-react";
import { soundFX } from "@/lib/soundEffects";

interface BeginnerManifestWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    affirmationText: string;
    category: "confidence" | "wealth" | "vitality" | "peace" | "mastery";
    visionTitle: string;
    visionDescription: string;
    visionImageUrl: string;
    visionHabit: string;
  }) => void;
}

type GoalPreset = {
  id: string;
  title: string;
  emoji: string;
  subtitle: string;
  category: "confidence" | "wealth" | "vitality" | "peace" | "mastery";
  affirmation: string;
  visionTitle: string;
  visionDesc: string;
  imageUrl: string;
  habit: string;
};

const PRESETS: GoalPreset[] = [
  {
    id: "vitality",
    title: "Wake Up Energized & Fit",
    emoji: "⚡",
    subtitle: "Vibrant health, natural vitality, and feeling strong in your body",
    category: "vitality",
    affirmation: "I am full of vibrant energy, healthy, and my body feels strong and alive every single day.",
    visionTitle: "Peak Physical Vitality",
    visionDesc: "Waking up refreshed, moving freely, and energized throughout the entire day.",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
    habit: "Drink 1 tall glass of water and stretch for 2 minutes upon waking",
  },
  {
    id: "wealth",
    title: "Financial Freedom & Growth",
    emoji: "💰",
    subtitle: "New income opportunities, abundance, and stress-free finances",
    category: "wealth",
    affirmation: "Abundance and high-value opportunities flow naturally to me as I deliver excellence.",
    visionTitle: "Financial Sovereignty & Peace",
    visionDesc: "Total clarity, effortless abundance, and freedom to live on my own terms.",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    habit: "Dedicate 15 minutes daily to building high-income skills or assets",
  },
  {
    id: "peace",
    title: "Peace of Mind & Calm",
    emoji: "🌊",
    subtitle: "No more overthinking, quiet confidence, and emotional balance",
    category: "peace",
    affirmation: "I am calm in the chaos, centered in my heart, and peaceful in my thoughts.",
    visionTitle: "Deep Inner Serenity",
    visionDesc: "Unshakeable poise, sound sleep, and letting go of all unnecessary worries.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    habit: "Take 3 slow, deep belly breaths before responding or starting work",
  },
  {
    id: "mastery",
    title: "Laser Focus & Discipline",
    emoji: "🎯",
    subtitle: "Crushing goals, stopping procrastination, and consistent progress",
    category: "mastery",
    affirmation: "I show up consistently; discipline is my superpower and compound growth is my reality.",
    visionTitle: "Unstoppable Daily Execution",
    visionDesc: "Deep flow state every day, making massive progress on what truly matters.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    habit: "Complete my top 1 priority task first thing in the morning",
  },
  {
    id: "confidence",
    title: "Unshakeable Self-Trust & Love",
    emoji: "🦁",
    subtitle: "Radiant confidence, speaking your truth, and deep self-worth",
    category: "confidence",
    affirmation: "I trust myself deeply, speak my truth with poise, and attract mutual respect.",
    visionTitle: "Quiet Unshakeable Confidence",
    visionDesc: "Standing tall, radiating warmth, and knowing my inherent worth in every room.",
    imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
    habit: "Look in the mirror every morning, smile, and say: 'I believe in you'",
  },
];

export default function BeginnerManifestWizard({
  isOpen,
  onClose,
  onComplete,
}: BeginnerManifestWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("vitality");
  const [isCustom, setIsCustom] = useState(false);
  const [customWish, setCustomWish] = useState("");

  // Step 2 Form state
  const [affirmationText, setAffirmationText] = useState(PRESETS[0].affirmation);
  const [visionTitle, setVisionTitle] = useState(PRESETS[0].visionTitle);
  const [visionDesc, setVisionDesc] = useState(PRESETS[0].visionDesc);
  const [visionImage, setVisionImage] = useState(PRESETS[0].imageUrl);
  const [visionHabit, setVisionHabit] = useState(PRESETS[0].habit);
  const [category, setCategory] = useState<GoalPreset["category"]>(PRESETS[0].category);

  // Step 3: Timer & Visualization
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Sync preset changes
  const applyPreset = (preset: GoalPreset) => {
    setSelectedPresetId(preset.id);
    setIsCustom(false);
    setAffirmationText(preset.affirmation);
    setVisionTitle(preset.visionTitle);
    setVisionDesc(preset.visionDesc);
    setVisionImage(preset.imageUrl);
    setVisionHabit(preset.habit);
    setCategory(preset.category);
    soundFX.playClick();
  };

  const applyCustom = () => {
    setIsCustom(true);
    const wish = customWish.trim() || "My Dream Life";
    setAffirmationText(`I am deeply grateful now that ${wish.toLowerCase()} is unfolding in my life.`);
    setVisionTitle(wish);
    setVisionDesc(`Experiencing the joy, relief, and gratitude of living: ${wish}`);
    setVisionImage("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80");
    setVisionHabit("Spend 5 minutes every day taking 1 concrete action towards this goal");
    setCategory("confidence");
    soundFX.playClick();
  };

  // Timer effect for step 3
  useEffect(() => {
    if (step === 3 && timerActive) {
      if (secondsLeft <= 0) {
        soundFX.playStepChime(5);
        setStep(4);
        setTimerActive(false);
        return;
      }
      const interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timerActive, secondsLeft]);

  // Restart timer when entering step 3
  const handleStartStep3 = () => {
    setSecondsLeft(30);
    setTimerActive(true);
    setStep(3);
    soundFX.playStepChime(2);
  };

  // Skip or early finish step 3
  const handleCompleteStep3 = () => {
    setTimerActive(false);
    soundFX.playStepChime(4);
    setStep(4);
  };

  // Final confirmation
  const handleFinalSave = () => {
    soundFX.playHyperspaceWarp();
    onComplete({
      affirmationText,
      category,
      visionTitle,
      visionDescription: visionDesc,
      visionImageUrl: visionImage,
      visionHabit,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Prompts for step 3 based on secondsLeft
  const getStep3Prompt = () => {
    if (secondsLeft > 24) return "Take a slow, deep breath in... and let your shoulders drop.";
    if (secondsLeft > 18) return "Imagine your wish has ALREADY come true today. How does that feel?";
    if (secondsLeft > 12) return "Notice the warm relief and gentle smile on your face.";
    if (secondsLeft > 6) return "Feel genuine gratitude in your chest: 'It is done. Thank you.'";
    return "Softly open your eyes. You have anchored this reality in your mind.";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Progress Bar */}
          <div className="bg-stone-100 dark:bg-[#1A1A22] h-1.5 w-full">
            <div
              className="bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EAB308] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-[#20202C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-500/15 text-[#7C3AED] font-black text-xs flex items-center justify-center">
                {step}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-[#9090A0]">
                Step {step} of 4:{" "}
                {step === 1 && "Choose Your Desire"}
                {step === 2 && "Review Your Blueprint"}
                {step === 3 && "30-Second Feeling Exercise"}
                {step === 4 && "Anchor & Lock It In"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto space-y-5 custom-scrollbar">
            {/* ━━━ STEP 1: PICK A DESIRE ━━━ */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-stone-900 dark:text-white">
                    What would you love to attract?
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-[#9090A0] mt-1">
                    Pick whatever feels most exciting or important right now. There are no wrong answers!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESETS.map((p) => {
                    const isSelected = !isCustom && selectedPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3 relative ${
                          isSelected
                            ? "border-[#7C3AED] bg-violet-500/10 ring-2 ring-[#7C3AED]/30 dark:border-[#7C3AED]"
                            : "border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#16161E] hover:border-[#7C3AED]/50"
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-white">{p.title}</h4>
                          <p className="text-[11px] text-stone-500 dark:text-[#9090A0] leading-snug">
                            {p.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input toggle */}
                <div
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    isCustom
                      ? "border-[#7C3AED] bg-violet-500/10 ring-2 ring-[#7C3AED]/30"
                      : "border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#16161E]"
                  }`}
                >
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => applyCustom()}>
                    <span className="text-xl">✨</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white">
                      Or type your own custom goal
                    </span>
                  </div>
                  <input
                    value={customWish}
                    onFocus={() => applyCustom()}
                    onChange={(e) => {
                      setCustomWish(e.target.value);
                      setIsCustom(true);
                      const wish = e.target.value.trim() || "My Dream Life";
                      setAffirmationText(`I am deeply grateful now that ${wish.toLowerCase()} is unfolding in my life.`);
                      setVisionTitle(wish);
                      setVisionDesc(`Living and enjoying: ${wish}`);
                    }}
                    placeholder="e.g., Passing my driving test with ease, landing a dream client, or buying my first car"
                    className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#7C3AED] text-stone-900 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      soundFX.playStepChime(1);
                      setStep(2);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next: View Your Manifestation Blueprint</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ━━━ STEP 2: REVIEW BLUEPRINT ━━━ */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-stone-900 dark:text-white">
                    Here is your 3-Part Blueprint
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-[#9090A0] mt-1">
                    We automatically created your affirmation, vision picture, and daily micro-habit. You can edit any of them!
                  </p>
                </div>

                {/* 1. Affirmation */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                      1. Your Daily Affirmation
                    </span>
                    <span className="text-[10px] text-stone-400">(Say this once a day)</span>
                  </div>
                  <textarea
                    value={affirmationText}
                    onChange={(e) => setAffirmationText(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#1A1A22] p-3 text-xs sm:text-sm font-bold outline-none focus:border-[#7C3AED] text-stone-900 dark:text-white resize-none"
                  />
                </div>

                {/* 2. Vision Picture */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] space-y-2">
                  <span className="text-xs font-bold text-[#EAB308] uppercase tracking-wider block">
                    2. Your Visual Anchor
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0">
                      <img src={visionImage} alt={visionTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        value={visionTitle}
                        onChange={(e) => setVisionTitle(e.target.value)}
                        placeholder="Vision Title"
                        className="w-full text-xs sm:text-sm font-bold bg-transparent outline-none border-b border-stone-200 dark:border-[#272732] pb-1 text-stone-900 dark:text-white"
                      />
                      <input
                        value={visionDesc}
                        onChange={(e) => setVisionDesc(e.target.value)}
                        placeholder="Short description"
                        className="w-full text-[11px] text-stone-500 dark:text-[#9090A0] bg-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Daily Action Bridge */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      3. The Action Bridge (1 Micro-Habit)
                    </span>
                    <span className="text-[10px] text-stone-400">(The secret ingredient!)</span>
                  </div>
                  <input
                    value={visionHabit}
                    onChange={(e) => setVisionHabit(e.target.value)}
                    placeholder="e.g., 2 minute morning stretch"
                    className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-white dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm font-medium outline-none focus:border-[#7C3AED] text-stone-900 dark:text-white"
                  />
                  <p className="text-[11px] text-stone-400 dark:text-[#9090A0]">
                    This tiny physical action convinces your brain that you are serious and actively moving towards your goal.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-stone-200 dark:border-[#272732] rounded-2xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#1A1A22] flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleStartStep3}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next: 30-Second Feeling Exercise</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ━━━ STEP 3: 30-SECOND GUIDED IMMERSION ━━━ */}
            {step === 3 && (
              <div className="text-center space-y-6 py-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#EAB308]">
                    The Secret Ingredient
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-stone-900 dark:text-white mt-1">
                    Feel It For 30 Seconds
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-[#9090A0] max-w-sm mx-auto mt-1">
                    Manifestation works through emotion. When you feel the relief of having it, your brain starts treating it as real.
                  </p>
                </div>

                {/* Breathing & Timer Circle */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  {/* Outer pulse */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/20 via-amber-500/20 to-violet-500/10 animate-ping duration-[3000ms]" />
                  <div className="absolute inset-2 rounded-full border border-violet-500/30 dark:border-violet-500/20 animate-pulse duration-[2000ms]" />

                  {/* Center Circle */}
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#CA8A04] flex flex-col items-center justify-center text-white shadow-xl shadow-violet-500/30 relative z-10">
                    <span className="text-4xl font-black font-heading">{secondsLeft}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">Seconds</span>
                  </div>
                </div>

                {/* Guided Prompts */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] max-w-md mx-auto">
                  <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 leading-relaxed transition-all">
                    &ldquo;{getStep3Prompt()}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleCompleteStep3}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-white"
                  >
                    I Feel It (Skip Timer ➔)
                  </button>
                </div>
              </div>
            )}

            {/* ━━━ STEP 4: CELEBRATION & 1-CLICK SAVE ━━━ */}
            {step === 4 && (
              <div className="text-center space-y-6 py-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                  <Check className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-heading text-stone-900 dark:text-white">
                    🎉 You Just Did It!
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                    See? Manifestation isn&apos;t hard at all. You just gave your brain a crystal-clear target, generated positive feeling, and linked a tiny daily action.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-left max-w-md mx-auto space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-[#7C3AED] dark:text-[#EAB308] block">
                    What We&apos;re Saving For You:
                  </span>
                  <div className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span><strong>Daily Affirmation:</strong> &ldquo;{affirmationText.slice(0, 45)}...&rdquo;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span><strong>Vision Board Card:</strong> {visionTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span><strong>Micro-Habit:</strong> {visionHabit}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinalSave}
                  className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EAB308] text-white rounded-2xl text-sm font-black shadow-xl shadow-violet-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#FACC15]" />
                  <span>Lock It In & Open My Sanctuary</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
