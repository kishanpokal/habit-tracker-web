"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Trash2, Info, Shield, Palette } from "lucide-react";
import { useState } from "react";
import { deleteUser } from "firebase/auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      await deleteUser(user);
      router.replace("/landing");
    } catch (err: any) {
      alert("Please sign out and sign back in before deleting your account (re-authentication required).");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-slate-900 dark:text-white selection:bg-[#7C3AED]/20">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-black font-heading tracking-tight">App Preferences</h1>

        {/* Appearance Mode */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-sm font-bold">Theme & Appearance</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light", label: "Luminous Canvas", icon: <Sun className="w-5 h-5 text-[#EAB308]" /> },
              { key: "dark", label: "Obsidian Void", icon: <Moon className="w-5 h-5 text-[#7C3AED]" /> },
              { key: "system", label: "System Sync", icon: <Monitor className="w-5 h-5 text-[#9090A0]" /> },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  theme === opt.key
                    ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] shadow-xs"
                    : "border-stone-200 dark:border-[#272732] hover:border-stone-300 dark:hover:border-stone-700 text-slate-600 dark:text-[#9090A0]"
                }`}
              >
                {opt.icon}
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Capabilities */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#EAB308]" />
            <h2 className="text-sm font-bold">Included Ecosystem Modules</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "Habit Matrix", "Streak Counter", "Consistency Index", "60 Badges",
              "Focus Clock", "Reflection Journal", "Milestone Targets", "Data Export",
              "PWA Offline Ready", "Zero Latency",
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1A22] text-xs font-bold text-slate-600 dark:text-slate-300 border border-stone-200/60 dark:border-[#272732]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* About App */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-sm font-bold">App Specification</h2>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-[#272732]">
            <span className="text-slate-500 dark:text-[#9090A0]">Release Version</span>
            <span className="font-bold text-[#7C3AED]">HabitFlow 5.0 (Royal Amethyst & Gilded Gold)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-[#272732]">
            <span className="text-slate-500 dark:text-[#9090A0]">Engine</span>
            <span className="font-bold">Next.js 16 App Router + React 19</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 dark:text-[#9090A0]">Cloud Storage</span>
            <span className="font-bold">Firebase Cloud Firestore</span>
          </div>
        </div>

        {/* Account Deletion Area */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-[#272732] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#EAB308]" />
            <h2 className="text-sm font-bold text-[#EAB308]">Danger Zone</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9090A0]">
            Permanently delete your account and all associated habit check-ins and journal entries.
          </p>
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-colors disabled:opacity-50 shadow-md shadow-violet-500/20"
              >
                {deleting ? "Deleting account..." : "Confirm Account Deletion"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-stone-200 dark:border-[#272732] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-[#EAB308]/40 text-[#EAB308] hover:bg-[#EAB308]/10 rounded-xl text-xs font-bold transition-colors"
            >
              Delete My Account
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
