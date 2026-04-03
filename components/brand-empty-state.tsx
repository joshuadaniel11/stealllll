import clsx from "clsx";

export function BrandEmptyState({
  title,
  body,
  className,
  compact = false,
}: {
  title: string;
  body: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] text-center",
        compact ? "px-4 py-4" : "px-5 py-5",
        className,
      )}
    >
      <p className="card-title text-white/92">{title}</p>
      <p className="secondary-copy mt-2">{body}</p>
    </div>
  );
}
