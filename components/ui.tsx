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
        "glass hairline relative rounded-[30px] px-5 py-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="progress-mini-metric rounded-[24px] border border-stroke px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="text-[12px] font-medium text-white/50">{label}</p>
      <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-white/92">{value}</p>
    </div>
  );
}
