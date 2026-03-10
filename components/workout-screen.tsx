import { CheckCircle2, Clock3, Dumbbell } from "lucide-react";

import { Card } from "@/components/ui";
import { getExercisePerformance } from "@/lib/progression";
import type {
  ActiveWorkout,
  ExerciseLibraryItem,
  ExerciseTemplate,
  Profile,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

export function WorkoutScreen({
  profile,
  todaysWorkoutId,
  activeWorkout,
  activeWorkoutTemplate,
  userSessions,
  exerciseLibrary,
  onStartWorkout,
  onUpdateSet,
  onDuplicateLastSet,
  onUpdateExerciseNote,
  onOpenExercise,
  onSwapExercise,
  onTriggerTimer,
  onCompleteWorkout,
  onCancelWorkout,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  userSessions: WorkoutSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  onStartWorkout: (workout: WorkoutPlanDay) => void;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => void;
  onDuplicateLastSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateExerciseNote: (exerciseIndex: number, note: string) => void;
  onOpenExercise: (id: string) => void;
  onSwapExercise: (exerciseIndex: number, exerciseId: string) => void;
  onTriggerTimer: (seconds: number) => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
}) {
  if (!activeWorkout || activeWorkout.userId !== profile.id) {
    return (
      <Card>
        <p className="text-sm text-muted">Preset plan</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Start any workout day</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Today&apos;s recommended session is highlighted automatically, and you can still switch to any preset day.
        </p>
        <div className="mt-4 space-y-3">
          {profile.workoutPlan.map((workout) => (
            <button
              key={workout.id}
              className={`w-full rounded-[24px] border px-4 py-4 text-left transition dark:bg-white/5 ${
                workout.id === todaysWorkoutId
                  ? "border-accent bg-accentSoft/70 shadow-glow"
                  : "border-stroke bg-white/50 hover:bg-white/70"
              }`}
              onClick={() => onStartWorkout(workout)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{workout.name}</p>
                    {workout.id === todaysWorkoutId && (
                      <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{workout.focus}</p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>{workout.dayLabel}</p>
                  <p>{workout.durationMinutes} min</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const totalSets = activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length,
    0,
  );
  const progressPercent = Math.round((completedSets / Math.max(totalSets, 1)) * 100);

  const getSubstitutions = (exerciseId: string) => {
    const current = exerciseLibrary.find((item) => item.id === exerciseId);
    if (!current) {
      return [];
    }
    return exerciseLibrary
      .filter((item) => item.muscleGroup === current.muscleGroup && item.id !== exerciseId)
      .slice(0, 3);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Active workout</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{activeWorkout.workoutName}</h2>
            <p className="mt-1 text-sm text-muted">
              {activeWorkoutTemplate?.focus ?? "Preset workout"} - Autosaves instantly
            </p>
          </div>
          <div className="rounded-[22px] bg-black/5 px-3 py-2 text-sm text-muted dark:bg-white/5">
            <Clock3 className="mx-auto mb-1 h-4 w-4" />
            Live
          </div>
        </div>
        <div className="mt-4 rounded-[22px] bg-black/5 p-4 dark:bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">{completedSets} of {totalSets} sets logged</span>
            <span className="text-muted">{progressPercent}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/50 dark:bg-white/10">
            <div className="h-2 rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {activeWorkout.exercises.map((exercise, exerciseIndex) => {
          const template = activeWorkoutTemplate?.exercises.find((item) => item.id === exercise.exerciseId);
          const performance = template
            ? getExercisePerformance(template as ExerciseTemplate, userSessions)
            : {
                lastSession: "No history yet",
                bestPerformance: "No best yet",
                suggestion: "Log a smooth first session.",
              };
          const substitutions = getSubstitutions(exercise.exerciseId);

          return (
            <Card key={exercise.exerciseId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button className="text-left" onClick={() => onOpenExercise(exercise.exerciseId)}>
                    <h3 className="text-lg font-semibold">{exercise.exerciseName}</h3>
                  </button>
                  <p className="mt-1 text-sm text-muted">
                    {template?.muscleGroup ?? exercise.muscleGroup} - {template?.repRange ?? "Custom reps"} -{" "}
                    {template?.restSeconds ?? 60}s rest
                  </p>
                  {template?.note && <p className="mt-2 text-sm leading-6 text-muted">{template.note}</p>}
                </div>
                <button
                  className="rounded-full bg-accentSoft px-3 py-2 text-xs font-medium text-accent"
                  onClick={() => onTriggerTimer(template?.restSeconds ?? 60)}
                >
                  Rest
                </button>
              </div>

              <div className="mt-4 rounded-[24px] bg-black/5 p-4 text-sm dark:bg-white/5">
                <p className="text-muted">Last: {performance.lastSession}</p>
                <p className="mt-1 text-muted">Best: {performance.bestPerformance}</p>
                <p className="mt-2 text-text">{performance.suggestion}</p>
              </div>

              {substitutions.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">Quick swap</p>
                  <div className="flex flex-wrap gap-2">
                    {substitutions.map((option) => (
                      <button
                        key={option.id}
                        className="rounded-full border border-stroke bg-white/50 px-3 py-2 text-xs font-medium text-muted dark:bg-white/5"
                        onClick={() => onSwapExercise(exerciseIndex, option.id)}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={set.id}
                    className="rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Set {setIndex + 1}</p>
                      <button
                        className="text-sm text-accent"
                        onClick={() => onDuplicateLastSet(exerciseIndex, setIndex)}
                      >
                        Duplicate last
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="rounded-[18px] bg-black/5 px-3 py-3 dark:bg-white/5">
                        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
                          Weight
                        </span>
                        <input
                          className="w-full bg-transparent text-lg font-semibold outline-none"
                          inputMode="decimal"
                          type="number"
                          value={set.weight || ""}
                          onChange={(event) =>
                            onUpdateSet(exerciseIndex, setIndex, "weight", Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="rounded-[18px] bg-black/5 px-3 py-3 dark:bg-white/5">
                        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
                          Reps
                        </span>
                        <input
                          className="w-full bg-transparent text-lg font-semibold outline-none"
                          inputMode="numeric"
                          type="number"
                          value={set.reps || ""}
                          onChange={(event) =>
                            onUpdateSet(exerciseIndex, setIndex, "reps", Number(event.target.value))
                          }
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {[60, 90, 120].map((seconds) => (
                        <button
                          key={seconds}
                          className="rounded-full border border-stroke px-3 py-2 text-xs text-muted"
                          onClick={() => onTriggerTimer(seconds)}
                        >
                          {seconds}s
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                className="mt-4 min-h-24 w-full rounded-[24px] border border-stroke bg-white/50 px-4 py-4 text-sm outline-none placeholder:text-muted dark:bg-white/5"
                placeholder="Short notes, setup reminders, or cues"
                value={exercise.note}
                onChange={(event) => onUpdateExerciseNote(exerciseIndex, event.target.value)}
              />
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-24 z-10">
        <div className="glass hairline rounded-[28px] px-4 py-4 shadow-card">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted">
              <Dumbbell className="h-4 w-4" />
              {activeWorkout.exercises.length} exercises
            </div>
            <div className="flex items-center gap-2 text-muted">
              <CheckCircle2 className="h-4 w-4" />
              {completedSets} sets done
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="rounded-[24px] border border-stroke bg-white/60 px-4 py-4 text-sm font-semibold text-muted dark:bg-white/5"
              onClick={onCancelWorkout}
            >
              Cancel Workout
            </button>
            <button
              className="rounded-[24px] bg-accent px-5 py-4 text-base font-bold text-white shadow-glow"
              onClick={onCompleteWorkout}
            >
              Complete Workout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
