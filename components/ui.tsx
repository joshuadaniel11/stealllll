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

export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <Card className="px-4 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-sm text-muted">{sublabel}</p>
    </Card>
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
