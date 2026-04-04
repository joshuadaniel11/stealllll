/**
 * Science-based fitness projections.
 *
 * Formulas:
 *   E1RM  — Epley (1985): weight × (1 + reps / 30). Validated for 1–12 reps.
 *   OLS   — ordinary least-squares linear regression for trend extrapolation.
 *   WMA   — weighted moving average for velocity (more recent gaps carry higher weight).
 */

import type { MeasurementEntry, MuscleGroup, UserId, WorkoutSession } from "@/lib/types";

// ─── Core math ────────────────────────────────────────────────────────────────

/** Epley (1985) estimated one-rep max. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Ordinary least-squares linear regression. x values should be evenly scaled (e.g. week index). */
function ols(points: Array<[number, number]>): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (const [x, y] of points) { sx += x; sy += y; sxy += x * y; sx2 += x * x; }
  const det = n * sx2 - sx * sx;
  if (det === 0) return null;
  const slope = (n * sxy - sx * sy) / det;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// ─── Tracked lifts (mirrors strength-prediction.ts) ──────────────────────────

type LiftConfig = { label: string; aliases: string[] };

const TRACKED_LIFTS: Record<UserId, LiftConfig[]> = {
  joshua: [
    { label: "Flat Dumbbell Press", aliases: ["flat dumbbell press", "bench press"] },
    { label: "Incline Dumbbell Press", aliases: ["incline dumbbell press"] },
    { label: "Leg Press", aliases: ["leg press"] },
    { label: "Neutral-Grip Lat Pulldown", aliases: ["neutral-grip lat pulldown", "lat pulldown"] },
    { label: "Machine Shoulder Press", aliases: ["machine shoulder press", "dumbbell shoulder press", "shoulder press"] },
  ],
  natasha: [
    { label: "Machine Hip Thrust", aliases: ["machine hip thrust", "barbell hip thrust", "hip thrust"] },
    { label: "Leg Press (Glute Bias)", aliases: ["leg press (glute bias)", "leg press"] },
    { label: "Wide-Grip Lat Pulldown", aliases: ["wide-grip lat pulldown", "lat pulldown"] },
    { label: "Seated Dumbbell Shoulder Press", aliases: ["seated dumbbell shoulder press", "shoulder press"] },
    { label: "Smith Machine Squat", aliases: ["smith machine squat"] },
  ],
};

type LiftPoint = { dateMs: number; e1rmKg: number };

function getLiftPoints(sessions: WorkoutSession[], aliases: string[]): LiftPoint[] {
  const points: LiftPoint[] = [];
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!aliases.includes(ex.exerciseName.toLowerCase())) continue;
      let best = 0;
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
        const v = e1rm(set.weight, set.reps);
        if (v > best) best = v;
      }
      if (best > 0) points.push({ dateMs: new Date(session.performedAt).getTime(), e1rmKg: best });
    }
  }
  return points.sort((a, b) => a.dateMs - b.dateMs);
}

/** Weighted velocity: more recent gaps carry higher weight. Returns kg E1RM per week. */
function weightedVelocity(points: LiftPoint[]): number {
  if (points.length < 2) return 0;
  const recent = points.slice(-5);
  const last = recent[recent.length - 1];
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < recent.length - 1; i++) {
    const weeks = Math.max((last.dateMs - recent[i].dateMs) / MS_PER_WEEK, 0.5);
    const gain = (last.e1rmKg - recent[i].e1rmKg) / weeks;
    const w = i + 1;
    wSum += gain * w;
    wTotal += w;
  }
  return wTotal > 0 ? Math.max(0, wSum / wTotal) : 0;
}

// ─── Feature 2: Strength Velocity ────────────────────────────────────────────

export type StrengthVelocityEntry = {
  exerciseName: string;
  /** E1RM gain per week (kg), positive only */
  gainPerWeekKg: number;
  /** Direction vs prior half of session history */
  trend: "accelerating" | "steady" | "decelerating";
  currentE1rmKg: number;
  dataPoints: number;
};

export function getStrengthVelocities(sessions: WorkoutSession[], userId: UserId): StrengthVelocityEntry[] {
  const results: StrengthVelocityEntry[] = [];
  for (const lift of TRACKED_LIFTS[userId] ?? []) {
    const pts = getLiftPoints(sessions, lift.aliases);
    if (pts.length < 3) continue;
    const mid = Math.floor(pts.length / 2);
    const recent = weightedVelocity(pts.slice(mid));
    const prior = weightedVelocity(pts.slice(0, mid + 1));
    const diff = recent - prior;
    const trend: StrengthVelocityEntry["trend"] =
      diff > 0.25 ? "accelerating" : diff < -0.25 ? "decelerating" : "steady";
    results.push({
      exerciseName: lift.label,
      gainPerWeekKg: recent,
      trend,
      currentE1rmKg: pts[pts.length - 1].e1rmKg,
      dataPoints: pts.length,
    });
  }
  return results.slice(0, 3);
}

// ─── Feature 3: Next PB Estimate ─────────────────────────────────────────────

export type PbEstimate = {
  exerciseName: string;
  currentPbE1rmKg: number;
  currentE1rmKg: number;
  gainPerWeekKg: number;
  /** null = plateau / insufficient trend */
  weeksToNextPb: number | null;
};

export function getNextPbEstimates(sessions: WorkoutSession[], userId: UserId): PbEstimate[] {
  const results: PbEstimate[] = [];
  for (const lift of TRACKED_LIFTS[userId] ?? []) {
    const pts = getLiftPoints(sessions, lift.aliases);
    if (pts.length < 3) continue;
    const currentPb = Math.max(...pts.map((p) => p.e1rmKg));
    const currentE1rm = pts[pts.length - 1].e1rmKg;
    const gain = weightedVelocity(pts);
    // Next meaningful PB: 2.5% above all-time peak (a scientifically plausible short-term target)
    const nextTarget = currentPb * 1.025;
    const weeks = gain > 0.05 ? Math.ceil((nextTarget - currentE1rm) / gain) : null;
    results.push({ exerciseName: lift.label, currentPbE1rmKg: currentPb, currentE1rmKg: currentE1rm, gainPerWeekKg: gain, weeksToNextPb: weeks });
  }
  return results.slice(0, 3);
}

// ─── Feature 4: Volume Momentum ───────────────────────────────────────────────

export type VolumeWeek = {
  /** Short label e.g. "Apr 1" */
  label: string;
  /** Total kg·reps lifted that week */
  volumeKg: number;
};

export type VolumeMomentum = {
  weeks: VolumeWeek[];
  /** OLS regression slope: kg per week (positive = building) */
  slopeKgPerWeek: number;
  trend: "building" | "stable" | "declining";
};

function isoWeekStart(d: Date): string {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c.toISOString().slice(0, 10);
}

export function getVolumeMomentum(sessions: WorkoutSession[], weeksBack = 12): VolumeMomentum {
  const map = new Map<string, number>();
  const now = new Date();
  const labels = new Map<string, string>();
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * MS_PER_WEEK);
    const key = isoWeekStart(d);
    map.set(key, 0);
    labels.set(key, new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(key)));
  }
  for (const session of sessions) {
    const key = isoWeekStart(new Date(session.performedAt));
    if (!map.has(key)) continue;
    let vol = 0;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (set.completed && set.weight > 0 && set.reps > 0) vol += set.weight * set.reps;
      }
    }
    map.set(key, (map.get(key) ?? 0) + vol);
  }

  const weeks: VolumeWeek[] = [];
  for (const [key, vol] of map) {
    weeks.push({ label: labels.get(key) ?? key, volumeKg: vol });
  }

  const regPts: Array<[number, number]> = weeks
    .map((w, i) => [i, w.volumeKg] as [number, number])
    .filter(([, v]) => v > 0);
  const reg = ols(regPts);
  const slope = reg?.slope ?? 0;
  const trend: VolumeMomentum["trend"] = slope > 150 ? "building" : slope < -150 ? "declining" : "stable";
  return { weeks, slopeKgPerWeek: slope, trend };
}

// ─── Feature 1: Wedding Projections ───────────────────────────────────────────

export type WeddingProjection = {
  daysToWedding: number;
  bodyweight: { currentKg: number; projectedKg: number; changeKg: number } | null;
  lifts: Array<{ exerciseName: string; currentE1rmKg: number; projectedE1rmKg: number; gainKg: number }>;
};

export function getWeddingProjection(
  sessions: WorkoutSession[],
  measurements: MeasurementEntry[],
  userId: UserId,
  weddingDate: Date,
): WeddingProjection | null {
  const nowMs = Date.now();
  const weddingMs = weddingDate.getTime();
  const daysToWedding = Math.round((weddingMs - nowMs) / 86_400_000);
  if (daysToWedding <= 0) return null;
  const weeksAhead = daysToWedding / 7;

  // Bodyweight via OLS on measurements
  let bodyweight: WeddingProjection["bodyweight"] = null;
  const meas = [...measurements]
    .filter((m) => m.bodyweightKg > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (meas.length >= 2) {
    const origin = new Date(meas[0].date).getTime();
    const pts: Array<[number, number]> = meas.map((m) => [
      (new Date(m.date).getTime() - origin) / MS_PER_WEEK,
      m.bodyweightKg,
    ]);
    const reg = ols(pts);
    if (reg) {
      const lastWeek = pts[pts.length - 1][0];
      const current = meas[meas.length - 1].bodyweightKg;
      const projected = Math.round((reg.slope * (lastWeek + weeksAhead) + reg.intercept) * 10) / 10;
      const change = Math.round((projected - current) * 10) / 10;
      bodyweight = { currentKg: current, projectedKg: projected, changeKg: change };
    }
  }

  // Lift E1RM projections via OLS
  const lifts: WeddingProjection["lifts"] = [];
  for (const lift of (TRACKED_LIFTS[userId] ?? []).slice(0, 3)) {
    const pts = getLiftPoints(sessions, lift.aliases);
    if (pts.length < 3) continue;
    const origin = pts[0].dateMs;
    const regPts: Array<[number, number]> = pts.map((p) => [(p.dateMs - origin) / MS_PER_WEEK, p.e1rmKg]);
    const reg = ols(regPts);
    if (!reg) continue;
    const lastWeek = regPts[regPts.length - 1][0];
    const current = pts[pts.length - 1].e1rmKg;
    const projected = reg.slope * (lastWeek + weeksAhead) + reg.intercept;
    const gain = projected - current;
    lifts.push({
      exerciseName: lift.label,
      currentE1rmKg: Math.round(current * 10) / 10,
      projectedE1rmKg: Math.round(projected * 10) / 10,
      gainKg: Math.round(gain * 10) / 10,
    });
  }

  if (!bodyweight && lifts.length === 0) return null;
  return { daysToWedding, bodyweight, lifts };
}

// ─── Feature 5: Head-to-Head Trajectory ──────────────────────────────────────

type MovementCategory = "Push" | "Pull" | "Legs";

const MUSCLE_TO_CATEGORY: Partial<Record<MuscleGroup, MovementCategory>> = {
  Chest: "Push",
  Shoulders: "Push",
  Triceps: "Push",
  Back: "Pull",
  Biceps: "Pull",
  Legs: "Legs",
  Glutes: "Legs",
  Hamstrings: "Legs",
  Quads: "Legs",
};

/** Quality-adjusted volume: sum of best-set E1RM per exercise per session, per category. */
function categoryE1rmVolume(sessions: WorkoutSession[], cat: MovementCategory, since: number): number {
  let total = 0;
  for (const session of sessions) {
    if (new Date(session.performedAt).getTime() < since) continue;
    for (const ex of session.exercises) {
      if (MUSCLE_TO_CATEGORY[ex.muscleGroup] !== cat) continue;
      let best = 0;
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
        const v = e1rm(set.weight, set.reps);
        if (v > best) best = v;
      }
      total += best;
    }
  }
  return total;
}

export type HeadToHeadEntry = {
  category: MovementCategory;
  userChangePercent: number;
  rivalChangePercent: number;
  /** Who improved more in the recent 4 weeks vs the 4 weeks before that */
  leader: "user" | "rival" | "tied";
};

export function getHeadToHead(
  userSessions: WorkoutSession[],
  rivalSessions: WorkoutSession[],
): HeadToHeadEntry[] {
  const now = Date.now();
  const t0 = now - 8 * MS_PER_WEEK;
  const t1 = now - 4 * MS_PER_WEEK;

  return (["Push", "Pull", "Legs"] as MovementCategory[])
    .map((cat) => {
      const uPrior = categoryE1rmVolume(userSessions, cat, t0) - categoryE1rmVolume(userSessions, cat, t1);
      const uRecent = categoryE1rmVolume(userSessions, cat, t1);
      const rPrior = categoryE1rmVolume(rivalSessions, cat, t0) - categoryE1rmVolume(rivalSessions, cat, t1);
      const rRecent = categoryE1rmVolume(rivalSessions, cat, t1);

      const uChange = uPrior > 0 ? Math.round(((uRecent - uPrior) / uPrior) * 100) : 0;
      const rChange = rPrior > 0 ? Math.round(((rRecent - rPrior) / rPrior) * 100) : 0;
      const leader: HeadToHeadEntry["leader"] =
        uChange > rChange + 2 ? "user" : rChange > uChange + 2 ? "rival" : "tied";

      return { category: cat, userChangePercent: uChange, rivalChangePercent: rChange, leader };
    })
    .filter((e) => e.userChangePercent !== 0 || e.rivalChangePercent !== 0);
}
