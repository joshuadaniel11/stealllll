import type { ReactNode } from "react";
import { MeasurementCard } from "@/components/measurement-card";
import { useState } from "react";
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
  progressInsight,
  sessionSummary,
  onOpen,
}: {
  focusText: string;
  progressInsight: string;
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
          Session
          <ChevronRight className="h-4 w-4 text-white/46" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="progress-summary-card rounded-[24px] border px-4 py-4">
          <p className="text-[12px] font-medium text-white/48">Progress signal</p>
          <p className="mt-2 text-[15px] font-semibold text-white/90">{progressInsight}</p>
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
  const [showAllGoalCards, setShowAllGoalCards] = useState(false);
  const [showSecondarySignals, setShowSecondarySignals] = useState(false);
  const [showDetailSections, setShowDetailSections] = useState(false);
  const [showAllRecentSessions, setShowAllRecentSessions] = useState(false);
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
  const visibleGoalCards = showAllGoalCards ? goalDashboard.cards : goalDashboard.cards.slice(0, 1);
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
  const currentWeekRow = calendarRows.find((row) => row.isCurrentWeek) ?? calendarRows.at(-1) ?? null;
  const joshuaWeekCount = currentWeekRow ? currentWeekRow.days.filter((day) => day.joshuaCompleted).length : 0;
  const natashaWeekCount = currentWeekRow ? currentWeekRow.days.filter((day) => day.natashaCompleted).length : 0;
  const competitionLabel =
    joshuaWeekCount === natashaWeekCount
      ? joshuaWeekCount === 0
        ? "Fresh week"
        : `Tied at ${joshuaWeekCount}`
      : joshuaWeekCount > natashaWeekCount
        ? `Joshua ${joshuaWeekCount}-${natashaWeekCount}`
        : `Natasha ${natashaWeekCount}-${joshuaWeekCount}`;

  const aestheticSignal = getAestheticSignal(profile.id, userSessions, measurements);
  const showingBodyMetrics = bodyweightTrend.length > 0;
  const hasDetailContent = showingBodyMetrics || trendData.length > 0 || recentSessions.length > 0;
  const { insights } = trainingState;
  const visibleRecentSessions = showAllRecentSessions ? recentSessions : recentSessions.slice(0, 2);
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
        <Card className="progress-panel tab-fade-enter">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-white/52">This week</p>
              <h2 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.06em] text-white/94">{insights.weeklyStatusTitle}</h2>
              <p className="mt-2 text-[14px] font-medium text-white/72">Focus: {insights.focusDirection}</p>
              <p className="mt-2 text-[14px] leading-6 text-white/56">{insights.weeklyStatusDetail}</p>
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
        <Card className="progress-panel tab-fade-enter">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
            {trainingState.progressPhaseIndicator.label}
          </p>
          <p className="mt-2 text-[12px] font-medium text-white/58">
            {trainingState.progressPhaseIndicator.description}
          </p>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={18}>
        <FocusDirectionCard
          focusText={insights.focusDirection}
          progressInsight={insights.progressSignal}
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

      <ScrollReveal delay={30}>
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
        <Card className="progress-panel tab-fade-enter">
          <SectionHeader
            eyebrow="Goal dashboard"
            title={goalDashboard.label}
            aside={
              <div className="max-w-[10rem] rounded-full bg-white/8 px-3 py-1.5 text-center text-[11px] font-medium text-white/68">
                {goalDashboard.emphasisLabel}
              </div>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {visibleGoalCards.map((card) => (
              <DashboardMetricCard key={card.label} card={card} />
            ))}
          </div>
          {goalDashboard.cards.length > 2 ? (
            <button
              type="button"
              onClick={() => setShowAllGoalCards((value) => !value)}
              className="mt-4 text-sm font-medium text-white/56 transition hover:text-white/82"
            >
              {showAllGoalCards ? "Show less" : "Show more"}
            </button>
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={62}>
        <Card className="progress-panel tab-fade-enter">
          <SectionHeader
            eyebrow="Workout calendar"
            title="Last 6 weeks"
            aside={
              <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
                {competitionLabel}
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
          <button
            type="button"
            onClick={() => setShowSecondarySignals((value) => !value)}
            className="flex w-full items-start justify-between gap-3 text-left"
          >
            <div>
              <p className="text-[13px] font-medium text-white/54">Signals</p>
              <h3 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-white/94">
                {progressSignals.leadingIndicator.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-white/58">{progressSignals.leadingIndicator.value}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Focus" value={progressSignals.primarySignal.value} />
              <MiniMetric label="Stretches" value={`${weeklyStretchCount}`} />
            </div>
          </button>
          {showSecondarySignals ? (
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
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={122}>
        <Card className="progress-panel">
          {hasDetailContent ? (
            <>
              <button
                type="button"
                onClick={() => setShowDetailSections((value) => !value)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-[13px] font-medium text-white/54">Archive</p>
                  <h3 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-white/94">
                    {showingBodyMetrics ? "Body metrics and sessions" : "Trend and sessions"}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-white/58">
                    Open the deeper history only when you want it.
                  </p>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
                  {showDetailSections ? "Hide" : "Open"}
                </div>
              </button>

              {showDetailSections ? (
            <div className="mt-5 space-y-5">
              <div>
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
              </div>

              {(showingBodyMetrics || measurements.length > 0) ? (
                <MeasurementCard measurements={measurements} onSave={onSaveMeasurement} />
              ) : null}

              {recentSessions.length ? (
                <div>
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
                    {visibleRecentSessions.map((session) => (
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
                    ))}
                    {recentSessions.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllRecentSessions((value) => !value)}
                        className="text-sm font-medium text-white/56 transition hover:text-white/82"
                      >
                        {showAllRecentSessions ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
              ) : null}
            </>
          ) : (
            <div>
              <p className="text-[13px] font-medium text-white/54">Archive</p>
              <h3 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-white/94">
                More detail unlocks after a few sessions
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-white/58">
                Once trend, check-ins, or saved sessions build up, the deeper detail layer will live here.
              </p>
            </div>
          )}
        </Card>
      </ScrollReveal>
    </>
  );
}

