"use client";

import { useState } from "react";
import { X, Sparkles, FileText, Check } from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { soundFX } from "@/lib/soundEffects";

interface HabitNoteModalProps {
  habitId: string;
  habitName: string;
  date: string;
  initialNote?: string;
  onClose: () => void;
  onSaved: (note: string) => void;
}

export default function HabitNoteModal({
  habitId,
  habitName,
  date,
  initialNote = "",
  onClose,
  onSaved,
}: HabitNoteModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid, "habitLogs", `${habitId}_${date}`),
        {
          habitId,
          date,
          note: note.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      soundFX.playClick();
      onSaved(note.trim());
      onClose();
    } catch (err) {
      console.error("Failed to save habit note:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading leading-tight">Daily Micro-Reflection</h3>
              <p className="text-white/80 text-[11px] font-medium">{habitName} • {date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
              Quick Win, Observation, or Obstacle
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Felt energized, pushed through last 5 minutes, finished Chapter 3..."
              maxLength={240}
              className="w-full rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] p-3 text-xs sm:text-sm text-stone-900 dark:text-white outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all resize-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-stone-400 dark:text-[#9090A0]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#EAB308]" />
                Micro-reflections reinforce neural habits
              </span>
              <span>{note.length}/240</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-[#272732]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1A1A22] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Note"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
