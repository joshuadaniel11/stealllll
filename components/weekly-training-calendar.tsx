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
    <div className="rounded-[24px] bg-[var(--card-strong)]/72 p-4">
      <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-2 text-center text-[11px] uppercase tracking-[0.12em] text-white/42">
        <div />
        {header.map((day) => (
          <p key={day.dayLabel}>{day.dayLabel}</p>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-2 rounded-[20px] px-2 py-2 ${
              row.isCurrentWeek ? "bg-white/[0.04]" : ""
            }`}
          >
            <div className="flex items-center justify-center text-[11px] font-medium uppercase tracking-[0.14em] text-white/38">
              {row.label}
            </div>
            {row.days.map((day) => (
              <div
                key={day.key}
                className={`relative flex aspect-square items-center justify-center rounded-[12px] text-xs font-medium ${
                  day.completed
                    ? "bg-[linear-gradient(180deg,rgba(136,106,255,0.96),rgba(93,64,222,0.96))] text-white shadow-[0_8px_20px_rgba(101,76,220,0.22)]"
                    : "bg-white/[0.06] text-white/38"
                } ${day.isToday ? "ring-2 ring-white/60 ring-offset-0" : ""}`}
              >
                {day.dayNumber}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
