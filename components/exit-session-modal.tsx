import { Card } from "@/components/ui";

export function ExitSessionModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
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
            <h3 className="large-title mt-2 font-semibold text-text">Leave without saving?</h3>
            <p className="medium-label mt-3 text-muted">
              This clears the current workout and takes you back out of Workout Mode.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+4px)]">
            <button
              className="sheet-action-secondary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onClose}
            >
              No, keep session
            </button>
            <button
              className="sheet-action-primary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onConfirm}
            >
              Yes, exit
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
