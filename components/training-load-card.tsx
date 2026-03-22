import { BodyActivationVisual } from "@/components/body-activation-visual";
import { Card } from "@/components/ui";
import type { TrainingLoadMetric } from "@/lib/training-load";

function LoadMetricPill({ metric }: { metric: TrainingLoadMetric }) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/86">{metric.label}</p>
        <p className="text-sm font-semibold text-white">{metric.percentage}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full ${metric.overload ? "shadow-[0_0_16px_rgba(255,255,255,0.18)]" : ""}`}
          style={{
            width: `${metric.percentage}%`,
            background: `linear-gradient(90deg, ${metric.color}88, ${metric.color})`,
          }}
        />
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/38">
        {metric.effectiveSets.toFixed(1)} / {metric.targetSets} target sets
      </p>
    </div>
  );
}

export function TrainingLoadCard({
  metrics,
  weekLabel,
}: {
  metrics: TrainingLoadMetric[];
  weekLabel: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Training Load</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">Weekly muscle activation</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{weekLabel}</p>
        </div>
        <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">Recovery</div>
      </div>

      <div className="mt-4 grid grid-cols-[0.95fr,1.05fr] gap-3">
        <BodyActivationVisual metrics={metrics} />
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <LoadMetricPill key={metric.id} metric={metric} />
          ))}
        </div>
      </div>
    </Card>
  );
}
