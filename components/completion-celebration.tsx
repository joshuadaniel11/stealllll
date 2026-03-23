export function CompletionCelebration({
  visible,
  title,
  message,
  actionLabel,
  onAction,
}: {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string | null;
  onAction?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-6 top-6 z-40 mx-auto max-w-sm transition-all duration-500 ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
      }`}
    >
      <div className="glass hairline rounded-[28px] px-5 py-4 shadow-glow">
        <p className="text-sm text-muted">{title}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-base font-medium">{message}</p>
          {actionLabel ? (
            <button className="shrink-0 text-sm font-semibold text-accent" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
