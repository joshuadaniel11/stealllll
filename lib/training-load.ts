import type { WorkoutSession, WorkoutSessionExercise } from "@/lib/types";

export type TrainingLoadZone =
  | "upperChest"
  | "midChest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "biceps"
  | "triceps"
  | "lats"
  | "upperBack"
  | "lowerBack"
  | "abs"
  | "obliques"
  | "upperGlutes"
  | "gluteMax"
  | "quads"
  | "hamstrings"
  | "calves";

export type TrainingLoadMetric = {
  id: TrainingLoadZone;
  label: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  color: string;
  group:
    | "chest"
    | "shoulders"
    | "arms"
    | "back"
    | "core"
    | "glutes"
    | "legs";
};

export type WeeklyTrainingLoad = {
  weekStart: Date;
  weekEnd: Date;
  metrics: TrainingLoadMetric[];
  activeDays: Set<string>;
};

type ZoneContribution = Partial<Record<TrainingLoadZone, number>>;

const ZONE_META: Record<
  TrainingLoadZone,
  { label: string; targetSets: number; color: string; group: TrainingLoadMetric["group"] }
> = {
  upperChest: { label: "Upper chest", targetSets: 6, color: "#ff9676", group: "chest" },
  midChest: { label: "Chest", targetSets: 8, color: "#ffb084", group: "chest" },
  frontDelts: { label: "Front delts", targetSets: 6, color: "#ffa65d", group: "shoulders" },
  sideDelts: { label: "Side delts", targetSets: 8, color: "#ffc35f", group: "shoulders" },
  rearDelts: { label: "Rear delts", targetSets: 8, color: "#f0d15c", group: "shoulders" },
  biceps: { label: "Biceps", targetSets: 8, color: "#f0d15c", group: "arms" },
  triceps: { label: "Triceps", targetSets: 8, color: "#f6bf62", group: "arms" },
  lats: { label: "Lats", targetSets: 10, color: "#5b9cff", group: "back" },
  upperBack: { label: "Upper back", targetSets: 10, color: "#57c2ff", group: "back" },
  lowerBack: { label: "Lower back", targetSets: 6, color: "#52d1d1", group: "back" },
  abs: { label: "Abs", targetSets: 8, color: "#35d3a3", group: "core" },
  obliques: { label: "Obliques", targetSets: 6, color: "#53dfb9", group: "core" },
  upperGlutes: { label: "Upper glutes", targetSets: 8, color: "#9675ff", group: "glutes" },
  gluteMax: { label: "Glute max", targetSets: 10, color: "#8064ff", group: "glutes" },
  quads: { label: "Quads", targetSets: 10, color: "#76d06e", group: "legs" },
  hamstrings: { label: "Hamstrings", targetSets: 8, color: "#60c27f", group: "legs" },
  calves: { label: "Calves", targetSets: 6, color: "#8bd86f", group: "legs" },
};

const EXERCISE_RULES: Array<{ pattern: RegExp; contribution: ZoneContribution }> = [
  {
    pattern: /incline dumbbell press|incline machine press|smith incline press/i,
    contribution: { upperChest: 1, midChest: 0.35, frontDelts: 0.35, triceps: 0.35 },
  },
  {
    pattern: /flat dumbbell press|flat machine press|machine chest press|bench press|chest press/i,
    contribution: { midChest: 1, upperChest: 0.2, frontDelts: 0.25, triceps: 0.35 },
  },
  {
    pattern: /chest fly|pec deck|machine chest fly/i,
    contribution: { midChest: 0.85, upperChest: 0.25, frontDelts: 0.1 },
  },
  {
    pattern: /shoulder press/i,
    contribution: { frontDelts: 0.7, sideDelts: 0.4, triceps: 0.45 },
  },
  {
    pattern: /lateral raise/i,
    contribution: { sideDelts: 1 },
  },
  {
    pattern: /reverse pec deck|rear delt/i,
    contribution: { rearDelts: 0.95, upperBack: 0.35 },
  },
  {
    pattern: /face pull/i,
    contribution: { rearDelts: 0.8, upperBack: 0.65 },
  },
  {
    pattern: /lat pulldown|pull-up|pull up|lat pull over|lat pullover|single-arm cable lat pull-in/i,
    contribution: { lats: 1, biceps: 0.25, upperBack: 0.2, rearDelts: 0.1 },
  },
  {
    pattern: /barbell row|single-arm seated row|single-arm dumbbell row|chest-supported dumbbell row|seated cable row|close-grip seated cable row|neutral-grip lat pulldown|t-bar row|machine row/i,
    contribution: { lats: 0.5, upperBack: 0.75, biceps: 0.25, lowerBack: 0.08 },
  },
  {
    pattern: /hyperextension/i,
    contribution: { lowerBack: 0.9, gluteMax: 0.35, hamstrings: 0.25 },
  },
  {
    pattern: /bicep curl|preacher curl|hammer curl|rope hammer curl|ez-bar curl|cable curl|bayesian curl/i,
    contribution: { biceps: 1 },
  },
  {
    pattern: /pushdown|tricep|triceps|skull crusher|rope extension|cable extension/i,
    contribution: { triceps: 1 },
  },
  {
    pattern: /hip thrust|glute bridge/i,
    contribution: { gluteMax: 1, upperGlutes: 0.45, hamstrings: 0.1 },
  },
  {
    pattern: /glute kickback/i,
    contribution: { gluteMax: 0.7, upperGlutes: 0.7 },
  },
  {
    pattern: /abductor/i,
    contribution: { upperGlutes: 0.95, gluteMax: 0.2 },
  },
  {
    pattern: /romanian deadlift|rdl/i,
    contribution: { hamstrings: 0.95, gluteMax: 0.45, lowerBack: 0.15 },
  },
  {
    pattern: /hamstring curl|leg curl/i,
    contribution: { hamstrings: 1 },
  },
  {
    pattern: /leg extension/i,
    contribution: { quads: 1 },
  },
  {
    pattern: /calf raise/i,
    contribution: { calves: 1 },
  },
  {
    pattern: /walking lunge|reverse lunge|bulgarian split squat|split squat|step-up|step up/i,
    contribution: { quads: 0.55, gluteMax: 0.55, upperGlutes: 0.18, hamstrings: 0.18, calves: 0.08 },
  },
  {
    pattern: /squat|hack squat|pendulum squat/i,
    contribution: { quads: 0.9, gluteMax: 0.35, hamstrings: 0.15, lowerBack: 0.1 },
  },
  {
    pattern: /leg press/i,
    contribution: { quads: 0.85, gluteMax: 0.25, calves: 0.08 },
  },
  {
    pattern: /woodchop/i,
    contribution: { abs: 0.45, obliques: 0.95 },
  },
  {
    pattern: /crunch|ab wheel|leg raise|knee raise|dead bug/i,
    contribution: { abs: 0.95, obliques: 0.2 },
  },
  {
    pattern: /kettlebell swing/i,
    contribution: { gluteMax: 0.55, hamstrings: 0.55, lowerBack: 0.12, abs: 0.15, upperBack: 0.1 },
  },
  {
    pattern: /medicine ball slam|wall throw|sled push|goblet squat to press|thruster|full body/i,
    contribution: { quads: 0.3, gluteMax: 0.25, frontDelts: 0.2, triceps: 0.12, abs: 0.16, upperBack: 0.1, calves: 0.08 },
  },
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

function getCompletedSetCount(exercise: WorkoutSessionExercise) {
  return exercise.sets.filter((set) => set.completed).length;
}

function getFallbackContribution(exercise: WorkoutSessionExercise): ZoneContribution {
  switch (exercise.muscleGroup) {
    case "Chest":
      return { midChest: 0.85, upperChest: 0.25, frontDelts: 0.2, triceps: 0.25 };
    case "Back":
      return { upperBack: 0.6, lats: 0.5, biceps: 0.2 };
    case "Shoulders":
      return { frontDelts: 0.34, sideDelts: 0.34, rearDelts: 0.34 };
    case "Biceps":
      return { biceps: 1 };
    case "Triceps":
      return { triceps: 1 };
    case "Glutes":
      return { gluteMax: 0.8, upperGlutes: 0.45 };
    case "Hamstrings":
      return { hamstrings: 1 };
    case "Quads":
      return { quads: 1 };
    case "Legs":
      return { quads: 0.5, hamstrings: 0.35, calves: 0.15 };
    case "Core":
      return { abs: 0.75, obliques: 0.35 };
    case "Full Body":
      return { quads: 0.3, gluteMax: 0.25, abs: 0.2, upperBack: 0.15, frontDelts: 0.1 };
    default:
      return {};
  }
}

export function getExerciseMuscleContribution(exercise: WorkoutSessionExercise): ZoneContribution {
  const matchedRule = EXERCISE_RULES.find((rule) => rule.pattern.test(exercise.exerciseName));
  return matchedRule?.contribution ?? getFallbackContribution(exercise);
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
  const totals = Object.keys(ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);

  for (const session of currentWeekSessions) {
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }

      const contribution = getExerciseMuscleContribution(exercise);
      for (const [zone, weight] of Object.entries(contribution) as Array<[TrainingLoadZone, number]>) {
        totals[zone] += completedSets * weight;
      }
    }
  }

  const metrics = (Object.entries(ZONE_META) as Array<[TrainingLoadZone, (typeof ZONE_META)[TrainingLoadZone]]>).map(
    ([id, meta]) => {
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
        group: meta.group,
      };
    },
  );

  return {
    weekStart,
    weekEnd,
    metrics,
    activeDays: new Set(currentWeekSessions.map((session) => toDayKey(session.performedAt))),
  };
}

export function getWeeklyCalendarRows(sessions: WorkoutSession[], weeksToShow = 6) {
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
