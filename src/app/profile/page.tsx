"use client";

import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/hooks/useHabits";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Shield, Key, User, CheckCircle2, AlertCircle, SlidersHorizontal, ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { habits } = useHabits();
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

  const isEmailUser = user.providerData.some((p) => p.providerId === "password");
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || "U";

  return (
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0B0B0F] text-slate-900 dark:text-white selection:bg-[#7C3AED]/20">
      <TopNav />

      <main className="pt-16 sm:pt-20 lg:pt-22 pb-32 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-[#121218] rounded-3xl border border-stone-200/80 dark:border-[#272732] overflow-hidden shadow-xs">
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] h-28 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#EAB308] flex items-center justify-center text-white text-2xl font-black font-heading shadow-xl ring-4 ring-white dark:ring-[#121218]">
                {userInitial.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pt-14 pb-6 px-6">
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
              {user.displayName || user.email?.split("@")[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-[#9090A0]">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-[11px] text-[#EAB308] font-bold">
                {user.emailVerified ? "Email verified" : "Email pending verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {message.text && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-purple-50 dark:bg-[#7C3AED]/10 border-purple-200 dark:border-[#7C3AED]/30 text-purple-700 dark:text-[#A855F7]"
                : "bg-yellow-50 dark:bg-[#EAB308]/10 border-yellow-200 dark:border-[#EAB308]/30 text-yellow-700 dark:text-[#EAB308]"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Display Name Box */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-sm font-bold">Profile Identity</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="flex-1 rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
            />
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white rounded-xl font-black text-xs shadow-md shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Identity"}
            </button>
          </div>
        </div>

        {/* Habit Management Hub */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
              <h2 className="text-sm font-bold">Habit Management</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-[#9090A0]">
              {habits.length} {habits.length === 1 ? "routine" : "routines"} configured
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9090A0]">
            Review your complete habit registry, reconfigure target frequencies, customize theme accents, or manage existing routines.
          </p>

          {habits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {habits.slice(0, 6).map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#1A1A22] border border-stone-200/60 dark:border-[#272732] text-[11px] font-bold text-slate-700 dark:text-slate-300"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                  <span className="truncate max-w-[120px]">{h.name}</span>
                </span>
              ))}
              {habits.length > 6 && (
                <span className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-[#9090A0] self-center">
                  +{habits.length - 6} more
                </span>
              )}
            </div>
          )}

          <div className="pt-1">
            <Link
              href="/habits"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:brightness-110 text-white rounded-xl font-bold text-xs shadow-md shadow-violet-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Access & Manage Habit List</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Password Security */}
        {isEmailUser && (
          <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#EAB308]" />
              <h2 className="text-sm font-bold">Security Credentials</h2>
            </div>
            <div className="space-y-2.5">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-slate-50 dark:bg-[#1A1A22] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#7C3AED]"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-2.5 bg-[#1A1A22] hover:bg-[#272732] text-white rounded-xl font-bold text-xs border border-[#272732] transition-all active:scale-95 disabled:opacity-50"
              >
                {changingPassword ? "Updating password..." : "Update Password"}
              </button>
            </div>
          </div>
        )}

        {/* Account Details Overview */}
        <div className="bg-white dark:bg-[#121218] rounded-2xl border border-stone-200/80 dark:border-[#272732] p-5 shadow-xs space-y-2.5 text-xs text-slate-900 dark:text-white">
          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-[#272732]">
            <span className="text-slate-500 dark:text-[#9090A0]">Sign-in Provider</span>
            <span className="font-bold">{user.providerData[0]?.providerId === "google.com" ? "Google" : "Email & Password"}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-[#272732]">
            <span className="text-slate-500 dark:text-[#9090A0]">Account Created</span>
            <span className="font-bold">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500 dark:text-[#9090A0]">Last Sign-in</span>
            <span className="font-bold">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
