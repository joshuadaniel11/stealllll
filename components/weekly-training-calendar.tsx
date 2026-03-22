type CalendarCell = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
};

type CalendarRow = {
  label: string;
  isCurrentWeek: boolean;
  days: CalendarCell[];
};

export function WeeklyTrainingCalendar({
  rows,
}: {
  rows: CalendarRow[];
}) {
  const header = rows[0]?.days ?? [];

  return (
    <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
      <div className="grid grid-cols-[34px_repeat(7,minmax(0,1fr))] gap-2 text-center text-[10px] uppercase tracking-[0.16em] text-white/36">
        <div />
        {header.map((day) => (
          <p key={day.dayLabel}>{day.dayLabel}</p>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-[34px_repeat(7,minmax(0,1fr))] gap-2 rounded-[20px] px-2 py-2 transition ${
              row.isCurrentWeek ? "bg-white/[0.055] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" : ""
            }`}
          >
            <div className="flex items-center justify-center text-[10px] font-medium uppercase tracking-[0.16em] text-white/34">
              {row.label}
            </div>
            {row.days.map((day) => (
              <div
                key={day.key}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[12px] text-[11px] font-medium transition ${
                  day.completed
                    ? "bg-[linear-gradient(180deg,rgba(136,106,255,0.98),rgba(92,67,219,0.98))] text-white shadow-[0_10px_24px_rgba(98,72,220,0.24)]"
                    : "border border-white/[0.04] bg-white/[0.04] text-white/30"
                } ${day.isToday ? "ring-1 ring-white/65" : ""}`}
              >
                {day.completed && (
                  <div className="pointer-events-none absolute inset-x-2 top-1 h-4 rounded-full bg-white/15 blur-md" />
                )}
                <span className="relative z-10">{day.dayNumber}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
