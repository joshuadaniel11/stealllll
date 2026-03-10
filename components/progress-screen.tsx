import { DataPortabilityCard } from "@/components/data-portability-card";
import { MeasurementCard } from "@/components/measurement-card";
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

  const weeklyStretchCount = stretchCompletions.filter(
    (entry) => new Date(entry.date) >= weekStart,
  ).length;
  const goalCards =
    profile.id === "natasha"
      ? [
          {
            title: "Back Shape",
            value: `${userSessions.filter((session) => /back/i.test(session.workoutName)).length} sessions`,
            detail: "Tracking width and upper-back detail work.",
          },
          {
            title: "Glute Focus",
            value: `${userSessions.filter((session) => /glutes/i.test(session.workoutName)).length} sessions`,
            detail: "Weekly lower-body emphasis stays high.",
          },
          {
            title: "Flexibility",
            value: `${weeklyStretchCount} stretches`,
            detail: "Completed in Bend this week.",
          },
        ]
      : [
          {
            title: "Chest Growth",
            value: `${userSessions.filter((session) => /chest/i.test(session.workoutName)).length} sessions`,
            detail: "Stable press volume is building up.",
          },
          {
            title: "Arm Focus",
            value: `${userSessions.filter((session) => /arms|biceps|triceps/i.test(session.workoutName)).length} sessions`,
            detail: "Direct arm work is landing through the week.",
          },
          {
            title: "Flexibility",
            value: `${weeklyStretchCount} stretches`,
            detail: "Completed in Bend this week.",
          },
        ];

  return (
    <>
      <Card>
        <p className="text-sm text-muted">Progress</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{profile.name}&apos;s summary</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{profile.goalSummary}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniMetric label="Total workouts" value={`${totalWorkouts}`} />
          <MiniMetric label="Volume this week" value={`${weeklySummary.totalVolume}kg`} />
          <MiniMetric label="Most trained" value={weeklySummary.mostTrainedMuscleGroup} />
          <MiniMetric label="Consistency" value={weeklySummary.consistencyLabel} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Trend</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Training volume</h3>
          </div>
          <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
            Last {trendData.length} sessions
          </div>
        </div>
        <div className="mt-4 h-52">
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
        </div>
      </Card>

      <Card>
        <p className="text-sm text-muted">Goals</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {goalCards.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{card.title}</p>
                <p className="text-sm font-medium text-accent">{card.value}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{card.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {profile.goals.map((goal) => (
            <div key={goal.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-sm text-muted">{goal.target}</p>
                </div>
                <span className="text-sm font-medium text-accent">{goal.progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-black/5 dark:bg-white/5">
                <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${goal.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <MeasurementCard
        measurements={measurements}
        onSave={onSaveMeasurement}
      />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Check-in trend</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Body metrics</h3>
          </div>
          <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
            {bodyweightTrend.length ? `${bodyweightTrend.length} entries` : "No entries yet"}
          </div>
        </div>
        <div className="mt-4 h-44">
          {bodyweightTrend.length ? (
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
          ) : (
            <div className="flex h-full items-center justify-center rounded-[24px] bg-black/5 text-sm text-muted dark:bg-white/5">
              Add your first check-in to see the trend.
            </div>
          )}
        </div>
      </Card>

      <Card>
        <p className="text-sm text-muted">Weekly summary</p>
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

      <DataPortabilityCard onExport={onExportData} onImport={onImportData} />
    </>
  );
}
