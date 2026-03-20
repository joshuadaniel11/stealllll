import { DataPortabilityCard } from "@/components/data-portability-card";
import { MeasurementCard } from "@/components/measurement-card";
import { ScrollReveal } from "@/components/scroll-reveal";
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
import { getAestheticSignal } from "@/lib/workout-intelligence";
import type { MeasurementEntry, Profile, StretchCompletion, WeeklySummary, WorkoutSession } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));
}

function buildCalendarData(sessions: WorkoutSession[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const workoutDays = new Set(sessions.map((session) => new Date(session.performedAt).toDateString()));

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      return null;
    }

    const date = new Date(year, month, dayNumber);
    return {
      dayNumber,
      completed: workoutDays.has(date.toDateString()),
      today: date.toDateString() === now.toDateString(),
    };
  });
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
  onExportData,
  onImportData,
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
  onExportData: () => void;
  onImportData: (file: File | null) => void;
  onEditSession: (sessionId: string) => void;
}) {
  const bodyweightTrend = [...measurements]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((entry) => ({
      date: new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(entry.date)),
      bodyweight: entry.bodyweightKg,
      bodyFat: entry.bodyFatPercent,
    }));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyStretchCount = stretchCompletions.filter((entry) => new Date(entry.date) >= weekStart).length;

  const chestSessions = userSessions.filter((session) => /chest/i.test(session.workoutName)).length;
  const backSessions = userSessions.filter((session) => /back/i.test(session.workoutName)).length;
  const gluteSessions = userSessions.filter((session) => /glutes/i.test(session.workoutName)).length;
  const coreSessions = userSessions.filter((session) => /core|abs/i.test(session.workoutName)).length;
  const shouldersSessions = userSessions.filter((session) => /shoulder/i.test(session.workoutName)).length;

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
          detail: `Lower-body emphasis is landing well, with ${weeklySummary.totalSets} total sets helping everything look rounder, softer, and far more tempting.`,
        }
      : {
          title: "Chest growth",
          value: `${chestSessions} sessions`,
          detail: `Pressing frequency and upper-body volume are stacking up for a thicker chest and a look Natasha is going to feel the second she is close.`,
        };

  const smartCards =
    profile.id === "natasha"
      ? [
          {
            title: "Current focus",
            value: "Back definition",
            detail: `${backSessions} back sessions logged. Width and upper-back detail are carving in nicely and making that waist-to-shoulder line look even dirtier.`,
          },
          {
            title: "Support signal",
            value: "Hourglass shape",
            detail: `${gluteSessions + shouldersSessions} shoulder and glute sessions are reinforcing that shoulder-to-waist-to-glute contrast and making your shape harder to forget.`,
          },
        ]
      : [
          {
            title: "Current focus",
            value: "Strength momentum",
            detail: `${strengthMomentumLabel} right now, with ${trendData.length || 0} tracked sessions feeding a load trend that keeps you looking stronger, fuller, and more dangerous.`,
          },
          {
            title: "Support signal",
            value: "Abs visibility",
            detail: `${absVisibilityLabel}, backed by ${weeklyStretchCount} recovery sessions and ${coreSessions} core-focused sessions so the waistline keeps tightening up.`,
          },
        ];

  const showingBodyMetrics = bodyweightTrend.length > 0;
  const calendarData = buildCalendarData(userSessions);
  const calendarMonthLabel = new Intl.DateTimeFormat("en-NZ", { month: "long", year: "numeric" }).format(new Date());
  const monthWorkoutCount = userSessions.filter((session) => {
    const date = new Date(session.performedAt);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;
  const aestheticSignal = getAestheticSignal(profile.id, userSessions, measurements);

  return (
    <>
      <ScrollReveal delay={0}>
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

      <ScrollReveal delay={70}>
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
          <div className="mt-4 grid grid-cols-1 gap-3">
            {smartCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{card.title}</p>
                  <p className="text-sm font-medium text-accent">{card.value}</p>
                </div>
                <p className="mt-2 text-sm text-muted">{card.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={150}>
        <MeasurementCard measurements={measurements} onSave={onSaveMeasurement} />
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <Card>
          <p className="text-sm text-muted">At a glance</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Completed" value={`${weeklySummary.workoutsCompleted}`} />
            <MiniMetric label="Total sets" value={`${weeklySummary.totalSets}`} />
            <MiniMetric label="PBs hit" value={`${weeklySummary.personalBests}`} />
            <MiniMetric label="Muscle focus" value={weeklySummary.mostTrainedMuscleGroup} />
          </div>
          <div className="mt-4 rounded-[24px] bg-black/5 p-4 text-sm text-muted dark:bg-white/5">
            {profile.name} is trending well with {weeklySummary.consistencyLabel.toLowerCase()}.
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={225}>
        <Card>
          <p className="text-sm text-muted">{aestheticSignal.title}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-text">{aestheticSignal.value}</h3>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">Adaptive</div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{aestheticSignal.detail}</p>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={250}>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Consistency</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{calendarMonthLabel}</h3>
            </div>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">{monthWorkoutCount} days trained</div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.12em] text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendarData.map((cell, index) =>
              cell ? (
                <div
                  key={`${cell.dayNumber}-${index}`}
                  className={`flex aspect-square items-center justify-center rounded-[18px] text-sm font-medium ${
                    cell.completed
                      ? "bg-accentSoft text-text"
                      : cell.today
                        ? "border border-stroke bg-[var(--card-strong)] text-text"
                        : "bg-[var(--card-strong)] text-muted"
                  }`}
                >
                  {cell.dayNumber}
                </div>
              ) : (
                <div key={`empty-${index}`} className="aspect-square" />
              ),
            )}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={275}>
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
                            session.partial
                              ? "bg-accentSoft text-accent"
                              : "bg-black/10 text-text dark:bg-white/10"
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

      <ScrollReveal delay={300}>
        <DataPortabilityCard onExport={onExportData} onImport={onImportData} />
      </ScrollReveal>
    </>
  );
}

