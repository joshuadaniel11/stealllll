import { CheckCircle2, Sparkles } from "lucide-react";

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
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/42">
            Daily mobility prompt
          </p>
          <h3 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-white/94">
            {prompt.focusRegions.join(" + ")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Today&apos;s body focus
          </p>
        </div>
        <div className="rounded-[20px] bg-white/8 p-3 text-white/74">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Focus</p>
          <p className="mt-2 text-[15px] font-semibold tracking-[-0.03em] text-white/92">
            {prompt.focusRegions.join(", ")}
          </p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/78">
          {prompt.feedback}
        </span>
      </div>

      <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Note</p>
        <p className="mt-2 text-[13px] leading-6 text-white/64">{prompt.note}</p>
      </div>

      <button
        className={`w-full rounded-[22px] px-4 py-4 text-base font-semibold transition-all ${
          completed
            ? "bg-[rgba(31,156,107,0.14)] text-success"
            : "bg-white text-black active:scale-[0.99]"
        }`}
        onClick={onToggle}
      >
        {completed ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Mark mobility as not done
          </span>
        ) : (
          "Mark mobility done"
        )}
      </button>
    </Card>
  );
}
