"use client";

import type { MuscleKey, UserId } from "@/lib/types";

const MUSCLE_LABELS: Record<MuscleKey, string> = {
  upperChest: "Upper chest",
  midChest: "Mid chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  triceps: "Triceps",
  upperTraps: "Upper traps",
  midBack: "Mid back",
  lats: "Lats",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  forearms: "Forearms",
  upperAbs: "Upper abs",
  lowerAbs: "Lower abs",
  obliques: "Obliques",
  lowerBack: "Lower back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  gluteMax: "Glute max",
  upperGlutes: "Upper glutes",
  sideGlutes: "Side glutes",
  hipFlexors: "Hip flexors",
  calves: "Calves",
  adductors: "Adductors",
};

function getAccent(profileId: UserId) {
  return profileId === "natasha"
    ? { tint: "rgba(45,139,255,0.10)", text: "#2D8BFF" }
    : { tint: "rgba(29,185,84,0.10)", text: "#1DB954" };
}

export function ExerciseMusclePills({
  profileId,
  primaryMuscles,
  secondaryMuscles,
  maxSecondary = 3,
  className = "",
}: {
  profileId: UserId;
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
  maxSecondary?: number;
  className?: string;
}) {
  const accent = getAccent(profileId);
  const visibleSecondary = secondaryMuscles.slice(0, maxSecondary);
  const hiddenSecondaryCount = Math.max(0, secondaryMuscles.length - visibleSecondary.length);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex flex-wrap gap-2">
        {primaryMuscles.map((muscle) => (
          <span
            key={`primary-${muscle}`}
            className="rounded-full px-[10px] py-[4px] text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ background: accent.tint, color: accent.text }}
          >
            {MUSCLE_LABELS[muscle]}
          </span>
        ))}
      </div>

      {visibleSecondary.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-white/30">Also works</span>
          {visibleSecondary.map((muscle) => (
            <span
              key={`secondary-${muscle}`}
              className="rounded-full bg-white/[0.06] px-[10px] py-[4px] text-[11px] font-medium uppercase tracking-[0.08em] text-white/40"
            >
              {MUSCLE_LABELS[muscle]}
            </span>
          ))}
          {hiddenSecondaryCount ? (
            <span className="text-[11px] uppercase tracking-[0.08em] text-white/30">+{hiddenSecondaryCount} more</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
