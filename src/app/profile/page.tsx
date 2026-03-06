"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import {
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Camera, Mail, Shield, Key, User, LogOut, Trash2 } from "lucide-react";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else setDisplayName(user.displayName || "");
    }, [user, loading, router]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            setSaving(true);
            setMessage({ type: "", text: "" });
            await updateProfile(user, { displayName: displayName.trim() });
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (!currentPassword || !newPassword) {
            setMessage({ type: "error", text: "Please fill in all password fields" });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "New password must be at least 6 characters" });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        try {
            setChangingPassword(true);
            setMessage({ type: "", text: "" });

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setMessage({ type: "success", text: "Password changed successfully!" });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to change password" });
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading || !user) return null;

    const isEmailUser = user.providerData.some(p => p.providerId === "password");
    const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || "U";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100">
            <TopNav />

            <main className="pt-16 sm:pt-20 lg:pt-24 pb-24 lg:pb-12 px-3 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
                {/* Profile Header */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-32 relative">
                        <div className="absolute -bottom-12 left-6">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white dark:ring-[#111827]">
                                {userInitial.toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-6 px-6">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                            {user.displayName || user.email?.split("@")[0]}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                {user.emailVerified ? "Email verified" : "Email not verified"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {message.text && (
                    <div className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${message.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                        }`}>
                        {message.type === "success" ? "✓" : "⚠"} {message.text}
                    </div>
                )}

                {/* Display Name */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-base font-bold">Display Name</h2>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="flex-1 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                        />
                        <button onClick={handleUpdateProfile} disabled={saving}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                {/* Change Password (email users only) */}
                {isEmailUser && (
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-4 h-4 text-amber-500" />
                            <h2 className="text-base font-bold">Change Password</h2>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Current password"
                                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                            />
                            <input
                                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password (min 6 characters)"
                                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                            />
                            <input
                                type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                            />
                            <button onClick={handleChangePassword} disabled={changingPassword}
                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                            >
                                {changingPassword ? "Changing..." : "Change Password"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Account Info */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <h2 className="text-base font-bold">Account Details</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Sign-in method</span>
                            <span className="font-bold">{user.providerData[0]?.providerId === "google.com" ? "Google" : "Email/Password"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                            <span className="text-gray-500">Account created</span>
                            <span className="font-bold">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-500">Last sign-in</span>
                            <span className="font-bold">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
