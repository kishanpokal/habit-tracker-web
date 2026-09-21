"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type HabitType = "boolean" | "numeric" | "negative";
export type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

export type Habit = {
  id: string;
  name: string;
  color: string;
  targetDays: number;
  reminderTime?: string | null;
  notes?: string;
  category?: string;
  isArchived?: boolean;
  timezone?: string;
  createdAt?: any;
  habitType?: HabitType;
  targetValue?: number;
  unit?: string;
  costPerDay?: number;
  timeOfDay?: TimeOfDay;
};

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "habits"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        color: doc.data().color || "#7C3AED",
        targetDays: doc.data().targetDays || 7,
        reminderTime: doc.data().reminderTime || null,
        notes: doc.data().notes || "",
        category: doc.data().category || "Other",
        isArchived: doc.data().isArchived || false,
        timezone: doc.data().timezone || "",
        createdAt: doc.data().createdAt,
        habitType: doc.data().habitType || "boolean",
        targetValue: doc.data().targetValue || 1,
        unit: doc.data().unit || "",
        costPerDay: doc.data().costPerDay || 0,
        timeOfDay: doc.data().timeOfDay || "anytime",
      }));
      setHabits(data.filter((h) => !h.isArchived));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { habits, loading };
}
