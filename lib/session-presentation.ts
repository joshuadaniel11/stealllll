import type { Profile, WorkoutPlanDay } from "@/lib/types";

type SessionPresentation = {
  splitLabel: string;
  title: string;
  noteLines: [string, string];
};

const sessionPresentationByWorkoutId: Record<string, SessionPresentation> = {
  "joshua-chest-triceps": {
    splitLabel: "Push Day",
    title: "Upper chest + triceps",
    noteLines: ["Press strong today.", "That chest work is going to land."],
  },
  "joshua-back-biceps": {
    splitLabel: "Pull Day",
    title: "Back width + biceps",
    noteLines: ["Lock in your pull today.", "That extra width is getting harder to miss."],
  },
  "joshua-legs": {
    splitLabel: "Athletic Build Day",
    title: "Delts + legs",
    noteLines: ["Move with force today.", "That stronger frame is starting to show."],
  },
  "joshua-shoulders-arms": {
    splitLabel: "Push Detail Day",
    title: "Chest detail + triceps",
    noteLines: ["Build with control today.", "That upper-body detail is going to read clean."],
  },
  "joshua-upper-strength": {
    splitLabel: "Pull Detail Day",
    title: "Back detail + biceps",
    noteLines: ["Pull sharp today.", "That back and arm detail is landing."],
  },
  "natasha-glutes-hams": {
    splitLabel: "Glute Focus Day",
    title: "Glute lift + hamstrings",
    noteLines: ["Move with control today.", "That lower-body shape is getting harder not to notice."],
  },
  "natasha-back-arms": {
    splitLabel: "Back Shape Day",
    title: "Back shape + shoulders",
    noteLines: ["Stay long and clean today.", "That back line is reading smoother every week."],
  },
  "natasha-glutes-quads": {
    splitLabel: "Lower Shape Day",
    title: "Glute lift + quads",
    noteLines: ["Keep it smooth today.", "That leg and glute shape is landing beautifully."],
  },
  "natasha-upper-core": {
    splitLabel: "Shape Detail Day",
    title: "Back shape + waist control",
    noteLines: ["Keep it sculpted today.", "That silhouette is getting cleaner every session."],
  },
  "natasha-core-explosive": {
    splitLabel: "Control Day",
    title: "Core control + movement",
    noteLines: ["Move light today.", "That smooth control is part of the shape."],
  },
};

function getFallbackSplitLabel(profileId: Profile["id"], workout: WorkoutPlanDay) {
  if (profileId === "natasha") {
    if (workout.name.toLowerCase().includes("glute")) return "Glute Focus Day";
    if (workout.name.toLowerCase().includes("back")) return "Back Shape Day";
    return "Shape Day";
  }

  if (workout.name.toLowerCase().includes("back")) return "Pull Day";
  if (workout.name.toLowerCase().includes("chest")) return "Push Day";
  return "Build Day";
}

function getFallbackTitle(workout: WorkoutPlanDay) {
  return workout.name
    .replace(/\s+[AB]$/i, "")
    .replace(/\s+\+\s+/g, " + ")
    .replace("Upper Body", "Upper shape");
}

export function getSessionPresentation(profile: Profile, workout: WorkoutPlanDay): SessionPresentation {
  return (
    sessionPresentationByWorkoutId[workout.id] ?? {
      splitLabel: getFallbackSplitLabel(profile.id, workout),
      title: getFallbackTitle(workout),
      noteLines:
        profile.id === "natasha"
          ? ["Move with control today.", "That shape is landing cleanly."]
          : ["Lock in today.", "That work is going to show."],
    }
  );
}

export function getSessionSupportLine(workout: WorkoutPlanDay, rhythmNote?: string | null) {
  if (rhythmNote) {
    return rhythmNote;
  }

  return `${workout.exercises.length} exercises - ${workout.durationMinutes} min`;
}
