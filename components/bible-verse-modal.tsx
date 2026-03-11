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
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-large animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Daily Bible Motivation</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{verse.reference}</h3>
            </div>
            <button
              className="rounded-full bg-[var(--card-strong)] px-3 py-2 text-sm text-muted"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="mt-5 balanced-text text-[18px] leading-8 text-text">&ldquo;{verse.fullText}&rdquo;</p>

          <div className="mt-5 rounded-[24px] bg-[var(--card-strong)] p-4">
            <p className="text-sm font-medium text-text">Encouragement</p>
            <p className="mt-2 text-sm leading-6 text-muted">{verse.encouragement}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
