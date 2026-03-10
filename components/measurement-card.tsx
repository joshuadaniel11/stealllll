"use client";

import { useEffect, useState } from "react";

import { Card, MiniMetric } from "@/components/ui";
import type { MeasurementEntry } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

type DraftMeasurement = {
  bodyweightKg: string;
  bodyFatPercent: string;
};

function toDraft(entry?: MeasurementEntry): DraftMeasurement {
  return {
    bodyweightKg: entry?.bodyweightKg?.toString() ?? "",
    bodyFatPercent: entry?.bodyFatPercent?.toString() ?? "",
  };
}

function metricValue(current?: number, previous?: number, suffix = "") {
  if (current == null) {
    return "Not set";
  }

  const roundedCurrent = Math.round(current * 10) / 10;

  if (previous == null) {
    return `${roundedCurrent}${suffix}`;
  }

  const change = Math.round((current - previous) * 10) / 10;
  const prefix = change > 0 ? "+" : "";
  return `${roundedCurrent}${suffix} (${prefix}${change}${suffix})`;
}

export function MeasurementCard({
  measurements,
  onSave,
}: {
  measurements: MeasurementEntry[];
  onSave: (entry: Omit<MeasurementEntry, "id" | "date">) => void;
}) {
  const sortedMeasurements = [...measurements].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );
  const latest = sortedMeasurements[0];
  const previous = sortedMeasurements[1];
  const [draft, setDraft] = useState<DraftMeasurement>(toDraft(latest));

  useEffect(() => {
    setDraft(toDraft(latest));
  }, [latest?.id]);

  const fields = [
    { key: "bodyweightKg", label: "Body Weight", unit: "kg" },
    { key: "bodyFatPercent", label: "Body Fat", unit: "%" },
  ] as const;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Check-ins</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Body metrics</h3>
        </div>
        <div className="rounded-full bg-accentSoft px-3 py-1 text-xs text-accent">
          {latest ? `Updated ${formatDate(latest.date)}` : "Add first check-in"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniMetric
          label="Body Weight"
          value={metricValue(latest?.bodyweightKg, previous?.bodyweightKg, "kg")}
        />
        <MiniMetric
          label="Body Fat"
          value={metricValue(latest?.bodyFatPercent, previous?.bodyFatPercent, "%")}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <label
            key={field.key}
            className="rounded-[20px] border border-stroke bg-white/50 px-4 py-3 dark:bg-white/5"
          >
            <span className="block text-xs uppercase tracking-[0.16em] text-muted">{field.label}</span>
            <input
              className="mt-2 w-full bg-transparent text-base font-medium outline-none"
              inputMode="decimal"
              type="number"
              step="0.1"
              placeholder={field.unit}
              value={draft[field.key]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>

      <button
        className="mt-4 w-full rounded-[22px] bg-accent px-4 py-4 font-semibold text-white shadow-glow"
        onClick={() =>
          onSave({
            bodyweightKg: Number(draft.bodyweightKg || 0),
            bodyFatPercent: draft.bodyFatPercent ? Number(draft.bodyFatPercent) : undefined,
          })
        }
      >
        Save Check-In
      </button>
    </Card>
  );
}
