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
        "surface-card relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] px-5 py-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-[20px] border border-white/[0.07] px-5 py-5">
      <p className="label-eyebrow">{label}</p>
      <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white/92">{value}</p>
    </div>
  );
}
