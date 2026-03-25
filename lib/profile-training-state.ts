import {
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getExerciseMuscleContribution,
  getProfilePriorityZones,
  getSuggestedFocusSession,
  getSuggestedWorkoutDestination,
  getTargetDisplayLabel,
  getWeeklyCalendarRows,
  getWeeklyTrainingLoad,
} from "@/lib/training-load";
import {
  getProfileTrainingMetrics,
  selectNextFocusFromMetrics,
  type ProfileTrainingMetrics,
} from "@/lib/training-metrics";
import { getWorkoutPrSummary } from "@/lib/progression";
import {
  getWeddingPhaseIndicator,
  getWeddingPhaseProfile,
  getWeddingPriorityMusclesForPhase,
  getWeddingPhaseTransitionCopy,
  type WeddingDateState,
  type WeddingPhase,
  type WeddingPhaseProfile,
  type WeddingUrgencyLevel,
  WeddingDateService,
} from "@/lib/wedding-date";
import type { SuggestedFocusSession, SuggestedWorkoutDestination, WeeklyTrainingLoad } from "@/lib/training-load";
import type {
  AppState,
  ExerciseLibraryItem,
  LiftReadyHistoryEntry,
  LiftReadyReadinessLevel,
  LiftReadyTrend,
  MuscleCeilingLogEntry,
  MuscleCeilingResponse,
  MuscleCeilingState,
  MuscleCeilingType,
  MuscleGroup,
  MonthlyReportArchiveEntry,
  MonthlyReportProfileData,
  MonthlyReportRivalryData,
  Profile,
  StealArchiveEntry,
  StretchCompletion,
  WeeklyRivalryArchiveEntry,
  WeeklySummary,
  WorkoutOverride,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

export type TrendPoint = {
  date: string;
  volume: number;
};

export type ProfileTrainingState = {
  userSessions: WorkoutSession[];
  totalWorkouts: number;
  weeklyCount: number;
  streak: number;
  streakAndMomentum: StreakAndMomentum;
  maturityState: ProfileMaturityState;
  trainingAge: TrainingAgeState;
  restDayState: RestDayState;
  signatureLifts: SignatureLiftsState;
  recentWorkouts: WorkoutSession[];
  recentSessions: WorkoutSession[];
  trendData: TrendPoint[];
  weeklySummary: WeeklySummary;
  trainingLoad: WeeklyTrainingLoad;
  calendarRows: ReturnType<typeof getWeeklyCalendarRows>;
  nextFocusDestination: SuggestedWorkoutDestination | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  weddingDate: WeddingDateState;
  weddingPhaseProfile: WeddingPhaseProfile;
  phaseTransitionLine: string | null;
  progressPhaseIndicator: {
    label: string;
    description: string;
  };
  metrics: ProfileTrainingMetrics;
  insights: TrainingInsights;
  goalDashboard: GoalDashboard;
  progressSignals: ProgressSignals;
};

export type WeeklyRivalryState = {
  joshuaSessions: number;
  natashaSessions: number;
  joshuaVolume: number;
  natashaVolume: number;
  joshuaConsistency: number;
  natashaConsistency: number;
  leader: "joshua" | "natasha" | "tied";
  leaderBy: "sessions" | "volume" | "consistency" | null;
  margin: "close" | "clear" | "dominant";
  weekComplete: boolean;
};

export type StealState = {
  todayIsStolen: boolean;
  stolenBy: "joshua" | "natasha" | null;
  consecutiveSteals: number;
  weekSteals: {
    joshua: number;
    natasha: number;
  };
  lastStealDate: string | null;
};

export type RivalryCardCopy = {
  headline: string;
  highlightName: "Joshua" | "Natasha" | null;
  leaderColorClass: string | null;
  detail: string;
  stealDetail: string | null;
  weddingGoalDetail: string | null;
};

export type WeddingRivalryState = {
  joshuaGoalAdherence: number;
  natashaGoalAdherence: number;
  joshuaOnTrack: boolean;
  natashaOnTrack: boolean;
  goalLeader: "joshua" | "natasha" | "both" | "neither";
  weeklySessionGap: number;
  phaseUrgency: WeddingUrgencyLevel;
  rivalryTone: "relaxed" | "focused" | "sharp" | "final";
};

export type TrainingInsights = {
  homeAction: string;
  liftReadyLine: string | null;
  completionNext: string;
  weeklyStatusTitle: string;
  weeklyStatusDetail: string;
  focusDirection: string;
  progressSignal: string;
};

export type LiftReadyScore = {
  chestScore: number;
  shoulderScore: number;
  pushStrengthScore: number;
  coreScore: number;
  compositeScore: number;
  readinessLevel: LiftReadyReadinessLevel;
  trend: LiftReadyTrend;
};

export type NatashaPriorityLock = {
  lockedPrimary: string[];
  lockedSecondary: string[];
  minimumFrequency: Record<string, number>;
  phaseOverrides: {
    noNewExercises?: boolean;
    noHeavyLoading?: boolean;
    repRangeBias?: "high";
    lightOnly?: boolean;
    noSoreness?: boolean;
    avoidSwelling?: boolean;
  };
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

export type StreakAndMomentum = {
  currentStreak: number;
  longestStreak: number;
  weeklyConsistency: number;
  momentumState: "building" | "steady" | "cooling" | "cold";
  lastSessionDaysAgo: number;
};

export type ProfileMaturityState = {
  isObserving: boolean;
  observationDaysElapsed: number;
  sessionsLogged: number;
  activationTriggered: boolean;
  activationDate: string | null;
};

export type TrainingAgeState = {
  rawSessionCount: number;
  weightedAge: number;
  trainingAgeLabel: string;
  milestone: string | null;
};

export type RestDayState = {
  isRest: boolean;
  restReason: "scheduled" | "recovery_needed" | "user_skipped" | null;
  recoveryScore: number;
  nextBestSession: string;
  nextBestSessionDaysOut: number;
};

export type SignatureLiftEntry = {
  exerciseName: string;
  consistencyScore: number;
  volumeScore: number;
  recencyScore: number;
  compositeScore: number;
  rank: 1 | 2 | 3;
};

export type SignatureLiftsState = {
  ready: boolean;
  signatures: SignatureLiftEntry[];
  basedOnSessions: number;
};

const TRAINING_AGE_MILESTONES = [
  { threshold: "first_session", copy: "It starts here." },
  { threshold: 4, copy: "A month in." },
  { threshold: 12, copy: "Three months. The base is forming." },
  { threshold: 26, copy: "Six months. You know how to train." },
  { threshold: 52, copy: "One year. This is who you are now." },
] as const;

export type MonthlyReportCard = {
  month: string;
  year: number;
  joshua: MonthlyReportProfileData;
  natasha: MonthlyReportProfileData;
  rivalry: MonthlyReportRivalryData;
  closingLine: {
    joshua: string;
    natasha: string;
  };
};

export type WaistProtocol = {
  active: boolean;
  obliquePriority: "low" | "medium" | "high";
  targetMovementTypes: string[];
  setsPerSession: number;
  avoidMovements: string[];
};

export type BackRevealState = {
  active: boolean;
  weeksRemaining: number;
  backPriorityLevel: "elevated" | "high" | "peak";
  targetMuscles: string[];
  movementBias: string[];
  volumeAddition: number;
};

function applyWeddingPhaseToFocus(
  focus: WeeklyTrainingLoad["summary"]["suggestedNextFocus"],
  phaseProfile: WeddingPhaseProfile,
) {
  if (!focus.zoneIds.length || !phaseProfile.priorityMuscles.length) {
    return focus;
  }

  const orderedZoneIds = [...focus.zoneIds].sort((a, b) => {
    const aIndex = phaseProfile.priorityMuscles.indexOf(a);
    const bIndex = phaseProfile.priorityMuscles.indexOf(b);
    const normalizedA = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex;
    const normalizedB = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex;
    return normalizedA - normalizedB;
  });

  return {
    ...focus,
    zoneIds: orderedZoneIds,
    labels: orderedZoneIds.map((zoneId) => focus.labels[focus.zoneIds.indexOf(zoneId)] ?? zoneId).filter(Boolean),
    text: phaseProfile.currentPhase === "wedding_week" ? "This week." : focus.text,
  };
}

export function getNatashaPriorityLock(
  currentPhase: WeddingPhase,
  _weeksRemaining: number,
): NatashaPriorityLock {
  switch (currentPhase) {
    case "build":
      return {
        lockedPrimary: ["gluteMax", "upperGlutes"],
        lockedSecondary: ["lats", "upperBack", "obliques"],
        minimumFrequency: {
          gluteMax: 3,
          upperGlutes: 2,
          lats: 1,
          obliques: 1,
        },
        phaseOverrides: {},
      };
    case "define":
      return {
        lockedPrimary: ["gluteMax", "upperGlutes", "sideGlutes"],
        lockedSecondary: ["lats", "obliques", "upperBack"],
        minimumFrequency: {
          gluteMax: 3,
          upperGlutes: 2,
          sideGlutes: 2,
          lats: 2,
          obliques: 2,
        },
        phaseOverrides: {},
      };
    case "peak":
      return {
        lockedPrimary: ["upperGlutes", "sideGlutes", "lats"],
        lockedSecondary: ["obliques"],
        minimumFrequency: {
          upperGlutes: 2,
          sideGlutes: 1,
          lats: 1,
        },
        phaseOverrides: {
          noNewExercises: true,
          noHeavyLoading: true,
          repRangeBias: "high",
        },
      };
    case "wedding_week":
      return {
        lockedPrimary: ["upperGlutes", "lats"],
        lockedSecondary: [],
        minimumFrequency: {
          upperGlutes: 1,
        },
        phaseOverrides: {
          lightOnly: true,
          noSoreness: true,
          avoidSwelling: true,
        },
      };
    case "complete":
      return {
        lockedPrimary: [],
        lockedSecondary: [],
        minimumFrequency: {},
        phaseOverrides: {},
      };
  }
}

export function getWaistProtocol(
  _natashaHistory: WorkoutSession[],
  currentPhase: WeddingPhase,
): WaistProtocol {
  switch (currentPhase) {
    case "define":
      return {
        active: true,
        obliquePriority: "medium",
        targetMovementTypes: ["cable_oblique", "rotational", "anti_rotation", "lateral_flexion"],
        setsPerSession: 2,
        avoidMovements: ["heavy_side_bends", "weighted_russian_twists_heavy"],
      };
    case "peak":
      return {
        active: true,
        obliquePriority: "high",
        targetMovementTypes: ["cable_oblique", "rotational", "core_vacuum", "lateral_flexion"],
        setsPerSession: 3,
        avoidMovements: [
          "heavy_side_bends",
          "weighted_russian_twists_heavy",
          "heavy_ab_wheel",
          "weighted_situps",
        ],
      };
    case "wedding_week":
      return {
        active: true,
        obliquePriority: "low",
        targetMovementTypes: ["light_rotational", "core_vacuum"],
        setsPerSession: 1,
        avoidMovements: [
          "heavy_side_bends",
          "weighted_russian_twists_heavy",
          "heavy_ab_wheel",
          "weighted_situps",
          "heavy_cable_oblique",
        ],
      };
    default:
      return {
        active: false,
        obliquePriority: "low",
        targetMovementTypes: [],
        setsPerSession: 0,
        avoidMovements: [],
      };
  }
}

export function getBackRevealState(
  _natashaHistory: WorkoutSession[],
  weeksRemaining: number,
  currentPhase: WeddingPhase,
): BackRevealState {
  const active = weeksRemaining <= 8 && (currentPhase === "define" || currentPhase === "peak" || currentPhase === "wedding_week");

  if (!active) {
    return {
      active: false,
      weeksRemaining,
      backPriorityLevel: "elevated",
      targetMuscles: ["lats", "upperBack"],
      movementBias: [],
      volumeAddition: 0,
    };
  }

  if (weeksRemaining <= 1 || currentPhase === "wedding_week") {
    return {
      active: true,
      weeksRemaining,
      backPriorityLevel: "peak",
      targetMuscles: ["lats", "upperBack", "rearDelts"],
      movementBias: ["face_pull", "band_pull_apart", "light_lat_pulldown"],
      volumeAddition: 1,
    };
  }

  if (weeksRemaining <= 4 || currentPhase === "peak") {
    return {
      active: true,
      weeksRemaining,
      backPriorityLevel: "high",
      targetMuscles: ["lats", "upperBack", "rearDelts"],
      movementBias: ["lat_pulldown", "face_pull", "rear_delt", "cable_row"],
      volumeAddition: 2,
    };
  }

  return {
    active: true,
    weeksRemaining,
    backPriorityLevel: "elevated",
    targetMuscles: ["lats", "upperBack"],
    movementBias: ["lat_pulldown", "cable_row", "single_arm_row"],
    volumeAddition: 1,
  };
}

function getWeeklyZoneSessionFrequency(userSessions: WorkoutSession[], referenceDate = new Date()) {
  const weeklySessions = getCurrentWeekSessions(userSessions.filter((session) => !session.partial), referenceDate);
  const frequency: Record<string, number> = {};

  for (const session of weeklySessions) {
    const touchedZones = new Set<string>();
    for (const exercise of session.exercises) {
      if (!exercise.sets.some((set) => set.completed)) {
        continue;
      }
      for (const [zoneId, weight] of Object.entries(getExerciseMuscleContribution(exercise))) {
        if (weight > 0) {
          touchedZones.add(zoneId);
        }
      }
    }
    for (const zoneId of touchedZones) {
      frequency[zoneId] = (frequency[zoneId] ?? 0) + 1;
    }
  }

  return frequency;
}

function applyNatashaPriorityLockToFocus(
  focus: WeeklyTrainingLoad["summary"]["suggestedNextFocus"],
  priorityLock: NatashaPriorityLock,
  weeklyZoneFrequency: Record<string, number>,
) {
  if (!priorityLock.lockedPrimary.length) {
    return focus;
  }

  const orderedPrimary = [...priorityLock.lockedPrimary].sort((a, b) => {
    const aGap = (priorityLock.minimumFrequency[a] ?? 0) - (weeklyZoneFrequency[a] ?? 0);
    const bGap = (priorityLock.minimumFrequency[b] ?? 0) - (weeklyZoneFrequency[b] ?? 0);
    return bGap - aGap;
  });
  const underTargetPrimary = orderedPrimary.filter(
    (zoneId) => (priorityLock.minimumFrequency[zoneId] ?? 0) > (weeklyZoneFrequency[zoneId] ?? 0),
  );
  const remainingPrimary = orderedPrimary.filter((zoneId) => !underTargetPrimary.includes(zoneId));

  const nextZoneIds = Array.from(new Set([
    ...underTargetPrimary,
    ...priorityLock.lockedSecondary,
    ...focus.zoneIds,
    ...remainingPrimary,
  ])) as typeof focus.zoneIds;

  return {
    ...focus,
    zoneIds: nextZoneIds,
    labels: nextZoneIds.map((zoneId) => getTargetDisplayLabel(zoneId)).filter(Boolean),
    text: focus.text,
  };
}

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

function startOfWeekMonday(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
}

function getSessionsBetweenDates(sessions: WorkoutSession[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return sessions.filter((session) => {
    const performedAt = new Date(session.performedAt).getTime();
    return performedAt >= startMs && performedAt <= endMs && !session.partial;
  });
}

function clampPercentScore(value: number) {
  return clamp(Math.round(value), 0, 100);
}

function getZoneWeightedSetsForWindow(sessions: WorkoutSession[], zoneIds: Array<ReturnType<typeof getProfilePriorityZones>[number]>) {
  return sessions.reduce((sum, session) => {
    return (
      sum +
      session.exercises.reduce((exerciseSum, exercise) => {
        const contribution = getExerciseMuscleContribution(exercise);
        const completedSets = exercise.sets.filter((set) => set.completed).length;
        const zoneWeight = zoneIds.reduce((zoneSum, zoneId) => zoneSum + (contribution[zoneId] ?? 0), 0);
        return exerciseSum + completedSets * zoneWeight;
      }, 0)
    );
  }, 0);
}

function getPushStrengthAverage(sessionWindow: WorkoutSession[]) {
  const pushExerciseKeywords = ["press", "dip", "bench"];
  const setScores = sessionWindow.flatMap((session) =>
    session.exercises
      .filter((exercise) => pushExerciseKeywords.some((keyword) => exercise.exerciseName.toLowerCase().includes(keyword)))
      .flatMap((exercise) => exercise.sets.filter((set) => set.completed).map((set) => set.weight * set.reps)),
  );

  if (!setScores.length) {
    return 0;
  }

  return setScores.reduce((sum, value) => sum + value, 0) / setScores.length;
}

function getCoreConsistencyScore(sessionWindow: WorkoutSession[]) {
  if (!sessionWindow.length) {
    return 0;
  }

  const directCoreSessions = sessionWindow.filter((session) =>
    session.exercises.some((exercise) => exercise.muscleGroup === "Core" && exercise.sets.some((set) => set.completed)),
  ).length;

  return clampPercentScore((directCoreSessions / Math.max(1, sessionWindow.length)) * 100);
}

function getReadinessLevel(compositeScore: number): LiftReadyReadinessLevel {
  if (compositeScore <= 20) {
    return "early";
  }
  if (compositeScore <= 40) {
    return "developing";
  }
  if (compositeScore <= 60) {
    return "building";
  }
  if (compositeScore <= 80) {
    return "strong";
  }
  return "ready";
}

function getLiftReadyLine(state: LiftReadyScore, currentPhase: WeddingPhase) {
  if (currentPhase === "build") {
    return null;
  }

  if (state.readinessLevel === "ready") {
    return "You're ready. Finish strong.";
  }

  if (state.trend === "slipping") {
    return "Momentum dipped. This session matters.";
  }

  const copyMap: Record<Exclude<LiftReadyReadinessLevel, "ready">, Record<Exclude<LiftReadyTrend, "slipping">, string>> = {
    early: {
      rising: "Upper body is coming. Keep the pace.",
      steady: "Foundation is forming. Stay consistent.",
    },
    developing: {
      rising: "Chest is building. Keep the frequency.",
      steady: "Steady progress. Push a little harder.",
    },
    building: {
      rising: "Looking strong. Keep the work going.",
      steady: "Solid base. Define it now.",
    },
    strong: {
      rising: "Upper body is there. Stay on it.",
      steady: "Strong and consistent. Protect it.",
    },
  };

  return copyMap[state.readinessLevel][state.trend === "rising" ? "rising" : "steady"];
}

export function getLiftReadyScore(
  joshuaHistory: WorkoutSession[],
  currentPhase: WeddingPhase,
  referenceDate = new Date(),
): LiftReadyScore {
  const completedHistory = sortSessionsDescending(joshuaHistory.filter((session) => !session.partial));
  const currentWeekStart = startOfWeekMonday(referenceDate);
  const recentStart = new Date(currentWeekStart);
  recentStart.setDate(recentStart.getDate() - 7);
  const previousStart = new Date(recentStart);
  previousStart.setDate(previousStart.getDate() - 14);
  const previousEnd = new Date(recentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const recentEnd = new Date(referenceDate);
  recentEnd.setHours(23, 59, 59, 999);

  const recentWindow = getSessionsBetweenDates(completedHistory, recentStart, recentEnd);
  const previousWindow = getSessionsBetweenDates(completedHistory, previousStart, previousEnd);

  const recentChestSets = getZoneWeightedSetsForWindow(recentWindow, ["upperChest", "midChest"]);
  const previousChestSets = getZoneWeightedSetsForWindow(previousWindow, ["upperChest", "midChest"]);
  const recentShoulderSets = getZoneWeightedSetsForWindow(recentWindow, ["sideDelts", "frontDelts"]);
  const previousShoulderSets = getZoneWeightedSetsForWindow(previousWindow, ["sideDelts", "frontDelts"]);
  const recentPushStrength = getPushStrengthAverage(recentWindow);
  const previousPushStrength = getPushStrengthAverage(previousWindow);
  const chestScore = clampPercentScore((recentChestSets / 10) * 100);
  const shoulderScore = clampPercentScore((recentShoulderSets / 8) * 100);
  const pushStrengthScore = clampPercentScore((recentPushStrength / 500) * 100);
  const coreScore = getCoreConsistencyScore(recentWindow);
  const compositeScore = clampPercentScore(
    chestScore * 0.35 + shoulderScore * 0.25 + pushStrengthScore * 0.3 + coreScore * 0.1,
  );

  const previousCompositeScore = clampPercentScore(
    clampPercentScore((previousChestSets / 10) * 100) * 0.35 +
      clampPercentScore((previousShoulderSets / 8) * 100) * 0.25 +
      clampPercentScore((previousPushStrength / 500) * 100) * 0.3 +
      getCoreConsistencyScore(previousWindow) * 0.1,
  );
  const delta = compositeScore - previousCompositeScore;
  const trend: LiftReadyTrend = delta >= 5 ? "rising" : delta <= -5 ? "slipping" : "steady";

  return {
    chestScore,
    shoulderScore,
    pushStrengthScore,
    coreScore,
    compositeScore,
    readinessLevel: getReadinessLevel(compositeScore),
    trend,
  };
}

export function syncLiftReadyHistory(state: AppState, referenceDate = new Date()): AppState {
  const weekStart = startOfWeekMonday(referenceDate).toISOString();
  if (state.liftReadyHistory.some((entry) => entry.weekStart === weekStart)) {
    return state;
  }

  const joshuaSessions = state.sessions.filter((session) => session.userId === "joshua");
  const weddingDate = WeddingDateService.getState(referenceDate);
  const liftReady = getLiftReadyScore(joshuaSessions, weddingDate.currentPhase, referenceDate);
  const nextEntry: LiftReadyHistoryEntry = {
    weekStart,
    compositeScore: liftReady.compositeScore,
    readinessLevel: liftReady.readinessLevel,
    trend: liftReady.trend,
    phase: weddingDate.currentPhase,
  };

  return {
    ...state,
    liftReadyHistory: [nextEntry, ...state.liftReadyHistory],
  };
}

export function getProfileMaturityState(
  profile: Profile,
  sessionHistory: WorkoutSession[],
  profileCreatedAt: string,
  activationDate: string | null,
  referenceDate = new Date(),
): ProfileMaturityState {
  const completedSessions = sessionHistory.filter((session) => !session.partial);
  const createdAt = new Date(profileCreatedAt);
  const observationDaysElapsed = Math.max(
    0,
    Math.floor((referenceDate.getTime() - createdAt.getTime()) / 86400000),
  );
  const sessionsLogged = completedSessions.length;
  const activationTriggered =
    Boolean(activationDate) || observationDaysElapsed >= 14 || sessionsLogged >= 8;

  return {
    isObserving: !activationTriggered,
    observationDaysElapsed,
    sessionsLogged,
    activationTriggered,
    activationDate,
  };
}

function roundTo(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundToNearestHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toLocalDayKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDayKey(dayKey: string) {
  return new Date(`${dayKey}T00:00:00`);
}

function getSplitWeekdayIndex(value: Date) {
  return (value.getDay() + 6) % 7;
}

const DEFAULT_PROFILE_TRAINING_DAYS: Record<Profile["id"], number> = {
  joshua: 5,
  natasha: 5,
};

function getDaysUntilNextPlannedTrainingDay(profile: Profile, referenceDate = new Date()) {
  const weekdayIndex = getSplitWeekdayIndex(referenceDate);
  if (profile.workoutPlan.length >= 7) {
    return 0;
  }
  if (weekdayIndex < profile.workoutPlan.length) {
    return 0;
  }
  return Math.max(1, 7 - weekdayIndex);
}

function getCompletedSetCountForSession(session: WorkoutSession) {
  return session.exercises.reduce(
    (sessionTotal, exercise) => sessionTotal + exercise.sets.filter((set) => set.completed).length,
    0,
  );
}

function getSessionsWithinWeek(workoutHistory: WorkoutSession[], weekStart: Date) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return workoutHistory.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= start && performedAt <= end;
  });
}

function hasScheduledTrainingDay(userId: Profile["id"], value: Date) {
  return getSplitWeekdayIndex(value) < DEFAULT_PROFILE_TRAINING_DAYS[userId];
}

function getCompletedDaySet(workoutHistory: WorkoutSession[]) {
  return new Set(
    workoutHistory
      .filter((session) => !session.partial)
      .map((session) => toLocalDayKey(session.performedAt)),
  );
}

function getWeekNumber(value: Date) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getMonthSessions(workoutHistory: WorkoutSession[], month: number, year: number) {
  return workoutHistory.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt.getFullYear() === year && performedAt.getMonth() === month && !session.partial;
  });
}

function getPlannedTrainingDaysInMonth(userId: Profile["id"], month: number, year: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let planned = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = new Date(year, month, day);
    if (hasScheduledTrainingDay(userId, value)) {
      planned += 1;
    }
  }
  return planned;
}

function getBestStreakWithinMonth(sessions: WorkoutSession[], month: number, year: number) {
  const monthDayKeys = Array.from(
    new Set(
      sessions
        .filter((session) => {
          const performedAt = new Date(session.performedAt);
          return performedAt.getFullYear() === year && performedAt.getMonth() === month && !session.partial;
        })
        .map((session) => toLocalDayKey(session.performedAt)),
    ),
  )
    .map((dayKey) => fromDayKey(dayKey))
    .sort((a, b) => +a - +b);

  if (!monthDayKeys.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;
  for (let index = 1; index < monthDayKeys.length; index += 1) {
    const diffDays = Math.round(
      (monthDayKeys[index].setHours(0, 0, 0, 0) - monthDayKeys[index - 1].setHours(0, 0, 0, 0)) / 86400000,
    );
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function hasPlannedSplitSessionOnDate(profile: Profile, referenceDate = new Date()) {
  return getSplitWeekdayIndex(referenceDate) < profile.workoutPlan.length;
}

function getDayKeysFromCompletedSessions(sessions: WorkoutSession[]) {
  return Array.from(
    new Set(
      sessions
        .filter((session) => !session.partial)
        .map((session) => toLocalDayKey(session.performedAt)),
    ),
  );
}

function getCurrentCompletedSessionStreak(sessions: WorkoutSession[], referenceDate = new Date()) {
  const uniqueDays = getDayKeysFromCompletedSessions(sessions);
  if (!uniqueDays.length) {
    return 0;
  }

  const sortedDays = [...uniqueDays].sort((a, b) => +fromDayKey(b) - +fromDayKey(a));
  const latestSessionDate = fromDayKey(sortedDays[0]);
  const lastSessionDaysAgo = Math.max(
    0,
    Math.floor((new Date(referenceDate).setHours(0, 0, 0, 0) - new Date(latestSessionDate).setHours(0, 0, 0, 0)) / 86400000),
  );

  if (lastSessionDaysAgo > 1) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(latestSessionDate);
  while (uniqueDays.includes(toLocalDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLongestCompletedSessionStreak(sessions: WorkoutSession[]) {
  const uniqueDays = getDayKeysFromCompletedSessions(sessions)
    .map((dayKey) => fromDayKey(dayKey))
    .sort((a, b) => +a - +b);

  if (!uniqueDays.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(uniqueDays[index - 1]);
    const currentDay = new Date(uniqueDays[index]);
    const diffDays = Math.round((currentDay.setHours(0, 0, 0, 0) - previous.setHours(0, 0, 0, 0)) / 86400000);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getStreakAndMomentum(
  profile: Profile,
  workoutHistory: WorkoutSession[],
  referenceDate = new Date(),
  persistedLongestStreak = 0,
): StreakAndMomentum {
  const completedSessions = sortSessionsDescending(workoutHistory.filter((session) => !session.partial));
  const currentStreak = getCurrentCompletedSessionStreak(completedSessions, referenceDate);
  const longestStreak = Math.max(persistedLongestStreak, getLongestCompletedSessionStreak(completedSessions));
  const weeklySessions = getCurrentWeekSessions(completedSessions, referenceDate);
  const weeklyConsistency = Math.min(1, weeklySessions.length / Math.max(profile.workoutPlan.length, 1));
  const lastSessionDaysAgo = completedSessions.length
    ? Math.max(
        0,
        Math.floor(
          (new Date(referenceDate).setHours(0, 0, 0, 0) -
            new Date(fromDayKey(toLocalDayKey(completedSessions[0].performedAt))).setHours(0, 0, 0, 0)) /
            86400000,
        ),
      )
    : Number.POSITIVE_INFINITY;

  const momentumState: StreakAndMomentum["momentumState"] =
    currentStreak >= 2 && weeklyConsistency >= 0.75
      ? "building"
      : currentStreak >= 1 && weeklyConsistency >= 0.5
        ? "steady"
        : lastSessionDaysAgo === 2
          ? "cooling"
          : "cold";

  return {
    currentStreak,
    longestStreak,
    weeklyConsistency,
    momentumState,
    lastSessionDaysAgo: Number.isFinite(lastSessionDaysAgo) ? lastSessionDaysAgo : 999,
  };
}

export function getQueuedWorkoutForProfile(
  profile: Profile,
  workoutHistory: WorkoutSession[],
  overrideWorkoutId: string | null,
): WorkoutPlanDay {
  if (overrideWorkoutId) {
    return (
      profile.workoutPlan.find((workout) => workout.id === overrideWorkoutId) ??
      getNextWorkoutFromSessions(profile, workoutHistory)
    );
  }

  return getNextWorkoutFromSessions(profile, workoutHistory);
}

export function getWeeklyRivalryState(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  weekStart: Date,
  referenceDate = new Date(),
): WeeklyRivalryState {
  const joshuaWeekSessions = getSessionsWithinWeek(joshuaHistory, weekStart);
  const natashaWeekSessions = getSessionsWithinWeek(natashaHistory, weekStart);
  const joshuaCompletedSessions = joshuaWeekSessions.filter((session) => !session.partial);
  const natashaCompletedSessions = natashaWeekSessions.filter((session) => !session.partial);
  const joshuaSessions = joshuaCompletedSessions.length;
  const natashaSessions = natashaCompletedSessions.length;
  const joshuaVolume = joshuaWeekSessions.reduce((sum, session) => sum + getCompletedSetCountForSession(session), 0);
  const natashaVolume = natashaWeekSessions.reduce((sum, session) => sum + getCompletedSetCountForSession(session), 0);
  const weekDaysElapsed = clamp(
    Math.floor((new Date(referenceDate).setHours(0, 0, 0, 0) - new Date(weekStart).setHours(0, 0, 0, 0)) / 86400000) + 1,
    1,
    7,
  );
  const plannedSessionsSoFar = Math.max(1, Math.min(5, weekDaysElapsed));
  const joshuaConsistency = clamp(joshuaSessions / plannedSessionsSoFar, 0, 1);
  const natashaConsistency = clamp(natashaSessions / plannedSessionsSoFar, 0, 1);

  let leader: WeeklyRivalryState["leader"] = "tied";
  let leaderBy: WeeklyRivalryState["leaderBy"] = null;

  if (joshuaSessions !== natashaSessions) {
    leader = joshuaSessions > natashaSessions ? "joshua" : "natasha";
    leaderBy = "sessions";
  } else if (joshuaVolume !== natashaVolume) {
    leader = joshuaVolume > natashaVolume ? "joshua" : "natasha";
    leaderBy = "volume";
  } else if (joshuaConsistency !== natashaConsistency) {
    leader = joshuaConsistency > natashaConsistency ? "joshua" : "natasha";
    leaderBy = "consistency";
  }

  let margin: WeeklyRivalryState["margin"] = "close";
  if (leaderBy === "sessions") {
    const sessionGap = Math.abs(joshuaSessions - natashaSessions);
    margin = sessionGap >= 3 ? "dominant" : sessionGap >= 2 ? "clear" : "close";
  } else if (leaderBy === "volume") {
    const trailingVolume = Math.max(1, Math.min(joshuaVolume, natashaVolume));
    const volumeLift = Math.abs(joshuaVolume - natashaVolume) / trailingVolume;
    margin = volumeLift >= 0.3 ? "dominant" : volumeLift >= 0.1 ? "clear" : "close";
  } else if (leaderBy === "consistency") {
    const consistencyGap = Math.abs(joshuaConsistency - natashaConsistency);
    margin = consistencyGap >= 0.3 ? "dominant" : consistencyGap >= 0.1 ? "clear" : "close";
  }

  const distinctLoggedDays = new Set(
    [...joshuaWeekSessions, ...natashaWeekSessions].map((session) => toLocalDayKey(session.performedAt)),
  ).size;
  const weekComplete = referenceDate.getDay() === 0 || distinctLoggedDays >= 7;

  return {
    joshuaSessions,
    natashaSessions,
    joshuaVolume,
    natashaVolume,
    joshuaConsistency,
    natashaConsistency,
    leader,
    leaderBy,
    margin,
    weekComplete,
  };
}

export function getStealState(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  weekStart: Date,
  referenceDate = new Date(),
): StealState {
  const joshuaCompletedDays = getCompletedDaySet(joshuaHistory);
  const natashaCompletedDays = getCompletedDaySet(natashaHistory);
  const lastCompletedDay = new Date(referenceDate);
  lastCompletedDay.setDate(lastCompletedDay.getDate() - 1);
  lastCompletedDay.setHours(0, 0, 0, 0);

  const weekSteals = {
    joshua: 0,
    natasha: 0,
  };

  const scanStart = new Date(weekStart);
  scanStart.setHours(0, 0, 0, 0);
  const scanEnd = new Date(lastCompletedDay);
  const stealByDay: Record<string, Profile["id"]> = {};

  if (scanEnd >= scanStart) {
    const cursor = new Date(scanStart);
    while (cursor <= scanEnd) {
      const dayKey = toLocalDayKey(cursor);
      const joshuaScheduled = hasScheduledTrainingDay("joshua", cursor);
      const natashaScheduled = hasScheduledTrainingDay("natasha", cursor);

      if (joshuaScheduled && natashaScheduled) {
        const joshuaCompleted = joshuaCompletedDays.has(dayKey);
        const natashaCompleted = natashaCompletedDays.has(dayKey);

        if (joshuaCompleted !== natashaCompleted) {
          const stolenBy = joshuaCompleted ? "joshua" : "natasha";
          stealByDay[dayKey] = stolenBy;
          weekSteals[stolenBy] += 1;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const lastStealDate = Object.keys(stealByDay).sort().at(-1) ?? null;
  const latestStealOwner = lastStealDate ? stealByDay[lastStealDate] : null;

  let consecutiveSteals = 0;
  if (lastStealDate && latestStealOwner) {
    const cursor = fromDayKey(lastStealDate);
    while (true) {
      const key = toLocalDayKey(cursor);
      if (stealByDay[key] === latestStealOwner) {
        consecutiveSteals += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  const todayKey = toLocalDayKey(lastCompletedDay);

  return {
    todayIsStolen: Boolean(latestStealOwner && lastStealDate === todayKey),
    stolenBy: latestStealOwner,
    consecutiveSteals,
    weekSteals,
    lastStealDate,
  };
}

function getGoalAdherenceForProfile(
  userId: Profile["id"],
  history: WorkoutSession[],
  currentPhase: WeddingPhase,
  referenceDate = new Date(),
) {
  const week = getCurrentWeekWindow(referenceDate);
  const weekSessions = getSessionsWithinWeek(history, week.start).filter((session) => !session.partial);
  const priorityZones = getWeddingPriorityMusclesForPhase(userId, currentPhase);
  const plannedSessionsSoFar = Math.max(
    1,
    Math.min(
      5,
      Math.floor((new Date(referenceDate).setHours(0, 0, 0, 0) - new Date(week.start).setHours(0, 0, 0, 0)) / 86400000) + 1,
    ),
  );
  const goalSessions = weekSessions.filter((session) =>
    session.exercises.some((exercise) =>
      Object.entries(
        getExerciseMuscleContribution({
          exerciseName:
            (exercise as { exerciseName?: string; name?: string }).exerciseName ??
            (exercise as { exerciseName?: string; name?: string }).name ??
            "",
          muscleGroup: exercise.muscleGroup,
        }),
      ).some(
        ([zoneId, weight]) => weight > 0 && priorityZones.includes(zoneId),
      ),
    ),
  ).length;

  return clamp(goalSessions / plannedSessionsSoFar, 0, 1);
}

export function getWeddingRivalryState(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  currentPhase: WeddingPhase,
  weeksRemaining: number,
  referenceDate = new Date(),
): WeddingRivalryState {
  const joshuaGoalAdherence = getGoalAdherenceForProfile("joshua", joshuaHistory, currentPhase, referenceDate);
  const natashaGoalAdherence = getGoalAdherenceForProfile("natasha", natashaHistory, currentPhase, referenceDate);
  const joshuaOnTrack = joshuaGoalAdherence >= 0.75;
  const natashaOnTrack = natashaGoalAdherence >= 0.75;
  const week = getCurrentWeekWindow(referenceDate);
  const joshuaSessions = getSessionsWithinWeek(joshuaHistory, week.start).filter((session) => !session.partial).length;
  const natashaSessions = getSessionsWithinWeek(natashaHistory, week.start).filter((session) => !session.partial).length;
  let goalLeader: WeddingRivalryState["goalLeader"] = "neither";

  if (joshuaOnTrack && natashaOnTrack) {
    goalLeader = "both";
  } else if (joshuaOnTrack || natashaOnTrack) {
    goalLeader = joshuaGoalAdherence > natashaGoalAdherence ? "joshua" : "natasha";
  } else if (joshuaGoalAdherence !== natashaGoalAdherence) {
    goalLeader = joshuaGoalAdherence > natashaGoalAdherence ? "joshua" : "natasha";
  }

  const urgencyMap = {
    low: "relaxed",
    medium: "focused",
    high: "sharp",
    final: "final",
  } as const;
  const phaseUrgency: WeddingUrgencyLevel =
    weeksRemaining > 16 ? "low" : weeksRemaining >= 8 ? "medium" : weeksRemaining >= 4 ? "high" : "final";

  return {
    joshuaGoalAdherence,
    natashaGoalAdherence,
    joshuaOnTrack,
    natashaOnTrack,
    goalLeader,
    weeklySessionGap: Math.abs(joshuaSessions - natashaSessions),
    phaseUrgency,
    rivalryTone: urgencyMap[phaseUrgency],
  };
}

function getWeddingRivalryCopy(
  viewingProfileId: Profile["id"],
  weddingRivalryState: WeddingRivalryState | null,
) {
  if (!weddingRivalryState) {
    return null;
  }

  const copyMap = {
    joshua: {
      relaxed: {
        both: "Both on track. Good start.",
        joshua: "You're ahead on goal work. Keep it.",
        natasha: "She's more consistent on her goals. Step up.",
        neither: "Both off-track this week. Reset.",
      },
      focused: {
        both: "Both consistent. The work is showing.",
        joshua: "More focused than her right now. Stay there.",
        natasha: "She's outworking you on goal sessions. Fix that.",
        neither: "Neither fully on track. This week matters.",
      },
      sharp: {
        both: "Both locked in. Final push.",
        joshua: "You're more on-track. Don't let it slip.",
        natasha: "She's ahead on consistency. Take it back.",
        neither: "Slipping with weeks left. One of you needs to move.",
      },
      final: {
        both: "Both ready. The work is done.",
        joshua: "You're where you need to be. Protect it.",
        natasha: "She's more prepared right now. Last chance.",
        neither: "Final weeks. Everything from here counts.",
      },
    },
    natasha: {
      relaxed: {
        both: "Both on track. Good energy this week.",
        natasha: "More consistent on your goals than him. Keep it.",
        joshua: "He's more on-track right now. Match it.",
        neither: "Both off-track. Fresh start tomorrow.",
      },
      focused: {
        both: "Both consistent. November is getting real.",
        natasha: "Ahead on goal work. Stay focused.",
        joshua: "He's outworking you on his goals. Your move.",
        neither: "Both losing ground. This week needs to count.",
      },
      sharp: {
        both: "Both locked in. Final stretch.",
        natasha: "More on-track than him right now. Hold it.",
        joshua: "He's more consistent. Take it back.",
        neither: "Weeks left and both slipping. Not the time.",
      },
      final: {
        both: "Both ready. You've done the work.",
        natasha: "You're where you need to be. Stay calm.",
        joshua: "He's more prepared. Final push starts now.",
        neither: "Last weeks. No more room for missed sessions.",
      },
    },
  } as const;

  return copyMap[viewingProfileId][weddingRivalryState.rivalryTone][weddingRivalryState.goalLeader];
}

export function getRivalryCardCopy(
  viewingProfileId: Profile["id"],
  rivalryState: WeeklyRivalryState,
  stealState?: StealState,
  isObserving = false,
  weddingRivalryState: WeddingRivalryState | null = null,
): RivalryCardCopy {
  if (isObserving) {
    return {
      headline: "",
      highlightName: null,
      leaderColorClass: null,
      detail: "",
      stealDetail: null,
      weddingGoalDetail: null,
    };
  }

  if (rivalryState.weekComplete) {
    if (rivalryState.leader === "tied") {
      return {
        headline: "This week was a draw.",
        highlightName: null,
        leaderColorClass: null,
        detail: `${rivalryState.joshuaSessions + rivalryState.natashaSessions} sessions between you this week`,
        stealDetail: null,
        weddingGoalDetail: null,
      };
    }

    const winnerName = rivalryState.leader === "joshua" ? "Joshua" : "Natasha";
    return {
      headline: `${winnerName} took this week.`,
      highlightName: winnerName,
      leaderColorClass: rivalryState.leader === "joshua" ? "text-emerald-300/90" : "text-sky-300/90",
      detail:
        rivalryState.leaderBy === "sessions"
          ? `${winnerName} finished more sessions`
          : rivalryState.leaderBy === "volume"
            ? `${winnerName} got more total sets in`
            : `${winnerName} stayed more consistent`,
      stealDetail: null,
      weddingGoalDetail: null,
    };
  }

  if (rivalryState.leader === "tied") {
    return {
      headline: "Dead even. Someone's got to move.",
      highlightName: null,
      leaderColorClass: null,
      detail: `${rivalryState.joshuaSessions + rivalryState.natashaSessions} sessions between you this week`,
      stealDetail: getStealCopy(viewingProfileId, stealState),
      weddingGoalDetail: getWeddingRivalryCopy(viewingProfileId, weddingRivalryState),
    };
  }

  const copyMap = {
    joshua: {
      joshua: {
        close: "Ahead. Don't let up.",
        clear: "Joshua's week. Keep the gap.",
        dominant: "No contest this week.",
      },
      natasha: {
        close: "Natasha's got it. Take it back.",
        clear: "She's pulling away. Your move.",
        dominant: "Natasha owns this week. Reset Monday.",
      },
    },
    natasha: {
      natasha: {
        close: "Ahead. Hold the shape.",
        clear: "Natasha's week. Stay on it.",
        dominant: "Not even close this week.",
      },
      joshua: {
        close: "Joshua's got it. Take it back.",
        clear: "He's pulling away. Your move.",
        dominant: "Joshua owns this week. Reset Monday.",
      },
    },
  } as const;

  const leaderName = rivalryState.leader === "joshua" ? "Joshua" : "Natasha";
  const detail =
    rivalryState.leaderBy === "sessions"
      ? `${leaderName} ahead on sessions`
      : rivalryState.leaderBy === "volume"
        ? rivalryState.joshuaSessions === rivalryState.natashaSessions
          ? `Identical sessions — ${leaderName} has more sets`
          : `${leaderName} ahead on volume`
        : `${leaderName} ahead on consistency`;

  return {
    headline: copyMap[viewingProfileId][rivalryState.leader][rivalryState.margin],
    highlightName: rivalryState.leader === "joshua" ? "Joshua" : "Natasha",
    leaderColorClass: rivalryState.leader === "joshua" ? "text-emerald-300/90" : "text-sky-300/90",
    detail,
    stealDetail: getStealCopy(viewingProfileId, stealState),
    weddingGoalDetail: getWeddingRivalryCopy(viewingProfileId, weddingRivalryState),
  };
}

function getStealCopy(viewingProfileId: Profile["id"], stealState?: StealState) {
  if (!stealState?.todayIsStolen || !stealState.stolenBy) {
    return null;
  }

  const selfStole = viewingProfileId === stealState.stolenBy;
  const tier = stealState.consecutiveSteals >= 3 ? "three" : stealState.consecutiveSteals === 2 ? "two" : "one";

  const copyMap = {
    joshua: {
      self: {
        one: "You trained. She didn't. Day stolen.",
        two: "Two days in a row. She owes you.",
        three: "Three straight. This is a statement.",
      },
      other: {
        one: "She trained. You didn't. She took today.",
        two: "Two days. She's taking ground.",
        three: "Three in a row. Take it back.",
      },
    },
    natasha: {
      self: {
        one: "You trained. He didn't. Day stolen.",
        two: "Two days in a row. He owes you.",
        three: "Three straight. Make it four.",
      },
      other: {
        one: "He trained. You didn't. He took today.",
        two: "Two days. He's taking ground.",
        three: "Three in a row. Take it back.",
      },
    },
  } as const;

  return copyMap[viewingProfileId][selfStole ? "self" : "other"][tier];
}

export function syncWeeklyRivalryArchive(state: AppState, referenceDate = new Date()): AppState {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const previousWeekStart = new Date(currentWeek.start);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  previousWeekStart.setHours(0, 0, 0, 0);
  const previousWeekKey = toLocalDayKey(previousWeekStart);

  if (state.rivalryArchive.some((entry) => entry.weekStart === previousWeekKey)) {
    return state;
  }

  const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
  const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
  const previousWeekState = getWeeklyRivalryState(joshuaHistory, natashaHistory, previousWeekStart, currentWeek.start);

  if (previousWeekState.joshuaSessions === 0 && previousWeekState.natashaSessions === 0) {
    return state;
  }

  const archiveEntry: WeeklyRivalryArchiveEntry = {
    weekStart: previousWeekKey,
    winner: previousWeekState.leader,
    joshuaSessions: previousWeekState.joshuaSessions,
    natashaSessions: previousWeekState.natashaSessions,
  };

  return {
    ...state,
    rivalryArchive: [archiveEntry, ...state.rivalryArchive],
  };
}

export function syncStealArchive(state: AppState, referenceDate = new Date()): AppState {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const previousWeekStart = new Date(currentWeek.start);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  previousWeekStart.setHours(0, 0, 0, 0);

  const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
  const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
  const previousWeekSteals = getStealState(joshuaHistory, natashaHistory, previousWeekStart, currentWeek.start);

  if (!previousWeekSteals.lastStealDate || !previousWeekSteals.stolenBy) {
    return state;
  }

  const existingDates = new Set(state.stealArchive.map((entry) => entry.date));
  const additions: StealArchiveEntry[] = [];
  const end = new Date(previousWeekStart);
  end.setDate(end.getDate() + 6);

  const joshuaCompletedDays = getCompletedDaySet(joshuaHistory);
  const natashaCompletedDays = getCompletedDaySet(natashaHistory);
  const cursor = new Date(previousWeekStart);
  let currentRunOwner: Profile["id"] | null = null;
  let currentRunCount = 0;

  while (cursor <= end) {
    const dayKey = toLocalDayKey(cursor);
    const joshuaScheduled = hasScheduledTrainingDay("joshua", cursor);
    const natashaScheduled = hasScheduledTrainingDay("natasha", cursor);
    let dayWinner: Profile["id"] | null = null;

    if (joshuaScheduled && natashaScheduled) {
      const joshuaCompleted = joshuaCompletedDays.has(dayKey);
      const natashaCompleted = natashaCompletedDays.has(dayKey);
      if (joshuaCompleted !== natashaCompleted) {
        dayWinner = joshuaCompleted ? "joshua" : "natasha";
      }
    }

    if (dayWinner) {
      if (dayWinner === currentRunOwner) {
        currentRunCount += 1;
      } else {
        currentRunOwner = dayWinner;
        currentRunCount = 1;
      }

      if (!existingDates.has(dayKey)) {
        additions.push({
          date: dayKey,
          stolenBy: dayWinner,
          consecutiveCount: currentRunCount,
          weekNumber: getWeekNumber(cursor),
        });
      }
    } else {
      currentRunOwner = null;
      currentRunCount = 0;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (!additions.length) {
    return state;
  }

  return {
    ...state,
    stealArchive: [...additions.reverse(), ...state.stealArchive],
  };
}

export function getNextWorkoutFromSessions(profile: Profile, workoutHistory: WorkoutSession[]) {
  if (!workoutHistory.length) {
    return profile.workoutPlan[0];
  }

  const lastSession = workoutHistory[0];
  const currentIndex = profile.workoutPlan.findIndex((workout) => workout.id === lastSession.workoutDayId);

  if (currentIndex === -1) {
    return profile.workoutPlan[0];
  }

  return profile.workoutPlan[(currentIndex + 1) % profile.workoutPlan.length];
}

export function isRestDay(
  profile: Profile,
  workoutHistory: WorkoutSession[],
  trainingState: {
    metrics: Pick<ProfileTrainingMetrics, "recoveryIndex">;
    nextFocusDestination: SuggestedWorkoutDestination | null;
    suggestedFocusSession: SuggestedFocusSession | null;
  },
  referenceDate = new Date(),
  workoutOverride: WorkoutOverride | null = null,
): RestDayState {
  const recoveryScore = Math.max(0, Math.min(1, trainingState.metrics.recoveryIndex.score / 100));
  const queuedWorkout = getQueuedWorkoutForProfile(profile, workoutHistory, workoutOverride?.nextWorkoutId ?? null);
  const nextBestSession =
    trainingState.nextFocusDestination?.workoutName ??
    trainingState.suggestedFocusSession?.sourceWorkoutName ??
    queuedWorkout.name;
  const scheduledRestToday = !hasPlannedSplitSessionOnDate(profile, referenceDate);
  const hasAnyStartedSession = workoutHistory.length > 0;
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const plannedYesterday = hasPlannedSplitSessionOnDate(profile, yesterday);
  const hadSessionYesterday = workoutHistory.some((session) => toLocalDayKey(session.performedAt) === toLocalDayKey(yesterday));
  const skippedYesterday = scheduledRestToday && hasAnyStartedSession && plannedYesterday && !hadSessionYesterday;
  const recoveryNeeded = !scheduledRestToday && trainingState.metrics.recoveryIndex.score < 55;
  const restReason = skippedYesterday
    ? "user_skipped"
    : scheduledRestToday
      ? "scheduled"
      : recoveryNeeded
        ? "recovery_needed"
        : null;
  const nextBestSessionDaysOut =
    restReason === "scheduled"
      ? getDaysUntilNextPlannedTrainingDay(profile, referenceDate)
      : restReason === "recovery_needed"
        ? 1
        : restReason === "user_skipped"
          ? 0
          : 0;

  return {
    isRest: restReason !== null,
    restReason,
    recoveryScore,
    nextBestSession,
    nextBestSessionDaysOut,
  };
}

export function getRestDayRead(
  profileId: Profile["id"],
  restReason: RestDayState["restReason"],
  isObserving = false,
) {
  if (!restReason) {
    return null;
  }

  if (isObserving) {
    return "Rest day.";
  }

  const copyMap = {
    joshua: {
      scheduled: "Rest day. Let it land.",
      recovery_needed: "Body needs this. Don't fight it.",
      user_skipped: "Missed yesterday. Reset today.",
    },
    natasha: {
      scheduled: "Rest day. Let your body settle.",
      recovery_needed: "Recovery is part of the shape.",
      user_skipped: "Yesterday's gone. Start clean.",
    },
  } as const;

  return copyMap[profileId][restReason];
}

export function getRestRecoveryLabel(recoveryScore: number) {
  if (recoveryScore >= 0.8) {
    return "Feeling fresh";
  }
  if (recoveryScore >= 0.5) {
    return "Recovering well";
  }
  if (recoveryScore >= 0.3) {
    return "Still building back";
  }
  return "Take it easy today";
}

export function getMomentumPillCopy(
  profileId: Profile["id"],
  streakAndMomentum: StreakAndMomentum,
  hasCompletedWorkout: boolean,
  isObserving = false,
) {
  if (!hasCompletedWorkout || isObserving) {
    return null;
  }

  const streakSuffix = streakAndMomentum.currentStreak >= 3 ? ` ${streakAndMomentum.currentStreak} days` : "";
  const copyMap = {
    joshua: {
      building: `On a run. Keep pushing.${streakSuffix}`,
      steady: "Consistent. Good.",
      cooling: "Don't lose it.",
      cold: "Time to get back.",
    },
    natasha: {
      building: `In the flow. Keep it up.${streakSuffix}`,
      steady: "Consistent. Nice.",
      cooling: "Don't break the shape.",
      cold: "Come back to it.",
    },
  } as const;

  return copyMap[profileId][streakAndMomentum.momentumState];
}

export function getSignatureLifts(
  profile: Profile,
  exerciseHistory: WorkoutSession[],
  isObserving = false,
): SignatureLiftsState {
  const completedSessions = sortSessionsDescending(exerciseHistory.filter((session) => !session.partial));
  const basedOnSessions = completedSessions.length;

  if (isObserving || basedOnSessions < 8) {
    return {
      ready: false,
      signatures: [],
      basedOnSessions,
    };
  }

  const recentWindow = completedSessions.slice(0, 12);
  const recentWindowSize = Math.max(recentWindow.length, 1);
  const maxRecencyWeight = recentWindow.reduce((sum, _session, index) => sum + (recentWindowSize - index), 0);
  const candidateMap = completedSessions.reduce<
    Record<
      string,
      {
        sessionIds: Set<string>;
        weightedVolumeTotal: number;
        recentWeightedHits: number;
      }
    >
  >((accumulator, session) => {
    const recentIndex = recentWindow.findIndex((entry) => entry.id === session.id);
    const recencyWeight = recentIndex === -1 ? 0 : recentWindowSize - recentIndex;

    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0));
      if (!completedSets.length) {
        continue;
      }

      const exerciseKey = exercise.exerciseName;
      if (!accumulator[exerciseKey]) {
        accumulator[exerciseKey] = {
          sessionIds: new Set<string>(),
          weightedVolumeTotal: 0,
          recentWeightedHits: 0,
        };
      }

      accumulator[exerciseKey].sessionIds.add(session.id);
      accumulator[exerciseKey].weightedVolumeTotal += completedSets.reduce(
        (sum, set) => sum + set.weight * Math.max(set.reps, 1),
        0,
      );
      if (recencyWeight > 0) {
        accumulator[exerciseKey].recentWeightedHits += recencyWeight;
      }
    }

    return accumulator;
  }, {});

  const candidates = Object.entries(candidateMap)
    .map(([exerciseName, entry]) => ({
      exerciseName,
      appearances: entry.sessionIds.size,
      averageWeightedVolume: entry.weightedVolumeTotal / Math.max(entry.sessionIds.size, 1),
      recentWeightedHits: entry.recentWeightedHits,
    }))
    .filter((candidate) => candidate.appearances >= 4);

  if (candidates.length < 3) {
    return {
      ready: false,
      signatures: [],
      basedOnSessions,
    };
  }

  const maxAverageVolume = Math.max(...candidates.map((candidate) => candidate.averageWeightedVolume), 1);

  const signatures = candidates
    .map((candidate) => {
      const consistencyScore = roundTo(candidate.appearances / basedOnSessions);
      const volumeScore = roundTo(candidate.averageWeightedVolume / maxAverageVolume);
      const recencyScore = roundTo(candidate.recentWeightedHits / Math.max(maxRecencyWeight, 1));
      const compositeScore = roundTo(
        consistencyScore * 0.4 +
          volumeScore * 0.35 +
          recencyScore * 0.25,
      );

      return {
        exerciseName: candidate.exerciseName,
        consistencyScore,
        volumeScore,
        recencyScore,
        compositeScore,
      };
    })
    .sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      if (b.consistencyScore !== a.consistencyScore) {
        return b.consistencyScore - a.consistencyScore;
      }
      if (b.recencyScore !== a.recencyScore) {
        return b.recencyScore - a.recencyScore;
      }
      return a.exerciseName.localeCompare(b.exerciseName);
    })
    .slice(0, 3)
    .map((entry, index) => ({
      ...entry,
      rank: (index + 1) as 1 | 2 | 3,
    }));

  return {
    ready: signatures.length === 3,
    signatures,
    basedOnSessions,
  };
}

type MuscleGroupProgressRead = {
  qualifying: boolean;
  weightProgress: boolean;
  repProgress: boolean;
  progressMade: boolean;
};

function getNormalizedExerciseHistory(
  sessions: WorkoutSession[],
  exerciseName: string,
  currentSessionId: string,
  currentPerformedAt: string,
) {
  return sessions
    .filter((session) => session.id !== currentSessionId && +new Date(session.performedAt) < +new Date(currentPerformedAt))
    .flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.exerciseName === exerciseName)
        .map((exercise) => ({
          performedAt: session.performedAt,
          sets: exercise.sets.filter((set) => set.completed),
        })),
    )
    .filter((entry) => entry.sets.length > 0)
    .sort((a, b) => +new Date(a.performedAt) - +new Date(b.performedAt));
}

function getMuscleGroupProgressRead(
  session: WorkoutSession,
  muscleGroup: MuscleGroup,
  sessionHistory: WorkoutSession[],
): MuscleGroupProgressRead {
  const relevantExercises = session.exercises.filter((exercise) => exercise.muscleGroup === muscleGroup);
  let qualifying = false;
  let weightProgress = false;
  let repProgress = false;

  for (const exercise of relevantExercises) {
    const currentSets = exercise.sets.filter((set) => set.completed);
    if (!currentSets.length) {
      continue;
    }

    const priorHistory = getNormalizedExerciseHistory(sessionHistory, exercise.exerciseName, session.id, session.performedAt);
    if (priorHistory.length < 2) {
      continue;
    }

    qualifying = true;
    const comparisonWindow = priorHistory.slice(-3);
    const priorSets = comparisonWindow.flatMap((entry) => entry.sets);
    if (!priorSets.length) {
      continue;
    }

    const bestHistoricalWeight = Math.max(...priorSets.map((set) => set.weight));
    const heavierThreshold = bestHistoricalWeight * 1.025;
    if (currentSets.some((set) => set.weight >= heavierThreshold)) {
      weightProgress = true;
    }

    const repsAtWeight = new Map<number, number>();
    for (const set of priorSets) {
      repsAtWeight.set(set.weight, Math.max(repsAtWeight.get(set.weight) ?? 0, set.reps));
    }

    if (
      currentSets.some((set) => {
        const priorBestReps = repsAtWeight.get(set.weight);
        return typeof priorBestReps === "number" && set.reps >= priorBestReps + 1;
      })
    ) {
      repProgress = true;
    }
  }

  return {
    qualifying,
    weightProgress,
    repProgress,
    progressMade: weightProgress || repProgress,
  };
}

export function getMuscleCeilingState(
  _profile: Profile,
  muscleGroup: MuscleGroup,
  exerciseHistory: WorkoutSession[],
): MuscleCeilingState {
  const completedSessions = sortSessionsDescending(exerciseHistory.filter((session) => !session.partial))
    .filter((session) => session.exercises.some((exercise) => exercise.muscleGroup === muscleGroup));

  if (completedSessions.length < 3) {
    return {
      muscleGroup,
      sessionsSinceProgress: 0,
      ceilingDetected: false,
      ceilingType: null,
      lastProgressDate: null,
      suggestedResponse: null,
    };
  }

  const orderedSessions = [...completedSessions].sort((a, b) => +new Date(a.performedAt) - +new Date(b.performedAt));
  const progressReads = orderedSessions.map((session) => ({
    session,
    read: getMuscleGroupProgressRead(session, muscleGroup, orderedSessions),
  }));

  const latestRead = progressReads.at(-1)?.read ?? null;
  if (!latestRead?.qualifying) {
    return {
      muscleGroup,
      sessionsSinceProgress: 0,
      ceilingDetected: false,
      ceilingType: null,
      lastProgressDate: null,
      suggestedResponse: null,
    };
  }

  let sessionsSinceProgress = 0;
  for (let index = progressReads.length - 1; index >= 0; index -= 1) {
    const entry = progressReads[index];
    if (!entry.read.qualifying) {
      break;
    }
    if (entry.read.progressMade) {
      break;
    }
    sessionsSinceProgress += 1;
  }

  const lastProgressEntry = [...progressReads].reverse().find((entry) => entry.read.progressMade);
  const historicalWeightProgress = progressReads.some((entry) => entry.read.weightProgress);
  const historicalRepProgress = progressReads.some((entry) => entry.read.repProgress);
  const ceilingDetected = sessionsSinceProgress >= 3;
  const ceilingType: MuscleCeilingType | null = !ceilingDetected
    ? null
    : historicalRepProgress && !historicalWeightProgress
      ? "weight"
      : historicalWeightProgress && !historicalRepProgress
        ? "reps"
        : "both";
  const suggestedResponse: MuscleCeilingResponse | null =
    ceilingType === "weight"
      ? "rep_range_shift"
      : ceilingType === "reps"
        ? "technique_swap"
        : ceilingType === "both"
          ? sessionsSinceProgress >= 5
            ? "rest"
            : "technique_swap"
          : null;

  return {
    muscleGroup,
    sessionsSinceProgress: ceilingDetected ? sessionsSinceProgress : 0,
    ceilingDetected,
    ceilingType,
    lastProgressDate: lastProgressEntry?.session.performedAt ?? null,
    suggestedResponse,
  };
}

export function buildMuscleCeilingLogEntries(
  profile: Profile,
  session: WorkoutSession,
  sessionHistory: WorkoutSession[],
  appliedResponses: Partial<Record<MuscleGroup, MuscleCeilingResponse>> = {},
): MuscleCeilingLogEntry[] {
  const muscleGroups = Array.from(new Set(session.exercises.map((exercise) => exercise.muscleGroup)));
  const nextHistory = [session, ...sessionHistory.filter((entry) => entry.id !== session.id)];

  return muscleGroups.map((muscleGroup) => {
    const postSessionState = getMuscleCeilingState(profile, muscleGroup, nextHistory);
    const progressRead = getMuscleGroupProgressRead(
      session,
      muscleGroup,
      [...sessionHistory.filter((entry) => entry.id !== session.id), session],
    );

    return {
      profile: profile.id,
      muscleGroup,
      sessionId: session.id,
      date: session.performedAt,
      ceilingDetected: postSessionState.ceilingDetected,
      ceilingType: postSessionState.ceilingType,
      responseApplied: appliedResponses[muscleGroup] ?? null,
      progressMadeThisSession: progressRead.progressMade,
    };
  });
}

export function getTrainingAge(profile: Profile, sessionHistory: WorkoutSession[]): TrainingAgeState {
  const completedSessions = sortSessionsDescending(sessionHistory.filter((session) => !session.partial));
  const rawSessionCount = completedSessions.length;

  if (!rawSessionCount) {
    return {
      rawSessionCount: 0,
      weightedAge: 0,
      trainingAgeLabel: "Early days",
      milestone: null,
    };
  }

  const base = rawSessionCount / 4;
  const earliest = new Date(completedSessions[completedSessions.length - 1].performedAt);
  const latest = new Date(completedSessions[0].performedAt);
  const elapsedWeeks = Math.max(1, Math.ceil((latest.getTime() - earliest.getTime() + 86400000) / (7 * 86400000)));
  const expectedSessions = Math.max(profile.workoutPlan.length * elapsedWeeks, 1);
  const overallConsistency = clamp(rawSessionCount / expectedSessions, 0, 1);

  const consistencyMultiplier =
    overallConsistency >= 0.8 ? 1.15 : overallConsistency >= 0.6 ? 1.05 : overallConsistency >= 0.4 ? 1 : 0.9;

  const averageSetsPerSession =
    completedSessions.reduce(
      (sum, session) =>
        sum + session.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.filter((set) => set.completed).length, 0),
      0,
    ) / Math.max(rawSessionCount, 1);

  const volumeMultiplier =
    averageSetsPerSession >= 20 ? 1.1 : averageSetsPerSession >= 14 ? 1.05 : averageSetsPerSession < 8 ? 0.95 : 1;

  const weightedAge = roundToNearestHalf(base * consistencyMultiplier * volumeMultiplier);
  const trainingAgeLabel =
    weightedAge < 4
      ? "Early days"
      : weightedAge < 8
        ? "Finding the rhythm"
        : weightedAge < 16
          ? "Building the base"
          : weightedAge < 26
            ? "Established"
            : weightedAge < 52
              ? "Experienced"
              : "Veteran";

  let milestone: string | null = null;
  if (rawSessionCount >= 1) {
    milestone = TRAINING_AGE_MILESTONES[0].copy;
  }
  for (const entry of TRAINING_AGE_MILESTONES.slice(1)) {
    if (typeof entry.threshold === "number" && weightedAge >= entry.threshold) {
      milestone = entry.copy;
    }
  }

  return {
    rawSessionCount,
    weightedAge,
    trainingAgeLabel,
    milestone,
  };
}

export function syncTrainingAgeState(state: AppState): AppState {
  let changed = false;
  const nextTrainingAgeState = { ...state.trainingAgeState };

  for (const profile of state.profiles) {
    const trainingAge = getTrainingAge(
      profile,
      state.sessions.filter((session) => session.userId === profile.id),
    );
    const current = state.trainingAgeState[profile.id];

    if (
      current.rawSessionCount !== trainingAge.rawSessionCount ||
      current.weightedAge !== trainingAge.weightedAge
    ) {
      nextTrainingAgeState[profile.id] = {
        ...current,
        rawSessionCount: trainingAge.rawSessionCount,
        weightedAge: trainingAge.weightedAge,
      };
      changed = true;
    }
  }

  return changed
    ? {
        ...state,
        trainingAgeState: nextTrainingAgeState,
      }
    : state;
}

function getMonthlyProfileData(userId: Profile["id"], allHistory: WorkoutSession[], month: number, year: number): MonthlyReportProfileData {
  const monthSessions = getMonthSessions(allHistory, month, year);
  const sessions = monthSessions.length;
  const totalSets = monthSessions.reduce(
    (sum, session) => sum + session.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.filter((set) => set.completed).length, 0),
    0,
  );

  const muscleVolume = monthSessions.reduce<Record<string, number>>((accumulator, session) => {
    for (const exercise of session.exercises) {
      const exerciseVolume = exercise.sets
        .filter((set) => set.completed)
        .reduce((sum, set) => sum + set.weight * Math.max(set.reps, 1), 0);
      accumulator[exercise.muscleGroup] = (accumulator[exercise.muscleGroup] ?? 0) + exerciseVolume;
    }
    return accumulator;
  }, {});

  const topMuscleGroup =
    Object.entries(muscleVolume).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

  const exerciseAppearances = monthSessions.reduce<Record<string, { count: number; volume: number; lastAt: number }>>(
    (accumulator, session) => {
      for (const exercise of session.exercises) {
        const completedSets = exercise.sets.filter((set) => set.completed);
        if (!completedSets.length) {
          continue;
        }
        const volume = completedSets.reduce((sum, set) => sum + set.weight * Math.max(set.reps, 1), 0);
        const current = accumulator[exercise.exerciseName] ?? { count: 0, volume: 0, lastAt: 0 };
        accumulator[exercise.exerciseName] = {
          count: current.count + 1,
          volume: current.volume + volume,
          lastAt: Math.max(current.lastAt, +new Date(session.performedAt)),
        };
      }
      return accumulator;
    },
    {},
  );

  const signatureLift =
    Object.entries(exerciseAppearances)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count;
        }
        if (b[1].lastAt !== a[1].lastAt) {
          return b[1].lastAt - a[1].lastAt;
        }
        return b[1].volume - a[1].volume;
      })[0]?.[0] ?? "Still forming";

  const plannedTrainingDays = getPlannedTrainingDaysInMonth(userId, month, year);
  const consistencyScore = roundTo(clamp(sessions / Math.max(plannedTrainingDays, 1), 0, 1), 3);

  const weekCounts = monthSessions.reduce<Record<number, number>>((accumulator, session) => {
    const weekNumber = getWeekNumber(new Date(session.performedAt));
    accumulator[weekNumber] = (accumulator[weekNumber] ?? 0) + 1;
    return accumulator;
  }, {});
  const bestWeek = Number(
    Object.entries(weekCounts).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return Number(a[0]) - Number(b[0]);
    })[0]?.[0] ?? 0,
  );

  const sortedHistory = sortSessionsDescending(allHistory)
    .filter((session) => !session.partial)
    .sort((a, b) => +new Date(a.performedAt) - +new Date(b.performedAt));

  const newPRs = monthSessions.reduce((sum, session) => {
    const previousSessions = sortedHistory.filter((entry) => +new Date(entry.performedAt) < +new Date(session.performedAt));
    return sum + getWorkoutPrSummary(session, previousSessions).count;
  }, 0);

  return {
    sessions,
    totalSets,
    topMuscleGroup,
    signatureLift,
    consistencyScore,
    bestWeek,
    newPRs,
    streakBest: getBestStreakWithinMonth(allHistory, month, year),
  };
}

function getMonthlyRivalryData(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  month: number,
  year: number,
): MonthlyReportRivalryData {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const weekWins = { joshua: 0, natasha: 0, tied: 0 };
  const totalSteals = { joshua: 0, natasha: 0 };

  const cursor = new Date(monthStart);
  while (cursor <= monthEnd) {
    const weekStart = new Date(cursor);
    weekStart.setDate(weekStart.getDate() - getSplitWeekdayIndex(weekStart));
    weekStart.setHours(0, 0, 0, 0);

    const rivalryState = getWeeklyRivalryState(joshuaHistory, natashaHistory, weekStart, new Date(Math.min(+monthEnd, +new Date(weekStart.getTime() + 6 * 86400000))));
    if (rivalryState.leader === "joshua") {
      weekWins.joshua += 1;
    } else if (rivalryState.leader === "natasha") {
      weekWins.natasha += 1;
    } else {
      weekWins.tied += 1;
    }

    cursor.setDate(cursor.getDate() + 7);
    while (getSplitWeekdayIndex(cursor) !== 0 && cursor <= monthEnd) {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const joshuaMonthSessions = getMonthSessions(joshuaHistory, month, year);
  const natashaMonthSessions = getMonthSessions(natashaHistory, month, year);
  const joshuaCompletedDays = getCompletedDaySet(joshuaMonthSessions);
  const natashaCompletedDays = getCompletedDaySet(natashaMonthSessions);
  const dayCursor = new Date(monthStart);
  while (dayCursor <= monthEnd) {
    const dayKey = toLocalDayKey(dayCursor);
    if (hasScheduledTrainingDay("joshua", dayCursor) && hasScheduledTrainingDay("natasha", dayCursor)) {
      const joshuaCompleted = joshuaCompletedDays.has(dayKey);
      const natashaCompleted = natashaCompletedDays.has(dayKey);
      if (joshuaCompleted !== natashaCompleted) {
        totalSteals[joshuaCompleted ? "joshua" : "natasha"] += 1;
      }
    }
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  const joshuaData = getMonthlyProfileData("joshua", joshuaHistory, month, year);
  const natashaData = getMonthlyProfileData("natasha", natashaHistory, month, year);

  let monthWinner: MonthlyReportRivalryData["monthWinner"] = "tied";
  if (joshuaData.sessions !== natashaData.sessions) {
    monthWinner = joshuaData.sessions > natashaData.sessions ? "joshua" : "natasha";
  } else if (joshuaData.totalSets !== natashaData.totalSets) {
    monthWinner = joshuaData.totalSets > natashaData.totalSets ? "joshua" : "natasha";
  } else if (joshuaData.consistencyScore !== natashaData.consistencyScore) {
    monthWinner = joshuaData.consistencyScore > natashaData.consistencyScore ? "joshua" : "natasha";
  }

  const archiveReferenceDate =
    month === 10 ? new Date(year, month, 2, 12, 0, 0, 0) : new Date(year, monthEnd.getMonth(), monthEnd.getDate(), 12, 0, 0, 0);
  const archiveWeddingPhase = month === 10 ? "wedding_week" : WeddingDateService.getState(archiveReferenceDate).currentPhase;
  const archiveWeddingRivalry = getWeddingRivalryState(
    joshuaHistory,
    natashaHistory,
    archiveWeddingPhase,
    Math.max(0, Math.floor((+new Date(year, 10, 2) - +archiveReferenceDate) / 604800000)),
    archiveReferenceDate,
  );

  return {
    weekWins,
    totalSteals,
    monthWinner,
    goalAdherence: {
      joshua: archiveWeddingRivalry.joshuaGoalAdherence,
      natasha: archiveWeddingRivalry.natashaGoalAdherence,
    },
  };
}

function getMonthlyClosingLine(
  profileId: Profile["id"],
  data: MonthlyReportProfileData,
  rivalry: MonthlyReportRivalryData,
) {
  const selfWeekWins = rivalry.weekWins[profileId];
  const otherWeekWins = rivalry.weekWins[profileId === "joshua" ? "natasha" : "joshua"];
  const selfSteals = rivalry.totalSteals[profileId];
  const otherSteals = rivalry.totalSteals[profileId === "joshua" ? "natasha" : "joshua"];

  if (data.consistencyScore >= 0.8) {
    return profileId === "joshua"
      ? "Locked in all month. That's the standard."
      : "Consistent all month. That's the shape.";
  }
  if (data.sessions >= 16) {
    return profileId === "joshua" ? "Big month. Build on it." : "Big month. Keep that energy.";
  }
  if (rivalry.monthWinner === profileId && selfWeekWins > otherWeekWins) {
    return profileId === "joshua"
      ? "Rivalry: Joshua. See you next month."
      : "Rivalry: Natasha. See you next month.";
  }
  if (selfSteals > otherSteals) {
    return profileId === "joshua" ? "Took the most days. That counts." : "Took the most days. She showed up.";
  }
  if (data.newPRs >= 3) {
    return profileId === "joshua" ? "Three PRs. The work showed up." : "Three PRs. Strength is building.";
  }
  if (data.consistencyScore < 0.5) {
    return profileId === "joshua" ? "Inconsistent month. Next one's different." : "Patchy month. Next one's cleaner.";
  }
  if (rivalry.monthWinner === "tied") {
    return profileId === "joshua" ? "Even month. Someone has to break that." : "Even month. One of you needs to move.";
  }
  return profileId === "joshua" ? "Another month done. Keep building." : "Another month done. Keep the shape.";
}

export function getMonthlyReportCard(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  month: number,
  year: number,
): MonthlyReportCard {
  const monthLabel = new Intl.DateTimeFormat("en-NZ", { month: "long" }).format(new Date(year, month, 1));
  const joshua = getMonthlyProfileData("joshua", joshuaHistory, month, year);
  const natasha = getMonthlyProfileData("natasha", natashaHistory, month, year);
  const rivalry = getMonthlyRivalryData(joshuaHistory, natashaHistory, month, year);

  return {
    month: monthLabel,
    year,
    joshua,
    natasha,
    rivalry,
    closingLine: {
      joshua: getMonthlyClosingLine("joshua", joshua, rivalry),
      natasha: getMonthlyClosingLine("natasha", natasha, rivalry),
    },
  };
}

export function syncMonthlyReportArchive(state: AppState, referenceDate = new Date()): AppState {
  if (referenceDate.getDate() !== 1) {
    return state;
  }

  const previousMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
  const month = previousMonthDate.getMonth();
  const year = previousMonthDate.getFullYear();
  const monthLabel = new Intl.DateTimeFormat("en-NZ", { month: "long" }).format(previousMonthDate);

  if (state.monthlyReportArchive.some((entry) => entry.month === monthLabel && entry.year === year)) {
    return state;
  }

  const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
  const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
  const report = getMonthlyReportCard(joshuaHistory, natashaHistory, month, year);

  if (report.joshua.sessions === 0 && report.natasha.sessions === 0) {
    return state;
  }

  const archiveEntry: MonthlyReportArchiveEntry = {
    month: report.month,
    year: report.year,
    joshuaData: report.joshua,
    natashaData: report.natasha,
    rivalryData: report.rivalry,
    closingLines: report.closingLine,
  };

  return {
    ...state,
    monthlyReportArchive: [archiveEntry, ...state.monthlyReportArchive],
  };
}

export function syncProfileMaturityState(state: AppState, referenceDate = new Date()): AppState {
  let changed = false;
  const nextActivationDates = { ...state.profileActivationDates };

  for (const profile of state.profiles) {
    if (nextActivationDates[profile.id]) {
      continue;
    }

    const maturityState = getProfileMaturityState(
      profile,
      state.sessions.filter((session) => session.userId === profile.id),
      state.profileCreatedAt[profile.id],
      nextActivationDates[profile.id],
      referenceDate,
    );

    if (maturityState.activationTriggered) {
      nextActivationDates[profile.id] = referenceDate.toISOString();
      changed = true;
    }
  }

  if (!changed) {
    return state;
  }

  return {
    ...state,
    profileActivationDates: nextActivationDates,
  };
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

function getStealDayMap(
  joshuaHistory: WorkoutSession[],
  natashaHistory: WorkoutSession[],
  referenceDate = new Date(),
  weeksToShow = 6,
) {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const start = new Date(currentWeek.start);
  start.setDate(start.getDate() - (weeksToShow - 1) * 7);
  start.setHours(0, 0, 0, 0);
  const lastCompletedDay = new Date(referenceDate);
  lastCompletedDay.setDate(lastCompletedDay.getDate() - 1);
  lastCompletedDay.setHours(0, 0, 0, 0);

  const joshuaCompletedDays = getCompletedDaySet(joshuaHistory);
  const natashaCompletedDays = getCompletedDaySet(natashaHistory);
  const map: Record<string, Profile["id"]> = {};
  const cursor = new Date(start);

  while (cursor <= lastCompletedDay) {
    const dayKey = toLocalDayKey(cursor);
    const joshuaScheduled = hasScheduledTrainingDay("joshua", cursor);
    const natashaScheduled = hasScheduledTrainingDay("natasha", cursor);

    if (joshuaScheduled && natashaScheduled) {
      const joshuaCompleted = joshuaCompletedDays.has(dayKey);
      const natashaCompleted = natashaCompletedDays.has(dayKey);
      if (joshuaCompleted !== natashaCompleted) {
        map[dayKey] = joshuaCompleted ? "joshua" : "natasha";
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
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
  maturityState: ProfileMaturityState,
  liftReadyScore: LiftReadyScore | null,
  currentPhase: WeddingPhase,
): TrainingInsights {
  if (maturityState.isObserving) {
    return {
      homeAction: "Keep logging. The read stays quiet for now.",
      liftReadyLine: null,
      completionNext: "Session logged.",
      weeklyStatusTitle: "Observation window",
      weeklyStatusDetail: "The app is watching your real pattern first.",
      focusDirection: "",
      progressSignal: "The signal is still forming.",
    };
  }

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
    liftReadyLine: profile.id === "joshua" ? getLiftReadyLine(liftReadyScore ?? getLiftReadyScore([], currentPhase), currentPhase) : null,
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
  persistedLongestStreak = 0,
  workoutOverride: WorkoutOverride | null = null,
  profileCreatedAt = new Date(referenceDate.getTime() - 30 * 86400000).toISOString(),
  profileActivationDate: string | null = null,
  lastSeenWeddingPhase: WeddingPhase | null = null,
): ProfileTrainingState {
  const userSessions = sortSessionsDescending(allSessions.filter((session) => session.userId === profile.id));
  const trainingLoad = getWeeklyTrainingLoad(userSessions, profile.id, referenceDate);
  const weeklySummary = getWeeklySummary(profile, userSessions, referenceDate);
  const streak = getWorkoutStreak(userSessions, referenceDate);
  const streakAndMomentum = getStreakAndMomentum(profile, userSessions, referenceDate, persistedLongestStreak);
  const maturityState = getProfileMaturityState(
    profile,
    userSessions,
    profileCreatedAt,
    profileActivationDate,
    referenceDate,
  );
  const trainingAge = getTrainingAge(profile, userSessions);
  const signatureLifts = getSignatureLifts(profile, userSessions, maturityState.isObserving);
  const trendData = getTrendData(userSessions);
  const weeklyStretchCount = getWeeklyStretchCount(stretchCompletions, profile.id, referenceDate);
  const weddingDate = WeddingDateService.getState(referenceDate);
  const weddingPhaseProfile = getWeddingPhaseProfile(profile.id, weddingDate);
  const natashaPriorityLock =
    profile.id === "natasha" ? getNatashaPriorityLock(weddingDate.currentPhase, weddingDate.weeksRemaining) : null;
  const natashaWaistProtocol =
    profile.id === "natasha" ? getWaistProtocol(userSessions, weddingDate.currentPhase) : null;
  const natashaBackReveal =
    profile.id === "natasha"
      ? getBackRevealState(userSessions, weddingDate.weeksRemaining, weddingDate.currentPhase)
      : null;
  const natashaWeeklyZoneFrequency =
    profile.id === "natasha" ? getWeeklyZoneSessionFrequency(userSessions, referenceDate) : {};
  const liftReadyScore = profile.id === "joshua" ? getLiftReadyScore(userSessions, weddingDate.currentPhase, referenceDate) : null;
  const muscleCeilingStates = maturityState.isObserving
    ? []
    : Array.from(new Set(profile.workoutPlan.flatMap((workout) => workout.exercises.map((exercise) => exercise.muscleGroup))))
        .map((muscleGroup) => getMuscleCeilingState(profile, muscleGroup, userSessions));
  const metrics = getProfileTrainingMetrics(profile, userSessions, exerciseLibrary, trainingLoad, referenceDate);
  const suggestedNextFocus = profile.id === "natasha" && natashaPriorityLock
    ? applyNatashaPriorityLockToFocus(
        applyWeddingPhaseToFocus(selectNextFocusFromMetrics(profile, trainingLoad, metrics), weddingPhaseProfile),
        natashaPriorityLock,
        natashaWeeklyZoneFrequency,
      )
    : applyWeddingPhaseToFocus(selectNextFocusFromMetrics(profile, trainingLoad, metrics), weddingPhaseProfile);
  const derivedTrainingLoad = {
    ...trainingLoad,
    summary: {
      ...trainingLoad.summary,
      suggestedNextFocus,
    },
  };
  const insights = buildTrainingInsights(
    profile,
    weeklySummary,
    derivedTrainingLoad,
    metrics,
    maturityState,
    liftReadyScore,
    weddingDate.currentPhase,
  );
  const nextFocusDestination = getSuggestedWorkoutDestination(
    profile.id,
    profile.workoutPlan,
    suggestedNextFocus,
    derivedTrainingLoad.recentLoad,
  );
  const suggestedFocusSession = getSuggestedFocusSession(
    profile.id,
    profile.workoutPlan,
    suggestedNextFocus,
    exerciseLibrary,
    derivedTrainingLoad.recentLoad,
    weddingPhaseProfile,
    muscleCeilingStates,
    liftReadyScore,
    natashaPriorityLock,
    natashaWaistProtocol,
    natashaBackReveal,
  );
  const restDayState = isRestDay(
    profile,
    userSessions,
    {
      metrics,
      nextFocusDestination,
      suggestedFocusSession,
    },
    referenceDate,
    workoutOverride,
  );
  const stealDayMap = getStealDayMap(
    allSessions.filter((session) => session.userId === "joshua"),
    allSessions.filter((session) => session.userId === "natasha"),
    referenceDate,
  );

  return {
    userSessions,
    totalWorkouts: userSessions.length,
    weeklyCount: trainingLoad.activeDays.size,
    streak,
    streakAndMomentum,
    maturityState,
    trainingAge,
    restDayState,
    signatureLifts,
    recentWorkouts: userSessions.slice(0, 3),
    recentSessions: userSessions.slice(0, 4),
    trendData,
    weeklySummary,
    trainingLoad: derivedTrainingLoad,
    calendarRows: getWeeklyCalendarRows(allSessions, 6, referenceDate).map((row) => ({
      ...row,
      days: row.days.map((day) => ({
        ...day,
        stolenBy: stealDayMap[day.key] ?? null,
      })),
    })),
    nextFocusDestination,
    suggestedFocusSession,
    weddingDate,
    weddingPhaseProfile,
    phaseTransitionLine: getWeddingPhaseTransitionCopy(profile.id, lastSeenWeddingPhase, weddingDate.currentPhase),
    progressPhaseIndicator: getWeddingPhaseIndicator(weddingDate.currentPhase),
    metrics,
    insights,
    goalDashboard: buildGoalDashboard(profile, derivedTrainingLoad, weeklySummary, streak),
    progressSignals: buildProgressSignals(profile, userSessions, trendData, weeklySummary, weeklyStretchCount),
  };
}

export function getProfileSessions(allSessions: WorkoutSession[], userId: Profile["id"]) {
  return sortSessionsDescending(allSessions.filter((session) => session.userId === userId));
}
