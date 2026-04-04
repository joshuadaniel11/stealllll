import { useMemo } from "react";
import { BarChart3, List, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { BodyActivationVisual } from "@/components/body-activation-visual";
import { BrandEmptyState } from "@/components/brand-empty-state";
import { CardHelpButton } from "@/components/card-help-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ActivityDropdown } from "@/components/ui/activity-dropdown";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { GlassCalendar } from "@/components/ui/glass-calendar";
import {
  getHeadToHead,
  getNextPbEstimates,
  getStrengthVelocities,
  getVolumeMomentum,
  getWeddingProjection,
} from "@/lib/projections";
import type { Profile, WorkoutSession } from "@/lib/types";
import type { ProfileTrainingState } from "@/lib/profile-training-state";
import type { ProgressViewModel } from "@/lib/view-models";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt1(n: number) {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
}

function TrendIcon({ trend }: { trend: "accelerating" | "steady" | "decelerating" | "building" | "stable" | "declining" }) {
  if (trend === "accelerating" || trend === "building")
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-400/80" strokeWidth={2} />;
  if (trend === "decelerating" || trend === "declining")
    return <TrendingDown className="h-3.5 w-3.5 text-rose-400/70" strokeWidth={2} />;
  return <Minus className="h-3.5 w-3.5 text-white/35" strokeWidth={2} />;
}

function getLoadStatusText(trainingState: ProfileTrainingState) {
  if (trainingState.trainingLoad.summary.lowActivity) return "Fresh week";
  const needsWork = trainingState.trainingLoad.summary.needsWork[0];
  if (needsWork) return needsWork.label;
  return "Covered";
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function StrengthTrajectorySection({ profile, userSessions }: { profile: Profile; userSessions: WorkoutSession[] }) {
  const velocities = useMemo(() => getStrengthVelocities(userSessions, profile.id), [userSessions, profile.id]);
  const pbEstimates = useMemo(() => getNextPbEstimates(userSessions, profile.id), [userSessions, profile.id]);

  if (velocities.length === 0) return null;

  const pbByName = new Map(pbEstimates.map((p) => [p.exerciseName, p]));

  return (
    <ScrollReveal delay={100}>
      <section className="glass-panel px-5 py-5">
        <p className="label-eyebrow">Strength trajectory</p>
        <p className="secondary-copy mt-1.5">Epley E1RM · weighted velocity · 2.5% PB target</p>
        <div className="mt-4 space-y-3">
          {velocities.map((v) => {
            const pb = pbByName.get(v.exerciseName);
            return (
              <div key={v.exerciseName} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-white/80">{v.exerciseName}</p>
                  <p className="mt-0.5 text-[12px] text-white/38">
                    {pb?.weeksToNextPb != null
                      ? `~${pb.weeksToNextPb} ${pb.weeksToNextPb === 1 ? "wk" : "wks"} to PB`
                      : "On current plateau"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5 pt-0.5">
                  <TrendIcon trend={v.trend} />
                  <span className="text-[13px] font-medium tabular-nums text-white/70">
                    {v.gainPerWeekKg > 0 ? `+${fmt1(v.gainPerWeekKg)}` : fmt1(v.gainPerWeekKg)} kg/wk
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </ScrollReveal>
  );
}

function VolumeMomentumSection({ userSessions }: { userSessions: WorkoutSession[] }) {
  const momentum = useMemo(() => getVolumeMomentum(userSessions, 12), [userSessions]);

  const hasData = momentum.weeks.some((w) => w.volumeKg > 0);
  if (!hasData) return null;

  const maxVol = Math.max(...momentum.weeks.map((w) => w.volumeKg), 1);

  return (
    <ScrollReveal delay={140}>
      <section className="glass-panel px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-eyebrow">Volume momentum</p>
            <p className="secondary-copy mt-1.5">
              {momentum.trend === "building"
                ? `Building · +${Math.round(momentum.slopeKgPerWeek)} kg/wk avg`
                : momentum.trend === "declining"
                  ? `Declining · ${Math.round(momentum.slopeKgPerWeek)} kg/wk`
                  : "Stable · consistent load"}
            </p>
          </div>
          <TrendIcon trend={momentum.trend} />
        </div>
        {/* Mini sparkline */}
        <div className="mt-4 flex h-10 items-end gap-[3px]">
          {momentum.weeks.map((w, i) => {
            const ratio = w.volumeKg / maxVol;
            const heightPercent = Math.max(ratio * 100, w.volumeKg > 0 ? 8 : 3);
            return (
              <div
                key={i}
                className="flex-1 rounded-[2px] transition-all"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor:
                    w.volumeKg === 0
                      ? "rgba(255,255,255,0.06)"
                      : ratio > 0.75
                        ? "var(--accent)"
                        : "rgba(255,255,255,0.25)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <p className="text-[10px] text-white/25">{momentum.weeks[0]?.label}</p>
          <p className="text-[10px] text-white/25">Now</p>
        </div>
      </section>
    </ScrollReveal>
  );
}

function WeddingProjectionSection({
  profile,
  userSessions,
  measurements,
  weddingDate,
}: {
  profile: Profile;
  userSessions: WorkoutSession[];
  measurements: ProgressViewModel["measurements"];
  weddingDate: Date;
}) {
  const projection = useMemo(
    () => getWeddingProjection(userSessions, measurements, profile.id, weddingDate),
    [userSessions, measurements, profile.id, weddingDate],
  );

  if (!projection) return null;

  const isJoshua = profile.id === "joshua";
  const accentColor = isJoshua ? "text-emerald-300/80" : "text-sky-300/80";

  return (
    <ScrollReveal delay={180}>
      <section className="glass-panel px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-eyebrow">Wedding day targets</p>
            <p className="secondary-copy mt-1.5">OLS regression · {projection.daysToWedding} days out</p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {projection.bodyweight && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-white/55">Bodyweight</p>
              <div className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums">
                <span className="text-white/40">{fmt1(projection.bodyweight.currentKg)} kg</span>
                <span className="text-white/20">→</span>
                <span className={projection.bodyweight.changeKg < 0 ? accentColor : "text-white/70"}>
                  {fmt1(projection.bodyweight.projectedKg)} kg
                </span>
              </div>
            </div>
          )}
          {projection.lifts.map((lift) => (
            <div key={lift.exerciseName} className="flex items-center justify-between gap-3">
              <p className="truncate text-[13px] text-white/55">{lift.exerciseName}</p>
              <div className="flex flex-shrink-0 items-center gap-1.5 text-[13px] font-medium tabular-nums">
                <span className="text-white/40">{fmt1(lift.currentE1rmKg)}</span>
                <span className="text-white/20">→</span>
                <span className={lift.gainKg > 0 ? accentColor : "text-white/70"}>
                  {fmt1(lift.projectedE1rmKg)} kg E1RM
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

function HeadToHeadSection({
  profile,
  userSessions,
  rivalSessions,
}: {
  profile: Profile;
  userSessions: WorkoutSession[];
  rivalSessions: WorkoutSession[];
}) {
  const entries = useMemo(
    () => getHeadToHead(userSessions, rivalSessions),
    [userSessions, rivalSessions],
  );

  if (entries.length === 0) return null;

  const rivalName = profile.id === "joshua" ? "Natasha" : "Joshua";
  const isJoshua = profile.id === "joshua";

  return (
    <ScrollReveal delay={220}>
      <section className="glass-panel px-5 py-5">
        <p className="label-eyebrow">vs {rivalName} · 4-wk trajectory</p>
        <p className="secondary-copy mt-1.5">Quality-adjusted E1RM volume · recent vs prior 4 weeks</p>
        <div className="mt-4 space-y-3">
          {entries.map((entry) => {
            const youLead = entry.leader === "user";
            const theyLead = entry.leader === "rival";
            return (
              <div key={entry.category}>
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-white/45 uppercase tracking-[0.07em]">{entry.category}</span>
                  <span className={`font-medium ${youLead ? (isJoshua ? "text-emerald-300/80" : "text-sky-300/80") : theyLead ? "text-white/35" : "text-white/50"}`}>
                    {youLead ? "You ↑" : theyLead ? `${rivalName} ↑` : "Tied"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {/* User bar */}
                  <div className="flex flex-1 flex-col items-end gap-0.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className={`h-full rounded-full transition-all ${isJoshua ? "bg-emerald-400/60" : "bg-sky-400/60"}`}
                        style={{ width: `${Math.min(Math.max(entry.userChangePercent + 50, 5), 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] tabular-nums text-white/35">
                      You {entry.userChangePercent >= 0 ? "+" : ""}{entry.userChangePercent}%
                    </p>
                  </div>
                  <div className="text-[10px] text-white/20">|</div>
                  {/* Rival bar */}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-white/[0.22] transition-all"
                        style={{ width: `${Math.min(Math.max(entry.rivalChangePercent + 50, 5), 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] tabular-nums text-white/35">
                      {rivalName} {entry.rivalChangePercent >= 0 ? "+" : ""}{entry.rivalChangePercent}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </ScrollReveal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgressScreen({
  viewModel,
  onEditSession,
}: {
  viewModel: ProgressViewModel;
  onEditSession: (sessionId: string) => void;
}) {
  const { profile, trainingState, measurements, rivalSessions, coach } = viewModel;
  const weeklyNumber = trainingState.weeklySummary.workoutsCompleted;
  const loadStatusText = getLoadStatusText(trainingState);
  const latestMeasurement = measurements[0] ?? null;
  const visibleRecentSessions = useMemo(() => trainingState.recentSessions.slice(0, 3), [trainingState.recentSessions]);

  return (
    <div className="space-y-3">
      {/* Weekly status */}
      <ScrollReveal delay={0}>
        <section className="glass-panel overflow-hidden px-5 py-5">
          <BackgroundPaths profileId={profile.id} className="opacity-80" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-eyebrow">Weekly status</p>
                <p className="giant-number mt-3 text-white">{weeklyNumber}</p>
                <p className="section-heading mt-3 text-white/88">
                  {weeklyNumber === 1 ? "workout logged" : "workouts logged"}
                </p>
              </div>
              <CardHelpButton
                title="Weekly status"
                summary="Fast read on the week."
                points={[
                  "The big number is completed sessions this week.",
                  "The line below tells you what to focus on next.",
                ]}
              />
            </div>
            <p className="secondary-copy mt-4">
              {trainingState.insights.weeklyStatusDetail || coach.progressFocusLine}
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Coach focus */}
      <ScrollReveal delay={40}>
        <div className="px-1">
          <p className="text-[15px] text-white/78">Focus: {coach.progressFocusLine}</p>
        </div>
      </ScrollReveal>

      {/* Body map */}
      <ScrollReveal delay={80}>
        <section className="glass-panel px-5 py-5">
          <p className="label-eyebrow">Body map</p>
          <p className="secondary-copy mt-1.5">What this week has actually touched.</p>
          <div className="mt-4 flex justify-center gap-3">
            <BodyActivationVisual
              metrics={trainingState.trainingLoad.metrics}
              userId={profile.id}
              view="front"
              selectedZone={null}
              onSelectZone={() => {}}
            />
            <BodyActivationVisual
              metrics={trainingState.trainingLoad.metrics}
              userId={profile.id}
              view="back"
              selectedZone={null}
              onSelectZone={() => {}}
            />
          </div>
        </section>
      </ScrollReveal>

      {/* Calendar */}
      <ScrollReveal delay={120}>
        <GlassCalendar rows={trainingState.calendarRows} />
      </ScrollReveal>

      {/* ── Science projections ── */}

      <StrengthTrajectorySection profile={profile} userSessions={trainingState.userSessions} />

      <VolumeMomentumSection userSessions={trainingState.userSessions} />

      <WeddingProjectionSection
        profile={profile}
        userSessions={trainingState.userSessions}
        measurements={measurements}
        weddingDate={trainingState.weddingDate.weddingDate}
      />

      <HeadToHeadSection
        profile={profile}
        userSessions={trainingState.userSessions}
        rivalSessions={rivalSessions}
      />

      {/* ── Existing dropdowns ── */}

      <ScrollReveal delay={260}>
        <ActivityDropdown
          title="Training load"
          description={loadStatusText}
          icon={<BarChart3 className="h-5 w-5" strokeWidth={1.5} />}
        >
          <div className="space-y-3">
            {trainingState.trainingLoad.summary.mostTrained.length ? (
              <div>
                <p className="label-eyebrow">Most trained</p>
                <p className="mt-2 text-[15px] text-white/80">
                  {trainingState.trainingLoad.summary.mostTrained.map((m) => m.label).join(", ")}
                </p>
              </div>
            ) : null}
            <div>
              <p className="label-eyebrow">Needs work</p>
              <p className="mt-2 text-[15px] text-white/80">
                {trainingState.trainingLoad.summary.needsWork.length
                  ? trainingState.trainingLoad.summary.needsWork.map((m) => m.label).join(", ")
                  : "Nothing urgent this week."}
              </p>
            </div>
          </div>
        </ActivityDropdown>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <ActivityDropdown
          title="Dashboard numbers"
          description="Measurements and saved sessions."
          icon={<List className="h-5 w-5" strokeWidth={1.5} />}
        >
          <div className="space-y-3">
            {trainingState.goalDashboard.cards.map((card) => (
              <div key={card.label} className="glass-panel-elevated rounded-[16px] px-4 py-4">
                <p className="label-eyebrow">{card.label}</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white/90">{card.value}</p>
                <p className="secondary-copy mt-2">{card.detail}</p>
              </div>
            ))}
            <div className="glass-panel-elevated rounded-[16px] px-4 py-4">
              <p className="label-eyebrow">Latest measurement</p>
              <p className="mt-2 text-[15px] text-white/80">
                {latestMeasurement ? `${latestMeasurement.bodyweightKg} kg` : "No entries yet."}
              </p>
            </div>
            <div className="space-y-2">
              <p className="label-eyebrow">Saved workouts</p>
              {visibleRecentSessions.length ? (
                visibleRecentSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onEditSession(session.id)}
                    className="glass-panel-elevated flex w-full items-center justify-between rounded-[16px] px-4 py-4 text-left"
                  >
                    <div>
                      <p className="text-[15px] text-white/80">{session.workoutName}</p>
                      <p className="secondary-copy mt-1">{new Date(session.performedAt).toLocaleDateString("en-NZ")}</p>
                    </div>
                    <span className="text-[13px] text-white/45">Edit</span>
                  </button>
                ))
              ) : (
                <BrandEmptyState title="Saved workouts" body="No sessions logged yet." compact />
              )}
            </div>
          </div>
        </ActivityDropdown>
      </ScrollReveal>
    </div>
  );
}
