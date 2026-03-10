import { Card } from "@/components/ui";

function ProgressRing({
  value,
  max,
  colorClass,
  trackClass,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  colorClass: string;
  trackClass: string;
  label: string;
  sublabel: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / Math.max(max, 1), 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        <svg className="-rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth="8"
            className={trackClass}
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClass}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tracking-[-0.04em]">{value}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {sublabel}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}

export function StreakRings({
  completed,
  goal,
}: {
  completed: number;
  goal: number;
}) {
  const progressPercent = Math.round((Math.min(completed / Math.max(goal, 1), 1)) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Streak Rings</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
            Weekly rhythm
          </h3>
        </div>
        <div className="rounded-full bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
          Goal {goal}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-6">
        <ProgressRing
          value={completed}
          max={goal}
          colorClass="stroke-[var(--accent)]"
          trackClass="stroke-[rgba(148,163,184,0.18)]"
          label="Completed"
          sublabel="this week"
        />
        <ProgressRing
          value={progressPercent}
          max={100}
          colorClass="stroke-[var(--success)]"
          trackClass="stroke-[rgba(148,163,184,0.14)]"
          label="Goal Progress"
          sublabel="%"
        />
      </div>

      <p className="mt-5 text-center text-sm leading-6 text-muted">
        {completed} of {goal} planned workouts done this week.
      </p>
    </Card>
  );
}
