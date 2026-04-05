import type { DailyMobilityPrompt } from "@/lib/types";

function formatFocusAreas(regions: string[]): string {
  if (regions.length === 0) return "";
  if (regions.length === 1) return regions[0];
  if (regions.length === 2) return `${regions[0]} and ${regions[1]}`;
  const last = regions[regions.length - 1];
  const rest = regions.slice(0, -1).join(", ");
  return `${rest}, and ${last}`;
}

export function DailyMobilityPromptCard({
  prompt,
  completed,
  onToggle,
}: {
  prompt: DailyMobilityPrompt;
  completed: boolean;
  onToggle: () => void;
}) {
  const focusText = formatFocusAreas(prompt.focusRegions);

  return (
    <div className={`rounded-[20px] border px-5 py-5 transition-colors ${completed ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.07] bg-[var(--bg-surface)]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="label-eyebrow">Mobility</p>
          <p className="text-[15px] font-medium leading-[1.4] text-white/88">
            Stretch your {focusText.toLowerCase()} today
          </p>
          {prompt.note ? (
            <p className="text-[13px] leading-[1.6] text-white/44">{prompt.note}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            completed
              ? "bg-emerald-400/20 text-emerald-300/80"
              : "border border-white/[0.10] text-white/44 hover:border-white/20 hover:text-white/70"
          }`}
        >
          {completed ? "Done" : "Mark done"}
        </button>
      </div>
    </div>
  );
}
