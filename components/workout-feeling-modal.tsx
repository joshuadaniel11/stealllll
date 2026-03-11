import { Card } from "@/components/ui";

const options = ["Strong", "Solid", "Tough"] as const;

export function WorkoutFeelingModal({
  onSelect,
  onClose,
}: {
  onSelect: (feeling: (typeof options)[number]) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Workout complete</p>
              <h3 className="large-title mt-1 font-semibold">
                How did today feel?
              </h3>
            </div>
            <button
              className="rounded-full bg-[var(--card-strong)] px-3 py-2 text-sm text-muted"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {options.map((option) => (
              <button
                key={option}
                className="w-full rounded-[22px] border border-stroke bg-[var(--card-strong)] px-4 py-4 text-left text-base font-medium text-text"
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
