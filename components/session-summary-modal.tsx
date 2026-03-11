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
    <div className="fixed inset-0 z-30 bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-md">
        <Card className="bg-[var(--surface)]">
          <p className="text-sm text-muted">Session complete</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">{summary.workoutName}</h3>
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
