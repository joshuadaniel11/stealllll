import { Card } from "@/components/ui";

export function ExitSessionModal({
  open,
  canSaveProgress,
  onSaveProgress,
  onDiscard,
  onClose,
}: {
  open: boolean;
  canSaveProgress: boolean;
  onSaveProgress: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <div>
            <p className="text-sm text-muted">Exit session</p>
            <h3 className="large-title mt-2 font-semibold text-text">Leave this workout?</h3>
            <p className="medium-label mt-3 text-muted">
              Save the work you already logged and come back later, or clear the live session and leave it behind.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+4px)]">
            <button
              className="sheet-action-secondary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onClose}
            >
              Keep session
            </button>
            <button
              className={`rounded-[28px] px-4 py-4 text-sm font-semibold ${
                canSaveProgress ? "sheet-action-primary" : "sheet-action-secondary opacity-60"
              }`}
              disabled={!canSaveProgress}
              onClick={onSaveProgress}
            >
              Save progress and exit
            </button>
            <button
              className="sheet-action-primary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onDiscard}
            >
              Clear live session
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
