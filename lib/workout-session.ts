import type { ActiveWorkout, WorkoutSession } from "@/lib/types";
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
