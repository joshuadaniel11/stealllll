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
        "glass hairline relative rounded-[12px] px-5 py-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="progress-mini-metric rounded-[12px] border border-stroke px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-2 text-[1rem] tracking-[-0.03em] text-white/88">{value}</p>
    </div>
  );
}
