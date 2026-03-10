import { BookOpenText } from "lucide-react";

import { Card } from "@/components/ui";
import type { BibleVerse } from "@/lib/types";

export function DailyBibleCard({
  verse,
  onOpen,
}: {
  verse: BibleVerse;
  onOpen: () => void;
}) {
  return (
    <button className="w-full text-left" onClick={onOpen}>
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Daily Bible Motivation</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">A quiet reminder for today</h3>
          </div>
          <div className="rounded-[20px] bg-accentSoft p-3 text-accent">
            <BookOpenText className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-5 balanced-text text-[17px] leading-7 text-text">&ldquo;{verse.preview}&rdquo;</p>
        <p className="mt-3 text-sm font-medium text-muted">{verse.reference}</p>
      </Card>
    </button>
  );
}
