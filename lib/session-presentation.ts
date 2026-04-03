import type { Profile, WorkoutPlanDay } from "@/lib/types";

export type SessionPresentation = {
  splitLabel: string;
  title: string;
  noteLines: [string, string];
};

export function getSessionPresentation(
  profile: Profile,
  todaysWorkout: WorkoutPlanDay,
): SessionPresentation {
  const splitLabel = todaysWorkout.focus ?? todaysWorkout.dayLabel ?? "Today";
  const title = todaysWorkout.name;
  const note = profile.notes?.[0] ?? "";
  const insight = profile.goalSummary ?? "Keep showing up.";

  return {
    splitLabel,
    title,
    noteLines: [note || insight, note ? insight : ""],
  };
}
