import { useMemo, useState } from "react";

import { BodyActivationVisual } from "@/components/body-activation-visual";
import { Card } from "@/components/ui";
import type { UserId } from "@/lib/types";
import type { TrainingLoadGroup, TrainingLoadMetric } from "@/lib/training-load";

function GroupMetricCard({ metric }: { metric: TrainingLoadGroup }) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-white/[0.035] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/84">{metric.label}</p>
        <p className="text-sm font-semibold text-white">{metric.percentage}%</p>
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
      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/36">
        {metric.effectiveSets.toFixed(1)} / {metric.targetSets} effective sets
      </p>
    </div>
  );
}

function TopZoneList({ zones }: { zones: TrainingLoadMetric[] }) {
  if (!zones.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/48">
        No completed sets yet this week. Once you log a session, the worked zones will light up here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {zones.map((zone) => (
        <div
          key={zone.id}
          className="flex items-center justify-between rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
            <div>
              <p className="text-sm font-medium text-white/84">{zone.label}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">
                {zone.effectiveSets.toFixed(1)} effective sets
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-white">{zone.percentage}%</p>
        </div>
      ))}
    </div>
  );
}

export function TrainingLoadCard({
  metrics,
  groups,
  topZones,
  weekLabel,
  activeDayCount,
  userId,
}: {
  metrics: TrainingLoadMetric[];
  groups: TrainingLoadGroup[];
  topZones: TrainingLoadMetric[];
  weekLabel: string;
  activeDayCount: number;
  userId: UserId;
}) {
  const [view, setView] = useState<"front" | "back">("front");
  const orderedGroups = useMemo(
    () => [...groups].sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets),
    [groups],
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Training Load</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">Current week</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{weekLabel}</p>
        </div>
        <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
          {activeDayCount} {activeDayCount === 1 ? "day" : "days"}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-[24px] border border-white/6 bg-[var(--card-strong)]/64 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/78">Worked muscle map</p>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-white/[0.04] p-1">
              {(["front", "back"] as const).map((nextView) => (
                <button
                  key={nextView}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition ${
                    view === nextView ? "bg-white text-black" : "text-white/48"
                  }`}
                  onClick={() => setView(nextView)}
                >
                  {nextView}
                </button>
              ))}
            </div>
          </div>

          <BodyActivationVisual metrics={metrics} userId={userId} view={view} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {orderedGroups.map((group) => (
            <GroupMetricCard key={group.id} metric={group} />
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/82">Most loaded zones</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">This week only</p>
          </div>
          <TopZoneList zones={topZones} />
        </div>
      </div>
    </Card>
  );
}
