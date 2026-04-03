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
    <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Mobility</p>
          <p className="text-sm font-medium text-white/86">{prompt.primaryStretch.name}</p>
          <p className="text-sm leading-6 text-white/52">{prompt.primaryStretch.why}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`mt-1 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
            completed
              ? "bg-emerald-400/20 text-emerald-300/80"
              : "border border-white/10 text-white/46 hover:text-white/72"
          }`}
        >
          {completed ? "Done" : prompt.ctaLabel}
        </button>
      </div>
      {prompt.note ? (
        <p className="mt-3 text-[12px] leading-5 text-white/38">{prompt.note}</p>
      ) : null}
    </div>
  );
}
