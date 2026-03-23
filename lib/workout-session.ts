import type { ActiveWorkout, WorkoutPlanDay, WorkoutSession } from "@/lib/types";
import type { SessionSummary } from "@/components/session-summary-modal";

export function countLoggedSets(exercises: ActiveWorkout["exercises"] | WorkoutSession["exercises"]) {
  return exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length,
    0,
  );
}

export function buildCompletedSession(
  activeWorkout: ActiveWorkout,
  options: {
    durationMinutes: number;
    feeling: WorkoutSession["feeling"];
    partial?: boolean;
  },
): WorkoutSession {
  return {
    id: `session-${Date.now()}`,
    userId: activeWorkout.userId,
    workoutDayId: activeWorkout.workoutDayId,
    workoutName: options.partial ? `${activeWorkout.workoutName} (Partial)` : activeWorkout.workoutName,
    performedAt: new Date().toISOString(),
    durationMinutes: options.durationMinutes,
    feeling: options.feeling,
    partial: options.partial ? true : undefined,
    exercises: activeWorkout.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

export function buildSessionSummary(
  session: WorkoutSession,
  options?: {
    partial?: boolean;
    prCount?: number;
    prHighlights?: string[];
  },
): SessionSummary {
  return {
    sessionId: session.id,
    workoutDayId: session.workoutDayId,
    userId: session.userId,
    workoutName: session.workoutName,
    durationMinutes: session.durationMinutes,
    completedSets: countLoggedSets(session.exercises),
    feeling: session.feeling,
    partial: options?.partial ?? session.partial,
    prCount: options?.prCount,
    prHighlights: options?.prHighlights,
  };
}

export function buildResumedActiveWorkout(
  partialSession: WorkoutSession,
  workout: WorkoutPlanDay,
): ActiveWorkout {
  const seed = Date.now();

  return {
    id: `active-resume-${seed}`,
    userId: partialSession.userId,
    startedAt: new Date().toISOString(),
    workoutDayId: workout.id,
    workoutName: workout.name,
    templateExercises: workout.exercises,
    exercises: workout.exercises.map((exercise, exerciseIndex) => {
      const partialExercise =
        partialSession.exercises.find((logged) => logged.exerciseId === exercise.id) ??
        partialSession.exercises.find(
          (logged) => logged.exerciseName.toLowerCase() === exercise.name.toLowerCase(),
        );
      const completedSets =
        partialExercise?.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)) ?? [];
      const carryForwardWeight =
        completedSets.at(-1)?.weight && completedSets.at(-1)!.weight > 0 ? completedSets.at(-1)!.weight : 0;

      return {
        exerciseId: partialExercise?.exerciseId ?? exercise.id,
        exerciseName: partialExercise?.exerciseName ?? exercise.name,
        muscleGroup: partialExercise?.muscleGroup ?? exercise.muscleGroup,
        note: partialExercise?.note ?? exercise.note ?? "",
        sets: Array.from({ length: exercise.sets }, (_, setIndex) => {
          const loggedSet = completedSets[setIndex];

          if (loggedSet) {
            return {
              ...loggedSet,
              id: `${exercise.id}-resume-${exerciseIndex}-${setIndex}-${seed}`,
              completed: true,
            };
          }

          return {
            id: `${exercise.id}-resume-${exerciseIndex}-${setIndex}-${seed}`,
            weight: carryForwardWeight,
            reps: 0,
            completed: false,
          };
        }),
      };
    }),
  };
}
