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
import type { MeasurementEntry, Profile, StretchCompletion, WeeklySummary, WorkoutSession } from "@/lib/types";

export function ProgressScreen({
  profile,
  totalWorkouts,
  weeklySummary,
  trendData,
  measurements,
  userSessions,
  stretchCompletions,
  onSaveMeasurement,
  onExportData,
  onImportData,
}: {
  profile: Profile;
  totalWorkouts: number;
  weeklySummary: WeeklySummary;
  trendData: Array<{ date: string; volume: number }>;
  measurements: MeasurementEntry[];
  userSessions: WorkoutSession[];
  stretchCompletions: StretchCompletion[];
  onSaveMeasurement: (entry: Omit<MeasurementEntry, "id" | "date">) => void;
  onExportData: () => void;
  onImportData: (file: File | null) => void;
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
          detail: `Lower-body emphasis is landing cleanly, with ${weeklySummary.totalSets} total sets supporting shape and fullness.`,
        }
      : {
          title: "Chest growth",
          value: `${chestSessions} sessions`,
          detail: `Pressing frequency and upper-body volume are lining up well for chest size and thickness.`,
        };

  const smartCards =
    profile.id === "natasha"
      ? [
          {
            title: "Current focus",
            value: "Back definition",
            detail: `${backSessions} back sessions logged. Width and upper-back detail work are staying consistent enough to sharpen shape.`,
          },
          {
            title: "Support signal",
            value: "Hourglass shape",
            detail: `${gluteSessions + shouldersSessions} shoulder and glute sessions are reinforcing the shoulder-to-waist-to-glute contrast.`,
          },
        ]
      : [
          {
            title: "Current focus",
            value: "Strength momentum",
            detail: `${strengthMomentumLabel} right now, with ${trendData.length || 0} tracked sessions informing the recent load trend.`,
          },
          {
            title: "Support signal",
            value: "Abs visibility",
            detail: `${absVisibilityLabel}, backed by ${weeklyStretchCount} recovery sessions and ${coreSessions} core-focused sessions.`,
          },
        ];

  const showingBodyMetrics = bodyweightTrend.length > 0;

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

      <ScrollReveal delay={170}>
        <MeasurementCard measurements={measurements} onSave={onSaveMeasurement} />
      </ScrollReveal>

      <ScrollReveal delay={220}>
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

      <ScrollReveal delay={270}>
        <DataPortabilityCard onExport={onExportData} onImport={onImportData} />
      </ScrollReveal>
    </>
  );
}
