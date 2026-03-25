import { getPreviousBestScore } from "@/lib/progression";
import type { HapticEvent, SetLog, WorkoutSession } from "@/lib/types";

const EVENT_COOLDOWN_MS = 10_000;
const WINDOW_LIMIT = 3;
const WINDOW_MS = 5_000;
const VISIBILITY_SUPPRESS_MS = 1_500;
const WEEK_STREAK_MILESTONES = [2, 4, 8, 12, 20] as const;

const HAPTIC_PATTERNS: Record<HapticEvent, number | number[]> = {
  pr_approach: 12,
  session_complete: [18, 120, 18],
  rivalry_lead_change: 18,
  week_streak: [10, 80, 10, 80, 18],
  set_saved: 10,
};

type HapticRuntimeState = {
  enabled: boolean;
  visible: boolean;
  suppressUntil: number;
  recentEvents: number[];
  lastByEvent: Partial<Record<HapticEvent, number>>;
};

const runtimeState: HapticRuntimeState = {
  enabled: true,
  visible: true,
  suppressUntil: 0,
  recentEvents: [],
  lastByEvent: {},
};

function trimRecentEvents(now: number) {
  runtimeState.recentEvents = runtimeState.recentEvents.filter((timestamp) => now - timestamp < WINDOW_MS);
}

function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function shouldTriggerHaptic(
  event: HapticEvent,
  now: number,
  state: Pick<HapticRuntimeState, "enabled" | "visible" | "suppressUntil" | "recentEvents" | "lastByEvent">,
) {
  if (!state.enabled || !state.visible || now < state.suppressUntil) {
    return false;
  }

  const recentEvents = state.recentEvents.filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recentEvents.length >= WINDOW_LIMIT) {
    return false;
  }

  const lastForEvent = state.lastByEvent[event] ?? 0;
  if (lastForEvent && now - lastForEvent < EVENT_COOLDOWN_MS) {
    return false;
  }

  return true;
}

export const HapticService = {
  setEnabled(enabled: boolean) {
    runtimeState.enabled = enabled;
  },

  notifyVisibilityChange(visible: boolean) {
    runtimeState.visible = visible;
    if (visible) {
      runtimeState.suppressUntil = Date.now() + VISIBILITY_SUPPRESS_MS;
    }
  },

  trigger(event: HapticEvent): void {
    const now = Date.now();
    trimRecentEvents(now);
    if (!shouldTriggerHaptic(event, now, runtimeState) || !canVibrate()) {
      return;
    }

    navigator.vibrate(HAPTIC_PATTERNS[event]);
    runtimeState.lastByEvent[event] = now;
    runtimeState.recentEvents.push(now);
  },
};

function getCompletedTrainingDaysByWeek(sessions: WorkoutSession[]) {
  const weeks = new Set<string>();
  for (const session of sessions) {
    if (session.partial) {
      continue;
    }
    const day = new Date(session.performedAt);
    const local = new Date(day);
    const weekStart = new Date(local);
    const offset = (weekStart.getDay() + 6) % 7;
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - offset);
    weeks.add(weekStart.toISOString().slice(0, 10));
  }
  return weeks;
}

export function getCurrentWeekStreak(sessions: WorkoutSession[], referenceDate = new Date()) {
  const completedWeeks = getCompletedTrainingDaysByWeek(sessions);
  const cursor = new Date(referenceDate);
  const offset = (cursor.getDay() + 6) % 7;
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - offset);

  let streak = 0;
  while (completedWeeks.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function getWeekStreakMilestone(
  sessions: WorkoutSession[],
  firedMilestones: number[],
  referenceDate = new Date(),
) {
  const streak = getCurrentWeekStreak(sessions, referenceDate);
  const milestone = [...WEEK_STREAK_MILESTONES].reverse().find((entry) => streak >= entry && !firedMilestones.includes(entry));
  return milestone ?? null;
}

function getSetScore(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export function isPrApproachSet(
  exerciseName: string,
  set: Pick<SetLog, "weight" | "reps">,
  sessions: WorkoutSession[],
) {
  if (set.weight <= 0 || set.reps <= 0) {
    return false;
  }

  const previousBest = getPreviousBestScore(exerciseName, sessions);
  if (previousBest <= 0) {
    return false;
  }

  const currentScore = getSetScore(set.weight, set.reps);
  return currentScore >= previousBest * 0.95 && currentScore < previousBest;
}
