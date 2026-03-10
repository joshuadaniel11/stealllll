import { Search } from "lucide-react";

import { Card } from "@/components/ui";
import type { ExerciseLibraryItem, MuscleGroup } from "@/lib/types";

export function LibraryScreen({
  query,
  onQueryChange,
  customExerciseName,
  customMuscleGroup,
  muscleOptions,
  filteredLibrary,
  onCustomExerciseNameChange,
  onCustomMuscleGroupChange,
  onAddCustomExercise,
  onOpenExercise,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  customExerciseName: string;
  customMuscleGroup: MuscleGroup;
  muscleOptions: MuscleGroup[];
  filteredLibrary: ExerciseLibraryItem[];
  onCustomExerciseNameChange: (value: string) => void;
  onCustomMuscleGroupChange: (value: MuscleGroup) => void;
  onAddCustomExercise: () => void;
  onOpenExercise: (id: string) => void;
}) {
  return (
    <>
      <Card>
        <p className="text-sm text-muted">Exercise library</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Fast, clean, searchable</h2>
        <label className="mt-4 flex items-center gap-3 rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
          <Search className="h-5 w-5 text-muted" />
          <input
            className="w-full bg-transparent outline-none placeholder:text-muted"
            placeholder="Search exercise or muscle group"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
      </Card>

      <Card>
        <p className="text-sm text-muted">Custom exercise</p>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-[20px] border border-stroke bg-white/50 px-4 py-4 outline-none placeholder:text-muted dark:bg-white/5"
            placeholder="Exercise name"
            value={customExerciseName}
            onChange={(event) => onCustomExerciseNameChange(event.target.value)}
          />
          <select
            className="w-full rounded-[20px] border border-stroke bg-white/50 px-4 py-4 outline-none dark:bg-white/5"
            value={customMuscleGroup}
            onChange={(event) => onCustomMuscleGroupChange(event.target.value as MuscleGroup)}
          >
            {muscleOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            className="w-full rounded-[20px] bg-accent px-4 py-4 font-semibold text-white"
            onClick={onAddCustomExercise}
          >
            Save Custom Exercise
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredLibrary.map((exercise) => (
          <button
            key={exercise.id}
            className="glass hairline w-full rounded-[26px] px-5 py-5 text-left shadow-card"
            onClick={() => onOpenExercise(exercise.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{exercise.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {exercise.muscleGroup} - {exercise.equipment}
                </p>
              </div>
              {exercise.isCustom && (
                <span className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">Custom</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
