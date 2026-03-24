type CalendarCell = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  joshuaCompleted: boolean;
  natashaCompleted: boolean;
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

  const getDayToneClass = (day: CalendarCell) => {
    if (day.joshuaCompleted && day.natashaCompleted) {
      return "calendar-day-cell-both text-white";
    }
    if (day.joshuaCompleted) {
      return "calendar-day-cell-joshua text-white";
    }
    if (day.natashaCompleted) {
      return "calendar-day-cell-natasha text-white";
    }
    return "calendar-day-cell-idle text-white/34";
  };

  return (
    <div className="calendar-shell rounded-[28px] p-4 sm:p-4.5">
      <div className="mb-3 flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.16em] text-white/38">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          <span>Joshua</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400/90" />
          <span>Natasha</span>
        </div>
      </div>
      <div className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))] gap-2.5 text-center text-[10px] uppercase tracking-[0.18em] text-white/34">
        <div />
        {header.map((day) => (
          <p key={day.dayLabel} className="calendar-day-label">
            {day.dayLabel}
          </p>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`calendar-week-row grid grid-cols-[28px_repeat(7,minmax(0,1fr))] gap-2.5 rounded-[22px] px-2.5 py-2.5 transition ${
              row.isCurrentWeek ? "calendar-week-row-current" : ""
            }`}
          >
            <div className="calendar-week-label flex items-center justify-center text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">
              {row.label}
            </div>
            {row.days.map((day) => (
              <div
                key={day.key}
                className={`calendar-day-cell relative flex aspect-square min-h-[38px] items-center justify-center overflow-hidden rounded-[14px] text-[11px] font-semibold transition ${
                  getDayToneClass(day)
                } ${day.isToday ? "calendar-day-cell-today" : ""}`}
              >
                {day.completed && (
                  <>
                    <div className="pointer-events-none absolute inset-x-2 top-1 h-4 rounded-full bg-white/15 blur-md" />
                    <div className="pointer-events-none absolute inset-x-1.5 bottom-0 h-1/2 rounded-b-[14px] bg-black/10" />
                  </>
                )}
                {day.isToday ? <div className="calendar-day-today-ring pointer-events-none absolute inset-[2px] rounded-[12px]" /> : null}
                <span className="relative z-10">{day.dayNumber}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
