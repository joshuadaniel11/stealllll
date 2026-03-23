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
import { getCurrentWeekWindow } from "@/lib/training-load";
import type { GoalDashboardCard, ProfileTrainingState } from "@/lib/profile-training-state";
import { getAestheticSignal } from "@/lib/workout-intelligence";
import type { MeasurementEntry, Profile, RecentTrainingUpdate, StretchCompletion } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));
}

function DashboardMetricCard({ card }: { card: GoalDashboardCard }) {
  const toneClass =
    card.tone === "positive"
      ? "bg-emerald-400/10 text-emerald-100"
      : card.tone === "attention"
        ? "bg-amber-300/10 text-amber-100"
        : "bg-white/8 text-white";

  return (
    <div className="rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">{card.label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${toneClass}`}>
          {card.tone === "positive" ? "On track" : card.tone === "attention" ? "Watch" : "Steady"}
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white/92">{card.value}</p>
      <p className="mt-1 text-sm leading-6 text-white/56">{card.detail}</p>
    </div>
  );
}

export function ProgressScreen({
  profile,
  trainingState,
  measurements,
  stretchCompletions,
  recentTrainingUpdate,
  onOpenNextFocus,
  onOpenSuggestedSession,
  onSaveMeasurement,
  onEditSession,
}: {
  profile: Profile;
  trainingState: ProfileTrainingState;
  measurements: MeasurementEntry[];
  stretchCompletions: StretchCompletion[];
  recentTrainingUpdate: RecentTrainingUpdate | null;
  onOpenNextFocus: () => void;
  onOpenSuggestedSession: () => void;
  onSaveMeasurement: (entry: Omit<MeasurementEntry, "id" | "date">) => void;
  onEditSession: (sessionId: string) => void;
}) {
  const { calendarRows, nextFocusDestination, progressSignals, recentSessions, suggestedFocusSession, totalWorkouts, trainingLoad, trendData, userSessions, weeklySummary } =
    trainingState;
  const goalDashboard = trainingState.goalDashboard;
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

  const aestheticSignal = getAestheticSignal(profile.id, userSessions, measurements);
  const showingBodyMetrics = bodyweightTrend.length > 0;
  const recentUpdateLabel = recentTrainingUpdate
    ? (() => {
        const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(recentTrainingUpdate.timestamp).getTime()) / 60000));
        const freshness =
          minutesAgo <= 1 ? "just now" : minutesAgo < 60 ? `${minutesAgo} min ago` : "recently";
        return recentTrainingUpdate.kind === "partial"
          ? `${recentTrainingUpdate.workoutName} saved ${freshness}. Your load, map, and next recommendation are already refreshed.`
          : recentTrainingUpdate.kind === "edit"
            ? `${recentTrainingUpdate.workoutName} was updated ${freshness}. This week's training read is already in sync.`
            : `${recentTrainingUpdate.workoutName} landed ${freshness}. Today's summaries and next suggestions have already shifted.`;
      })()
    : null;

  return (
    <>
      {recentUpdateLabel ? (
        <ScrollReveal delay={0}>
          <div className="training-refresh-chip rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/42">Training state refreshed</p>
              <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-medium text-accent">Live</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/76">{recentUpdateLabel}</p>
          </div>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={0}>
        <TrainingLoadCard
          metrics={trainingLoad.metrics}
          groups={trainingLoad.groups}
          topZones={trainingLoad.topZones}
          summary={trainingLoad.summary}
          weekLabel={trainingLoad.week.label}
          activeDayCount={trainingLoad.activeDays.size}
          userId={profile.id}
          nextFocusHelperText={nextFocusDestination?.helperText ?? "Open matching workout"}
          suggestedSession={suggestedFocusSession}
          onOpenNextFocus={onOpenNextFocus}
          onOpenSuggestedSession={onOpenSuggestedSession}
        />
      </ScrollReveal>

      <ScrollReveal delay={12}>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Goal dashboard</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">{goalDashboard.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{goalDashboard.headline}</p>
            </div>
            <div className="max-w-[9.5rem] rounded-full bg-accentSoft px-3 py-1 text-center text-xs text-accent">
              {goalDashboard.emphasisLabel}
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">This week&apos;s read</p>
            <p className="mt-2 text-sm leading-6 text-white/80">{goalDashboard.summary}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {goalDashboard.cards.map((card) => (
              <DashboardMetricCard key={card.label} card={card} />
            ))}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={25}>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Workout calendar</p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">Last 6 weeks</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                A clean view of your training rhythm, with this week kept visually in focus.
              </p>
            </div>
            <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
              {weeklySummary.workoutsCompleted} this week
            </div>
          </div>
          <div className="mt-4">
            <WeeklyTrainingCalendar rows={calendarRows} />
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={50}>
        <Card>
          <p className="text-sm text-muted">Weekly snapshot</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{profile.name}&apos;s training read</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{profile.goalSummary}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniMetric label="Total workouts" value={`${totalWorkouts}`} />
            <MiniMetric label="This week" value={`${weeklySummary.workoutsCompleted}`} />
            <MiniMetric label="Stretches" value={`${weeklyStretchCount}`} />
          </div>
          <div className="mt-4 rounded-[24px] bg-[var(--card-strong)] p-4">
            <p className="text-sm text-muted">Best current signal</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-text">{progressSignals.leadingIndicator.title}</p>
              <p className="text-sm font-medium text-accent">{progressSignals.leadingIndicator.value}</p>
            </div>
            <p className="caption-text mt-2 text-muted">{progressSignals.leadingIndicator.detail}</p>
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
          <p className="text-sm text-muted">Direction this week</p>
          <div className="mt-4 rounded-[24px] border border-stroke bg-white/50 px-4 py-4 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{progressSignals.primarySignal.title}</p>
              <p className="text-sm font-medium text-accent">{progressSignals.primarySignal.value}</p>
            </div>
            <p className="mt-2 text-sm text-muted">{progressSignals.primarySignal.detail}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <MiniMetric label="Support" value={progressSignals.supportSignal.value} />
            <MiniMetric label="PBs hit" value={`${weeklySummary.personalBests}`} />
            <MiniMetric label="Load leader" value={weeklySummary.mostTrainedMuscleGroup} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{progressSignals.supportSignal.detail}</p>
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
