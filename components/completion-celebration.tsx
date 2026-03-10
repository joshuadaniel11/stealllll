export function CompletionCelebration({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-6 top-6 z-40 mx-auto max-w-sm transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div className="glass hairline rounded-[28px] px-5 py-4 shadow-glow">
        <p className="text-sm text-muted">Workout saved</p>
        <p className="mt-1 text-base font-medium">{message}</p>
      </div>
    </div>
  );
}
