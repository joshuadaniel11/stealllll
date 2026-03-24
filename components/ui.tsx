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
        "glass hairline relative rounded-[30px] px-5 py-6 shadow-[var(--shadow-soft)] motion-safe:hover:translate-y-[-1px]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="progress-mini-metric rounded-[22px] border border-stroke px-4 py-3.5 shadow-[var(--shadow-soft)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/42">{label}</p>
      <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-white/92">{value}</p>
    </div>
  );
}
