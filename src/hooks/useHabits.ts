"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type Habit = {
  id: string;
  name: string;
  color: string;
  targetDays: number;
  reminderTime: string | null;
  notes: string;
  isArchived: boolean;
  createdAt?: any;
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

    const habitsRef = collection(db, "users", user.uid, "habits");

    const q = query(habitsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Habit[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Habit, "id">),
        }));

        setHabits(list);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch habits:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    habits,
    loading,
  };
}
