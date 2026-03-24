import type {
  ExerciseLibraryItem,
  ExerciseTemplate,
  MuscleGroup,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/lib/types";
import { buildCanonicalExerciseLibrary, normalizeExerciseName } from "@/lib/exercise-data";

export type TrainingLoadGroupId =
  | "chest"
  | "shoulders"
  | "back"
  | "core"
  | "glutes"
  | "arms"
  | "legs";

export type TrainingLoadZone =
  | "upperChest"
  | "midChest"
  | "lowerChest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "upperBack"
  | "lats"
  | "midBack"
  | "lowerBack"
  | "upperAbs"
  | "lowerAbs"
  | "obliques"
  | "upperGlutes"
  | "gluteMax"
  | "sideGlutes"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "calves";

export type TrainingLoadMetric = {
  id: TrainingLoadZone;
  label: string;
  group: TrainingLoadGroupId;
  color: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  contributors: Array<{
    exerciseName: string;
    effectiveSets: number;
  }>;
};

export type TrainingLoadGroup = {
  id: TrainingLoadGroupId;
  label: string;
  color: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
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
  recentLoad: RecentLoadProfile;
  summary: TrainingLoadSummary;
};

export type TrainingLoadSummary = {
  mostTrained: TrainingLoadMetric[];
  needsWork: TrainingLoadMetric[];
  suggestedNextFocus: NextWorkoutFocus;
  lowActivity: boolean;
};

export type NextWorkoutFocus = {
  zoneIds: TrainingLoadZone[];
  labels: string[];
  text: string;
};

export type SuggestedWorkoutDestination = {
  workoutId: string;
  workoutName: string;
  matchedZoneIds: TrainingLoadZone[];
  matchedLabels: string[];
  helperText: string;
  isFallback: boolean;
};

export type SuggestedFocusSessionExercise = {
  exerciseId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number | null;
  repRange: string | null;
  note?: string;
  matchedZoneIds: TrainingLoadZone[];
  matchedLabels: string[];
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
};

export type SuggestedFocusSession = {
  focusText: string;
  exercises: SuggestedFocusSessionExercise[];
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
  targetLabels: string[];
  totalSets: number;
  estimatedDurationMinutes: number;
  helperText: string;
  actionLabel: string;
  canStartDirectly: boolean;
  isFallback: boolean;
};

export type RecentLoadProfile = {
  zonePenalties: Record<TrainingLoadZone, number>;
  recentSessionsConsidered: number;
};

type FocusExerciseCandidate = {
  key: string;
  exerciseId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number | null;
  repRange: string | null;
  note?: string;
  matchedZoneIds: TrainingLoadZone[];
  totalFocusScore: number;
  recoveryAdjustedScore: number;
  strongestZoneScore: number;
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
  preferredWorkout: boolean;
  favorite: boolean;
  stableOrder: number;
};

export const TRAINING_LOAD_VIEW_ZONES: Record<"front" | "back", TrainingLoadZone[]> = {
  front: [
    "upperChest",
    "midChest",
    "lowerChest",
    "frontDelts",
    "sideDelts",
    "biceps",
    "triceps",
    "forearms",
    "upperAbs",
    "lowerAbs",
    "obliques",
    "sideGlutes",
    "quads",
    "calves",
  ],
  back: [
    "rearDelts",
    "upperBack",
    "lats",
    "midBack",
    "lowerBack",
    "triceps",
    "biceps",
    "forearms",
    "upperGlutes",
    "gluteMax",
    "sideGlutes",
    "hamstrings",
    "calves",
  ],
};

const PROFILE_PRIORITY_ZONES: Record<UserId, TrainingLoadZone[]> = {
  joshua: [
    "upperChest",
    "midChest",
    "sideDelts",
    "rearDelts",
    "lats",
    "upperAbs",
    "lowerAbs",
    "biceps",
    "triceps",
  ],
  natasha: [
    "upperGlutes",
    "gluteMax",
    "sideGlutes",
    "lats",
    "upperBack",
    "lowerAbs",
    "obliques",
    "sideDelts",
  ],
};

export function getProfilePriorityZones(userId: UserId) {
  return PROFILE_PRIORITY_ZONES[userId];
}

const MOST_TRAINED_MIN_PERCENTAGE = 18;
const MOST_TRAINED_MIN_EFFECTIVE_SETS = 1.5;

type ZoneContribution = Partial<Record<TrainingLoadZone, number>>;

type ExerciseLike = {
  exerciseName: string;
  muscleGroup: MuscleGroup;
};

type CalendarCell = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  joshuaCompleted: boolean;
  natashaCompleted: boolean;
};

type CalendarRow = {
  label: string;
  isCurrentWeek: boolean;
  days: CalendarCell[];
};

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export const TRAINING_LOAD_GROUP_META: Record<TrainingLoadGroupId, { label: string; color: string }> = {
  chest: { label: "Chest", color: "#ff8f73" },
  shoulders: { label: "Shoulders", color: "#ffb45b" },
  back: { label: "Back", color: "#5a9bff" },
  core: { label: "Core", color: "#33d1a0" },
  glutes: { label: "Glutes", color: "#8b6aff" },
  arms: { label: "Arms", color: "#e8cf62" },
  legs: { label: "Legs", color: "#77cf73" },
};

export const TRAINING_LOAD_ZONE_META: Record<
  TrainingLoadZone,
  { label: string; group: TrainingLoadGroupId; color: string; targetSets: number }
> = {
  upperChest: { label: "Upper chest", group: "chest", color: "#ff8e72", targetSets: 5 },
  midChest: { label: "Mid chest", group: "chest", color: "#ffa57a", targetSets: 7 },
  lowerChest: { label: "Lower chest", group: "chest", color: "#ffbf88", targetSets: 4 },
  frontDelts: { label: "Front delts", group: "shoulders", color: "#ff9f58", targetSets: 5 },
  sideDelts: { label: "Side delts", group: "shoulders", color: "#ffbc63", targetSets: 7 },
  rearDelts: { label: "Rear delts", group: "shoulders", color: "#f0d15c", targetSets: 7 },
  upperBack: { label: "Upper back", group: "back", color: "#55c0ff", targetSets: 7 },
  lats: { label: "Lats", group: "back", color: "#589bff", targetSets: 8 },
  midBack: { label: "Mid back", group: "back", color: "#4caef6", targetSets: 8 },
  lowerBack: { label: "Lower back", group: "back", color: "#53d3d0", targetSets: 5 },
  upperAbs: { label: "Upper abs", group: "core", color: "#39d4aa", targetSets: 5 },
  lowerAbs: { label: "Lower abs", group: "core", color: "#4be0b6", targetSets: 5 },
  obliques: { label: "Obliques", group: "core", color: "#69e3c6", targetSets: 4 },
  upperGlutes: { label: "Upper glutes", group: "glutes", color: "#9877ff", targetSets: 6 },
  gluteMax: { label: "Glute max", group: "glutes", color: "#8264ff", targetSets: 8 },
  sideGlutes: { label: "Side glutes", group: "glutes", color: "#ac88ff", targetSets: 5 },
  biceps: { label: "Biceps", group: "arms", color: "#ebd35f", targetSets: 6 },
  triceps: { label: "Triceps", group: "arms", color: "#f5be67", targetSets: 6 },
  forearms: { label: "Forearms", group: "arms", color: "#f2db7e", targetSets: 4 },
  quads: { label: "Quads", group: "legs", color: "#7bd26f", targetSets: 8 },
  hamstrings: { label: "Hamstrings", group: "legs", color: "#61c37d", targetSets: 6 },
  calves: { label: "Calves", group: "legs", color: "#95db72", targetSets: 4 },
};

const TARGET_DISPLAY_LABELS: Record<TrainingLoadZone, string> = {
  upperChest: "Upper chest",
  midChest: "Mid chest",
  lowerChest: "Lower chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  upperBack: "Upper back",
  lats: "Lats",
  midBack: "Mid back",
  lowerBack: "Lower back",
  upperAbs: "Upper abs",
  lowerAbs: "Lower abs",
  obliques: "Obliques",
  upperGlutes: "Glute shelf",
  gluteMax: "Lower glute",
  sideGlutes: "Side glute",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const USER_TARGET_OVERRIDES: Record<UserId, Partial<Record<TrainingLoadZone, number>>> = {
  joshua: {
    upperChest: 6,
    midChest: 8,
    lowerChest: 5,
    frontDelts: 5,
    sideDelts: 7,
    rearDelts: 6,
    upperBack: 7,
    lats: 8,
    midBack: 8,
    lowerBack: 5,
    upperAbs: 4,
    lowerAbs: 4,
    obliques: 3,
    upperGlutes: 4,
    gluteMax: 5,
    sideGlutes: 3,
    biceps: 7,
    triceps: 7,
    forearms: 4,
    quads: 6,
    hamstrings: 5,
    calves: 4,
  },
  natasha: {
    upperChest: 4,
    midChest: 5,
    lowerChest: 3,
    frontDelts: 4,
    sideDelts: 6,
    rearDelts: 6,
    upperBack: 7,
    lats: 8,
    midBack: 7,
    lowerBack: 4,
    upperAbs: 4,
    lowerAbs: 4,
    obliques: 4,
    upperGlutes: 8,
    gluteMax: 10,
    sideGlutes: 7,
    biceps: 5,
    triceps: 5,
    forearms: 3,
    quads: 7,
    hamstrings: 6,
    calves: 4,
  },
};

const EXERCISE_RULES: Array<{ pattern: RegExp; contribution: ZoneContribution }> = [
  {
    pattern: /incline dumbbell press|incline machine press|smith incline press/i,
    contribution: { upperChest: 1, midChest: 0.25, frontDelts: 0.35, triceps: 0.3 },
  },
  {
    pattern: /flat dumbbell press|flat machine press|machine chest press|bench press|chest press/i,
    contribution: { midChest: 1, upperChest: 0.18, lowerChest: 0.15, frontDelts: 0.28, triceps: 0.32 },
  },
  {
    pattern: /dip|weighted dip/i,
    contribution: { lowerChest: 0.95, triceps: 0.65, frontDelts: 0.22, midChest: 0.18 },
  },
  {
    pattern: /chest fly|pec deck|machine chest fly|cable fly/i,
    contribution: { midChest: 0.8, upperChest: 0.24, lowerChest: 0.2 },
  },
  {
    pattern: /shoulder press/i,
    contribution: { frontDelts: 0.8, sideDelts: 0.35, triceps: 0.42 },
  },
  {
    pattern: /lateral raise/i,
    contribution: { sideDelts: 1 },
  },
  {
    pattern: /reverse pec deck|rear delt|reverse fly/i,
    contribution: { rearDelts: 0.9, upperBack: 0.4, midBack: 0.22 },
  },
  {
    pattern: /face pull/i,
    contribution: { rearDelts: 0.72, upperBack: 0.62, midBack: 0.22 },
  },
  {
    pattern: /lat pulldown|single arm lat pulldown|pull up|pull in|lat pullover|machine lat pullover|straight arm cable pulldown|straight arm pulldown|assisted pull up/i,
    contribution: { lats: 1, upperBack: 0.25, biceps: 0.3, forearms: 0.15 },
  },
  {
    pattern: /barbell row|single-arm seated row|single-arm dumbbell row|chest-supported dumbbell row|seated cable row|close-grip seated cable row|t-bar row|machine row/i,
    contribution: { midBack: 0.82, lats: 0.45, upperBack: 0.4, biceps: 0.22, forearms: 0.14, lowerBack: 0.1 },
  },
  {
    pattern: /neutral-grip lat pulldown/i,
    contribution: { lats: 0.85, upperBack: 0.22, biceps: 0.32, forearms: 0.14 },
  },
  {
    pattern: /hyperextension/i,
    contribution: { lowerBack: 0.92, gluteMax: 0.36, hamstrings: 0.22 },
  },
  {
    pattern: /bicep curl|preacher curl|hammer curl|rope hammer curl|ez-bar curl|cable curl|bayesian curl|incline dumbbell curl/i,
    contribution: { biceps: 1, forearms: 0.28 },
  },
  {
    pattern: /pushdown|tricep|triceps|skull crusher|rope extension|cable extension/i,
    contribution: { triceps: 1, forearms: 0.1 },
  },
  {
    pattern: /hip thrust|glute bridge/i,
    contribution: { gluteMax: 1, upperGlutes: 0.5, hamstrings: 0.1 },
  },
  {
    pattern: /glute kickback/i,
    contribution: { gluteMax: 0.68, upperGlutes: 0.62, sideGlutes: 0.18 },
  },
  {
    pattern: /abductor|abduction/i,
    contribution: { sideGlutes: 1, upperGlutes: 0.3 },
  },
  {
    pattern: /romanian deadlift|rdl/i,
    contribution: { hamstrings: 0.92, gluteMax: 0.42, lowerBack: 0.18, forearms: 0.08 },
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
    contribution: { quads: 0.52, gluteMax: 0.48, sideGlutes: 0.18, hamstrings: 0.16, calves: 0.08 },
  },
  {
    pattern: /squat|hack squat|pendulum squat/i,
    contribution: { quads: 0.9, gluteMax: 0.32, sideGlutes: 0.08, hamstrings: 0.12, lowerBack: 0.08 },
  },
  {
    pattern: /leg press/i,
    contribution: { quads: 0.86, gluteMax: 0.24, calves: 0.08 },
  },
  {
    pattern: /crunch|sit-up/i,
    contribution: { upperAbs: 0.95, lowerAbs: 0.18 },
  },
  {
    pattern: /leg raise|knee raise|reverse crunch/i,
    contribution: { lowerAbs: 0.95, upperAbs: 0.2 },
  },
  {
    pattern: /ab wheel|dead bug|plank/i,
    contribution: { upperAbs: 0.45, lowerAbs: 0.45, obliques: 0.2 },
  },
  {
    pattern: /woodchop|wood chop/i,
    contribution: { obliques: 0.95, upperAbs: 0.22, lowerAbs: 0.22 },
  },
  {
    pattern: /kettlebell swing/i,
    contribution: { gluteMax: 0.55, hamstrings: 0.52, lowerBack: 0.12, upperBack: 0.08, forearms: 0.1 },
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

function getTargetSets(userId: UserId, zone: TrainingLoadZone) {
  return USER_TARGET_OVERRIDES[userId]?.[zone] ?? TRAINING_LOAD_ZONE_META[zone].targetSets;
}

function getZoneLabel(zone: TrainingLoadZone) {
  return TRAINING_LOAD_ZONE_META[zone].label;
}

export function getTargetDisplayLabel(zone: TrainingLoadZone) {
  return TARGET_DISPLAY_LABELS[zone] ?? getZoneLabel(zone);
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

  return {
    start,
    end,
    key: toLocalDayKey(start),
    label: `${new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(start)} to ${new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(end)}`,
  };
}

function getCompletedSetCount(exercise: WorkoutSessionExercise) {
  return exercise.sets.filter((set) => set.completed).length;
}

function getFallbackContribution(exercise: ExerciseLike): ZoneContribution {
  switch (exercise.muscleGroup) {
    case "Chest":
      return { midChest: 0.75, upperChest: 0.2, lowerChest: 0.15, frontDelts: 0.2, triceps: 0.2 };
    case "Back":
      return { upperBack: 0.35, lats: 0.35, midBack: 0.35, biceps: 0.15 };
    case "Shoulders":
      return { frontDelts: 0.3, sideDelts: 0.4, rearDelts: 0.3 };
    case "Biceps":
      return { biceps: 1, forearms: 0.2 };
    case "Triceps":
      return { triceps: 1, forearms: 0.1 };
    case "Glutes":
      return { gluteMax: 0.7, upperGlutes: 0.35, sideGlutes: 0.25 };
    case "Hamstrings":
      return { hamstrings: 1 };
    case "Quads":
      return { quads: 1 };
    case "Legs":
      return { quads: 0.55, hamstrings: 0.25, calves: 0.2 };
    case "Core":
      return { upperAbs: 0.42, lowerAbs: 0.42, obliques: 0.26 };
    case "Full Body":
      return { quads: 0.25, gluteMax: 0.2, upperBack: 0.14, upperAbs: 0.12, sideDelts: 0.1, forearms: 0.08 };
    default:
      return {};
  }
}

export function getExerciseMuscleContribution(exercise: ExerciseLike): ZoneContribution {
  const normalizedName = normalizeExerciseName(exercise.exerciseName);
  const matchedRule = EXERCISE_RULES.find((rule) => rule.pattern.test(normalizedName));
  return matchedRule?.contribution ?? getFallbackContribution(exercise);
}

export function getExerciseTargetLabels(exercise: ExerciseLike, limit = 2) {
  return Object.entries(getExerciseMuscleContribution(exercise))
    .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
    .slice(0, limit)
    .map(([zoneId]) => getTargetDisplayLabel(zoneId as TrainingLoadZone));
}

export function getExerciseTargetSummary(exercise: ExerciseLike, limit = 2) {
  const labels = getExerciseTargetLabels(exercise, limit);
  return labels.length ? labels.join(" • ") : exercise.muscleGroup;
}

function getTemplateExerciseContribution(exercise: ExerciseTemplate) {
  return getExerciseMuscleContribution({
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
  });
}

function scoreContributionForFocus(contribution: ZoneContribution, focusZoneIds: TrainingLoadZone[]) {
  const zoneScores = focusZoneIds.reduce<Record<TrainingLoadZone, number>>((accumulator, zoneId) => {
    accumulator[zoneId] = contribution[zoneId] ?? 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);

  const matchedZoneIds = focusZoneIds.filter((zoneId) => zoneScores[zoneId] > 0);

  return {
    zoneScores,
    matchedZoneIds,
    totalFocusScore: focusZoneIds.reduce((sum, zoneId) => sum + zoneScores[zoneId], 0),
    strongestZoneScore: Math.max(0, ...focusZoneIds.map((zoneId) => zoneScores[zoneId])),
  };
}

function buildEmptyZoneRecord() {
  return Object.keys(TRAINING_LOAD_ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
}

function getRecentSessionWeight(performedAt: string, referenceDate: Date) {
  const hoursSince = Math.max(0, (referenceDate.getTime() - new Date(performedAt).getTime()) / 36e5);

  if (hoursSince <= 24) {
    return 1;
  }
  if (hoursSince <= 48) {
    return 0.72;
  }
  if (hoursSince <= 72) {
    return 0.5;
  }
  return 0.32;
}

function getRecentLoadProfile(
  userId: UserId,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
): RecentLoadProfile {
  const zoneLoads = buildEmptyZoneRecord();
  const sortedSessions = [...sessions].sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
  const recentSessions = sortedSessions.filter((session, index) => {
    const hoursSince = Math.max(0, (referenceDate.getTime() - new Date(session.performedAt).getTime()) / 36e5);
    return hoursSince <= 72 || index < 2;
  });

  for (const session of recentSessions) {
    const weight = getRecentSessionWeight(session.performedAt, referenceDate);
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }
      const contribution = getExerciseMuscleContribution(exercise);
      for (const [zoneId, zoneWeight] of Object.entries(contribution) as Array<[TrainingLoadZone, number]>) {
        zoneLoads[zoneId] += completedSets * zoneWeight * weight;
      }
    }
  }

  const zonePenalties = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<
    Record<TrainingLoadZone, number>
  >((accumulator, zoneId) => {
    const targetSets = getTargetSets(userId, zoneId);
    accumulator[zoneId] = Math.min(1, zoneLoads[zoneId] / Math.max(2, targetSets * 0.8));
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);

  return {
    zonePenalties,
    recentSessionsConsidered: recentSessions.length,
  };
}

function roundDurationToFive(minutes: number) {
  return Math.max(15, Math.round(minutes / 5) * 5);
}

function estimateSuggestedSessionDuration(exercises: FocusExerciseCandidate[], sourceWorkout: WorkoutPlanDay | null) {
  const templateSets = exercises.reduce((sum, exercise) => sum + (exercise.sets ?? 0), 0);

  if (sourceWorkout?.durationMinutes) {
    const sourceSetCount = sourceWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (sourceSetCount > 0 && templateSets > 0) {
      const scaledDuration = (templateSets / sourceSetCount) * sourceWorkout.durationMinutes;
      return roundDurationToFive(Math.max(18, scaledDuration));
    }
  }

  return roundDurationToFive(templateSets * 2.6 + exercises.length * 1.5);
}

export function getCurrentWeekSessions(sessions: WorkoutSession[], referenceDate = new Date()) {
  const week = getCurrentWeekWindow(referenceDate);
  return sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= week.start && performedAt <= week.end;
  });
}

function buildEmptyZoneTotals() {
  return Object.keys(TRAINING_LOAD_ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
}

function buildZoneMetrics(
  userId: UserId,
  totals: Record<TrainingLoadZone, number>,
  contributorTotals: Record<TrainingLoadZone, Record<string, number>>,
) {
  return (Object.entries(TRAINING_LOAD_ZONE_META) as Array<
    [TrainingLoadZone, (typeof TRAINING_LOAD_ZONE_META)[TrainingLoadZone]]
  >).map(([id, meta]) => {
    const effectiveSets = roundToSingleDecimal(totals[id]);
    const targetSets = getTargetSets(userId, id);
    const rawPercentage = targetSets ? (effectiveSets / targetSets) * 100 : 0;
    const contributors = Object.entries(contributorTotals[id] ?? {})
      .map(([exerciseName, sets]) => ({
        exerciseName,
        effectiveSets: roundToSingleDecimal(sets),
      }))
      .sort((a, b) => b.effectiveSets - a.effectiveSets)
      .slice(0, 4);

    return {
      id,
      label: meta.label,
      group: meta.group,
      color: meta.color,
      targetSets,
      effectiveSets,
      percentage: Math.min(100, Math.round(rawPercentage)),
      overload: rawPercentage > 100,
      contributors,
    };
  });
}

function buildGroupMetrics(metrics: TrainingLoadMetric[]) {
  return (Object.entries(TRAINING_LOAD_GROUP_META) as Array<
    [TrainingLoadGroupId, (typeof TRAINING_LOAD_GROUP_META)[TrainingLoadGroupId]]
  >).map(([id, meta]) => {
    const zoneMetrics = metrics.filter((metric) => metric.group === id);
    const effectiveSets = roundToSingleDecimal(zoneMetrics.reduce((sum, metric) => sum + metric.effectiveSets, 0));
    const targetSets = zoneMetrics.reduce((sum, metric) => sum + metric.targetSets, 0);
    const rawPercentage = targetSets ? (effectiveSets / targetSets) * 100 : 0;

    return {
      id,
      label: meta.label,
      color: meta.color,
      targetSets,
      effectiveSets,
      percentage: Math.min(100, Math.round(rawPercentage)),
      overload: rawPercentage > 100,
      zones: zoneMetrics.map((metric) => metric.id),
    };
  });
}

function getPriorityRank(userId: UserId, zone: TrainingLoadZone) {
  const index = PROFILE_PRIORITY_ZONES[userId].indexOf(zone);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getAveragePenaltyForZones(zoneIds: TrainingLoadZone[], recentLoad?: RecentLoadProfile) {
  if (!zoneIds.length || !recentLoad) {
    return 0;
  }

  return (
    zoneIds.reduce((sum, zoneId) => sum + (recentLoad.zonePenalties[zoneId] ?? 0), 0) /
    zoneIds.length
  );
}

function getFocusHelperText(
  focusLabels: string[],
  matchedZoneLabels: string[],
  isFallback: boolean,
) {
  const focusText = focusLabels.join(" + ");
  const matchedText = matchedZoneLabels.join(" + ");

  if (isFallback) {
    return `Closest real workout for ${focusText}`;
  }

  if (matchedText && matchedText !== focusText) {
    return `Best match for ${matchedText}`;
  }

  return `Best match for ${focusText}`;
}

function buildSuggestedNextFocus(
  userId: UserId,
  metrics: TrainingLoadMetric[],
  lowActivity: boolean,
  recentLoad: RecentLoadProfile,
): NextWorkoutFocus {
  const priorityZones = PROFILE_PRIORITY_ZONES[userId];
  const priorityMetrics = priorityZones
    .map((zone) => metrics.find((metric) => metric.id === zone))
    .filter((metric): metric is TrainingLoadMetric => Boolean(metric));

  const pickZones = (pool: TrainingLoadMetric[]) =>
    [...pool]
      .sort((a, b) => {
        const aAdjustedPercentage = a.percentage + recentLoad.zonePenalties[a.id] * 22;
        const bAdjustedPercentage = b.percentage + recentLoad.zonePenalties[b.id] * 22;

        if (aAdjustedPercentage !== bAdjustedPercentage) {
          return aAdjustedPercentage - bAdjustedPercentage;
        }
        if (a.effectiveSets !== b.effectiveSets) {
          return a.effectiveSets - b.effectiveSets;
        }
        if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
          return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
        }
        return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
      })
      .slice(0, 2);

  const selectedMetrics = lowActivity
    ? [...priorityMetrics.slice(0, Math.min(5, priorityMetrics.length))]
        .sort((a, b) => {
          if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
            return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
          }
          return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
        })
        .slice(0, 2)
    : (() => {
        const lagging = priorityMetrics.filter((metric) => metric.percentage < 80);
        if (lagging.length >= 2) {
          return pickZones(lagging);
        }

        const belowTarget = priorityMetrics.filter((metric) => metric.percentage < 100);
        if (belowTarget.length >= 2) {
          return pickZones(belowTarget);
        }

        return pickZones(priorityMetrics);
      })();

  const labels = selectedMetrics.map((metric) => getZoneLabel(metric.id));

  return {
    zoneIds: selectedMetrics.map((metric) => metric.id),
    labels,
    text: labels.join(" + "),
  };
}

export function getSuggestedWorkoutDestination(
  userId: UserId,
  workoutPlan: WorkoutPlanDay[],
  focus: NextWorkoutFocus,
  recentLoad?: RecentLoadProfile,
): SuggestedWorkoutDestination | null {
  if (!workoutPlan.length) {
    return null;
  }

  const scoredWorkouts = workoutPlan.map((workout, index) => {
    const zoneScores = focus.zoneIds.reduce<Record<TrainingLoadZone, number>>((accumulator, zoneId) => {
      accumulator[zoneId] = 0;
      return accumulator;
    }, {} as Record<TrainingLoadZone, number>);

    for (const exercise of workout.exercises) {
      const contribution = getTemplateExerciseContribution(exercise);
      for (const zoneId of focus.zoneIds) {
        zoneScores[zoneId] += contribution[zoneId] ?? 0;
      }
    }

    const matchedZoneIds = focus.zoneIds.filter((zoneId) => zoneScores[zoneId] > 0);
    const totalFocusScore = focus.zoneIds.reduce((sum, zoneId) => sum + zoneScores[zoneId], 0);

    return {
      workout,
      index,
      matchedZoneIds,
      totalFocusScore,
      adjustedFocusScore: totalFocusScore - focus.zoneIds.reduce(
        (sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0) * (zoneScores[zoneId] > 0 ? 0.32 : 0),
        0,
      ),
      strongestZoneScore: Math.max(0, ...focus.zoneIds.map((zoneId) => zoneScores[zoneId])),
    };
  });

  const bestMatch = [...scoredWorkouts].sort((a, b) => {
    if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
      return b.matchedZoneIds.length - a.matchedZoneIds.length;
    }
    if (b.adjustedFocusScore !== a.adjustedFocusScore) {
      return b.adjustedFocusScore - a.adjustedFocusScore;
    }
    if (b.totalFocusScore !== a.totalFocusScore) {
      return b.totalFocusScore - a.totalFocusScore;
    }
    if (b.strongestZoneScore !== a.strongestZoneScore) {
      return b.strongestZoneScore - a.strongestZoneScore;
    }
    return a.index - b.index;
  })[0];

  if (!bestMatch) {
    return null;
  }

  const matchedZoneIds = bestMatch.matchedZoneIds.length ? bestMatch.matchedZoneIds : focus.zoneIds;
  const matchedLabels = matchedZoneIds.map(getZoneLabel);

  return {
    workoutId: bestMatch.workout.id,
    workoutName: bestMatch.workout.name,
    matchedZoneIds,
    matchedLabels,
    helperText: getFocusHelperText(focus.labels, matchedLabels, bestMatch.matchedZoneIds.length === 0),
    isFallback: bestMatch.matchedZoneIds.length === 0,
  };
}

export function getSuggestedFocusSession(
  userId: UserId,
  workoutPlan: WorkoutPlanDay[],
  focus: NextWorkoutFocus,
  exerciseLibrary: ExerciseLibraryItem[] = [],
  recentLoad?: RecentLoadProfile,
): SuggestedFocusSession | null {
  if (!focus.zoneIds.length) {
    return null;
  }

  const destination = getSuggestedWorkoutDestination(userId, workoutPlan, focus, recentLoad);
  const preferredWorkoutId = destination?.workoutId ?? null;
  const preferredWorkoutName = destination?.workoutName ?? null;
  const sourceWorkout = preferredWorkoutId
    ? workoutPlan.find((workout) => workout.id === preferredWorkoutId) ?? null
    : null;

  const scoredTemplateExercises: FocusExerciseCandidate[] = workoutPlan.flatMap((workout, workoutIndex) =>
    workout.exercises.map((exercise, exerciseIndex) => {
      const contribution = getTemplateExerciseContribution(exercise);
      const score = scoreContributionForFocus(contribution, focus.zoneIds);

      return {
        key: `template-${workout.id}-${exercise.id}`,
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets,
        repRange: exercise.repRange,
        note: exercise.note,
        matchedZoneIds: score.matchedZoneIds,
        totalFocusScore: score.totalFocusScore,
        recoveryAdjustedScore:
          score.totalFocusScore *
          Math.max(
            0.55,
            1 -
              score.matchedZoneIds.reduce((sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0), 0) /
                Math.max(1, score.matchedZoneIds.length) *
                0.45,
          ),
        strongestZoneScore: score.strongestZoneScore,
        sourceWorkoutId: workout.id,
        sourceWorkoutName: workout.name,
        preferredWorkout: workout.id === preferredWorkoutId,
        favorite: Boolean(exercise.favorite),
        stableOrder: workoutIndex * 100 + exerciseIndex,
      };
    }),
  );

  const dedupedTemplateExercises = Array.from(
    new Map(
      scoredTemplateExercises
        .sort((a, b) => {
          if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
            return b.matchedZoneIds.length - a.matchedZoneIds.length;
          }
          if (b.recoveryAdjustedScore !== a.recoveryAdjustedScore) {
            return b.recoveryAdjustedScore - a.recoveryAdjustedScore;
          }
          if (b.totalFocusScore !== a.totalFocusScore) {
            return b.totalFocusScore - a.totalFocusScore;
          }
          if (Number(b.preferredWorkout) !== Number(a.preferredWorkout)) {
            return Number(b.preferredWorkout) - Number(a.preferredWorkout);
          }
          if (Number(b.favorite) !== Number(a.favorite)) {
            return Number(b.favorite) - Number(a.favorite);
          }
          if (b.strongestZoneScore !== a.strongestZoneScore) {
            return b.strongestZoneScore - a.strongestZoneScore;
          }
          return a.stableOrder - b.stableOrder;
        })
        .map((exercise) => [normalizeExerciseName(exercise.name), exercise] as const),
    ).values(),
  );

  const matchedTemplateExercises = dedupedTemplateExercises.filter((exercise) => exercise.totalFocusScore > 0);
  const selectedExercises: FocusExerciseCandidate[] = [];
  const targetCount = 4;
  const usedMuscleGroups = new Set<MuscleGroup>();

  for (const zoneId of focus.zoneIds) {
    const bestForZone = matchedTemplateExercises.find(
      (exercise) =>
        !selectedExercises.includes(exercise) &&
        exercise.matchedZoneIds.includes(zoneId) &&
        (!usedMuscleGroups.has(exercise.muscleGroup) || exercise.matchedZoneIds.length > 1),
    );
    if (bestForZone) {
      selectedExercises.push(bestForZone);
      usedMuscleGroups.add(bestForZone.muscleGroup);
    }
  }

  for (const exercise of matchedTemplateExercises) {
    if (selectedExercises.length >= targetCount) {
      break;
    }
    if (selectedExercises.includes(exercise)) {
      continue;
    }
    if (usedMuscleGroups.has(exercise.muscleGroup) && selectedExercises.length < Math.min(targetCount, 3)) {
      continue;
    }
    selectedExercises.push(exercise);
    usedMuscleGroups.add(exercise.muscleGroup);
  }

  if (selectedExercises.length < targetCount) {
    const libraryFallbacks = buildCanonicalExerciseLibrary(exerciseLibrary)
      .map((exercise, index) => {
        const contribution = getExerciseMuscleContribution({
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
        });
        const score = scoreContributionForFocus(contribution, focus.zoneIds);

        return {
          key: `library-${exercise.id}`,
          exerciseId: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: null,
          repRange: null,
          note: exercise.cues[0],
          matchedZoneIds: score.matchedZoneIds,
          totalFocusScore: score.totalFocusScore,
          recoveryAdjustedScore:
            score.totalFocusScore *
            Math.max(
              0.55,
              1 -
                score.matchedZoneIds.reduce((sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0), 0) /
                  Math.max(1, score.matchedZoneIds.length) *
                  0.45,
            ),
          strongestZoneScore: score.strongestZoneScore,
          sourceWorkoutId: null,
          sourceWorkoutName: null,
          preferredWorkout: false,
          favorite: false,
          stableOrder: 10000 + index,
        };
      })
      .filter((exercise) => exercise.totalFocusScore > 0)
      .sort((a, b) => {
        if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
          return b.matchedZoneIds.length - a.matchedZoneIds.length;
        }
        if (b.recoveryAdjustedScore !== a.recoveryAdjustedScore) {
          return b.recoveryAdjustedScore - a.recoveryAdjustedScore;
        }
        if (b.totalFocusScore !== a.totalFocusScore) {
          return b.totalFocusScore - a.totalFocusScore;
        }
        if (b.strongestZoneScore !== a.strongestZoneScore) {
          return b.strongestZoneScore - a.strongestZoneScore;
        }
        return a.stableOrder - b.stableOrder;
      });

    for (const fallbackExercise of libraryFallbacks) {
      if (selectedExercises.length >= targetCount) {
        break;
      }
      const alreadySelected = selectedExercises.some(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(fallbackExercise.name),
      );
      if (alreadySelected) {
        continue;
      }
      selectedExercises.push(fallbackExercise);
      usedMuscleGroups.add(fallbackExercise.muscleGroup);
    }
  }

  if (!selectedExercises.length) {
    return null;
  }

  const sourceWorkoutName =
    selectedExercises.find((exercise) => exercise.sourceWorkoutId === preferredWorkoutId)?.sourceWorkoutName ??
    selectedExercises.find((exercise) => exercise.sourceWorkoutName)?.sourceWorkoutName ??
    preferredWorkoutName;
  const canStartDirectly = selectedExercises.every(
    (exercise) => Boolean(exercise.exerciseId) && Boolean(exercise.sets) && Boolean(exercise.repRange),
  );
  const selectedSlice = selectedExercises.slice(0, targetCount);
  const targetLabels = Array.from(
    new Set([
      ...focus.labels,
      ...selectedSlice.flatMap((exercise) => exercise.matchedZoneIds.map(getZoneLabel)),
    ]),
  ).slice(0, 3);
  const totalSets = selectedSlice.reduce((sum, exercise) => sum + (exercise.sets ?? 0), 0);
  const estimatedDurationMinutes = estimateSuggestedSessionDuration(selectedSlice, sourceWorkout);

  return {
    focusText: focus.text,
    exercises: selectedSlice.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets,
      repRange: exercise.repRange,
      note: exercise.note,
      matchedZoneIds: exercise.matchedZoneIds,
      matchedLabels: exercise.matchedZoneIds.map(getZoneLabel),
      sourceWorkoutId: exercise.sourceWorkoutId,
      sourceWorkoutName: exercise.sourceWorkoutName,
    })),
    sourceWorkoutId: preferredWorkoutId,
    sourceWorkoutName,
    targetLabels,
    totalSets,
    estimatedDurationMinutes,
    helperText: sourceWorkoutName
      ? getAveragePenaltyForZones(focus.zoneIds, recentLoad) >= 0.5
        ? `Built from ${sourceWorkoutName}, with fresher support work around your focus`
        : `Built from ${sourceWorkoutName}`
      : "Built from your current focus priorities",
    actionLabel: canStartDirectly ? "Start session" : "Open workout",
    canStartDirectly,
    isFallback: selectedExercises.some((exercise) => exercise.sourceWorkoutId === null),
  };
}

function buildTrainingLoadSummary(
  userId: UserId,
  metrics: TrainingLoadMetric[],
  recentLoad: RecentLoadProfile,
): TrainingLoadSummary {
  const priorityZones = new Set(PROFILE_PRIORITY_ZONES[userId]);
  const lowActivity = metrics.every((metric) => metric.effectiveSets < MOST_TRAINED_MIN_EFFECTIVE_SETS);

  if (lowActivity) {
    return {
      mostTrained: [],
      needsWork: PROFILE_PRIORITY_ZONES[userId]
        .slice(0, 3)
        .map((zone) => metrics.find((metric) => metric.id === zone))
        .filter((metric): metric is TrainingLoadMetric => Boolean(metric)),
      suggestedNextFocus: buildSuggestedNextFocus(userId, metrics, true, recentLoad),
      lowActivity: true,
    };
  }

  const thresholdQualified = metrics.filter(
    (metric) =>
      metric.effectiveSets >= MOST_TRAINED_MIN_EFFECTIVE_SETS || metric.percentage >= MOST_TRAINED_MIN_PERCENTAGE,
  );

  const mostTrainedPool = thresholdQualified.length
    ? thresholdQualified
    : metrics.filter((metric) => priorityZones.has(metric.id) && metric.effectiveSets > 0);

  const mostTrained = [...mostTrainedPool]
    .sort((a, b) => {
      if (priorityZones.has(a.id) !== priorityZones.has(b.id)) {
        return priorityZones.has(a.id) ? -1 : 1;
      }
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      if (b.effectiveSets !== a.effectiveSets) {
        return b.effectiveSets - a.effectiveSets;
      }
      return a.label.localeCompare(b.label);
    })
    .slice(0, 3);

  const needsWork = metrics
    .filter((metric) => priorityZones.has(metric.id))
    .sort((a, b) => {
      if (a.percentage !== b.percentage) {
        return a.percentage - b.percentage;
      }
      if (a.effectiveSets !== b.effectiveSets) {
        return a.effectiveSets - b.effectiveSets;
      }
      if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
        return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
      }
      return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
    })
    .slice(0, 3);

  return {
    mostTrained,
    needsWork,
    suggestedNextFocus: buildSuggestedNextFocus(userId, metrics, lowActivity, recentLoad),
    lowActivity,
  };
}

export function getWeeklyTrainingLoad(
  sessions: WorkoutSession[],
  userId: UserId,
  referenceDate = new Date(),
): WeeklyTrainingLoad {
  const week = getCurrentWeekWindow(referenceDate);
  const currentWeekSessions = getCurrentWeekSessions(sessions, referenceDate);
  const recentLoad = getRecentLoadProfile(userId, sessions, referenceDate);
  const totals = buildEmptyZoneTotals();
  const contributorTotals = Object.keys(TRAINING_LOAD_ZONE_META).reduce<
    Record<TrainingLoadZone, Record<string, number>>
  >((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = {};
    return accumulator;
  }, {} as Record<TrainingLoadZone, Record<string, number>>);

  for (const session of currentWeekSessions) {
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }

      const contribution = getExerciseMuscleContribution(exercise);
      for (const [zone, weight] of Object.entries(contribution) as Array<[TrainingLoadZone, number]>) {
        const effectiveContribution = completedSets * weight;
        totals[zone] += effectiveContribution;
        contributorTotals[zone][exercise.exerciseName] =
          (contributorTotals[zone][exercise.exerciseName] ?? 0) + effectiveContribution;
      }
    }
  }

  const metrics = buildZoneMetrics(userId, totals, contributorTotals);
  const groups = buildGroupMetrics(metrics);
  const topZones = [...metrics]
    .filter((metric) => metric.effectiveSets > 0)
    .sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets)
    .slice(0, 5);
  const summary = buildTrainingLoadSummary(userId, metrics, recentLoad);

  return {
    week,
    metrics,
    groups,
    topZones,
    activeDays: new Set(currentWeekSessions.map((session) => toLocalDayKey(session.performedAt))),
    recentLoad,
    summary,
  };
}

export function getWeeklyCalendarRows(
  sessions: WorkoutSession[],
  weeksToShow = 6,
  referenceDate = new Date(),
): CalendarRow[] {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const workoutDays = sessions.reduce<
    Record<string, { joshuaCompleted: boolean; natashaCompleted: boolean }>
  >((accumulator, session) => {
    const key = toLocalDayKey(session.performedAt);
    const current = accumulator[key] ?? { joshuaCompleted: false, natashaCompleted: false };
    if (session.userId === "joshua") {
      current.joshuaCompleted = true;
    }
    if (session.userId === "natasha") {
      current.natashaCompleted = true;
    }
    accumulator[key] = current;
    return accumulator;
  }, {});
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
        const dayCompletion = workoutDays[key] ?? { joshuaCompleted: false, natashaCompleted: false };

        return {
          key,
          dayLabel: DAY_LABELS[dayIndex],
          dayNumber: date.getDate(),
          completed: dayCompletion.joshuaCompleted || dayCompletion.natashaCompleted,
          isToday: key === todayKey,
          joshuaCompleted: dayCompletion.joshuaCompleted,
          natashaCompleted: dayCompletion.natashaCompleted,
        };
      }),
    };
  });
}
