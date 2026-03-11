"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

function formatNow(date: Date) {
  return {
    date: new Intl.DateTimeFormat("en-NZ", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date),
    time: new Intl.DateTimeFormat("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

export function DateTimeChip() {
  const [now, setNow] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(formatNow(new Date()));
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex w-fit items-center gap-2 rounded-[22px] border border-stroke bg-[var(--card-strong)]/80 px-4 py-3 text-sm text-text shadow-[var(--shadow-soft)]">
      <CalendarDays className="h-4 w-4" />
      <span className="font-medium">{now.date}</span>
      <span className="opacity-50">•</span>
      <Clock3 className="h-4 w-4" />
      <span className="font-medium">{now.time}</span>
    </div>
  );
}
