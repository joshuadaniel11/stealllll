import { Sparkles, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui";
import type { StrengthPrediction } from "@/lib/types";

export function StrengthPredictionCard({
  predictions,
}: {
  predictions: StrengthPrediction[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_42%)] opacity-70" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Strength prediction</p>
          <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">8-week outlook</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Smart projections based on your recent lift trend and logged consistency.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 text-white shadow-[var(--shadow-soft)]">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      {predictions.length ? (
        <div className="relative z-10 mt-5 space-y-3">
          {predictions.map((prediction) => (
            <div
              key={prediction.exerciseName}
              className="rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{prediction.exerciseName}</p>
                  <p className="mt-2 text-sm text-muted">Current best: {prediction.currentBest}</p>
                </div>
                <div className="rounded-full bg-white/[0.06] p-2 text-white/80">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Projected in 8 weeks</p>
                  <p className="mt-1 text-xl font-bold tracking-[-0.04em]">{prediction.projectedPerformance}</p>
                </div>
                <p className="text-xs text-muted">{prediction.note}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state relative z-10 mt-5 border border-dashed border-white/10 text-sm">
          Not enough data yet to generate prediction
        </div>
      )}
    </Card>
  );
}
