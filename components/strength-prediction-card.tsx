import type { StrengthPrediction } from "@/lib/types";

export function StrengthPredictionCard({ predictions }: { predictions: StrengthPrediction[] }) {
  if (!predictions.length) return null;

  return (
    <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Strength outlook</p>
      <div className="mt-3 space-y-3">
        {predictions.slice(0, 3).map((p) => (
          <div key={p.exerciseName} className="space-y-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-white/82">{p.exerciseName}</p>
              <p className="text-xs text-white/44">{p.trendLabel}</p>
            </div>
            <p className="text-[12px] leading-5 text-white/50">
              {p.currentBest} → {p.projectedPerformance}
            </p>
            {p.note ? (
              <p className="text-[11px] text-white/34">{p.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
