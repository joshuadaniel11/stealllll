import { Card } from "@/components/ui";
import type { BibleVerse } from "@/lib/types";

export function BibleVerseModal({
  verse,
  onClose,
}: {
  verse: BibleVerse | null;
  onClose: () => void;
}) {
  if (!verse) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/30 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-md">
        <Card className="bg-[var(--surface)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Daily Bible Motivation</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{verse.reference}</h3>
            </div>
            <button
              className="rounded-full bg-black/5 px-3 py-2 text-sm text-muted dark:bg-white/5"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="mt-5 balanced-text text-[18px] leading-8 text-text">&ldquo;{verse.fullText}&rdquo;</p>

          <div className="mt-5 rounded-[24px] bg-black/5 p-4 dark:bg-white/5">
            <p className="text-sm font-medium text-text">Encouragement</p>
            <p className="mt-2 text-sm leading-6 text-muted">{verse.encouragement}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
