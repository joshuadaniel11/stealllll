import type { BibleVerse } from "@/lib/types";

export function DailyBibleCard({ verse, onOpen }: { verse: BibleVerse; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-left transition hover:bg-white/[0.04]"
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Daily verse</p>
      <p className="mt-2 text-sm font-medium text-white/86">{verse.reference}</p>
      <p className="mt-1 text-sm leading-6 text-white/54">{verse.preview}</p>
      <p className="mt-2 text-[11px] text-white/34">Read more →</p>
    </button>
  );
}
