import { getExerciseMuscleContribution } from "@/lib/training-load";
import type { MeasurementEntry, SharedSummary, WorkoutSession } from "@/lib/types";

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayKey(value: string) {
  return new Date(value).toDateString();
}

function toWeekKey(value: Date) {
  const cursor = new Date(value);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - cursor.getDay());
  return cursor.toISOString().slice(0, 10);
}

function getSharedWeekStreak(joshuaSessions: WorkoutSession[], natashaSessions: WorkoutSession[]) {
  const joshuaWeeks = new Set(joshuaSessions.map((session) => toWeekKey(new Date(session.performedAt))));
  const natashaWeeks = new Set(natashaSessions.map((session) => toWeekKey(new Date(session.performedAt))));

  let streak = 0;
  const cursor = getWeekStart();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!joshuaWeeks.has(key) || !natashaWeeks.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

function getRecentZoneExposure(sessions: WorkoutSession[], limit = 6) {
  const recentSessions = sessions.slice(0, limit);
  const exposure: Record<string, number> = {};

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
        exposure[zoneId] = (exposure[zoneId] ?? 0) + score * completedSets;
      }
    }
  }

  return exposure;
}

function getExposureTotal(exposure: Record<string, number>, zoneIds: string[]) {
  return zoneIds.reduce((sum, zoneId) => sum + (exposure[zoneId] ?? 0), 0);
}

function getJoshuaComplement(joshuaSessions: WorkoutSession[]) {
  const exposure = getRecentZoneExposure(joshuaSessions);
  const chestLoad = getExposureTotal(exposure, ["upperChest", "midChest", "lowerChest", "triceps"]);
  const backLoad = getExposureTotal(exposure, ["lats", "upperBack", "midBack", "biceps"]);

  if (chestLoad >= backLoad) {
    return "Joshua's chest and arm work is leading the visual change right now.";
  }

  return "Joshua's back width and arm detail are carrying the stronger signal right now.";
}

function getNatashaComplement(natashaSessions: WorkoutSession[]) {
  const exposure = getRecentZoneExposure(natashaSessions);
  const gluteLoad = getExposureTotal(exposure, ["upperGlutes", "gluteMax", "sideGlutes"]);
  const backLoad = getExposureTotal(exposure, ["lats", "upperBack", "midBack"]);

  if (gluteLoad >= backLoad) {
    return "Natasha's glute-focused work is shaping the stronger silhouette signal right now.";
  }

  return "Natasha's back definition work is leading the cleaner shape change right now.";
}

function getWeddingMomentumLine(combinedWorkouts: number, weddingCountdown: { months: number; days: number }) {
  if (combinedWorkouts >= 5) {
    return `Wedding momentum is ahead. ${combinedWorkouts} sessions this week is exactly the kind of rhythm that compounds by ${weddingCountdown.months} months to go.`;
  }

  if (combinedWorkouts >= 3) {
    return `Wedding momentum is holding. ${combinedWorkouts} sessions this week keeps the trend moving in the right direction before the last ${weddingCountdown.months} months and ${weddingCountdown.days} days.`;
  }

  return `Wedding momentum is still open this week. A couple more sessions now will matter more than trying to make it perfect later.`;
}

export function getCoupleIntelligenceSummary({
  sessions,
  measurements,
  weddingCountdown,
}: {
  sessions: WorkoutSession[];
  measurements: Record<"joshua" | "natasha", MeasurementEntry[]>;
  weddingCountdown: { months: number; days: number };
}): SharedSummary {
  const joshuaSessions = sessions
    .filter((session) => session.userId === "joshua")
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
  const natashaSessions = sessions
    .filter((session) => session.userId === "natasha")
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));

  const weekStart = getWeekStart();
  const joshuaThisWeek = joshuaSessions.filter((session) => new Date(session.performedAt) >= weekStart);
  const natashaThisWeek = natashaSessions.filter((session) => new Date(session.performedAt) >= weekStart);
  const combinedWorkouts = joshuaThisWeek.length + natashaThisWeek.length;
  const bothTrainedThisWeek = joshuaThisWeek.length > 0 && natashaThisWeek.length > 0;
  const sharedWeekStreak = getSharedWeekStreak(joshuaSessions, natashaSessions);

  const joshuaBodyFat = measurements.joshua.at(-1)?.bodyFatPercent;
  const natashaBodyFat = measurements.natasha.at(-1)?.bodyFatPercent;
  const leaningOutTogether =
    typeof joshuaBodyFat === "number" &&
    typeof natashaBodyFat === "number" &&
    joshuaBodyFat < 20 &&
    natashaBodyFat < 30;

  const sameDayOverlap = new Set(joshuaThisWeek.map((session) => toDayKey(session.performedAt)));
  const bothDaysThisWeek = natashaThisWeek.filter((session) => sameDayOverlap.has(toDayKey(session.performedAt))).length;

  const weeklyHighlight = bothTrainedThisWeek
    ? bothDaysThisWeek > 0
      ? `Both of you trained this week, and ${bothDaysThisWeek} of those days lined up together.`
      : "Both of you trained this week and kept the shared rhythm alive."
    : joshuaThisWeek.length || natashaThisWeek.length
      ? "One side is moving this week. The shared rhythm is one session away from being back on."
      : "Fresh week. Both sides are still open.";

  const complementarySignal = `${getJoshuaComplement(joshuaSessions)} ${getNatashaComplement(natashaSessions)}`;

  return {
    combinedWorkouts,
    teamStreak: sharedWeekStreak,
    weeklyHighlight,
    recentMilestones: [
      bothTrainedThisWeek
        ? "Both trained this week."
        : "Only one side has trained this week so far.",
      getWeddingMomentumLine(combinedWorkouts, weddingCountdown),
      leaningOutTogether
        ? "Both body-fat trends are supporting the visual payoff."
        : complementarySignal,
    ],
  };
}
