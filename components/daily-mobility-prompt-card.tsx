import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui";
import type { DailyMobilityPrompt } from "@/lib/types";

export function DailyMobilityPromptCard({
  prompt,
  completed,
  onToggle,
}: {
  prompt: DailyMobilityPrompt;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="space-y-5 px-5 py-5">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/42">
          Mobility
        </p>
        <h3 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white/94">
          {prompt.focusRegions.join(" • ")}
        </h3>
        <p className="text-sm leading-6 text-white/56">Today&apos;s focus</p>
      </div>

      <div className="rounded-[22px] border border-white/7 bg-white/[0.035] px-4 py-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/38">
            Primary stretch
          </p>
          <p className="mt-2 text-[15px] font-semibold tracking-[-0.03em] text-white/92">
            {prompt.primaryStretch.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {prompt.primaryStretch.why}
          </p>
        </div>
      </div>

      {prompt.secondaryStretches.length ? (
        <div className="space-y-2">
          {prompt.secondaryStretches.map((stretch) => (
            <div
              key={stretch.name}
              className="rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-3"
            >
              <p className="text-[13px] font-medium text-white/82">{stretch.name}</p>
              <p className="mt-1 text-sm leading-6 text-white/48">{stretch.why}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[20px] border border-white/7 bg-white/[0.03] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/38">Note</p>
        <p className="mt-2 text-sm leading-6 text-white/68">{prompt.note}</p>
      </div>

      <button
        className={`w-full rounded-[24px] px-4 py-4 text-base font-semibold transition-all ${
          completed
            ? "bg-[rgba(31,156,107,0.14)] text-success"
            : "bg-white text-black active:scale-[0.99]"
        }`}
        onClick={onToggle}
      >
        {completed ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Done today
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {prompt.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>
    </Card>
  );
}
