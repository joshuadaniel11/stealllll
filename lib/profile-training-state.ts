import {
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getProfilePriorityZones,
  getSuggestedFocusSession,
  getSuggestedWorkoutDestination,
  getWeeklyCalendarRows,
  getWeeklyTrainingLoad,
} from "@/lib/training-load";
import type { SuggestedFocusSession, SuggestedWorkoutDestination, WeeklyTrainingLoad } from "@/lib/training-load";
import type { ExerciseLibraryItem, Profile, WeeklySummary, WorkoutSession } from "@/lib/types";

export type TrendPoint = {
  date: string;
  volume: number;
};

export type ProfileTrainingState = {
  userSessions: WorkoutSession[];
  totalWorkouts: number;
  weeklyCount: number;
  streak: number;
  recentWorkouts: WorkoutSession[];
  recentSessions: WorkoutSession[];
  trendData: TrendPoint[];
  weeklySummary: WeeklySummary;
  trainingLoad: WeeklyTrainingLoad;
  calendarRows: ReturnType<typeof getWeeklyCalendarRows>;
  nextFocusDestination: SuggestedWorkoutDestination | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  goalDashboard: GoalDashboard;
};

export type GoalDashboardCard = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "positive" | "attention";
};

export type GoalDashboard = {
  headline: string;
  emphasisLabel: string;
  summary: string;
  cards: GoalDashboardCard[];
};

function sortSessionsDescending(sessions: WorkoutSession[]) {
  return [...sessions].sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getSessionVolume(session: WorkoutSession) {
  return session.exercises.flatMap((exercise) => exercise.sets).reduce((sum, set) => sum + set.weight * set.reps, 0);
}

function getWeeklySummary(profile: Profile, sessions: WorkoutSession[], referenceDate = new Date()): WeeklySummary {
  const weeklySessions = getCurrentWeekSessions(sessions, referenceDate);
  const totalSets = weeklySessions.reduce(
    (sum, session) => sum + session.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.length, 0),
    0,
  );
  const totalVolume = weeklySessions.reduce((sum, session) => sum + getSessionVolume(session), 0);
  const muscleCount = weeklySessions
    .flatMap((session) => session.exercises.map((exercise) => exercise.muscleGroup))
    .reduce<Record<string, number>>((accumulator, muscle) => {
      accumulator[muscle] = (accumulator[muscle] ?? 0) + 1;
      return accumulator;
    }, {});
  const mostTrainedMuscleGroup =
    Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    profile.workoutPlan[0].exercises[0].muscleGroup;
  const workoutsCompleted = weeklySessions.length;
  const consistencyLabel =
    workoutsCompleted >= 4
      ? "Excellent momentum this week"
      : workoutsCompleted >= 2
        ? "Solid consistency and steady progress"
        : "Building rhythm with a clean start";

  return {
    userId: profile.id,
    workoutsCompleted,
    totalSets,
    totalVolume,
    personalBests: Math.max(1, Math.min(weeklySessions.length, 3)),
    mostTrainedMuscleGroup,
    consistencyLabel,
  };
}

function getWorkoutStreak(sessions: WorkoutSession[], referenceDate = new Date()) {
  const uniqueDays = Array.from(new Set(sessions.map((session) => new Date(session.performedAt).toDateString())));
  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(referenceDate);
  while (true) {
    if (uniqueDays.includes(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (uniqueDays.includes(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }
    break;
  }

  return streak;
}

function getTrendData(sessions: WorkoutSession[]) {
  return sessions
    .slice()
    .reverse()
    .map((session) => ({
      date: new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(session.performedAt)),
      volume: getSessionVolume(session),
    }));
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function buildGoalDashboard(profile: Profile, trainingLoad: WeeklyTrainingLoad, weeklySummary: WeeklySummary, streak: number): GoalDashboard {
  const priorityZones = getProfilePriorityZones(profile.id);
  const priorityMetrics = priorityZones
    .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
    .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));

  const priorityAverage = average(priorityMetrics.map((metric) => metric.percentage));
  const coveredPriorityCount = priorityMetrics.filter((metric) => metric.effectiveSets > 0).length;
  const laggingPriorityMetrics = [...priorityMetrics]
    .sort((a, b) => a.percentage - b.percentage || a.effectiveSets - b.effectiveSets)
    .slice(0, 3);
  const strongestPriorityMetrics = [...priorityMetrics]
    .filter((metric) => metric.effectiveSets > 0)
    .sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets)
    .slice(0, 2);

  const weeklyExecutionTarget = profile.id === "joshua" ? 4 : 4;
  const executionTone: GoalDashboardCard["tone"] =
    weeklySummary.workoutsCompleted >= weeklyExecutionTarget
      ? "positive"
      : weeklySummary.workoutsCompleted >= 2
        ? "neutral"
        : "attention";

  if (profile.id === "joshua") {
    const upperBodyZones = ["upperChest", "midChest", "sideDelts", "rearDelts", "lats", "biceps", "triceps"] as const;
    const upperBodyMetrics = upperBodyZones
      .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
      .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));
    const chestDeltLatMetrics = ["upperChest", "midChest", "sideDelts", "rearDelts", "lats"]
      .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
      .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));
    const coreMetrics = ["upperAbs", "lowerAbs"]
      .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
      .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));

    return {
      headline: "Upper-body shape is the main driver this week.",
      emphasisLabel: "Chest, delts, lats, arms, and core",
      summary: `${
        strongestPriorityMetrics.length
          ? `On track with ${strongestPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")}.`
          : "Still building the main upper-body regions."
      } ${
        laggingPriorityMetrics.length
          ? `${laggingPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} need more attention.`
          : ""
      }`,
      cards: [
        {
          label: "Upper body coverage",
          value: `${average(upperBodyMetrics.map((metric) => metric.percentage))}%`,
          detail: `${upperBodyMetrics.filter((metric) => metric.effectiveSets > 0).length}/${upperBodyMetrics.length} key upper-body zones trained this week.`,
          tone: average(upperBodyMetrics.map((metric) => metric.percentage)) >= 70 ? "positive" : "neutral",
        },
        {
          label: "Chest / delts / lats",
          value: `${average(chestDeltLatMetrics.map((metric) => metric.percentage))}%`,
          detail: `${laggingPriorityMetrics.slice(0, 2).map((metric) => metric.label).join(" + ")} are the main catch-up areas.`,
          tone: average(chestDeltLatMetrics.map((metric) => metric.percentage)) >= 65 ? "positive" : "attention",
        },
        {
          label: "Core consistency",
          value: `${average(coreMetrics.map((metric) => metric.percentage))}%`,
          detail: `${coreMetrics.filter((metric) => metric.effectiveSets > 0).length}/${coreMetrics.length} core priority zones have work logged.`,
          tone: average(coreMetrics.map((metric) => metric.percentage)) >= 55 ? "neutral" : "attention",
        },
        {
          label: "Weekly execution",
          value: `${weeklySummary.workoutsCompleted}/${weeklyExecutionTarget}`,
          detail: `${trainingLoad.activeDays.size} training days and a ${streak}d streak feeding momentum.`,
          tone: executionTone,
        },
        {
          label: "Priority zones hit",
          value: `${coveredPriorityCount}/${priorityMetrics.length}`,
          detail: `${priorityAverage}% average completion across Joshua's main physique targets.`,
          tone: priorityAverage >= 65 ? "positive" : "neutral",
        },
      ],
    };
  }

  const gluteMetrics = ["upperGlutes", "gluteMax", "sideGlutes"]
    .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
    .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));
  const shapeMetrics = ["lats", "upperBack", "sideDelts"]
    .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
    .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));
  const coreMetrics = ["lowerAbs", "obliques"]
    .map((zoneId) => trainingLoad.metrics.find((metric) => metric.id === zoneId))
    .filter((metric): metric is WeeklyTrainingLoad["metrics"][number] => Boolean(metric));

  return {
    headline: "Shape, glute emphasis, and back detail are leading this week.",
    emphasisLabel: "Glutes, back width, waist detail, and shoulder shape",
    summary: `${
      strongestPriorityMetrics.length
        ? `Glute and shape work is moving through ${strongestPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")}.`
        : "Still building Natasha's main shape drivers."
    } ${
      laggingPriorityMetrics.length
        ? `${laggingPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} need more attention.`
        : ""
    }`,
    cards: [
      {
        label: "Glute coverage",
        value: `${average(gluteMetrics.map((metric) => metric.percentage))}%`,
        detail: `${gluteMetrics.filter((metric) => metric.effectiveSets > 0).length}/${gluteMetrics.length} glute regions trained this week.`,
        tone: average(gluteMetrics.map((metric) => metric.percentage)) >= 70 ? "positive" : "neutral",
      },
      {
        label: "Back / shape coverage",
        value: `${average(shapeMetrics.map((metric) => metric.percentage))}%`,
        detail: `${shapeMetrics.filter((metric) => metric.effectiveSets > 0).length}/${shapeMetrics.length} shape-defining upper-body regions are moving.`,
        tone: average(shapeMetrics.map((metric) => metric.percentage)) >= 60 ? "positive" : "attention",
      },
      {
        label: "Core consistency",
        value: `${average(coreMetrics.map((metric) => metric.percentage))}%`,
        detail: `${coreMetrics.filter((metric) => metric.effectiveSets > 0).length}/${coreMetrics.length} waist-detail regions have work logged.`,
        tone: average(coreMetrics.map((metric) => metric.percentage)) >= 55 ? "neutral" : "attention",
      },
      {
        label: "Weekly execution",
        value: `${weeklySummary.workoutsCompleted}/${weeklyExecutionTarget}`,
        detail: `${trainingLoad.activeDays.size} training days and a ${streak}d streak this week.`,
        tone: executionTone,
      },
      {
        label: "Priority zones hit",
        value: `${coveredPriorityCount}/${priorityMetrics.length}`,
        detail: `${priorityAverage}% average completion across Natasha's main physique targets.`,
        tone: priorityAverage >= 65 ? "positive" : "neutral",
      },
    ],
  };
}

export function getProfileTrainingState(
  profile: Profile,
  allSessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate = new Date(),
): ProfileTrainingState {
  const userSessions = sortSessionsDescending(allSessions.filter((session) => session.userId === profile.id));
  const trainingLoad = getWeeklyTrainingLoad(userSessions, profile.id, referenceDate);
  const weeklySummary = getWeeklySummary(profile, userSessions, referenceDate);
  const streak = getWorkoutStreak(userSessions, referenceDate);

  return {
    userSessions,
    totalWorkouts: userSessions.length,
    weeklyCount: trainingLoad.activeDays.size,
    streak,
    recentWorkouts: userSessions.slice(0, 3),
    recentSessions: userSessions.slice(0, 4),
    trendData: getTrendData(userSessions),
    weeklySummary,
    trainingLoad,
    calendarRows: getWeeklyCalendarRows(userSessions, 6, referenceDate),
    nextFocusDestination: getSuggestedWorkoutDestination(
      profile.id,
      profile.workoutPlan,
      trainingLoad.summary.suggestedNextFocus,
      trainingLoad.recentLoad,
    ),
    suggestedFocusSession: getSuggestedFocusSession(
      profile.id,
      profile.workoutPlan,
      trainingLoad.summary.suggestedNextFocus,
      exerciseLibrary,
      trainingLoad.recentLoad,
    ),
    goalDashboard: buildGoalDashboard(profile, trainingLoad, weeklySummary, streak),
  };
}

export function getProfileSessions(allSessions: WorkoutSession[], userId: Profile["id"]) {
  return sortSessionsDescending(allSessions.filter((session) => session.userId === userId));
}

export function getWeeklyWorkoutCount(sessions: WorkoutSession[], referenceDate = new Date()) {
  return getCurrentWeekSessions(sessions, referenceDate).length;
}

export function getCurrentWeekLabel(referenceDate = new Date()) {
  return getCurrentWeekWindow(referenceDate).label;
}
