import { areEquivalentExerciseNames, buildCanonicalExerciseLibrary, findExerciseLibraryItemByName } from "@/lib/exercise-data";
import type { ExerciseLibraryItem, UserId } from "@/lib/types";

const STABLE_EXERCISE_NAMES = new Set([
  "Machine Hip Thrust",
  "Smith Machine Hip Thrust",
  "Glute Bridge Machine",
  "Leg Press",
  "Leg Press High Foot Placement",
  "Machine Row",
  "Machine Lat Pullover",
  "Seated Cable Row",
  "Close-Grip Seated Cable Row",
  "Cable Glute Kickback",
  "Hamstring Curl",
  "Seated Leg Curl",
  "Seated Hamstring Curl",
  "Face Pull",
  "Cable Face Pull",
  "Reverse Pec Deck",
  "Machine Shoulder Press",
  "Plate-Loaded Shoulder Press",
]);

const PROFILE_SWAP_HINTS: Record<UserId | "default", Record<string, string[]>> = {
  default: {
    "Barbell Hip Thrust": ["Smith Machine Hip Thrust", "Machine Hip Thrust", "Glute Bridge Machine"],
    "Machine Hip Thrust": ["Smith Machine Hip Thrust", "Glute Bridge Machine", "Cable Glute Kickback", "Leg Press High Foot Placement"],
    "Smith Machine Hip Thrust": ["Machine Hip Thrust", "Glute Bridge Machine", "Cable Glute Kickback", "Leg Press High Foot Placement"],
    "Glute Bridge Machine": ["Machine Hip Thrust", "Smith Machine Hip Thrust", "Cable Glute Kickback", "Leg Press High Foot Placement"],
    "Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Wide-Grip Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Neutral-Grip Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Lat Pullover": ["Machine Lat Pullover", "Straight-Arm Cable Pulldown", "Single-Arm Lat Pulldown"],
    "Barbell Row": ["Seated Cable Row", "Machine Row", "Chest-Supported Dumbbell Row"],
    "Single-Arm Seated Row": ["Seated Cable Row", "Machine Row", "Single-Arm Dumbbell Row"],
    "Flat Dumbbell Press": ["Flat Machine Press", "Smith Machine Flat Press", "Plate-Loaded Chest Press"],
    "Incline Dumbbell Press": ["Incline Machine Press", "Smith Incline Press", "Plate-Loaded Chest Press"],
    "Machine Chest Fly": ["Flat Machine Press", "Incline Machine Press", "Plate-Loaded Chest Press"],
    "Chest-Supported Dumbbell Row": ["Seated Cable Row", "Machine Row", "Single-Arm Lat Pulldown"],
    "Single-Arm Dumbbell Row": ["Seated Cable Row", "Machine Row", "Chest-Supported Dumbbell Row"],
    "Seated Cable Row": ["Machine Row", "Single-Arm Dumbbell Row", "Chest-Supported Dumbbell Row"],
    "Close-Grip Seated Cable Row": ["Machine Row", "Seated Cable Row", "Single-Arm Dumbbell Row"],
    "Smith Machine Squat": ["Pendulum Squat", "Goblet Squat", "Leg Press"],
    "Hack Squat": ["Leg Press", "Pendulum Squat", "Walking Lunge"],
    Squat: ["Pendulum Squat", "Goblet Squat", "Leg Press"],
    "Leg Press (Glute Bias)": ["Leg Press High Foot Placement", "Smith Machine Hip Thrust", "Walking Lunge"],
    "Dumbbell Shoulder Press": ["Plate-Loaded Shoulder Press", "Machine Shoulder Press", "Cable Lateral Raise"],
    "Machine Shoulder Press": ["Plate-Loaded Shoulder Press", "Seated Dumbbell Shoulder Press", "Cable Lateral Raise"],
    "Seated Dumbbell Shoulder Press": ["Plate-Loaded Shoulder Press", "Machine Shoulder Press", "Cable Lateral Raise"],
    "Cable Tricep Pushdown": ["Rope Pushdown", "Single-Arm Cable Extension", "Overhead Cable Tricep Extension"],
    "Overhead Cable Tricep Extension": ["Single-Arm Cable Extension", "Rope Pushdown", "Cable Skull Crusher"],
    "Cable Triceps Extension": ["Rope Pushdown", "Single-Arm Cable Extension", "Overhead Rope Extension"],
    "Cable Skull Crusher": ["Overhead Cable Tricep Extension", "Rope Pushdown", "Single-Arm Cable Extension"],
    "Preacher Curl": ["Cable Curl", "EZ-Bar Curl", "Incline Dumbbell Curl"],
    "Cable Bicep Curl": ["Cable Curl", "EZ-Bar Curl", "Preacher Curl"],
    "Dumbbell Bicep Curl": ["Cable Curl", "Preacher Curl", "EZ-Bar Curl"],
    "Machine Preacher Curl": ["Cable Curl", "EZ-Bar Curl", "Incline Dumbbell Curl"],
    Hyperextensions: ["45 Degree Back Extension", "Back Hyperextensions", "Dumbbell Romanian Deadlift", "Seated Leg Curl"],
  },
  natasha: {
    "Machine Hip Thrust": ["Smith Machine Hip Thrust", "Glute Bridge Machine", "Cable Glute Kickback", "Leg Press High Foot Placement"],
    "Dumbbell Romanian Deadlift": ["Seated Leg Curl", "Hamstring Curl", "45 Degree Back Extension", "Back Hyperextensions"],
    "Hamstring Curl": ["Seated Leg Curl", "Dumbbell Romanian Deadlift", "45 Degree Back Extension", "Back Hyperextensions"],
    "Seated Leg Curl": ["Hamstring Curl", "Dumbbell Romanian Deadlift", "45 Degree Back Extension", "Back Hyperextensions"],
    "Reverse Lunge": ["Dumbbell Step-Up", "Walking Lunge", "Leg Press High Foot Placement", "Leg Press"],
    "Walking Lunge": ["Reverse Lunge", "Dumbbell Step-Up", "Leg Press High Foot Placement", "Leg Press"],
    "Bulgarian Split Squat": ["Dumbbell Step-Up", "Reverse Lunge", "Walking Lunge", "Leg Press"],
    "Dumbbell Step-Up": ["Bulgarian Split Squat", "Reverse Lunge", "Walking Lunge", "Leg Press High Foot Placement"],
    "Cable Glute Kickback": ["Machine Hip Thrust", "Abductor Machine", "Cable Hip Abduction", "Leg Press High Foot Placement"],
    "Abductor Machine": ["Cable Hip Abduction", "Cable Glute Kickback", "Leg Press High Foot Placement", "Machine Hip Thrust"],
    "Cable Hip Abduction": ["Abductor Machine", "Cable Glute Kickback", "Leg Press High Foot Placement", "Machine Hip Thrust"],
    "Leg Press High Foot Placement": ["Bulgarian Split Squat", "Reverse Lunge", "Dumbbell Step-Up", "Machine Hip Thrust"],
    "Incline Machine Press": ["Machine Chest Press", "Machine Chest Fly", "Plate-Loaded Chest Press"],
    "Machine Chest Press": ["Flat Machine Press", "Incline Machine Press", "Machine Chest Fly"],
    "Machine Chest Fly": ["Machine Chest Press", "Incline Machine Press", "Flat Machine Press"],
    "Machine Shoulder Press": ["Plate-Loaded Shoulder Press", "Seated Dumbbell Shoulder Press", "Cable Lateral Raise"],
    "Cable Lateral Raise": ["Seated Dumbbell Lateral Raise", "Machine Shoulder Press", "Plate-Loaded Shoulder Press"],
    "Cable Tricep Pushdown": ["Rope Pushdown", "Overhead Cable Tricep Extension", "Single-Arm Cable Extension"],
    "Overhead Cable Tricep Extension": ["Overhead Rope Extension", "Single-Arm Cable Extension", "Cable Tricep Pushdown"],
    "Lat Pulldown": ["Single-Arm Lat Pulldown", "Machine Lat Pullover", "Assisted Pull-Up"],
    "Seated Cable Row": ["Single-Arm Seated Row", "Machine Row", "Chest-Supported Dumbbell Row"],
    "Single-Arm Cable Lat Pull-In": ["Machine Lat Pullover", "Straight-Arm Cable Pulldown", "Single-Arm Lat Pulldown"],
    "Kettlebell Swing": ["Sled Push", "Medicine Ball Slam", "Goblet Squat to Press", "Box Step-Up with Knee Drive"],
    "Face Pull": ["Cable Face Pull", "Reverse Pec Deck", "Cable Lateral Raise"],
    "Reverse Pec Deck": ["Face Pull", "Cable Face Pull", "Cable Lateral Raise"],
    "Cable Bicep Curl": ["Cable Curl", "Preacher Curl", "Dumbbell Bicep Curl"],
    "Hammer Curl": ["Cable Curl", "Preacher Curl", "Dumbbell Bicep Curl"],
    "Cable Oblique Crunch": ["Pallof Press", "Cable Woodchop", "Side Plank Reach"],
    "Pallof Press": ["Cable Oblique Crunch", "Cable Woodchop", "Standing Cable Rotation"],
    "Cable Woodchop": ["Standing Cable Rotation", "Cable Oblique Crunch", "Pallof Press"],
    "Box Step-Up with Knee Drive": ["Dumbbell Step-Up", "Reverse Lunge", "Walking Lunge"],
    "Medicine Ball Wall Throw": ["Medicine Ball Slam", "Battle Rope Slam", "Sled Push"],
    "Medicine Ball Slam": ["Battle Rope Slam", "Medicine Ball Wall Throw", "Sled Push"],
    "Goblet Squat to Press": ["Goblet Squat", "Sled Push", "Box Step-Up with Knee Drive"],
    "Sled Push": ["Box Step-Up with Knee Drive", "Goblet Squat to Press", "Leg Press"],
  },
  joshua: {},
};

function getPreferredNames(profileId: UserId, exerciseName: string) {
  return PROFILE_SWAP_HINTS[profileId][exerciseName] ?? PROFILE_SWAP_HINTS.default[exerciseName] ?? [];
}

function getSwapPriority(profileId: UserId, exerciseName: string) {
  const stableBonus = STABLE_EXERCISE_NAMES.has(exerciseName) ? 1 : 0;
  if (profileId === "natasha") {
    return stableBonus * 2;
  }
  return stableBonus;
}

export function getExerciseSwapOptions(
  profileId: UserId,
  currentExerciseName: string,
  muscleGroup: string,
  library: ExerciseLibraryItem[],
) {
  const canonicalLibrary = buildCanonicalExerciseLibrary(library);
  const preferredNames = getPreferredNames(profileId, currentExerciseName);
  const preferred = preferredNames
    .map((name) => findExerciseLibraryItemByName(canonicalLibrary, name))
    .filter((item): item is ExerciseLibraryItem => Boolean(item));

  const fallback = canonicalLibrary
    .filter(
      (item) =>
        item.muscleGroup === muscleGroup &&
        !areEquivalentExerciseNames(item.name, currentExerciseName) &&
        !preferred.some((option) => option.id === item.id),
    )
    .sort((a, b) => getSwapPriority(profileId, b.name) - getSwapPriority(profileId, a.name));

  return [...preferred, ...fallback].slice(0, 3);
}

export function getSwapSectionLabel(profileId: UserId) {
  return profileId === "natasha" ? "Same target, easier fit" : "Same target, cleaner fit";
}
