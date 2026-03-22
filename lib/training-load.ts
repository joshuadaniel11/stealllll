import type { WorkoutSession, WorkoutSessionExercise } from "@/lib/types";

export type TrainingLoadGroupId =
  | "chest"
  | "shoulders"
  | "arms"
  | "back"
  | "core"
  | "glutes"
  | "legs";

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
  group: TrainingLoadGroupId;
};

export type TrainingLoadGroup = {
  id: TrainingLoadGroupId;
  label: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  color: string;
  zones: TrainingLoadZone[];
};

export type WeekWindow = {
  start: Date;
  end: Date;
  key: string;
  label: string;
};

export type WeeklyTrainingLoad = {
  week: WeekWindow;
  metrics: TrainingLoadMetric[];
  groups: TrainingLoadGroup[];
  topZones: TrainingLoadMetric[];
  activeDays: Set<string>;
};

type ZoneContribution = Partial<Record<TrainingLoadZone, number>>;

type CalendarCell = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
};

type CalendarRow = {
  label: string;
  isCurrentWeek: boolean;
  days: CalendarCell[];
};

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

const GROUP_META: Record<TrainingLoadGroupId, { label: string; color: string }> = {
  chest: { label: "Chest", color: "#ff9a7a" },
  shoulders: { label: "Shoulders", color: "#ffbe67" },
  arms: { label: "Arms", color: "#f0d15c" },
  back: { label: "Back", color: "#5d9dff" },
  core: { label: "Core", color: "#45d5ab" },
  glutes: { label: "Glutes", color: "#8a6cff" },
  legs: { label: "Legs", color: "#72cf73" },
};

const ZONE_META: Record<
  TrainingLoadZone,
  { label: string; targetSets: number; color: string; group: TrainingLoadGroupId }
> = {
  upperChest: { label: "Upper chest", targetSets: 6, color: "#ff9676", group: "chest" },
  midChest: { label: "Chest", targetSets: 8, color: "#ffb084", group: "chest" },
  frontDelts: { label: "Front delts", targetSets: 6, color: "#ffa65d", group: "shoulders" },
  sideDelts: { label: "Side delts", targetSets: 8, color: "#ffc35f", group: "shoulders" },
  rearDelts: { label: "Rear delts", targetSets: 8, color: "#f0d15c", group: "shoulders" },
  biceps: { label: "Biceps", targetSets: 8, color: "#e4d769", group: "arms" },
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
    pattern:
      /barbell row|single-arm seated row|single-arm dumbbell row|chest-supported dumbbell row|seated cable row|close-grip seated cable row|neutral-grip lat pulldown|t-bar row|machine row/i,
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
    contribution: {
      quads: 0.3,
      gluteMax: 0.25,
      frontDelts: 0.2,
      triceps: 0.12,
      abs: 0.16,
      upperBack: 0.1,
      calves: 0.08,
    },
  },
];

function toLocalDayKey(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function getCurrentWeekWindow(referenceDate = new Date()): WeekWindow {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const startLabel = new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(end);

  return {
    start,
    end,
    key: toLocalDayKey(start),
    label: `${startLabel} to ${endLabel}`,
  };
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

export function getCurrentWeekSessions(sessions: WorkoutSession[], referenceDate = new Date()) {
  const week = getCurrentWeekWindow(referenceDate);
  return sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= week.start && performedAt <= week.end;
  });
}

function buildEmptyZoneTotals() {
  return Object.keys(ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
}

function buildZoneMetrics(totals: Record<TrainingLoadZone, number>) {
  return (Object.entries(ZONE_META) as Array<[TrainingLoadZone, (typeof ZONE_META)[TrainingLoadZone]]>).map(
    ([id, meta]) => {
      const effectiveSets = roundToSingleDecimal(totals[id]);
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
}

function buildGroupMetrics(metrics: TrainingLoadMetric[]) {
  return (Object.entries(GROUP_META) as Array<[TrainingLoadGroupId, (typeof GROUP_META)[TrainingLoadGroupId]]>).map(
    ([groupId, meta]) => {
      const groupMetrics = metrics.filter((metric) => metric.group === groupId);
      const effectiveSets = roundToSingleDecimal(
        groupMetrics.reduce((sum, metric) => sum + metric.effectiveSets, 0),
      );
      const targetSets = groupMetrics.reduce((sum, metric) => sum + metric.targetSets, 0);
      const rawPercentage = targetSets ? (effectiveSets / targetSets) * 100 : 0;

      return {
        id: groupId,
        label: meta.label,
        targetSets,
        effectiveSets,
        percentage: Math.min(100, Math.round(rawPercentage)),
        overload: rawPercentage > 100,
        color: meta.color,
        zones: groupMetrics.map((metric) => metric.id),
      };
    },
  );
}

export function getWeeklyTrainingLoad(sessions: WorkoutSession[], referenceDate = new Date()): WeeklyTrainingLoad {
  const week = getCurrentWeekWindow(referenceDate);
  const currentWeekSessions = getCurrentWeekSessions(sessions, referenceDate);
  const totals = buildEmptyZoneTotals();

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

  const metrics = buildZoneMetrics(totals);
  const groups = buildGroupMetrics(metrics);
  const topZones = [...metrics]
    .filter((metric) => metric.effectiveSets > 0)
    .sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets)
    .slice(0, 4);

  return {
    week,
    metrics,
    groups,
    topZones,
    activeDays: new Set(currentWeekSessions.map((session) => toLocalDayKey(session.performedAt))),
  };
}

export function getWeeklyCalendarRows(
  sessions: WorkoutSession[],
  weeksToShow = 6,
  referenceDate = new Date(),
): CalendarRow[] {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const workoutDays = new Set(sessions.map((session) => toLocalDayKey(session.performedAt)));
  const todayKey = toLocalDayKey(referenceDate);

  return Array.from({ length: weeksToShow }, (_, index) => {
    const offset = weeksToShow - index - 1;
    const weekStart = new Date(currentWeek.start);
    weekStart.setDate(weekStart.getDate() - offset * 7);

    return {
      label: `W${index + 1}`,
      isCurrentWeek: offset === 0,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        const key = toLocalDayKey(date);

        return {
          key,
          dayLabel: DAY_LABELS[dayIndex],
          dayNumber: date.getDate(),
          completed: workoutDays.has(key),
          isToday: key === todayKey,
        };
      }),
    };
  });
}
