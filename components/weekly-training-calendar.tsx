type CalendarDay = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  joshuaCompleted: boolean;
  natashaCompleted: boolean;
  stolenBy?: "joshua" | "natasha" | null;
};

type CalendarRow = {
  label: string;
  isCurrentWeek: boolean;
  days: CalendarDay[];
};

export function WeeklyTrainingCalendar({ rows }: { rows: CalendarRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1.5">
          <p
            className={`text-[11px] uppercase tracking-[0.18em] ${
              row.isCurrentWeek ? "text-white/48" : "text-white/26"
            }`}
          >
            {row.label}
          </p>
          <div className="grid grid-cols-7 gap-1">
            {row.days.map((day) => {
              const bothDone = day.joshuaCompleted && day.natashaCompleted;
              const anyDone = day.joshuaCompleted || day.natashaCompleted;
              return (
                <div
                  key={day.key}
                  className={`flex flex-col items-center gap-0.5 rounded-[8px] px-1 py-1.5 ${
                    day.isToday ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <p
                    className={`text-[9px] uppercase tracking-[0.12em] ${
                      day.isToday ? "text-white/50" : "text-white/28"
                    }`}
                  >
                    {day.dayLabel}
                  </p>
                  <p
                    className={`text-[13px] font-medium leading-none ${
                      bothDone
                        ? "text-emerald-300/90"
                        : anyDone
                          ? "text-white/70"
                          : day.isToday
                            ? "text-white/60"
                            : "text-white/28"
                    }`}
                  >
                    {day.dayNumber}
                  </p>
                  {anyDone ? (
                    <div className="flex gap-0.5">
                      <span
                        className={`h-1 w-1 rounded-full ${
                          day.joshuaCompleted ? "bg-emerald-400/70" : "bg-white/12"
                        }`}
                      />
                      <span
                        className={`h-1 w-1 rounded-full ${
                          day.natashaCompleted ? "bg-sky-400/70" : "bg-white/12"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="h-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
