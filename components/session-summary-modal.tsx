import { Card } from "@/components/ui";

export type SessionSummary = {
  workoutName: string;
  durationMinutes: number;
  completedSets: number;
  feeling: "Strong" | "Solid" | "Tough";
};

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
          <p className="text-sm text-muted">Session complete</p>
          <h3 className="large-title mt-2 font-semibold text-text">{summary.workoutName}</h3>
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
          <button
            className="mt-6 w-full rounded-[28px] bg-white px-4 py-4 text-sm font-semibold text-black"
            onClick={onClose}
          >
            Done
          </button>
        </Card>
      </div>
    </div>
  );
}
