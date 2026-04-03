import type { MuscleKey, WorkoutPlanDay } from "@/lib/types";

function countWeightedMuscles(entries: Array<{ muscles: MuscleKey[]; weight: number }>) {
  return entries.reduce<Record<MuscleKey, number>>((accumulator, entry) => {
    for (const muscle of entry.muscles) {
      accumulator[muscle] = (accumulator[muscle] ?? 0) + entry.weight;
    }
    return accumulator;
  }, {} as Record<MuscleKey, number>);
}

function sortMusclesByWeight(counts: Record<MuscleKey, number>) {
  return Object.entries(counts)
    .sort((left, right) => {
      const weightDelta = right[1] - left[1];
      if (weightDelta !== 0) {
        return weightDelta;
      }

      return left[0].localeCompare(right[0]);
    })
    .map(([muscle]) => muscle as MuscleKey);
}

export function getWorkoutPreviewMuscleProfile(workout: WorkoutPlanDay) {
  const primaryCounts = countWeightedMuscles(
    workout.exercises.map((exercise) => ({
      muscles: exercise.primaryMuscles,
      weight: exercise.sets,
    })),
  );
  const orderedPrimary = sortMusclesByWeight(primaryCounts);
  const secondaryCounts = countWeightedMuscles(
    workout.exercises.map((exercise) => ({
      muscles: exercise.secondaryMuscles.filter((muscle) => !orderedPrimary.includes(muscle)),
      weight: Math.max(1, Math.round(exercise.sets / 2)),
    })),
  );

  return {
    primary: orderedPrimary.slice(0, 3),
    secondary: sortMusclesByWeight(secondaryCounts),
  };
}

export function getWorkoutPreviewTags(workout: WorkoutPlanDay) {
  return getWorkoutPreviewMuscleProfile(workout).primary.map((muscle) =>
    muscle
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (value) => value.toUpperCase())
      .trim(),
  );
}
