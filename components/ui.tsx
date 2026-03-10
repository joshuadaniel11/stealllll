import type { ReactNode } from "react";
import clsx from "clsx";
import { Activity } from "lucide-react";

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
        "glass hairline relative rounded-[32px] px-5 py-5 shadow-[var(--shadow-card)]",
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
  icon: Icon,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="rounded-[28px] px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <div className="rounded-full bg-accentSoft p-2 text-accent">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="text-sm text-muted">{sublabel}</p>
    </Card>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-stroke bg-[var(--card-strong)]/70 px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}
