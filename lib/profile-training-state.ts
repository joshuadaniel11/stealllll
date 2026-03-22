import {
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getExerciseMuscleContribution,
  getProfilePriorityZones,
  getSuggestedFocusSession,
  getSuggestedWorkoutDestination,
  getWeeklyCalendarRows,
  getWeeklyTrainingLoad,
  TRAINING_LOAD_ZONE_META,
} from "@/lib/training-load";
import type { SuggestedFocusSession, SuggestedWorkoutDestination, WeeklyTrainingLoad } from "@/lib/training-load";
import type { ActiveWorkout, ExerciseLibraryItem, Profile, WeeklySummary, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

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
  todaySession: TodaySession;
  goalDashboard: GoalDashboard;
  progressSignals: ProgressSignals;
};

export type TodaySessionExercise = {
  id: string;
  order: number;
  name: string;
  role: "primary" | "support" | "finisher";
  primaryRegion: string;
  secondaryRegions: string[];
  sets: number;
  repRange: string;
  lastPerformance?: string;
  targetCue?: string;
  swapEnabled: boolean;
};

export type TodaySession = {
  status: "ready" | "resume" | "low-activity" | "recovery";
  title: string;
  subtitle: string;
  sessionTypeLabel: string;
  estimatedDurationMin: number;
  focusRegions: string[];
  why: {
    summary: string;
    insightChips: string[];
    coverage: Array<{ region: string; completionPct: number }>;
  };
  plan: {
    source: "template" | "generated";
    exercises: TodaySessionExercise[];
    totalExercises: number;
  };
  notes: string[];
  cta: {
    primaryLabel: string;
    action: "start" | "resume";
  };
  workoutId: string;
  workoutName: string;
  generatedSession: SuggestedFocusSession | null;
  canStartDirectly: boolean;
  resumeSource: "active" | "partial" | null;
  partialSessionId: string | null;
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

function getRotationalWorkout(profile: Profile, sessions: WorkoutSession[], overrideWorkoutId: string | null) {
  if (overrideWorkoutId) {
    return profile.workoutPlan.find((workout) => workout.id === overrideWorkoutId) ?? profile.workoutPlan[0];
  }

  if (!sessions.length) {
    return profile.workoutPlan[0];
  }

  const lastSession = sessions[0];
  const currentIndex = profile.workoutPlan.findIndex((workout) => workout.id === lastSession.workoutDayId);
  if (currentIndex === -1) {
    return profile.workoutPlan[0];
  }
  return profile.workoutPlan[(currentIndex + 1) % profile.workoutPlan.length];
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

function getExerciseLastPerformance(exerciseName: string, sessions: WorkoutSession[]) {
  for (const session of sessions) {
    const match = session.exercises.find((exercise) => exercise.exerciseName === exerciseName);
    if (!match) {
      continue;
    }
    const completedSet = [...match.sets].reverse().find((set) => set.completed && (set.weight > 0 || set.reps > 0));
    if (!completedSet) {
      continue;
    }
    if (completedSet.weight > 0) {
      return `${completedSet.weight} kg × ${completedSet.reps}`;
    }
    return `${completedSet.reps} reps`;
  }
  return undefined;
}

function getExerciseRegionLabels(exerciseName: string, muscleGroup: WorkoutSession["exercises"][number]["muscleGroup"]) {
  const contribution = getExerciseMuscleContribution({ exerciseName, muscleGroup });
  return Object.entries(contribution)
    .sort((a, b) => b[1] - a[1])
    .map(([zoneId]) => TRAINING_LOAD_ZONE_META[zoneId as keyof typeof TRAINING_LOAD_ZONE_META].label)
    .slice(0, 3);
}

function getSessionTypeLabel(profileId: Profile["id"], status: TodaySession["status"], focusRegions: string[]) {
  if (status === "resume") {
    return "Resume session";
  }
  if (status === "low-activity") {
    return profileId === "joshua" ? "Restart session" : "Restart session";
  }
  if (status === "recovery") {
    return profileId === "joshua" ? "Recovery-aware build" : "Recovery-aware shape";
  }
  if (focusRegions.some((label) => /chest|delts|lats|arms/i.test(label))) {
    return profileId === "joshua" ? "Build session" : "Shape session";
  }
  if (focusRegions.some((label) => /glute|waist|obliques/i.test(label))) {
    return profileId === "natasha" ? "Sculpt session" : "Catch-up session";
  }
  return profileId === "joshua" ? "Push session" : "Shape session";
}

function buildTodaySession(
  profile: Profile,
  sessions: WorkoutSession[],
  trainingLoad: WeeklyTrainingLoad,
  nextFocusDestination: SuggestedWorkoutDestination | null,
  suggestedFocusSession: SuggestedFocusSession | null,
  workoutOverrideId: string | null,
  activeWorkout: ActiveWorkout | null,
): TodaySession {
  const rotatedWorkout = getRotationalWorkout(profile, sessions, workoutOverrideId);
  const workout =
    (workoutOverrideId ? profile.workoutPlan.find((item) => item.id === workoutOverrideId) : null) ??
    (suggestedFocusSession?.sourceWorkoutId
      ? profile.workoutPlan.find((item) => item.id === suggestedFocusSession.sourceWorkoutId) ?? null
      : null) ??
    (nextFocusDestination ? profile.workoutPlan.find((item) => item.id === nextFocusDestination.workoutId) ?? null : null) ??
    rotatedWorkout;
  const latestPartialSession =
    activeWorkout?.userId === profile.id
      ? null
      : sessions.find((session) => session.partial && session.workoutDayId === workout.id) ?? null;
  const focusRegions = trainingLoad.summary.suggestedNextFocus.labels.slice(0, 2);
  const focusCoverage = trainingLoad.summary.suggestedNextFocus.zoneIds
    .map((zoneId) => ({
      region: TRAINING_LOAD_ZONE_META[zoneId].label,
      completionPct: trainingLoad.metrics.find((metric) => metric.id === zoneId)?.percentage ?? 0,
    }))
    .slice(0, 2);
  const recentPenaltyAverage =
    trainingLoad.summary.suggestedNextFocus.zoneIds.reduce(
      (sum, zoneId) => sum + (trainingLoad.recentLoad.zonePenalties[zoneId] ?? 0),
      0,
    ) / Math.max(1, trainingLoad.summary.suggestedNextFocus.zoneIds.length);
  const status: TodaySession["status"] =
    activeWorkout?.userId === profile.id || latestPartialSession
      ? "resume"
      : trainingLoad.summary.lowActivity
        ? "low-activity"
        : recentPenaltyAverage >= 0.58
          ? "recovery"
          : "ready";
  const rawPlanExercises = suggestedFocusSession?.exercises.length
    ? suggestedFocusSession.exercises.map((exercise) => ({
        id: exercise.exerciseId ?? `${workout.id}-${exercise.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets ?? 3,
        repRange: exercise.repRange ?? "10-12",
        note: exercise.note,
      }))
    : workout.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets,
        repRange: exercise.repRange,
        note: exercise.note,
      }));
  const planExercises = (status === "low-activity" ? rawPlanExercises.slice(0, 3) : rawPlanExercises).map((exercise, index, array) => {
    const regionLabels = getExerciseRegionLabels(exercise.name, exercise.muscleGroup);
    return {
      id: exercise.id,
      order: index + 1,
      name: exercise.name,
      role: index === 0 || index === 1 ? "primary" : index === array.length - 1 ? "finisher" : "support",
      primaryRegion: regionLabels[0] ?? exercise.muscleGroup,
      secondaryRegions: regionLabels.slice(1),
      sets: exercise.sets,
      repRange: exercise.repRange,
      lastPerformance: getExerciseLastPerformance(exercise.name, sessions),
      targetCue: exercise.note,
      swapEnabled: true,
    } satisfies TodaySessionExercise;
  });
  const estimatedDurationMin =
    suggestedFocusSession?.estimatedDurationMinutes ??
    (status === "low-activity" ? Math.max(24, Math.round(workout.durationMinutes * 0.6)) : workout.durationMinutes);
  const sessionTypeLabel = getSessionTypeLabel(profile.id, status, focusRegions);
  const title = `${trainingLoad.summary.suggestedNextFocus.text} Session`;
  const subtitle =
    status === "resume"
      ? activeWorkout?.userId === profile.id
        ? `${activeWorkout.workoutName} is still open and ready to continue.`
        : `${latestPartialSession?.workoutName ?? workout.name} has progress saved and is ready to resume.`
      : status === "low-activity"
        ? `A shorter restart session built from your highest-priority regions while this week's load data fills in.`
        : status === "recovery"
          ? `Today's plan leans into fresher work while still moving your main physique priorities forward.`
          : `Today's workout plan is shaped around your current-week focus gaps and the best matching template available.`;
  const whySummary =
    status === "low-activity"
      ? `Current-week load is still sparse, so this session starts from your highest-priority regions for ${profile.name}.`
      : `Current-week training load points to ${focusRegions.join(" + ")} as the clearest next push, so the session plan leans into those regions first.`;
  const insightChips = Array.from(
    new Set([
      sessionTypeLabel,
      `${planExercises.length} exercises`,
      nextFocusDestination?.workoutName ?? workout.name,
    ]),
  ).slice(0, 3);
  const notes = [
    status === "resume"
      ? "Pick up where you left off and keep the session clean."
      : `Lead with ${focusRegions[0] ?? "your main priority"} while the session is freshest.`,
    status === "recovery"
      ? "Keep reps smooth and leave a clean rep in reserve on the first main movement."
      : "Let the first two exercises do the heavy lifting for today's result.",
    profile.id === "joshua"
      ? "Chase width, fullness, and crisp execution instead of chasing junk volume."
      : "Keep the shape work controlled so glutes, back, and waist detail all read clearly.",
  ].slice(0, 3);
  const planSource: TodaySession["plan"]["source"] =
    suggestedFocusSession && (suggestedFocusSession.isFallback || suggestedFocusSession.exercises.length !== workout.exercises.length)
      ? "generated"
      : "template";

  return {
    status,
    title,
    subtitle,
    sessionTypeLabel,
    estimatedDurationMin,
    focusRegions,
    why: {
      summary: whySummary,
      insightChips,
      coverage: focusCoverage,
    },
    plan: {
      source: planSource,
      exercises: planExercises,
      totalExercises: planExercises.length,
    },
    notes,
    cta: {
      primaryLabel: status === "resume" ? "Resume session" : "Start session",
      action: status === "resume" ? "resume" : "start",
    },
    workoutId: workout.id,
    workoutName: workout.name,
    generatedSession: suggestedFocusSession,
    canStartDirectly: Boolean(suggestedFocusSession?.canStartDirectly),
    resumeSource: activeWorkout?.userId === profile.id ? "active" : latestPartialSession ? "partial" : null,
    partialSessionId: latestPartialSession?.id ?? null,
  };
}

export function selectTodaySession(
  profile: Profile,
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  options?: {
    workoutOverrideId?: string | null;
    activeWorkout?: ActiveWorkout | null;
  },
  referenceDate = new Date(),
): TodaySession {
  const trainingLoad = getWeeklyTrainingLoad(sessions, profile.id, referenceDate);
  const nextFocusDestination = getSuggestedWorkoutDestination(
    profile.id,
    profile.workoutPlan,
    trainingLoad.summary.suggestedNextFocus,
    trainingLoad.recentLoad,
  );
  const suggestedFocusSession = getSuggestedFocusSession(
    profile.id,
    profile.workoutPlan,
    trainingLoad.summary.suggestedNextFocus,
    exerciseLibrary,
    trainingLoad.recentLoad,
  );

  return buildTodaySession(
    profile,
    sessions,
    trainingLoad,
    nextFocusDestination,
    suggestedFocusSession,
    options?.workoutOverrideId ?? null,
    options?.activeWorkout ?? null,
  );
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
  const strengthMomentumLabel =
    trendData.length < 3 ? "Starting" : recentVolume > previousVolume ? "Rising" : recentVolume < previousVolume ? "Steadying" : "Stable";

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

export function getProfileTrainingState(
  profile: Profile,
  allSessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  options?: {
    workoutOverrideId?: string | null;
    activeWorkout?: ActiveWorkout | null;
  },
  referenceDate = new Date(),
): ProfileTrainingState {
  const userSessions = sortSessionsDescending(allSessions.filter((session) => session.userId === profile.id));
  const trainingLoad = getWeeklyTrainingLoad(userSessions, profile.id, referenceDate);
  const weeklySummary = getWeeklySummary(profile, userSessions, referenceDate);
  const streak = getWorkoutStreak(userSessions, referenceDate);
  const trendData = getTrendData(userSessions);

  const nextFocusDestination = getSuggestedWorkoutDestination(
    profile.id,
    profile.workoutPlan,
    trainingLoad.summary.suggestedNextFocus,
    trainingLoad.recentLoad,
  );
  const suggestedFocusSession = getSuggestedFocusSession(
    profile.id,
    profile.workoutPlan,
    trainingLoad.summary.suggestedNextFocus,
    exerciseLibrary,
    trainingLoad.recentLoad,
  );

  return {
    userSessions,
    totalWorkouts: userSessions.length,
    weeklyCount: trainingLoad.activeDays.size,
    streak,
    recentWorkouts: userSessions.slice(0, 3),
    recentSessions: userSessions.slice(0, 4),
    trendData,
    weeklySummary,
    trainingLoad,
    calendarRows: getWeeklyCalendarRows(userSessions, 6, referenceDate),
    nextFocusDestination,
    suggestedFocusSession,
    todaySession: selectTodaySession(profile, userSessions, exerciseLibrary, options, referenceDate),
    goalDashboard: buildGoalDashboard(profile, trainingLoad, weeklySummary, streak),
    progressSignals: buildProgressSignals(profile, userSessions, trendData, weeklySummary, 0),
  };
}

export function getProfileSessions(allSessions: WorkoutSession[], userId: Profile["id"]) {
  return sortSessionsDescending(allSessions.filter((session) => session.userId === userId));
}
