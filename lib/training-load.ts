import type { WorkoutSession, WorkoutSessionExercise } from "@/lib/types";

export type TrainingLoadMuscle =
  | "chest"
  | "shoulders"
  | "arms"
  | "back"
  | "abs"
  | "glutes"
  | "legs";

export type TrainingLoadMetric = {
  id: TrainingLoadMuscle;
  label: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  color: string;
};

export type WeeklyTrainingLoad = {
  weekStart: Date;
  weekEnd: Date;
  metrics: TrainingLoadMetric[];
  activeDays: Set<string>;
};

type MuscleContribution = Partial<Record<TrainingLoadMuscle, number>>;

const MUSCLE_META: Record<
  TrainingLoadMuscle,
  { label: string; targetSets: number; color: string }
> = {
  chest: { label: "Chest", targetSets: 10, color: "#ff9676" },
  shoulders: { label: "Shoulders", targetSets: 10, color: "#f3a65f" },
  arms: { label: "Arms", targetSets: 12, color: "#f2cb58" },
  back: { label: "Back", targetSets: 14, color: "#58b7ff" },
  abs: { label: "Abs", targetSets: 8, color: "#35d3a3" },
  glutes: { label: "Glutes", targetSets: 14, color: "#8d79ff" },
  legs: { label: "Legs", targetSets: 12, color: "#76d06e" },
};

const EXERCISE_RULES: Array<{ pattern: RegExp; muscles: MuscleContribution }> = [
  { pattern: /bench|chest press|chest fly|incline dumbbell press|flat dumbbell press/i, muscles: { chest: 1, shoulders: 0.35, arms: 0.35 } },
  { pattern: /shoulder press/i, muscles: { shoulders: 1, arms: 0.4 } },
  { pattern: /lateral raise/i, muscles: { shoulders: 1 } },
  { pattern: /reverse pec deck|rear delt|face pull/i, muscles: { shoulders: 0.45, back: 0.75 } },
  { pattern: /lat pulldown|pull-up|pull up|lat pullover|pullover|row|hyperextension/i, muscles: { back: 1, arms: 0.35 } },
  { pattern: /curl/i, muscles: { arms: 1 } },
  { pattern: /pushdown|tricep|triceps|skull crusher|extension/i, muscles: { arms: 1 } },
  { pattern: /hip thrust|glute bridge|glute kickback|abductor/i, muscles: { glutes: 1, legs: 0.2 } },
  { pattern: /rdl|romanian deadlift/i, muscles: { legs: 0.65, glutes: 0.65 } },
  { pattern: /hamstring curl|leg curl/i, muscles: { legs: 0.85, glutes: 0.15 } },
  { pattern: /squat|leg press|leg extension|calf raise/i, muscles: { legs: 1, glutes: 0.3 } },
  { pattern: /lunge|split squat|step-up|step up/i, muscles: { legs: 0.75, glutes: 0.75 } },
  { pattern: /woodchop|crunch|ab wheel|leg raise|knee raise|dead bug|core/i, muscles: { abs: 1 } },
  { pattern: /swing|slam|sled|throw|squat to press|full body/i, muscles: { legs: 0.4, glutes: 0.4, shoulders: 0.25, arms: 0.2, abs: 0.2, back: 0.2 } },
];

function getWeekStartMonday(input = new Date()) {
  const next = new Date(input);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getWeekEndMonday(weekStart: Date) {
  const next = new Date(weekStart);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toDayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getBaseContribution(exercise: WorkoutSessionExercise): MuscleContribution {
  switch (exercise.muscleGroup) {
    case "Chest":
      return { chest: 1, shoulders: 0.25, arms: 0.25 };
    case "Back":
      return { back: 1, arms: 0.3 };
    case "Shoulders":
      return { shoulders: 1, arms: 0.3 };
    case "Biceps":
    case "Triceps":
      return { arms: 1 };
    case "Glutes":
      return { glutes: 1, legs: 0.2 };
    case "Hamstrings":
    case "Quads":
    case "Legs":
      return { legs: 1, glutes: 0.2 };
    case "Core":
      return { abs: 1 };
    case "Full Body":
      return { legs: 0.4, glutes: 0.35, back: 0.2, shoulders: 0.2, abs: 0.2, arms: 0.15 };
    default:
      return {};
  }
}

export function getExerciseMuscleContribution(exercise: WorkoutSessionExercise): MuscleContribution {
  const name = exercise.exerciseName;
  const matchedRule = EXERCISE_RULES.find((rule) => rule.pattern.test(name));
  return matchedRule?.muscles ?? getBaseContribution(exercise);
}

function getCompletedSetCount(exercise: WorkoutSessionExercise) {
  return exercise.sets.filter((set) => set.completed).length;
}

export function getCurrentWeekSessions(sessions: WorkoutSession[]) {
  const weekStart = getWeekStartMonday();
  const weekEnd = getWeekEndMonday(weekStart);

  return sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= weekStart && performedAt <= weekEnd;
  });
}

export function getWeeklyTrainingLoad(sessions: WorkoutSession[]): WeeklyTrainingLoad {
  const weekStart = getWeekStartMonday();
  const weekEnd = getWeekEndMonday(weekStart);
  const currentWeekSessions = getCurrentWeekSessions(sessions);
  const totals: Record<TrainingLoadMuscle, number> = {
    chest: 0,
    shoulders: 0,
    arms: 0,
    back: 0,
    abs: 0,
    glutes: 0,
    legs: 0,
  };

  for (const session of currentWeekSessions) {
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }

      const contribution = getExerciseMuscleContribution(exercise);
      for (const [muscle, weight] of Object.entries(contribution) as Array<[TrainingLoadMuscle, number]>) {
        totals[muscle] += completedSets * weight;
      }
    }
  }

  const metrics = (Object.entries(MUSCLE_META) as Array<
    [TrainingLoadMuscle, (typeof MUSCLE_META)[TrainingLoadMuscle]]
  >).map(([id, meta]) => {
    const effectiveSets = Number(totals[id].toFixed(1));
    const rawPercentage = meta.targetSets ? (effectiveSets / meta.targetSets) * 100 : 0;
    return {
      id,
      label: meta.label,
      targetSets: meta.targetSets,
      effectiveSets,
      percentage: Math.min(100, Math.round(rawPercentage)),
      overload: rawPercentage > 100,
      color: meta.color,
    };
  });

  return {
    weekStart,
    weekEnd,
    metrics,
    activeDays: new Set(currentWeekSessions.map((session) => toDayKey(session.performedAt))),
  };
}

export function getWeeklyCalendarRows(
  sessions: WorkoutSession[],
  weeksToShow = 6,
) {
  const currentWeekStart = getWeekStartMonday();
  const workoutDays = new Set(sessions.map((session) => toDayKey(session.performedAt)));
  const todayKey = toDayKey(new Date());

  return Array.from({ length: weeksToShow }, (_, index) => {
    const offset = weeksToShow - index - 1;
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - offset * 7);

    return {
      label: `W${index + 1}`,
      isCurrentWeek: offset === 0,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        const key = toDayKey(date);

        return {
          key,
          dayLabel: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][dayIndex],
          dayNumber: date.getDate(),
          completed: workoutDays.has(key),
          isToday: key === todayKey,
        };
      }),
    };
  });
}
