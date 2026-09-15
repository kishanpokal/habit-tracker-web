"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Compass,
  Zap,
  Share2,
} from "lucide-react";
import { soundFX } from "@/lib/soundEffects";
import { useToast } from "@/components/Toast";

interface ManifestationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWizard: () => void;
}

export default function ManifestationGuideModal({
  isOpen,
  onClose,
  onOpenWizard,
}: ManifestationGuideModalProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"basics" | "myths" | "share">("basics");

  if (!isOpen) return null;

  const friendMessage = `Hey! Here is how manifestation actually works in 3 super simple steps (no weird magic, just science & focus!):

1. Clear Target: Pick ONE thing you want clearly (e.g., waking up fit & energized, landing a better job, or passing your exams).
2. Feel It for 30 Seconds: Imagine how relieved, proud, and happy you'll feel when it's done. Just 30 seconds a day signals your brain it's real!
3. The Action Bridge: Do 1 tiny daily habit that moves you 1% closer (drink 1 water glass, write 1 line, or do 1 pushup).

You DO NOT need to be positive 24/7, and you don't need complicated rituals. If you can daydream and take 1 tiny step, you can manifest! ✨`;

  const copyForFriend = () => {
    navigator.clipboard.writeText(friendMessage);
    setCopied(true);
    soundFX.playClick();
    addToast("success", "Copied to clipboard! Send this to your friend 💬");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-600/10 via-amber-500/10 to-violet-600/5 border-b border-stone-200/80 dark:border-[#272732] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#EAB308] flex items-center justify-center text-white shadow-md shadow-violet-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#EAB308]">
                  Zero Jargon • Beginner Friendly
                </span>
                <h2 className="text-lg sm:text-xl font-black font-heading text-stone-900 dark:text-white">
                  Manifestation Explained in 60 Seconds
                </h2>
                <p className="text-xs text-stone-500 dark:text-[#9090A0] mt-0.5">
                  Why it is NOT hard, how it actually works, and how anyone can do it.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#1A1A22] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-stone-100 dark:border-[#20202C] px-5 sm:px-6 gap-2 pt-3">
            {[
              { key: "basics", label: "The 3-Step Formula", icon: Compass },
              { key: "myths", label: "3 Common Myths", icon: AlertCircle },
              { key: "share", label: "Text Your Friend", icon: Share2 },
            ].map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any);
                    soundFX.playClick();
                  }}
                  className={`flex items-center gap-2 pb-3 px-2 text-xs font-bold border-b-2 transition-all ${
                    active
                      ? "border-[#7C3AED] text-[#7C3AED] dark:text-white"
                      : "border-transparent text-stone-400 dark:text-[#9090A0] hover:text-stone-700 dark:hover:text-stone-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
            {/* TAB 1: THE BASICS */}
            {activeTab === "basics" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-stone-800 dark:text-stone-200 text-xs sm:text-sm leading-relaxed">
                  <span className="font-bold text-amber-700 dark:text-[#FACC15]">💡 What is it really?</span>
                  <p className="mt-1">
                    Manifestation is simply <strong>turning a thought into reality</strong>. You already do it daily: when you think &ldquo;I want coffee&rdquo;, you stand up, brew it, and drink it. For bigger goals (fitness, money, confidence), you follow the exact same 3 steps:
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-xl bg-violet-500/15 text-[#7C3AED] flex items-center justify-center font-black text-xs flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        Clear Target (Tell Your Brain What You Want)
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-[#9090A0] mt-1 leading-relaxed">
                        Your brain is like Google Maps: if you type &ldquo;somewhere nice&rdquo;, it gets confused. But if you type &ldquo;wake up full of energy at 7am&rdquo;, it has a clear destination to work towards.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-[#EAB308] flex items-center justify-center font-black text-xs flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        Feel It for 30 Seconds (Expectation & Belief)
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-[#9090A0] mt-1 leading-relaxed">
                        Once a day, close your eyes for just 30 seconds. Imagine how relieved and proud you will feel when your goal is reached. This calms your nervous system and teaches your brain to stop doubting yourself.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#16161E] border border-stone-200/80 dark:border-[#272732] flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        The Action Bridge (1 Micro-Habit Daily)
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-[#9090A0] mt-1 leading-relaxed">
                        Wishing without action is just daydreaming. You do <strong>1 tiny step</strong> every day (drink 1 glass of water, read 2 pages, or send 1 message). The action builds confidence and turns your dream into physical reality.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWizard();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-[#EAB308]" />
                    <span>Try It Right Now (1-Minute Quickstart Wizard)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MYTHS */}
            {activeTab === "myths" && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#16161E] space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                    <X className="w-4 h-4" />
                    <span>Myth 1: &ldquo;I have to be 100% positive all day or it fails.&rdquo;</span>
                  </div>
                  <div className="flex items-start gap-2 text-stone-700 dark:text-stone-300 text-xs pl-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Truth:</strong> Nobody is positive 24/7. Doubts, sadness, and bad moods are completely normal. Spending just <strong>30 to 60 seconds a day</strong> focusing on your dream is more than enough to re-direct your life.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#16161E] space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                    <X className="w-4 h-4" />
                    <span>Myth 2: &ldquo;It&apos;s magic. A bag of money will fall through my roof.&rdquo;</span>
                  </div>
                  <div className="flex items-start gap-2 text-stone-700 dark:text-stone-300 text-xs pl-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Truth:</strong> Manifestation doesn&apos;t magically drop things on your couch. It tunes your brain&apos;s natural filter so you suddenly spot great opportunities, helpful people, and creative ideas that you were ignoring before.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-[#272732] bg-stone-50 dark:bg-[#16161E] space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                    <X className="w-4 h-4" />
                    <span>Myth 3: &ldquo;It requires weird frequencies and complicated rituals.&rdquo;</span>
                  </div>
                  <div className="flex items-start gap-2 text-stone-700 dark:text-stone-300 text-xs pl-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Truth:</strong> Techniques like writing things down (3-6-9) or making vision boards are simply fun games to keep your goal in mind. If you can daydream and write 1 line, you can do it!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SHARE WITH A FRIEND */}
            {activeTab === "share" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-stone-700 dark:text-stone-300">
                  <span className="font-bold text-[#7C3AED] dark:text-[#C084FC]">
                    Share this with your friend right now!
                  </span>{" "}
                  It explains everything in plain English with zero confusion:
                </div>

                <div className="relative p-4 rounded-2xl bg-stone-900 text-stone-200 font-sans text-xs leading-relaxed border border-stone-800 whitespace-pre-line shadow-inner">
                  {friendMessage}
                </div>

                <button
                  onClick={copyForFriend}
                  className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 shadow-violet-500/25"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Text Message for My Friend</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-stone-50 dark:bg-[#16161E] border-t border-stone-100 dark:border-[#20202C] flex items-center justify-between text-xs text-stone-500 dark:text-[#9090A0]">
            <span>Keep it simple. Trust yourself.</span>
            <button
              onClick={onClose}
              className="font-bold text-stone-800 dark:text-stone-200 hover:underline"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
