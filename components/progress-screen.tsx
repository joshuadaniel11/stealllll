import type { ReactNode } from "react";
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
import { ChevronRight } from "lucide-react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));
}

function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-white/54">{eyebrow}</p>
        <h3 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-white/94">{title}</h3>
        {description ? <p className="mt-2 text-[14px] leading-6 text-white/58">{description}</p> : null}
      </div>
      {aside ? <div>{aside}</div> : null}
    </div>
  );
}

function DashboardMetricCard({ card }: { card: GoalDashboardCard }) {
  const toneClass =
    card.tone === "positive"
      ? "bg-emerald-400/10 text-emerald-50"
      : card.tone === "attention"
        ? "bg-amber-300/10 text-amber-50"
        : "bg-white/7 text-white/78";

  return (
    <div className="progress-kpi-card rounded-[22px] border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium tracking-[-0.01em] text-white/58">{card.label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${toneClass}`}>
          {card.tone === "positive" ? "On track" : card.tone === "attention" ? "Watch" : "Steady"}
        </span>
      </div>
      <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-white/94">{card.value}</p>
      <p className="mt-1 text-[13px] leading-6 text-white/54">{card.detail}</p>
    </div>
  );
}

function FocusDirectionCard({
  focusText,
  coverageLabels,
  sessionSummary,
  onOpen,
}: {
  focusText: string;
  coverageLabels: Array<{ label: string; percentage: number }>;
  sessionSummary: { focusText: string; estimatedDurationMinutes: number; exerciseCount: number } | null;
  onOpen: () => void;
}) {
  return (
    <Card className="progress-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-white/52">Focus direction</p>
          <h3 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.05em] text-white/94">{focusText}</h3>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/72 transition active:scale-[0.98]"
        >
          Open
          <ChevronRight className="h-4 w-4 text-white/46" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="progress-summary-card rounded-[24px] border px-4 py-4">
          <p className="text-[12px] font-medium text-white/48">Needs attention</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coverageLabels.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium text-white/78"
              >
                {item.label} {item.percentage}%
              </span>
            ))}
          </div>
        </div>
        {sessionSummary ? (
          <div className="progress-subcard rounded-[24px] border px-4 py-4">
            <p className="text-[12px] font-medium text-white/48">Suggested session</p>
            <p className="mt-2 text-[15px] font-semibold text-white/90">{sessionSummary.focusText}</p>
            <p className="mt-2 text-[13px] leading-6 text-white/56">
              {sessionSummary.exerciseCount} moves - ~{sessionSummary.estimatedDurationMinutes} min
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function getWeeklyRead(trainingState: ProfileTrainingState) {
  const { trainingLoad, weeklySummary } = trainingState;
  const nextText = trainingLoad.summary.suggestedNextFocus.text;
  const topLoaded = trainingLoad.summary.mostTrained.map((metric) => metric.label).join(", ");
  const lagging = trainingLoad.summary.needsWork.map((metric) => metric.label).join(", ");

  if (weeklySummary.workoutsCompleted === 0) {
    return {
      title: "No training logged yet this week",
      detail: "Start with your priority zones and let the week build from there.",
    };
  }

  return {
    title: `${nextText} need attention`,
    detail: topLoaded
      ? `${topLoaded} are leading. ${lagging || nextText} still need work.`
      : `${lagging || nextText} still need work next.`,
  };
}

function getWeeklyFocusText(trainingState: ProfileTrainingState) {
  const labels = trainingState.trainingLoad.summary.suggestedNextFocus.labels.slice(0, 2);
  return labels.length ? labels.join(" + ") : trainingState.trainingLoad.summary.suggestedNextFocus.text;
}

export function ProgressScreen({
  profile,
  trainingState,
  measurements,
  stretchCompletions,
  recentTrainingUpdate,
  onOpenSuggestedSession,
  onSaveMeasurement,
  onEditSession,
}: {
  profile: Profile;
  trainingState: ProfileTrainingState;
  measurements: MeasurementEntry[];
  stretchCompletions: StretchCompletion[];
  recentTrainingUpdate: RecentTrainingUpdate | null;
  onOpenSuggestedSession: () => void;
  onSaveMeasurement: (entry: Omit<MeasurementEntry, "id" | "date">) => void;
  onEditSession: (sessionId: string) => void;
}) {
  const {
    calendarRows,
    nextFocusDestination,
    progressSignals,
    recentSessions,
    suggestedFocusSession,
    trainingLoad,
    trendData,
    userSessions,
    weeklySummary,
  } = trainingState;
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
  const weeklyRead = getWeeklyRead(trainingState);
  const weeklyFocusText = getWeeklyFocusText(trainingState);
  const focusCoverage = trainingLoad.summary.needsWork.slice(0, 2).map((metric) => ({
    label: metric.label,
    percentage: metric.percentage,
  }));
  const recentUpdateLabel = recentTrainingUpdate
    ? (() => {
        const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(recentTrainingUpdate.timestamp).getTime()) / 60000));
        const freshness =
          minutesAgo <= 1 ? "just now" : minutesAgo < 60 ? `${minutesAgo} min ago` : "recently";
        return recentTrainingUpdate.kind === "partial"
          ? `${recentTrainingUpdate.workoutName} saved ${freshness}. Your training read is already refreshed.`
          : recentTrainingUpdate.kind === "edit"
            ? `${recentTrainingUpdate.workoutName} was updated ${freshness}. This week's training read is in sync.`
            : `${recentTrainingUpdate.workoutName} landed ${freshness}. This week's direction already shifted.`;
      })()
    : null;

  return (
    <>
      <ScrollReveal delay={0}>
        <Card className="progress-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-white/52">This week</p>
              <h2 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.06em] text-white/94">{weeklyRead.title}</h2>
              <p className="mt-2 text-[14px] font-medium text-white/72">Focus: {weeklyFocusText}</p>
              <p className="mt-2 text-[14px] leading-6 text-white/56">{weeklyRead.detail}</p>
            </div>
            <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/68">
              {weeklySummary.workoutsCompleted} this week
            </div>
          </div>
          {recentUpdateLabel ? (
            <div className="progress-summary-card mt-4 rounded-[22px] border px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/42">In sync</p>
              <p className="mt-2 text-[13px] leading-6 text-white/60">{recentUpdateLabel}</p>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={12}>
        <FocusDirectionCard
          focusText={weeklyFocusText}
          coverageLabels={focusCoverage}
          sessionSummary={
            suggestedFocusSession
              ? {
                  focusText: suggestedFocusSession.focusText,
                  estimatedDurationMinutes: suggestedFocusSession.estimatedDurationMinutes,
                  exerciseCount: suggestedFocusSession.exercises.length,
                }
              : null
          }
          onOpen={onOpenSuggestedSession}
        />
      </ScrollReveal>

      <ScrollReveal delay={24}>
        <TrainingLoadCard
          metrics={trainingLoad.metrics}
          groups={trainingLoad.groups}
          topZones={trainingLoad.topZones}
          summary={trainingLoad.summary}
          weekLabel={trainingLoad.week.label}
          activeDayCount={trainingLoad.activeDays.size}
          userId={profile.id}
        />
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <Card className="progress-panel">
          <SectionHeader
            eyebrow="Goal dashboard"
            title={goalDashboard.label}
            description={goalDashboard.headline}
            aside={
              <div className="max-w-[10rem] rounded-full bg-white/8 px-3 py-1.5 text-center text-[11px] font-medium text-white/68">
                {goalDashboard.emphasisLabel}
              </div>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {goalDashboard.cards.map((card) => (
              <DashboardMetricCard key={card.label} card={card} />
            ))}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={62}>
        <Card className="progress-panel">
          <SectionHeader
            eyebrow="Workout calendar"
            title="Last 6 weeks"
            description="Your recent rhythm, with this week kept in focus."
            aside={
              <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
                {weeklySummary.workoutsCompleted} this week
              </div>
            }
          />
          <div className="mt-4">
            <WeeklyTrainingCalendar rows={calendarRows} />
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={86}>
        <Card className="progress-panel">
          <SectionHeader
            eyebrow="Secondary signals"
            title={`${profile.name}'s supporting read`}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Focus" value={progressSignals.primarySignal.value} />
            <MiniMetric label="Stretches" value={`${weeklyStretchCount}`} />
          </div>
          <div className="mt-4 grid gap-3">
            <div className="progress-highlight-card rounded-[24px] p-4">
              <p className="text-[12px] font-medium text-white/52">Best current signal</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold text-white/90">{progressSignals.leadingIndicator.title}</p>
                <p className="text-[13px] font-medium text-white/72">{progressSignals.leadingIndicator.value}</p>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-white/56">{progressSignals.leadingIndicator.detail}</p>
            </div>
            <div className="progress-summary-card rounded-[24px] border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-white/52">{progressSignals.primarySignal.title}</p>
                  <p className="mt-1 text-[15px] font-semibold text-white/90">{progressSignals.primarySignal.value}</p>
                </div>
                <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/68">
                  Direction
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-white/56">{progressSignals.primarySignal.detail}</p>
            </div>
            <div className="progress-summary-card rounded-[24px] border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-white/52">{aestheticSignal.title}</p>
                  <p className="mt-1 text-[15px] font-semibold text-white/90">{aestheticSignal.value}</p>
                </div>
                <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/68">
                  Adaptive
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-white/56">{aestheticSignal.detail}</p>
            </div>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={122}>
        <Card className="progress-panel">
          <SectionHeader
            eyebrow="Trend"
            title={showingBodyMetrics ? "Body metrics" : "Training volume"}
            aside={
              <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
                {showingBodyMetrics
                  ? `${bodyweightTrend.length} entries`
                  : trendData.length
                    ? `Last ${trendData.length} sessions`
                    : "No sessions yet"}
              </div>
            }
          />
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

      <ScrollReveal delay={170}>
        <MeasurementCard measurements={measurements} onSave={onSaveMeasurement} />
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <Card className="progress-panel">
          <SectionHeader
            eyebrow="Recent sessions"
            title="Saved workouts"
            aside={
              <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
                {recentSessions.length} tracked
              </div>
            }
          />
          <div className="mt-4 space-y-3">
            {recentSessions.length ? (
              recentSessions.map((session) => (
                <div key={session.id} className="progress-session-row rounded-[24px] border px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-white/92">{session.workoutName}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            session.partial ? "bg-white/10 text-white/84" : "bg-white/6 text-white/64"
                          }`}
                        >
                          {session.partial ? "Partial" : "Full"}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-white/48">
                        {[
                          formatDate(session.performedAt),
                          `${session.durationMinutes} min`,
                          `${session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets`,
                        ].join(" · ")}
                      </p>
                    </div>
                    <button
                      className="rounded-[18px] bg-white/7 px-3 py-2 text-sm font-medium text-white/78"
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

