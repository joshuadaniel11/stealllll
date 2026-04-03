import { useMemo, useState } from "react";
import { BarChart3, List } from "lucide-react";

import { BodyActivationVisual } from "@/components/body-activation-visual";
import { BrandEmptyState } from "@/components/brand-empty-state";
import { CardHelpButton } from "@/components/card-help-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ActivityDropdown } from "@/components/ui/activity-dropdown";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { GlassCalendar } from "@/components/ui/glass-calendar";
import type { Profile } from "@/lib/types";
import type { ProfileTrainingState } from "@/lib/profile-training-state";
import type { TrainingLoadZone } from "@/lib/training-load";
import type { ProgressViewModel } from "@/lib/view-models";

function getLoadingLine(profileId: Profile["id"]) {
  return profileId === "natasha" ? "Reading your week." : "Getting your numbers.";
}

function getNoSessionsLine(profileId: Profile["id"]) {
  return profileId === "natasha" ? "No sessions yet. Start shaping." : "No sessions yet. Start building.";
}

function getLoadStatusText(trainingState: ProfileTrainingState) {
  if (trainingState.trainingLoad.summary.lowActivity) {
    return "Fresh week";
  }

  const needsWork = trainingState.trainingLoad.summary.needsWork[0];
  if (needsWork) {
    return needsWork.label;
  }

  return "Covered";
}

export function ProgressScreen({
  viewModel,
  onEditSession,
}: {
  viewModel: ProgressViewModel;
  onEditSession: (sessionId: string) => void;
}) {
  const { profile, trainingState, measurements, coach } = viewModel;
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [selectedZone, setSelectedZone] = useState<TrainingLoadZone | null>(null);
  const weeklyNumber = trainingState.weeklySummary.workoutsCompleted;
  const loadStatusText = getLoadStatusText(trainingState);
  const latestMeasurement = measurements[0] ?? null;
  const visibleRecentSessions = useMemo(() => trainingState.recentSessions.slice(0, 3), [trainingState.recentSessions]);

  return (
    <div className="space-y-3">
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
                summary="This is the fast read first: how much of the week is actually logged."
                points={[
                  "The big number is the current week's completed sessions.",
                  "The line under it explains what matters next.",
                ]}
              />
            </div>
            <p className="secondary-copy mt-4">{trainingState.insights.weeklyStatusDetail || getLoadingLine(profile.id)}</p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <div className="px-1">
          <p className="text-[15px] text-white/78">
            Focus: {coach.progressFocusLine || getLoadingLine(profile.id)}
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <section className="glass-panel px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="label-eyebrow">Body map</p>
              <p className="secondary-copy mt-2">What this week has actually touched.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBodyView("front")}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] ${
                  bodyView === "front"
                    ? "border-white/[0.12] bg-white/[0.08] text-white/80"
                    : "border-white/[0.07] bg-transparent text-white/40"
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setBodyView("back")}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] ${
                  bodyView === "back"
                    ? "border-white/[0.12] bg-white/[0.08] text-white/80"
                    : "border-white/[0.07] bg-transparent text-white/40"
                }`}
              >
                Back
              </button>
            </div>
          </div>

          <BodyActivationVisual
            metrics={trainingState.trainingLoad.metrics}
            userId={profile.id}
            view={bodyView}
            selectedZone={selectedZone}
            onSelectZone={(zone) => setSelectedZone(zone)}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <GlassCalendar rows={trainingState.calendarRows} />
      </ScrollReveal>

      <ScrollReveal delay={160}>
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
                  {trainingState.trainingLoad.summary.mostTrained.map((metric) => metric.label).join(", ")}
                </p>
              </div>
            ) : null}
            <div>
              <p className="label-eyebrow">Needs work</p>
              <p className="mt-2 text-[15px] text-white/80">
                {trainingState.trainingLoad.summary.needsWork.length
                  ? trainingState.trainingLoad.summary.needsWork.map((metric) => metric.label).join(", ")
                  : "Nothing urgent this week."}
              </p>
            </div>
          </div>
        </ActivityDropdown>
      </ScrollReveal>

      <ScrollReveal delay={200}>
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
                {latestMeasurement ? `${latestMeasurement.bodyweightKg} kg` : getLoadingLine(profile.id)}
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
                <BrandEmptyState
                  title="Saved workouts"
                  body={getNoSessionsLine(profile.id)}
                  compact
                />
              )}
            </div>
          </div>
        </ActivityDropdown>
      </ScrollReveal>
    </div>
  );
}
