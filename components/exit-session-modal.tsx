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
    <div className="fixed inset-0 z-30 bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-md">
        <Card className="bg-[var(--surface)]">
          <p className="text-sm text-muted">Exit session</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Leave without saving?</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            This clears the current workout and takes you back out of Workout Mode.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
              onClick={onClose}
            >
              Keep Session
            </button>
            <button
              className="rounded-[28px] bg-white px-4 py-4 text-sm font-semibold text-black"
              onClick={onConfirm}
            >
              Exit Session
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
