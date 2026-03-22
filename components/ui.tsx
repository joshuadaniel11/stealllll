import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={clsx(
        "glass hairline relative rounded-[28px] px-5 py-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-stroke bg-[var(--card-strong)]/70 px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}
