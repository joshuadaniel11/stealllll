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
import type {
  AppState,
  ExerciseLibraryItem,
  Profile,
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

export type RivalryCardCopy = {
  headline: string;
  highlightName: "Joshua" | "Natasha" | null;
  leaderColorClass: string | null;
  detail: string;
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

export type StreakAndMomentum = {
  currentStreak: number;
  longestStreak: number;
  weeklyConsistency: number;
  momentumState: "building" | "steady" | "cooling" | "cold";
  lastSessionDaysAgo: number;
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

function roundTo(value: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
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

export function getRivalryCardCopy(viewingProfileId: Profile["id"], rivalryState: WeeklyRivalryState): RivalryCardCopy {
  if (rivalryState.weekComplete) {
    if (rivalryState.leader === "tied") {
      return {
        headline: "This week was a draw.",
        highlightName: null,
        leaderColorClass: null,
        detail: `${rivalryState.joshuaSessions + rivalryState.natashaSessions} sessions between you this week`,
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
    };
  }

  if (rivalryState.leader === "tied") {
    return {
      headline: "Dead even. Someone's got to move.",
      highlightName: null,
      leaderColorClass: null,
      detail: `${rivalryState.joshuaSessions + rivalryState.natashaSessions} sessions between you this week`,
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
  };
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

export function getRestDayRead(profileId: Profile["id"], restReason: RestDayState["restReason"]) {
  if (!restReason) {
    return null;
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

export function getMomentumPillCopy(profileId: Profile["id"], streakAndMomentum: StreakAndMomentum, hasCompletedWorkout: boolean) {
  if (!hasCompletedWorkout) {
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

export function getSignatureLifts(profile: Profile, exerciseHistory: WorkoutSession[]): SignatureLiftsState {
  const completedSessions = sortSessionsDescending(exerciseHistory.filter((session) => !session.partial));
  const basedOnSessions = completedSessions.length;

  if (basedOnSessions < 8) {
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
  persistedLongestStreak = 0,
  workoutOverride: WorkoutOverride | null = null,
): ProfileTrainingState {
  const userSessions = sortSessionsDescending(allSessions.filter((session) => session.userId === profile.id));
  const trainingLoad = getWeeklyTrainingLoad(userSessions, profile.id, referenceDate);
  const weeklySummary = getWeeklySummary(profile, userSessions, referenceDate);
  const streak = getWorkoutStreak(userSessions, referenceDate);
  const streakAndMomentum = getStreakAndMomentum(profile, userSessions, referenceDate, persistedLongestStreak);
  const signatureLifts = getSignatureLifts(profile, userSessions);
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

  return {
    userSessions,
    totalWorkouts: userSessions.length,
    weeklyCount: trainingLoad.activeDays.size,
    streak,
    streakAndMomentum,
    restDayState,
    signatureLifts,
    recentWorkouts: userSessions.slice(0, 3),
    recentSessions: userSessions.slice(0, 4),
    trendData,
    weeklySummary,
    trainingLoad: derivedTrainingLoad,
    calendarRows: getWeeklyCalendarRows(allSessions, 6, referenceDate),
    nextFocusDestination,
    suggestedFocusSession,
    metrics,
    insights,
    goalDashboard: buildGoalDashboard(profile, derivedTrainingLoad, weeklySummary, streak),
    progressSignals: buildProgressSignals(profile, userSessions, trendData, weeklySummary, weeklyStretchCount),
  };
}

export function getProfileSessions(allSessions: WorkoutSession[], userId: Profile["id"]) {
  return sortSessionsDescending(allSessions.filter((session) => session.userId === userId));
}
