import {
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getExerciseMuscleContribution,
  getProfilePriorityZones,
  getSuggestedFocusSession,
  getSuggestedWorkoutDestination,
  getWeeklyCalendarRows,
  getWeeklyTrainingLoad,
} from "@/lib/training-load";
import {
  getProfileTrainingMetrics,
  selectNextFocusFromMetrics,
  type ProfileTrainingMetrics,
} from "@/lib/training-metrics";
import type { SuggestedFocusSession, SuggestedWorkoutDestination, WeeklyTrainingLoad } from "@/lib/training-load";
import type { ExerciseLibraryItem, Profile, StretchCompletion, WeeklySummary, WorkoutSession } from "@/lib/types";

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
  metrics: ProfileTrainingMetrics;
  insights: TrainingInsights;
  goalDashboard: GoalDashboard;
  progressSignals: ProgressSignals;
};

export type TrainingInsights = {
  homeAction: string;
  completionNext: string;
  weeklyStatusTitle: string;
  weeklyStatusDetail: string;
  focusDirection: string;
  progressSignal: string;
};

export type GoalDashboardCard = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "positive" | "attention";
};

export type GoalDashboard = {
  label: string;
  headline: string;
  emphasisLabel: string;
  summary: string;
  cards: GoalDashboardCard[];
};

export type ProgressSignal = {
  title: string;
  value: string;
  detail: string;
};

export type ProgressSignals = {
  leadingIndicator: ProgressSignal;
  primarySignal: ProgressSignal;
  supportSignal: ProgressSignal;
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
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function getRecentZoneExposure(sessions: WorkoutSession[], limit = 8) {
  const recentSessions = sessions.slice(0, limit);
  const zoneExposure: Record<string, number> = {};

  for (const session of recentSessions) {
    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed).length;
      if (!completedSets) {
        continue;
      }

      const contribution = getExerciseMuscleContribution({
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
      });

      for (const [zoneId, score] of Object.entries(contribution)) {
        zoneExposure[zoneId] = (zoneExposure[zoneId] ?? 0) + score * completedSets;
      }
    }
  }

  return zoneExposure;
}

function getExposureTotal(zoneExposure: Record<string, number>, zoneIds: string[]) {
  return Math.round(zoneIds.reduce((sum, zoneId) => sum + (zoneExposure[zoneId] ?? 0), 0) * 10) / 10;
}

function getWeeklyStretchCount(
  stretchCompletions: StretchCompletion[],
  userId: Profile["id"],
  referenceDate: Date,
) {
  const week = getCurrentWeekWindow(referenceDate);
  return stretchCompletions.filter((completion) => {
    if (completion.userId !== userId) {
      return false;
    }
    const date = new Date(completion.date);
    return date >= week.start && date <= week.end;
  }).length;
}

function buildProgressSignals(
  profile: Profile,
  sessions: WorkoutSession[],
  trendData: TrendPoint[],
  weeklySummary: WeeklySummary,
  weeklyStretchCount: number,
): ProgressSignals {
  const zoneExposure = getRecentZoneExposure(sessions);
  const chestExposure = getExposureTotal(zoneExposure, ["upperChest", "midChest", "lowerChest"]);
  const backExposure = getExposureTotal(zoneExposure, ["lats", "upperBack", "midBack"]);
  const gluteExposure = getExposureTotal(zoneExposure, ["upperGlutes", "gluteMax", "sideGlutes"]);
  const coreExposure = getExposureTotal(zoneExposure, ["upperAbs", "lowerAbs", "obliques"]);
  const shoulderExposure = getExposureTotal(zoneExposure, ["frontDelts", "sideDelts", "rearDelts"]);
  const recentVolume = trendData.slice(-2).reduce((sum, item) => sum + item.volume, 0);
  const previousVolume = trendData.slice(-4, -2).reduce((sum, item) => sum + item.volume, 0);
  const totalRecentExposure = chestExposure + backExposure + gluteExposure + coreExposure + shoulderExposure;
  const hasMeaningfulTrainingSignal = weeklySummary.workoutsCompleted > 0 || totalRecentExposure > 0.5;
  const strengthMomentumLabel =
    trendData.length < 3 ? "Starting" : recentVolume > previousVolume ? "Rising" : recentVolume < previousVolume ? "Steadying" : "Stable";

  if (!hasMeaningfulTrainingSignal) {
    if (profile.id === "natasha") {
      return {
        leadingIndicator: {
          title: "Shape signal",
          value: "Waiting on first session",
          detail: "Log a workout and your glute, back, and waist trend will start reading clearly here.",
        },
        primarySignal: {
          title: "Current focus",
          value: "Fresh week",
          detail: "No meaningful load yet. Start the first session and let the shape signals build from real work.",
        },
        supportSignal: {
          title: "Support signal",
          value: weeklyStretchCount > 0 ? "Mobility in motion" : "Mobility ready",
          detail:
            weeklyStretchCount > 0
              ? `${weeklyStretchCount} mobility session${weeklyStretchCount === 1 ? "" : "s"} logged this week.`
              : "Mobility is ready when you want a quick reset between sessions.",
        },
      };
    }

    return {
      leadingIndicator: {
        title: "Build signal",
        value: "Waiting on first session",
        detail: "Log a workout and your chest, back, and arm trend will start reading clearly here.",
      },
      primarySignal: {
        title: "Current focus",
        value: "Fresh week",
        detail: "No meaningful load yet. Start the first session and let the upper-body signals build from real work.",
      },
      supportSignal: {
        title: "Support signal",
        value: weeklyStretchCount > 0 ? "Mobility in motion" : "Mobility ready",
        detail:
          weeklyStretchCount > 0
            ? `${weeklyStretchCount} mobility session${weeklyStretchCount === 1 ? "" : "s"} logged this week.`
            : "Mobility is ready when you want a quick reset between sessions.",
      },
    };
  }

  if (profile.id === "natasha") {
    return {
      leadingIndicator: {
        title: "Glute growth",
        value: `${gluteExposure.toFixed(1)} load`,
        detail: `Recent glute-biased work is carrying about ${gluteExposure.toFixed(1)} effective-load points, with ${weeklySummary.totalSets} total sets backing the shape work.`,
      },
      primarySignal: {
        title: "Current focus",
        value: backExposure >= shoulderExposure ? "Back definition" : "Shape balance",
        detail:
          backExposure >= shoulderExposure
            ? `Back and lat work are leading at ${backExposure.toFixed(1)} recent load points, which keeps width and upper-body shape moving.`
            : `Shoulder and upper-shape work are stacking with ${shoulderExposure.toFixed(1)} recent load points to keep silhouette contrast building.`,
      },
      supportSignal: {
        title: "Support signal",
        value: "Waist detail",
        detail: `Core work is contributing ${coreExposure.toFixed(1)} recent load points, with ${weeklyStretchCount} stretch sessions helping the look stay consistent.`,
      },
    };
  }

  return {
    leadingIndicator: {
      title: "Chest growth",
      value: `${chestExposure.toFixed(1)} load`,
      detail: `Recent pressing and chest work are carrying about ${chestExposure.toFixed(1)} effective-load points, which is the clearest size signal in the current run.`,
    },
    primarySignal: {
      title: "Current focus",
      value: "Strength momentum",
      detail: `${strengthMomentumLabel} right now, with back and shoulder support work adding ${(backExposure + shoulderExposure).toFixed(1)} recent load points around the main upper-body push.`,
    },
    supportSignal: {
      title: "Support signal",
      value: "Abs visibility",
      detail: `Core work is contributing ${coreExposure.toFixed(1)} recent load points, with ${weeklyStretchCount} stretch sessions helping that harder look stay consistent.`,
    },
  };
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
      label: "Upper-body build",
      headline: "Drive width, chest fullness, and sharper arm detail.",
      emphasisLabel: "Chest, delts, lats, arms",
      summary: `${
        strongestPriorityMetrics.length
          ? `${strongestPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} are moving well.`
          : "Upper-body momentum is still building."
      } ${
        laggingPriorityMetrics.length
          ? `${laggingPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} need more work next.`
          : ""
      }`,
      cards: [
        {
          label: "Upper-body build",
          value: `${average(upperBodyMetrics.map((metric) => metric.percentage))}%`,
          detail: `${upperBodyMetrics.filter((metric) => metric.effectiveSets > 0).length}/${upperBodyMetrics.length} key zones touched this week.`,
          tone: average(upperBodyMetrics.map((metric) => metric.percentage)) >= 70 ? "positive" : "neutral",
        },
        {
          label: "Width stack",
          value: `${average(chestDeltLatMetrics.map((metric) => metric.percentage))}%`,
          detail: `${laggingPriorityMetrics.slice(0, 2).map((metric) => metric.label).join(" + ")} are the main catch-up zones.`,
          tone: average(chestDeltLatMetrics.map((metric) => metric.percentage)) >= 65 ? "positive" : "attention",
        },
        {
          label: "Core sharpness",
          value: `${average(coreMetrics.map((metric) => metric.percentage))}%`,
          detail: `${coreMetrics.filter((metric) => metric.effectiveSets > 0).length}/${coreMetrics.length} core zones have real work logged.`,
          tone: average(coreMetrics.map((metric) => metric.percentage)) >= 55 ? "neutral" : "attention",
        },
        {
          label: "Session rhythm",
          value: `${weeklySummary.workoutsCompleted}/${weeklyExecutionTarget}`,
          detail: `${trainingLoad.activeDays.size} training days and a ${streak}d streak keeping momentum up.`,
          tone: executionTone,
        },
        {
          label: "Priority coverage",
          value: `${coveredPriorityCount}/${priorityMetrics.length}`,
          detail: `${priorityAverage}% average completion across Joshua's main growth targets.`,
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
    label: "Shape focus",
    headline: "Build glute fullness, back detail, and a tighter waist line.",
    emphasisLabel: "Glutes, back shape, waist detail",
    summary: `${
      strongestPriorityMetrics.length
        ? `${strongestPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} are landing well.`
        : "Shape-building momentum is still starting up."
    } ${
      laggingPriorityMetrics.length
        ? `${laggingPriorityMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} need more attention next.`
        : ""
    }`,
    cards: [
      {
        label: "Glute curve",
        value: `${average(gluteMetrics.map((metric) => metric.percentage))}%`,
        detail: `${gluteMetrics.filter((metric) => metric.effectiveSets > 0).length}/${gluteMetrics.length} glute regions trained this week.`,
        tone: average(gluteMetrics.map((metric) => metric.percentage)) >= 70 ? "positive" : "neutral",
      },
      {
        label: "Back shape",
        value: `${average(shapeMetrics.map((metric) => metric.percentage))}%`,
        detail: `${shapeMetrics.filter((metric) => metric.effectiveSets > 0).length}/${shapeMetrics.length} shape-defining upper-body zones are moving.`,
        tone: average(shapeMetrics.map((metric) => metric.percentage)) >= 60 ? "positive" : "attention",
      },
      {
        label: "Waist detail",
        value: `${average(coreMetrics.map((metric) => metric.percentage))}%`,
        detail: `${coreMetrics.filter((metric) => metric.effectiveSets > 0).length}/${coreMetrics.length} waist-detail zones have work logged.`,
        tone: average(coreMetrics.map((metric) => metric.percentage)) >= 55 ? "neutral" : "attention",
      },
      {
        label: "Session rhythm",
        value: `${weeklySummary.workoutsCompleted}/${weeklyExecutionTarget}`,
        detail: `${trainingLoad.activeDays.size} training days and a ${streak}d streak this week.`,
        tone: executionTone,
      },
      {
        label: "Priority coverage",
        value: `${coveredPriorityCount}/${priorityMetrics.length}`,
        detail: `${priorityAverage}% average completion across Natasha's main shape targets.`,
        tone: priorityAverage >= 65 ? "positive" : "neutral",
      },
    ],
  };
}

function getPrimaryFocusLabel(trainingLoad: WeeklyTrainingLoad) {
  return trainingLoad.summary.suggestedNextFocus.labels[0] ?? trainingLoad.summary.suggestedNextFocus.text;
}

function buildTrainingInsights(
  profile: Profile,
  weeklySummary: WeeklySummary,
  trainingLoad: WeeklyTrainingLoad,
  metrics: ProfileTrainingMetrics,
): TrainingInsights {
  const primaryFocusLabel = getPrimaryFocusLabel(trainingLoad);
  const focusDirection = trainingLoad.summary.suggestedNextFocus.text;
  const primaryFocusMetric =
    metrics.regionMetrics.find((metric) => metric.zoneId === trainingLoad.summary.suggestedNextFocus.zoneIds[0]) ?? null;
  const strongestCovered = trainingLoad.summary.mostTrained[0]?.label ?? null;
  const progressLeader = metrics.progressVelocity.leaders[0] ?? null;
  const progressLaggard = metrics.progressVelocity.laggards[0] ?? null;
  const recoveryLow = metrics.recoveryIndex.score < 55;
  const recoverySoft = metrics.recoveryIndex.score < 68;
  const consistencyStrong = metrics.consistencyScore.score >= 75;
  const noTrainingYet = weeklySummary.workoutsCompleted === 0;
  const undercovered = (primaryFocusMetric?.coveragePct ?? 0) < 100;
  const phase1Primary = metrics.phase1Insights.primaryInsight;
  const phase2Recovery = metrics.phase2Insights.recoveryInsight ?? metrics.phase2Insights.fatigueInsight;
  const phase3RepRange = metrics.phase3Insights.repRangeInsight;

  const homeAction = noTrainingYet
    ? `Start with ${focusDirection.toLowerCase()}.`
    : recoveryLow
      ? phase2Recovery ?? `Recovery is slightly low. Keep ${focusDirection.toLowerCase()} clean.`
      : phase1Primary && undercovered
        ? phase1Primary
        : phase3RepRange && undercovered
          ? phase3RepRange
        : `Give ${primaryFocusLabel.toLowerCase()} more this week.`;

  const completionNext = noTrainingYet
    ? `Open progress after the first session and let the week take shape.`
    : recoverySoft
      ? phase2Recovery ?? `Recovery is slightly low. Shift to ${focusDirection.toLowerCase()} next.`
      : strongestCovered && undercovered
        ? `${strongestCovered} are covered. Shift to ${focusDirection.toLowerCase()} next.`
        : `Keep the week moving toward ${focusDirection.toLowerCase()}.`;

  const weeklyStatusTitle =
    noTrainingYet
      ? "No training logged yet this week"
      : recoveryLow
        ? "Recovery is slightly low"
        : undercovered
          ? `${focusDirection} need attention`
          : profile.id === "natasha"
            ? "Shape work is moving well"
            : "Upper-body work is moving well";

  const weeklyStatusDetail =
    noTrainingYet
      ? `Start with ${focusDirection.toLowerCase()}.`
      : recoveryLow
        ? `Keep ${focusDirection.toLowerCase()} clean and skip junk volume.`
        : strongestCovered && undercovered
          ? `${strongestCovered} are covered. ${focusDirection} are next.`
          : consistencyStrong
            ? "The week is holding steady. Keep the rhythm."
            : `Coverage is building, with ${focusDirection.toLowerCase()} still next.`;

  const progressSignal =
    phase3RepRange && undercovered
      ? phase3RepRange
      : progressLeader && progressLeader.score > 2
        ? `${progressLeader.label} work is trending up.`
        : progressLaggard && undercovered
          ? `${progressLaggard.label} is flat. Give it more clean work.`
        : consistencyStrong
          ? "Consistency is holding. Keep the rhythm."
          : profile.id === "natasha"
            ? "Shape work is building cleanly."
            : "Strength is building cleanly.";

  return {
    homeAction,
    completionNext,
    weeklyStatusTitle,
    weeklyStatusDetail,
    focusDirection,
    progressSignal,
  };
}

export function getProfileTrainingState(
  profile: Profile,
  allSessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate = new Date(),
  stretchCompletions: StretchCompletion[] = [],
): ProfileTrainingState {
  const userSessions = sortSessionsDescending(allSessions.filter((session) => session.userId === profile.id));
  const trainingLoad = getWeeklyTrainingLoad(userSessions, profile.id, referenceDate);
  const weeklySummary = getWeeklySummary(profile, userSessions, referenceDate);
  const streak = getWorkoutStreak(userSessions, referenceDate);
  const trendData = getTrendData(userSessions);
  const weeklyStretchCount = getWeeklyStretchCount(stretchCompletions, profile.id, referenceDate);
  const metrics = getProfileTrainingMetrics(profile, userSessions, exerciseLibrary, trainingLoad, referenceDate);
  const suggestedNextFocus = selectNextFocusFromMetrics(profile, trainingLoad, metrics);
  const derivedTrainingLoad = {
    ...trainingLoad,
    summary: {
      ...trainingLoad.summary,
      suggestedNextFocus,
    },
  };
  const insights = buildTrainingInsights(profile, weeklySummary, derivedTrainingLoad, metrics);

  return {
    userSessions,
    totalWorkouts: userSessions.length,
    weeklyCount: trainingLoad.activeDays.size,
    streak,
    recentWorkouts: userSessions.slice(0, 3),
    recentSessions: userSessions.slice(0, 4),
    trendData,
    weeklySummary,
    trainingLoad: derivedTrainingLoad,
    calendarRows: getWeeklyCalendarRows(allSessions, 6, referenceDate),
    nextFocusDestination: getSuggestedWorkoutDestination(
      profile.id,
      profile.workoutPlan,
      suggestedNextFocus,
      derivedTrainingLoad.recentLoad,
    ),
    suggestedFocusSession: getSuggestedFocusSession(
      profile.id,
      profile.workoutPlan,
      suggestedNextFocus,
      exerciseLibrary,
      derivedTrainingLoad.recentLoad,
    ),
    metrics,
    insights,
    goalDashboard: buildGoalDashboard(profile, derivedTrainingLoad, weeklySummary, streak),
    progressSignals: buildProgressSignals(profile, userSessions, trendData, weeklySummary, weeklyStretchCount),
  };
}

export function getProfileSessions(allSessions: WorkoutSession[], userId: Profile["id"]) {
  return sortSessionsDescending(allSessions.filter((session) => session.userId === userId));
}
