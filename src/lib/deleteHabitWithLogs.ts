import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Deletes a habit AND all related habitLogs
 * Structure:
 * users/{uid}/habits/{habitId}
 * users/{uid}/habitLogs/{logId}
 */
export async function deleteHabitWithLogs(
  uid: string,
  habitId: string
) {
  if (!uid || !habitId) {
    throw new Error("Missing uid or habitId");
  }

  const batch = writeBatch(db);

  // 1️⃣ Delete habit document
  const habitRef = doc(db, "users", uid, "habits", habitId);
  batch.delete(habitRef);

  // 2️⃣ Find & delete all habitLogs linked to this habit
  const logsRef = collection(db, "users", uid, "habitLogs");

  // ✅ BEST PRACTICE: logs should contain habitId field
  const logsQuery = query(logsRef, where("habitId", "==", habitId));
  const logsSnap = await getDocs(logsQuery);

  logsSnap.forEach((logDoc) => {
    batch.delete(logDoc.ref);
  });

  await batch.commit();
}
