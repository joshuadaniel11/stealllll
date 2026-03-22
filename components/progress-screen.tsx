import { MeasurementCard } from "@/components/measurement-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TrainingLoadCard } from "@/components/training-load-card";
import { WeeklyTrainingCalendar } from "@/components/weekly-training-calendar";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, MiniMetric } from "@/components/ui";
import { getCurrentWeekSessions, getCurrentWeekWindow, getWeeklyCalendarRows, getWeeklyTrainingLoad } from "@/lib/training-load";
import { getAestheticSignal } from "@/lib/workout-intelligence";
import type { MeasurementEntry, Profile, StretchCompletion, WeeklySummary, WorkoutSession } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));
}

export function ProgressScreen({
  profile,
  totalWorkouts,
  weeklySummary,
  trendData,
  measurements,
  userSessions,
  recentSessions,
  stretchCompletions,
  onSaveMeasurement,
  onEditSession,
}: {
  profile: Profile;
  totalWorkouts: number;
  weeklySummary: WeeklySummary;
  trendData: Array<{ date: string; volume: number }>;
  measurements: MeasurementEntry[];
  userSessions: WorkoutSession[];
  recentSessions: WorkoutSession[];
  stretchCompletions: StretchCompletion[];
  onSaveMeasurement: (entry: Omit<MeasurementEntry, "id" | "date">) => void;
  onEditSession: (sessionId: string) => void;
}) {
  const bodyweightTrend = [...measurements]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((entry) => ({
      date: formatDate(entry.date),
      bodyweight: entry.bodyweightKg,
      bodyFat: entry.bodyFatPercent,
    }));

  const currentWeek = getCurrentWeekWindow();
  const weeklyStretchCount = stretchCompletions.filter((entry) => {
    const date = new Date(entry.date);
    return date >= currentWeek.start && date <= currentWeek.end;
  }).length;

  const chestSessions = userSessions.filter((session) => /chest/i.test(session.workoutName)).length;
  const backSessions = userSessions.filter((session) => /back/i.test(session.workoutName)).length;
  const gluteSessions = userSessions.filter((session) => /glutes/i.test(session.workoutName)).length;
  const coreSessions = userSessions.filter((session) => /core|abs/i.test(session.workoutName)).length;
  const shoulderSessions = userSessions.filter((session) => /shoulder/i.test(session.workoutName)).length;

  const recentVolume = trendData.slice(-2).reduce((sum, item) => sum + item.volume, 0);
  const previousVolume = trendData.slice(-4, -2).reduce((sum, item) => sum + item.volume, 0);
  const strengthMomentumLabel =
    trendData.length < 3 ? "Starting" : recentVolume > previousVolume ? "Rising" : recentVolume < previousVolume ? "Steadying" : "Stable";

  const latestBodyFat = bodyweightTrend.at(-1)?.bodyFat;
  const previousBodyFat = bodyweightTrend.at(-2)?.bodyFat;
  const absVisibilityLabel =
    latestBodyFat !== undefined && previousBodyFat !== undefined
      ? latestBodyFat < previousBodyFat
        ? "Leaning out"
        : "Holding steady"
      : coreSessions >= 2
        ? "Core work landing"
        : "Still building";

  const leadingIndicator =
    profile.id === "natasha"
      ? {
          title: "Glute growth",
          value: `${gluteSessions} sessions`,
          detail: `Lower-body volume is landing well, with ${weeklySummary.totalSets} total sets supporting the shape changes you actually care about.`,
        }
      : {
          title: "Chest growth",
          value: `${chestSessions} sessions`,
          detail: `Pressing frequency and total upper-body work are stacking into a stronger chest-growth signal week to week.`,
        };

  const primarySignal =
    profile.id === "natasha"
      ? {
          title: "Current focus",
          value: "Back definition",
          detail: `${backSessions} back sessions logged. Width and upper-back detail are carrying the current look.`,
        }
      : {
          title: "Current focus",
          value: "Strength momentum",
          detail: `${strengthMomentumLabel} right now, based on the recent volume trend and the last ${trendData.length || 0} logged sessions.`,
        };

  const supportSignal =
    profile.id === "natasha"
      ? {
          title: "Support signal",
          value: "Hourglass shape",
          detail: `${gluteSessions + shoulderSessions} shoulder and glute sessions are reinforcing shoulder-to-waist-to-glute contrast.`,
        }
      : {
          title: "Support signal",
          value: "Abs visibility",
          detail: `${absVisibilityLabel}, backed by ${weeklyStretchCount} recovery sessions and ${coreSessions} core-focused sessions.`,
        };

  const weeklyTrainingLoad = getWeeklyTrainingLoad(userSessions);
  const currentWeekSessions = getCurrentWeekSessions(userSessions);
  const weeklyCalendarRows = getWeeklyCalendarRows(userSessions);
  const aestheticSignal = getAestheticSignal(profile.id, userSessions, measurements);
  const showingBodyMetrics = bodyweightTrend.length > 0;

  return (
    <>
      <ScrollReveal delay={0}>
        <TrainingLoadCard
          metrics={weeklyTrainingLoad.metrics}
          groups={weeklyTrainingLoad.groups}
          topZones={weeklyTrainingLoad.topZones}
          weekLabel={weeklyTrainingLoad.week.label}
          activeDayCount={weeklyTrainingLoad.activeDays.size}
          userId={profile.id}
        />
      </ScrollReveal>

      <ScrollReveal delay={25}>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Workout calendar</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Last 6 weeks</h3>
            </div>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
              {currentWeekSessions.length} this week
            </div>
          </div>
          <div className="mt-4">
            <WeeklyTrainingCalendar rows={weeklyCalendarRows} />
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={50}>
        <Card>
          <p className="text-sm text-muted">Progress</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{profile.name}&apos;s summary</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{profile.goalSummary}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniMetric label="Total workouts" value={`${totalWorkouts}`} />
            <MiniMetric label="This week" value={`${weeklySummary.workoutsCompleted}`} />
            <MiniMetric label="Stretches" value={`${weeklyStretchCount}`} />
          </div>
          <div className="mt-4 rounded-[24px] bg-[var(--card-strong)] p-4">
            <p className="text-sm text-muted">Leading indicator</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-text">{leadingIndicator.title}</p>
              <p className="text-sm font-medium text-accent">{leadingIndicator.value}</p>
            </div>
            <p className="caption-text mt-2 text-muted">{leadingIndicator.detail}</p>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={95}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Trend</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                {showingBodyMetrics ? "Body metrics" : "Training volume"}
              </h3>
            </div>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
              {showingBodyMetrics
                ? `${bodyweightTrend.length} entries`
                : trendData.length
                  ? `Last ${trendData.length} sessions`
                  : "No sessions yet"}
            </div>
          </div>
          <div className="mt-4 h-52">
            {showingBodyMetrics ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyweightTrend}>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 20,
                      border: "1px solid var(--stroke)",
                      background: "var(--card)",
                      backdropFilter: "blur(18px)",
                    }}
                  />
                  <Line type="monotone" dataKey="bodyweight" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bodyFat" stroke="var(--muted)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: "rgba(91,142,255,0.3)" }}
                    contentStyle={{
                      borderRadius: 20,
                      border: "1px solid var(--stroke)",
                      background: "var(--card)",
                      backdropFilter: "blur(18px)",
                    }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="var(--accent)" fill="url(#volumeFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">Log a full workout and your first clean trend will appear here.</div>
            )}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <Card>
          <p className="text-sm text-muted">Smart focus</p>
          <div className="mt-4 rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{primarySignal.title}</p>
              <p className="text-sm font-medium text-accent">{primarySignal.value}</p>
            </div>
            <p className="mt-2 text-sm text-muted">{primarySignal.detail}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <MiniMetric label="Support" value={supportSignal.value} />
            <MiniMetric label="PBs hit" value={`${weeklySummary.personalBests}`} />
            <MiniMetric label="Muscle focus" value={weeklySummary.mostTrainedMuscleGroup} />
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={145}>
        <MeasurementCard measurements={measurements} onSave={onSaveMeasurement} />
      </ScrollReveal>

      <ScrollReveal delay={170}>
        <Card>
          <p className="text-sm text-muted">{aestheticSignal.title}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-text">{aestheticSignal.value}</h3>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">Adaptive</div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{aestheticSignal.detail}</p>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={245}>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Recent sessions</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Saved workouts</h3>
            </div>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
              {recentSessions.length} tracked
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {recentSessions.length ? (
              recentSessions.map((session) => (
                <div key={session.id} className="rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">{session.workoutName}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            session.partial ? "bg-accentSoft text-accent" : "bg-black/10 text-text dark:bg-white/10"
                          }`}
                        >
                          {session.partial ? "Partial" : "Full"}
                        </span>
                      </div>
                      <p className="caption-text mt-1 text-muted">
                        {[
                          formatDate(session.performedAt),
                          `${session.durationMinutes} min`,
                          `${session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets`,
                        ].join(" • ")}
                      </p>
                    </div>
                    <button
                      className="rounded-[18px] bg-[var(--card-strong)] px-3 py-2 text-sm font-medium text-text"
                      onClick={() => onEditSession(session.id)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Complete a workout and your saved sessions will show up here.</div>
            )}
          </div>
        </Card>
      </ScrollReveal>
    </>
  );
}
