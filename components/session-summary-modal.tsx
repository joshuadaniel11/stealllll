import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";

export type SessionSummary = {
  userId: "joshua" | "natasha";
  workoutName: string;
  durationMinutes: number;
  completedSets: number;
  feeling: "Strong" | "Solid" | "Tough";
  partial?: boolean;
};

function getAfterWorkoutTease(summary: SessionSummary) {
  const lowerName = summary.workoutName.toLowerCase();

  if (summary.userId === "natasha") {
    if (lowerName.includes("glute")) {
      return "Glute work landed. That softer, rounder shape is getting harder for Joshua to ignore.";
    }
    if (lowerName.includes("back")) {
      return "Back day done. Joshua is going to notice that tempting line through your shoulders and waist.";
    }
    if (lowerName.includes("upper")) {
      return "Upper-body shape work keeps that feminine, dangerous silhouette looking even better.";
    }
    return "You showed up, moved well, and kept building the kind of shape Joshua keeps thinking about.";
  }

  if (lowerName.includes("chest")) {
    return "Chest work is stacking up. Natasha is going to feel that thicker upper body when she gets close.";
  }
  if (lowerName.includes("back")) {
    return "Back and biceps are building that wider, wrapped-around-her look Natasha loves.";
  }
  if (lowerName.includes("shoulder") || lowerName.includes("leg")) {
    return "Shoulders and legs keep that athletic, hard-to-ignore look getting stronger every week.";
  }
  return "Another strong session in. Natasha is going to notice how much more solid and tempting you feel.";
}

export function SessionSummaryModal({
  summary,
  onClose,
}: {
  summary: SessionSummary | null;
  onClose: () => void;
}) {
  if (!summary) {
    return null;
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <ScrollReveal delay={0} y={18} scale={0.994}>
            <div>
              <p className="text-sm text-muted">{summary.partial ? "Partial session saved" : "Session complete"}</p>
              <h3 className="large-title mt-2 font-semibold text-text">{summary.workoutName}</h3>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={70} y={18} scale={0.994}>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-sm text-muted">Length</p>
                <p className="mt-2 text-lg font-semibold text-text">{summary.durationMinutes} min</p>
              </div>
              <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-sm text-muted">Sets</p>
                <p className="mt-2 text-lg font-semibold text-text">{summary.completedSets}</p>
              </div>
              <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-sm text-muted">Felt</p>
                <p className="mt-2 text-lg font-semibold text-text">{summary.feeling}</p>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={95} y={14} scale={0.996}>
            <p className="mt-5 text-sm leading-6 text-muted">{getAfterWorkoutTease(summary)}</p>
          </ScrollReveal>
          <ScrollReveal delay={120} y={14} scale={0.996}>
            <button
              className="sheet-action-primary mt-6 w-full rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onClose}
            >
              Done
            </button>
          </ScrollReveal>
        </Card>
      </div>
    </div>
  );
}
