"use client";

import { useEffect, useState } from "react";

import { Card, MiniMetric } from "@/components/ui";
import type { MeasurementEntry, Profile } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

type DraftMeasurement = {
  bodyweightKg: string;
  waistCm: string;
  hipsCm: string;
  glutesCm: string;
  chestCm: string;
  armsCm: string;
  thighCm: string;
};

function toDraft(entry?: MeasurementEntry): DraftMeasurement {
  return {
    bodyweightKg: entry?.bodyweightKg?.toString() ?? "",
    waistCm: entry?.waistCm?.toString() ?? "",
    hipsCm: entry?.hipsCm?.toString() ?? "",
    glutesCm: entry?.glutesCm?.toString() ?? "",
    chestCm: entry?.chestCm?.toString() ?? "",
    armsCm: entry?.armsCm?.toString() ?? "",
    thighCm: entry?.thighCm?.toString() ?? "",
  };
}

function metricValue(current?: number, previous?: number, unit = "cm") {
  if (current == null) {
    return "Not set";
  }
  if (previous == null) {
    return `${current}${unit}`;
  }
  const change = Math.round((current - previous) * 10) / 10;
  const prefix = change > 0 ? "+" : "";
  return `${current}${unit} (${prefix}${change}${unit})`;
}

export function MeasurementCard({
  profile,
  measurements,
  onSave,
}: {
  profile: Profile;
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

  const fields =
    profile.id === "natasha"
      ? [
          { key: "bodyweightKg", label: "Bodyweight", unit: "kg" },
          { key: "waistCm", label: "Waist", unit: "cm" },
          { key: "glutesCm", label: "Glutes", unit: "cm" },
          { key: "hipsCm", label: "Hips", unit: "cm" },
          { key: "armsCm", label: "Arms", unit: "cm" },
        ]
      : [
          { key: "bodyweightKg", label: "Bodyweight", unit: "kg" },
          { key: "waistCm", label: "Waist", unit: "cm" },
          { key: "chestCm", label: "Chest", unit: "cm" },
          { key: "armsCm", label: "Arms", unit: "cm" },
          { key: "thighCm", label: "Thigh", unit: "cm" },
        ];

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
        {fields.slice(0, 4).map((field) => {
          const current = latest?.[field.key as keyof MeasurementEntry] as number | undefined;
          const previousValue = previous?.[field.key as keyof MeasurementEntry] as number | undefined;
          return <MiniMetric key={field.key} label={field.label} value={metricValue(current, previousValue, field.unit)} />;
        })}
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
              value={draft[field.key as keyof DraftMeasurement]}
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
            waistCm: draft.waistCm ? Number(draft.waistCm) : undefined,
            hipsCm: draft.hipsCm ? Number(draft.hipsCm) : undefined,
            glutesCm: draft.glutesCm ? Number(draft.glutesCm) : undefined,
            chestCm: draft.chestCm ? Number(draft.chestCm) : undefined,
            armsCm: draft.armsCm ? Number(draft.armsCm) : undefined,
            thighCm: draft.thighCm ? Number(draft.thighCm) : undefined,
          })
        }
      >
        Save Check-In
      </button>
    </Card>
  );
}
