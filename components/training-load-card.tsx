import { useEffect, useMemo, useState } from "react";

import { BodyActivationVisual } from "@/components/body-activation-visual";
import { Card } from "@/components/ui";
import { TRAINING_LOAD_VIEW_ZONES } from "@/lib/training-load";
import type { UserId } from "@/lib/types";
import type { TrainingLoadGroup, TrainingLoadMetric, TrainingLoadSummary, TrainingLoadZone } from "@/lib/training-load";

function DetailLabel({ label }: { label: string }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">{label}</p>;
}

function GroupMetricCard({ metric }: { metric: TrainingLoadGroup }) {
  return (
    <div className="progress-subcard rounded-[20px] border px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-white/68">{metric.label}</p>
        <p className="text-[13px] font-semibold text-white/88">{metric.percentage}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/7">
        <div
          className={metric.overload ? "shadow-[0_0_16px_rgba(255,255,255,0.14)]" : ""}
          style={{
            width: `${metric.percentage}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${metric.color}7a, ${metric.color})`,
          }}
        />
      </div>
      <p className="mt-2 text-[11px] font-medium text-white/42">
        {metric.effectiveSets.toFixed(1)} / {metric.targetSets} effective sets
      </p>
    </div>
  );
}

function getZoneStatus(metric: TrainingLoadMetric) {
  if (metric.overload || metric.percentage >= 100) {
    return {
      label: "Ahead",
      toneClass: "bg-emerald-400/14 text-emerald-100",
      note: "This region is already at or above the tuned weekly target.",
    };
  }

  if (metric.percentage >= 65) {
    return {
      label: "On track",
      toneClass: "bg-white/8 text-white",
      note: "A small amount of extra work keeps this region in a good spot.",
    };
  }

  return {
    label: "Needs work",
    toneClass: "bg-amber-300/14 text-amber-100",
    note: "This region is still behind the tuned target for the current week.",
  };
}

function ZoneContributorPanel({ metric }: { metric: TrainingLoadMetric | null }) {
  if (!metric) {
    return (
      <div className="progress-subcard rounded-[20px] border border-dashed px-4 py-4 text-sm text-white/48">
        Tap a muscle region to inspect what contributed to it this week.
      </div>
    );
  }

  const status = getZoneStatus(metric);

  return (
    <div className="progress-subcard rounded-[22px] border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-white/86">{metric.label}</p>
          <p className="mt-1 text-[11px] font-medium text-white/40">
            {metric.effectiveSets.toFixed(1)} / {metric.targetSets} target sets
          </p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-semibold text-white/90">{metric.percentage}%</p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.toneClass}`}
          >
            {status.label}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-white/56">{status.note}</p>

      <div className="mt-3 space-y-2">
        {metric.contributors.length ? (
          metric.contributors.map((contributor) => (
            <div
              key={`${metric.id}-${contributor.exerciseName}`}
              className="rounded-[16px] border border-white/5 bg-white/[0.025] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-white/80">{contributor.exerciseName}</p>
                <p className="text-[11px] font-medium text-white/42">
                  {contributor.effectiveSets.toFixed(1)} sets
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/46">No completed sets have loaded this region this week.</p>
        )}
      </div>
    </div>
  );
}

function TopZoneList({
  zones,
  selectedZone,
  onSelectZone,
}: {
  zones: TrainingLoadMetric[];
  selectedZone: TrainingLoadZone | null;
  onSelectZone: (zone: TrainingLoadZone) => void;
}) {
  if (!zones.length) {
    return (
      <div className="progress-subcard rounded-[20px] border border-dashed px-4 py-4 text-sm text-white/48">
        No completed sets yet this week. Once you log a session, the visible zones for this side will light up here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {zones.map((zone) => (
        <button
          key={zone.id}
          type="button"
          onClick={() => onSelectZone(zone.id)}
          className={`progress-subcard flex w-full items-center justify-between rounded-[18px] border px-3 py-3 text-left transition ${
            selectedZone === zone.id
              ? "border-white/18 bg-white/[0.08]"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
            <div>
              <p className="text-[13px] font-medium text-white/82">{zone.label}</p>
              <p className="text-[11px] font-medium text-white/40">
                {zone.effectiveSets.toFixed(1)} effective sets
              </p>
            </div>
          </div>
          <p className="text-[13px] font-semibold text-white/88">{zone.percentage}%</p>
        </button>
      ))}
    </div>
  );
}

function SummaryLine({
  label,
  metrics,
  lowActivity,
}: {
  label: string;
  metrics: TrainingLoadMetric[];
  lowActivity?: boolean;
}) {
  const emptyLabel =
    label === "Most trained"
      ? lowActivity
        ? "No meaningful load logged yet this week"
        : "Still building"
      : "Still building";

  const value = metrics.length
    ? metrics.map((metric) => metric.label).join(", ")
    : emptyLabel;

  return (
    <div className="progress-subcard rounded-[18px] border px-4 py-3">
      <p className="text-[12px] font-medium text-white/48">{label}</p>
      <p className="mt-1 text-[14px] font-medium text-white/84">{value}</p>
    </div>
  );
}

export function TrainingLoadCard({
  metrics,
  groups,
  summary,
  weekLabel,
  activeDayCount,
  userId,
}: {
  metrics: TrainingLoadMetric[];
  groups: TrainingLoadGroup[];
  topZones: TrainingLoadMetric[];
  summary: TrainingLoadSummary;
  weekLabel: string;
  activeDayCount: number;
  userId: UserId;
}) {
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedZone, setSelectedZone] = useState<TrainingLoadZone | null>(null);

  const orderedGroups = useMemo(
    () => [...groups].sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets),
    [groups],
  );

  const visibleTopZones = useMemo(
    () =>
      [...metrics]
        .filter((metric) => TRAINING_LOAD_VIEW_ZONES[view].includes(metric.id) && metric.effectiveSets > 0)
        .sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets)
        .slice(0, 4),
    [metrics, view],
  );

  const inspectedMetric = useMemo(
    () => metrics.find((metric) => metric.id === selectedZone) ?? null,
    [metrics, selectedZone],
  );

  useEffect(() => {
    if (selectedZone && visibleTopZones.some((metric) => metric.id === selectedZone)) {
      return;
    }

    setSelectedZone(visibleTopZones[0]?.id ?? null);
  }, [selectedZone, visibleTopZones]);

  return (
    <Card className="progress-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-white/54">Training Load</p>
          <h3 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.05em] text-white/94">Current week</h3>
          <p className="mt-2 text-[13px] leading-6 text-white/54">{weekLabel}</p>
        </div>
        <div className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70">
          {activeDayCount} {activeDayCount === 1 ? "day" : "days"}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="space-y-2">
          <DetailLabel label="Load read" />
          <div className="grid gap-2">
            <SummaryLine label="Most trained" metrics={summary.mostTrained} lowActivity={summary.lowActivity} />
          </div>
        </div>

        <div className="progress-summary-card rounded-[24px] border p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/78">Worked muscle map</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/34">
                Tap a lit zone to inspect it
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-white/[0.04] p-1">
              {(["front", "back"] as const).map((nextView) => (
                <button
                  key={nextView}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition ${
                    view === nextView ? "bg-white text-black" : "text-white/48"
                  }`}
                  onClick={() => {
                    setView(nextView);
                    setSelectedZone(null);
                  }}
                >
                  {nextView}
                </button>
              ))}
            </div>
          </div>

          <BodyActivationVisual
            metrics={metrics}
            userId={userId}
            view={view}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.12em] text-white/34">
            <div className="rounded-full bg-white/[0.04] px-3 py-2 text-center">Tuned targets</div>
            <div className="rounded-full bg-amber-300/10 px-3 py-2 text-center text-amber-100">Needs work</div>
            <div className="rounded-full bg-emerald-400/10 px-3 py-2 text-center text-emerald-100">Ahead</div>
          </div>
        </div>

        <ZoneContributorPanel metric={inspectedMetric} />

        <div className="space-y-2">
          <DetailLabel label="Coverage" />
          <div className="grid grid-cols-2 gap-2">
            {orderedGroups.map((group) => (
              <GroupMetricCard key={group.id} metric={group} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <DetailLabel label="Loaded zones" />
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/82">Most loaded visible zones</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">{view} side</p>
          </div>
          <TopZoneList
            zones={visibleTopZones}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />
        </div>
      </div>
    </Card>
  );
}
