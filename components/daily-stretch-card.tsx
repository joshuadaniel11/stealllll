import { CheckCircle2, MoveRight, Sparkles } from "lucide-react";

import { Card } from "@/components/ui";
import type { StretchRecommendation } from "@/lib/types";

export function DailyStretchCard({
  stretch,
  completed,
  onToggle,
}: {
  stretch: StretchRecommendation;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="transition-all duration-500 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Daily flexibility</p>
          <h3 className="mt-1 text-[22px] font-bold tracking-[-0.04em]">
            {stretch.title}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {stretch.focus} - {stretch.durationMinutes} min
          </p>
        </div>
        <div className="rounded-[20px] bg-accentSoft p-3 text-accent">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 rounded-[24px] bg-black/5 px-4 py-4 dark:bg-white/5">
        <p className="text-sm leading-6 text-text">{stretch.note}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-accent">Open Bend app</span>
          <span className="text-muted">{stretch.bendSearch}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-sm font-medium text-muted">
        Daily stretch reminder <MoveRight className="h-4 w-4" />
      </div>
        <button
          className={`mt-4 w-full rounded-[22px] px-4 py-4 text-base font-bold transition-all ${
            completed
              ? "bg-[rgba(31,156,107,0.14)] text-success"
              : "bg-accent text-white shadow-glow"
          }`}
          onClick={onToggle}
        >
          {completed ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Undo Bend stretch done
            </span>
          ) : (
            "Mark Bend stretch done"
          )}
      </button>
    </Card>
  );
}
