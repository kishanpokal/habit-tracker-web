import HabitList from "@/components/HabitList";

export default function HabitsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Habits
        </h1>
      </div>

      <p className="text-sm text-gray-500">
        Delete habits you no longer want to track.
      </p>

      <HabitList />
    </div>
  );
}
