"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Trash2, Download, Info, Shield, Bell, Palette } from "lucide-react";
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
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100">
            <TopNav />
            <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-5">
                <h1 className="text-2xl font-black">Settings</h1>

                {/* Appearance */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-bold">Appearance</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
                            { key: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
                            { key: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setTheme(opt.key)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === opt.key
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                {opt.icon}
                                <span className="text-xs font-bold">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* About */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-bold">About HabitFlow</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Version</span>
                            <span className="font-bold">2.0.0</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Framework</span>
                            <span className="font-bold">Next.js 16 + React 19</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Database</span>
                            <span className="font-bold">Firebase Firestore</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Authentication</span>
                            <span className="font-bold">Firebase Auth</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Charts</span>
                            <span className="font-bold">Recharts</span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-sm font-bold">Features</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Habit Tracking", "Streak Tracking", "Advanced Analytics", "50 Badges",
                            "Focus Timer", "Dark Mode", "CSV Export", "PDF Export",
                            "Custom Categories", "Profile Management", "PWA Support", "Responsive Design",
                        ].map(f => (
                            <span key={f} className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-red-200 dark:border-red-900/30 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <h2 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {showDeleteConfirm ? (
                        <div className="flex gap-3">
                            <button onClick={handleDeleteAccount} disabled={deleting}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Yes, Delete My Account"}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2.5 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            Delete Account
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
