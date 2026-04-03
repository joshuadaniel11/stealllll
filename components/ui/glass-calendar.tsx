"use client";

import * as React from "react";
import {
  format,
  getDate,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface GlassCalendarDay {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  joshuaCompleted: boolean;
  natashaCompleted: boolean;
  joshuaWorkouts: string[];
  natashaWorkouts: string[];
  stolenBy?: "joshua" | "natasha" | null;
}

export interface GlassCalendarRow {
  label: string;
  isCurrentWeek: boolean;
  days: GlassCalendarDay[];
}

interface RenderDay extends GlassCalendarDay {
  date: Date;
  isSelected: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: GlassCalendarRow[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

function fromDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getWeekIndexForDate(rows: GlassCalendarRow[], date: Date) {
  const weekIndex = rows.findIndex((row) =>
    row.days.some((day) => isSameDay(fromDayKey(day.key), date)),
  );

  return weekIndex >= 0 ? weekIndex : Math.max(rows.length - 1, 0);
}

function buildDayMap(rows: GlassCalendarRow[]) {
  return rows.reduce<Map<string, GlassCalendarDay>>((map, row) => {
    row.days.forEach((day) => {
      map.set(day.key, day);
    });
    return map;
  }, new Map());
}

function joinWorkoutNames(names: string[]) {
  return names.join(", ");
}

function getSelectedStatus(day: GlassCalendarDay | undefined) {
  if (!day) {
    return {
      label: "Quiet day",
      detail: "No session logged for this date.",
      workoutLines: [] as Array<{ owner: "joshua" | "natasha"; text: string }>,
    };
  }

  const workoutLines = [
    ...(day.joshuaWorkouts.length
      ? [{ owner: "joshua" as const, text: joinWorkoutNames(day.joshuaWorkouts) }]
      : []),
    ...(day.natashaWorkouts.length
      ? [{ owner: "natasha" as const, text: joinWorkoutNames(day.natashaWorkouts) }]
      : []),
  ];

  if (day.joshuaCompleted && day.natashaCompleted) {
    return {
      label: "Together",
      detail: "Joshua and Natasha both logged work.",
      workoutLines,
    };
  }

  if (day.joshuaCompleted) {
    return {
      label: "Joshua trained",
      detail: "Joshua logged the session on this date.",
      workoutLines,
    };
  }

  if (day.natashaCompleted) {
    return {
      label: "Natasha trained",
      detail: "Natasha logged the session on this date.",
      workoutLines,
    };
  }

  return {
    label: "Quiet day",
    detail: day.isToday ? "No session logged yet." : "No session was logged here.",
    workoutLines,
  };
}

function DayButton({
  day,
  onClick,
}: {
  day: RenderDay;
  onClick: () => void;
}) {
  const showJoshua = day.joshuaCompleted;
  const showNatasha = day.natashaCompleted;
  const showBoth = showJoshua && showNatasha;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200",
        day.isSelected
          ? "border-white/18 bg-white/[0.14] text-white"
          : day.completed
            ? "border-white/10 bg-white/[0.06] text-white/86"
            : "border-white/[0.06] bg-white/[0.02] text-white/56 hover:bg-white/[0.05]",
      )}
      aria-pressed={day.isSelected}
    >
      {getDate(day.date)}
      {day.isToday && !day.completed && !day.isSelected ? (
        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/40" />
      ) : null}

      {(showJoshua || showNatasha) && !day.isSelected ? (
        <div className="absolute -bottom-1.5 flex items-center gap-1">
          {showJoshua ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--joshua)]" /> : null}
          {showNatasha ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--natasha)]" /> : null}
        </div>
      ) : null}

      {showBoth && day.isSelected ? (
        <div className="absolute inset-x-2 bottom-1 h-[3px] rounded-full bg-[linear-gradient(90deg,var(--joshua),var(--natasha))]" />
      ) : null}
    </button>
  );
}

export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ rows, className, selectedDate: selectedDateProp, onDateSelect, ...props }, ref) => {
    const dayMap = React.useMemo(() => buildDayMap(rows), [rows]);
    const availableDates = React.useMemo(
      () =>
        rows
          .flatMap((row) => row.days.map((day) => fromDayKey(day.key)))
          .sort((left, right) => left.getTime() - right.getTime()),
      [rows],
    );

    const initialDate = selectedDateProp ?? availableDates.at(-1) ?? new Date();
    const [viewMode, setViewMode] = React.useState<"weekly" | "overview">("weekly");
    const [selectedDate, setSelectedDate] = React.useState(initialDate);
    const [currentWeekIndex, setCurrentWeekIndex] = React.useState(getWeekIndexForDate(rows, initialDate));

    React.useEffect(() => {
      if (!selectedDateProp) {
        return;
      }

      setSelectedDate(selectedDateProp);
      setCurrentWeekIndex(getWeekIndexForDate(rows, selectedDateProp));
    }, [selectedDateProp, rows]);

    React.useEffect(() => {
      if (selectedDateProp || availableDates.length === 0) {
        return;
      }

      if (dayMap.has(toDayKey(selectedDate))) {
        return;
      }

      const latestDate = availableDates[availableDates.length - 1];
      if (!latestDate) {
        return;
      }

      setSelectedDate(latestDate);
      setCurrentWeekIndex(getWeekIndexForDate(rows, latestDate));
    }, [availableDates, dayMap, rows, selectedDate, selectedDateProp]);

    const selectedWeek = rows[currentWeekIndex] ?? rows[rows.length - 1] ?? null;
    const selectedDay = dayMap.get(toDayKey(selectedDate));
    const selectedStatus = getSelectedStatus(selectedDay);

    const weeklyDays = React.useMemo(() => {
      if (!selectedWeek) {
        return [] as RenderDay[];
      }

      return selectedWeek.days.map((day) => {
        const date = fromDayKey(day.key);
        return {
          ...day,
          date,
          isSelected: isSameDay(date, selectedDate),
        };
      });
    }, [selectedDate, selectedWeek]);

    const overviewDays = React.useMemo(
      () =>
        rows.flatMap((row) =>
          row.days.map((day) => {
            const date = fromDayKey(day.key);
            return {
              ...day,
              date,
              isSelected: isSameDay(date, selectedDate),
            };
          }),
        ),
      [rows, selectedDate],
    );

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      setCurrentWeekIndex(getWeekIndexForDate(rows, date));
      onDateSelect?.(date);
    };

    const handleWeeklyShift = (direction: -1 | 1) => {
      const nextWeekIndex = Math.min(Math.max(currentWeekIndex + direction, 0), rows.length - 1);
      const nextWeek = rows[nextWeekIndex];
      if (!nextWeek) {
        return;
      }

      const currentDayIndex = selectedWeek?.days.findIndex((day) => isSameDay(fromDayKey(day.key), selectedDate)) ?? -1;
      const nextDay = nextWeek.days[currentDayIndex >= 0 ? currentDayIndex : 0] ?? nextWeek.days[0];
      const nextDate = fromDayKey(nextDay.key);

      setCurrentWeekIndex(nextWeekIndex);
      setSelectedDate(nextDate);
      onDateSelect?.(nextDate);
    };

    const handlePrev = () => {
      if (viewMode !== "weekly") {
        return;
      }
      handleWeeklyShift(-1);
    };

    const handleNext = () => {
      if (viewMode !== "weekly") {
        return;
      }
      handleWeeklyShift(1);
    };

    const canGoPrev = viewMode === "weekly" ? currentWeekIndex > 0 : false;
    const canGoNext = viewMode === "weekly" ? currentWeekIndex < rows.length - 1 : false;
    const weeklyRange =
      selectedWeek && selectedWeek.days.length
        ? `${format(fromDayKey(selectedWeek.days[0].key), "d MMM")} - ${format(fromDayKey(selectedWeek.days[6].key), "d MMM")}`
        : "Shared training";
    const sixWeekRange =
      rows.length && rows[0]?.days.length && rows[rows.length - 1]?.days.length
        ? `${format(fromDayKey(rows[0].days[0].key), "d MMM")} - ${format(fromDayKey(rows[rows.length - 1].days[6].key), "d MMM")}`
        : "Recent shared training";

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-[1px]",
          className,
        )}
        {...props}
      >
        <div className="rounded-[27px] bg-[rgba(15,15,15,0.82)] p-5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              {(
                [
                  ["weekly", "Weekly"],
                  ["overview", "6 weeks"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
                    viewMode === mode ? "bg-white text-black" : "text-white/45 hover:text-white/72",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/32">Joshua + Natasha</p>
          </div>

          <div className="my-6 flex items-center justify-between gap-3">
            <div>
              <motion.p
                key={`${viewMode}-${selectedWeek?.label ?? "shared-window"}-${rows.length}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="text-[32px] font-semibold tracking-[-0.04em] text-white"
              >
                {viewMode === "weekly"
                  ? format(fromDayKey(selectedWeek?.days[0]?.key ?? toDayKey(selectedDate)), "MMMM")
                  : "6 weeks"}
              </motion.p>
              <p className="mt-1 text-[12px] text-white/40">
                {viewMode === "weekly" ? weeklyRange : sixWeekRange}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {viewMode === "weekly" ? (
            <div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {weeklyDays.map((day) => (
                  <div key={day.key} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">{day.dayLabel}</span>
                    <DayButton day={day} onClick={() => handleDateClick(day.date)} />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-white/52">
                {selectedWeek?.isCurrentWeek ? "This week at a glance." : "A recent shared week."}
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 gap-y-3 text-center">
                {DAY_LABELS.map((label) => (
                  <span key={label} className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-y-3">
                {overviewDays.map((day) => (
                  <div key={day.key} className="flex justify-center">
                    <DayButton day={day} onClick={() => handleDateClick(day.date)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 h-px bg-white/10" />

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/32">
                {format(selectedDate, "EEE d MMM")}
              </p>
              <p className="mt-2 text-[15px] font-medium text-white/88">{selectedStatus.label}</p>
              <p className="mt-1 text-[13px] text-white/46">{selectedStatus.detail}</p>
              {selectedStatus.workoutLines.length ? (
                <div className="mt-3 space-y-2">
                  {selectedStatus.workoutLines.map((line) => (
                    <div key={`${line.owner}-${line.text}`} className="flex items-start gap-2 text-[12px] text-white/58">
                      <span
                        className={cn(
                          "mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full",
                          line.owner === "joshua" ? "bg-[var(--joshua)]" : "bg-[var(--natasha)]",
                        )}
                      />
                      <span>{line.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              <div className="flex items-center justify-end gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--joshua)]" />
                <span>Joshua</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--natasha)]" />
                <span>Natasha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

GlassCalendar.displayName = "GlassCalendar";
