import type {
  ExerciseLibraryItem,
  ExerciseMuscleProfile,
  ExerciseTemplate,
  MuscleGroup,
  WorkoutSessionExercise,
} from "@/lib/types";

type CanonicalExerciseDefinition = ExerciseMuscleProfile & {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  aliases?: string[];
  cues?: string[];
};

type HydratableExerciseLike = {
  name: string;
  muscleGroup: MuscleGroup;
  primaryMuscles?: ExerciseMuscleProfile["primaryMuscles"];
  secondaryMuscles?: ExerciseMuscleProfile["secondaryMuscles"];
};

function uniqueMuscles(values: ExerciseMuscleProfile["primaryMuscles"]) {
  return Array.from(new Set(values));
}

function defineExercise(definition: CanonicalExerciseDefinition): CanonicalExerciseDefinition {
  return {
    ...definition,
    primaryMuscles: uniqueMuscles(definition.primaryMuscles),
    secondaryMuscles: uniqueMuscles(definition.secondaryMuscles),
  };
}

export function normalizeExerciseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[()+/,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeExerciseName(value).replace(/\s+/g, "-");
}

const DEFAULT_CUES = ["Smooth tempo and stable setup.", "Leave 1 to 2 good reps in reserve."];

const CANONICAL_EXERCISES: CanonicalExerciseDefinition[] = [
  // Chest
  defineExercise({ name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Incline Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", aliases: ["Incline Machine Press", "Smith Incline Press"], primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "triceps", "midChest"] }),
  defineExercise({ name: "Decline Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell", primaryMuscles: ["midChest"], secondaryMuscles: ["triceps", "frontDelts"] }),
  defineExercise({ name: "Dumbbell Bench Press", muscleGroup: "Chest", equipment: "Dumbbell", aliases: ["Flat Dumbbell Press"], primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell", primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Incline Dumbbell Fly", muscleGroup: "Chest", equipment: "Dumbbell", primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "midChest"] }),
  defineExercise({ name: "Cable Fly (Low to High)", muscleGroup: "Chest", equipment: "Cable", aliases: ["Low to High Cable Fly"], primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "midChest"] }),
  defineExercise({ name: "Cable Fly (High to Low)", muscleGroup: "Chest", equipment: "Cable", aliases: ["High to Low Cable Fly"], primaryMuscles: ["midChest"], secondaryMuscles: ["frontDelts"] }),
  defineExercise({ name: "Chest Dips", muscleGroup: "Chest", equipment: "Bodyweight", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["triceps", "frontDelts"] }),
  defineExercise({ name: "Push Up", muscleGroup: "Chest", equipment: "Bodyweight", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["triceps", "frontDelts", "sideDelts"] }),
  defineExercise({ name: "Machine Chest Press", muscleGroup: "Chest", equipment: "Machine", aliases: ["Flat Machine Press", "Plate-Loaded Chest Press", "Smith Machine Flat Press"], primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Pec Deck / Machine Fly", muscleGroup: "Chest", equipment: "Machine", aliases: ["Machine Chest Fly"], primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts"] }),

  // Shoulders
  defineExercise({ name: "Overhead Press (Barbell)", muscleGroup: "Shoulders", equipment: "Barbell", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps", "upperChest"] }),
  defineExercise({ name: "Overhead Press (Dumbbell)", muscleGroup: "Shoulders", equipment: "Dumbbell", aliases: ["Dumbbell Shoulder Press", "Seated Dumbbell Shoulder Press", "Machine Shoulder Press", "Plate-Loaded Shoulder Press"], primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps"] }),
  defineExercise({ name: "Arnold Press", muscleGroup: "Shoulders", equipment: "Dumbbell", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps", "rearDelts"] }),
  defineExercise({ name: "Lateral Raise (Dumbbell)", muscleGroup: "Shoulders", equipment: "Dumbbell", aliases: ["Dumbbell Lateral Raise", "Seated Dumbbell Lateral Raise"], primaryMuscles: ["sideDelts"], secondaryMuscles: ["frontDelts", "upperTraps"] }),
  defineExercise({ name: "Lateral Raise (Cable)", muscleGroup: "Shoulders", equipment: "Cable", aliases: ["Cable Lateral Raise"], primaryMuscles: ["sideDelts"], secondaryMuscles: ["frontDelts", "upperTraps"] }),
  defineExercise({ name: "Front Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", aliases: ["Cable Front Raise"], primaryMuscles: ["frontDelts"], secondaryMuscles: ["sideDelts", "upperChest"] }),
  defineExercise({ name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable", aliases: ["Cable Face Pull"], primaryMuscles: ["rearDelts"], secondaryMuscles: ["midBack", "upperTraps", "biceps"] }),
  defineExercise({ name: "Rear Delt Fly (Dumbbell)", muscleGroup: "Shoulders", equipment: "Dumbbell", primaryMuscles: ["rearDelts"], secondaryMuscles: ["midBack", "upperTraps"] }),
  defineExercise({ name: "Rear Delt Fly (Cable)", muscleGroup: "Shoulders", equipment: "Cable", aliases: ["Rear Delt Cable Fly", "Reverse Pec Deck", "Band Pull-Apart"], primaryMuscles: ["rearDelts"], secondaryMuscles: ["midBack"] }),
  defineExercise({ name: "Upright Row", muscleGroup: "Shoulders", equipment: "Barbell", primaryMuscles: ["sideDelts", "upperTraps"], secondaryMuscles: ["frontDelts", "biceps"] }),
  defineExercise({ name: "Shrugs", muscleGroup: "Shoulders", equipment: "Dumbbell", primaryMuscles: ["upperTraps"], secondaryMuscles: ["midBack"] }),

  // Back
  defineExercise({ name: "Pull Up / Chin Up", muscleGroup: "Back", equipment: "Bodyweight", aliases: ["Assisted Pull-Up"], primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["biceps", "rearDelts", "upperTraps"] }),
  defineExercise({ name: "Lat Pulldown (Wide Grip)", muscleGroup: "Back", equipment: "Cable", aliases: ["Lat Pulldown", "Wide-Grip Lat Pulldown", "Single-Arm Lat Pulldown"], primaryMuscles: ["lats"], secondaryMuscles: ["midBack", "biceps", "rearDelts"] }),
  defineExercise({ name: "Lat Pulldown (Close Grip)", muscleGroup: "Back", equipment: "Cable", aliases: ["Neutral-Grip Lat Pulldown"], primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["biceps"] }),
  defineExercise({ name: "Straight Arm Pulldown", muscleGroup: "Back", equipment: "Cable", aliases: ["Straight-Arm Cable Pulldown"], primaryMuscles: ["lats"], secondaryMuscles: ["triceps", "midBack"] }),
  defineExercise({ name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell", primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps", "upperTraps"] }),
  defineExercise({ name: "Dumbbell Row (Single Arm)", muscleGroup: "Back", equipment: "Dumbbell", aliases: ["Single-Arm Dumbbell Row", "Chest-Supported Dumbbell Row"], primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable", aliases: ["Single-Arm Seated Row", "Close-Grip Seated Cable Row", "Machine Row"], primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "T-Bar Row", muscleGroup: "Back", equipment: "Machine", primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps", "upperTraps"] }),
  defineExercise({ name: "Cable Pullover", muscleGroup: "Back", equipment: "Cable", aliases: ["Lat Pullover", "Machine Lat Pullover", "Single-Arm Cable Lat Pull-In"], primaryMuscles: ["lats"], secondaryMuscles: ["midBack", "triceps"] }),
  defineExercise({ name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", primaryMuscles: ["lowerBack", "hamstrings", "gluteMax"], secondaryMuscles: ["midBack", "upperTraps", "quads", "forearms", "upperGlutes"] }),
  defineExercise({ name: "Romanian Deadlift", muscleGroup: "Hamstrings", equipment: "Barbell", aliases: ["Dumbbell Romanian Deadlift"], primaryMuscles: ["hamstrings", "gluteMax"], secondaryMuscles: ["lowerBack", "upperGlutes", "midBack"] }),
  defineExercise({ name: "Good Morning", muscleGroup: "Hamstrings", equipment: "Barbell", primaryMuscles: ["hamstrings", "lowerBack"], secondaryMuscles: ["gluteMax", "upperGlutes"] }),
  defineExercise({ name: "Sumo Deadlift", muscleGroup: "Glutes", equipment: "Barbell", primaryMuscles: ["gluteMax", "adductors"], secondaryMuscles: ["hamstrings", "quads", "lowerBack", "upperGlutes"] }),

  // Arms
  defineExercise({ name: "Barbell Curl", muscleGroup: "Biceps", equipment: "Barbell", aliases: ["EZ-Bar Curl"], primaryMuscles: ["biceps"], secondaryMuscles: ["forearms", "frontDelts"] }),
  defineExercise({ name: "Dumbbell Curl", muscleGroup: "Biceps", equipment: "Dumbbell", aliases: ["Dumbbell Bicep Curl"], primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] }),
  defineExercise({ name: "Hammer Curl", muscleGroup: "Biceps", equipment: "Dumbbell", aliases: ["Rope Hammer Curl"], primaryMuscles: ["biceps", "forearms"], secondaryMuscles: [] }),
  defineExercise({ name: "Incline Dumbbell Curl", muscleGroup: "Biceps", equipment: "Dumbbell", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] }),
  defineExercise({ name: "Cable Curl", muscleGroup: "Biceps", equipment: "Cable", aliases: ["Cable Bicep Curl"], primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] }),
  defineExercise({ name: "Preacher Curl", muscleGroup: "Biceps", equipment: "Machine", primaryMuscles: ["biceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Tricep Pushdown (Cable)", muscleGroup: "Triceps", equipment: "Cable", aliases: ["Cable Tricep Pushdown", "Rope Pushdown"], primaryMuscles: ["triceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Skull Crusher", muscleGroup: "Triceps", equipment: "Cable", aliases: ["Cable Skull Crusher"], primaryMuscles: ["triceps"], secondaryMuscles: ["frontDelts"] }),
  defineExercise({ name: "Overhead Tricep Extension", muscleGroup: "Triceps", equipment: "Cable", aliases: ["Overhead Cable Tricep Extension", "Overhead Rope Extension", "Single-Arm Cable Extension"], primaryMuscles: ["triceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Close Grip Bench Press", muscleGroup: "Triceps", equipment: "Barbell", primaryMuscles: ["triceps"], secondaryMuscles: ["midChest", "frontDelts"] }),
  defineExercise({ name: "Tricep Dips", muscleGroup: "Triceps", equipment: "Bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["frontDelts", "midChest"] }),
  defineExercise({ name: "Diamond Push Up", muscleGroup: "Triceps", equipment: "Bodyweight", primaryMuscles: ["triceps"], secondaryMuscles: ["midChest", "frontDelts"] }),

  // Glutes and legs
  defineExercise({ name: "Hip Thrust (Barbell)", muscleGroup: "Glutes", equipment: "Barbell", primaryMuscles: ["gluteMax", "upperGlutes"], secondaryMuscles: ["hamstrings", "sideGlutes", "lowerBack"] }),
  defineExercise({ name: "Hip Thrust (Machine)", muscleGroup: "Glutes", equipment: "Machine", aliases: ["Machine Hip Thrust", "Smith Machine Hip Thrust"], primaryMuscles: ["gluteMax", "upperGlutes"], secondaryMuscles: ["hamstrings", "sideGlutes"] }),
  defineExercise({ name: "Glute Bridge", muscleGroup: "Glutes", equipment: "Bodyweight", aliases: ["Glute Bridge Machine"], primaryMuscles: ["gluteMax"], secondaryMuscles: ["hamstrings", "lowerBack"] }),
  defineExercise({ name: "Cable Kickback", muscleGroup: "Glutes", equipment: "Cable", aliases: ["Cable Glute Kickback"], primaryMuscles: ["gluteMax", "upperGlutes"], secondaryMuscles: ["hamstrings", "sideGlutes"] }),
  defineExercise({ name: "Donkey Kickback", muscleGroup: "Glutes", equipment: "Bodyweight", primaryMuscles: ["gluteMax", "upperGlutes"], secondaryMuscles: ["sideGlutes"] }),
  defineExercise({ name: "Abduction Machine", muscleGroup: "Glutes", equipment: "Machine", aliases: ["Abductor Machine"], primaryMuscles: ["sideGlutes"], secondaryMuscles: ["gluteMax"] }),
  defineExercise({ name: "Cable Hip Abduction", muscleGroup: "Glutes", equipment: "Cable", primaryMuscles: ["sideGlutes"], secondaryMuscles: ["gluteMax"] }),
  defineExercise({ name: "Bulgarian Split Squat", muscleGroup: "Glutes", equipment: "Dumbbell", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["hamstrings", "upperGlutes", "sideGlutes", "hipFlexors"] }),
  defineExercise({ name: "Step Up", muscleGroup: "Glutes", equipment: "Dumbbell", aliases: ["Dumbbell Step-Up", "Box Step-Up with Knee Drive"], primaryMuscles: ["gluteMax", "quads"], secondaryMuscles: ["hamstrings", "upperGlutes", "sideGlutes"] }),
  defineExercise({ name: "Reverse Lunge", muscleGroup: "Glutes", equipment: "Dumbbell", primaryMuscles: ["gluteMax", "quads"], secondaryMuscles: ["hamstrings", "sideGlutes"] }),
  defineExercise({ name: "Walking Lunge", muscleGroup: "Legs", equipment: "Dumbbell", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["hamstrings", "sideGlutes", "upperGlutes", "hipFlexors"] }),
  defineExercise({ name: "Barbell Squat", muscleGroup: "Legs", equipment: "Barbell", aliases: ["Squat"], primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["hamstrings", "lowerBack", "upperGlutes", "adductors"] }),
  defineExercise({ name: "Front Squat", muscleGroup: "Quads", equipment: "Barbell", primaryMuscles: ["quads"], secondaryMuscles: ["gluteMax", "upperAbs", "lowerBack"] }),
  defineExercise({ name: "Goblet Squat", muscleGroup: "Quads", equipment: "Dumbbell", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["adductors", "upperAbs"] }),
  defineExercise({ name: "Leg Press", muscleGroup: "Quads", equipment: "Machine", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["hamstrings", "adductors"] }),
  defineExercise({ name: "Leg Press High Foot Placement", muscleGroup: "Glutes", equipment: "Machine", primaryMuscles: ["gluteMax", "quads"], secondaryMuscles: ["hamstrings", "adductors", "upperGlutes"] }),
  defineExercise({ name: "Hack Squat", muscleGroup: "Quads", equipment: "Machine", aliases: ["Pendulum Squat"], primaryMuscles: ["quads"], secondaryMuscles: ["gluteMax", "hamstrings"] }),
  defineExercise({ name: "Leg Extension", muscleGroup: "Quads", equipment: "Machine", primaryMuscles: ["quads"], secondaryMuscles: [] }),
  defineExercise({ name: "Leg Curl (Lying)", muscleGroup: "Hamstrings", equipment: "Machine", aliases: ["Hamstring Curl"], primaryMuscles: ["hamstrings"], secondaryMuscles: ["calves", "gluteMax"] }),
  defineExercise({ name: "Leg Curl (Seated)", muscleGroup: "Hamstrings", equipment: "Machine", aliases: ["Seated Leg Curl", "Seated Hamstring Curl"], primaryMuscles: ["hamstrings"], secondaryMuscles: ["calves"] }),
  defineExercise({ name: "Nordic Curl", muscleGroup: "Hamstrings", equipment: "Bodyweight", primaryMuscles: ["hamstrings"], secondaryMuscles: ["gluteMax", "calves"] }),
  defineExercise({ name: "Calf Raise (Standing)", muscleGroup: "Legs", equipment: "Machine", aliases: ["Standing Calf Raise"], primaryMuscles: ["calves"], secondaryMuscles: [] }),
  defineExercise({ name: "Calf Raise (Seated)", muscleGroup: "Legs", equipment: "Machine", primaryMuscles: ["calves"], secondaryMuscles: [] }),

  // Core
  defineExercise({ name: "Crunch", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["upperAbs"], secondaryMuscles: ["lowerAbs"] }),
  defineExercise({ name: "Reverse Crunch", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["lowerAbs"], secondaryMuscles: ["upperAbs", "hipFlexors"] }),
  defineExercise({ name: "Leg Raise", muscleGroup: "Core", equipment: "Bodyweight", aliases: ["Captain's Chair Knee Raise"], primaryMuscles: ["lowerAbs"], secondaryMuscles: ["hipFlexors", "upperAbs"] }),
  defineExercise({ name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable", primaryMuscles: ["upperAbs"], secondaryMuscles: ["lowerAbs", "obliques"] }),
  defineExercise({ name: "Plank", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["upperAbs", "lowerAbs"], secondaryMuscles: ["obliques", "lowerBack", "sideDelts"] }),
  defineExercise({ name: "Side Plank", muscleGroup: "Core", equipment: "Bodyweight", aliases: ["Side Plank Reach"], primaryMuscles: ["obliques"], secondaryMuscles: ["sideDelts", "lowerAbs"] }),
  defineExercise({ name: "Russian Twist", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["obliques"], secondaryMuscles: ["upperAbs", "lowerAbs"] }),
  defineExercise({ name: "Cable Oblique Crunch", muscleGroup: "Core", equipment: "Cable", primaryMuscles: ["obliques"], secondaryMuscles: ["upperAbs", "lowerAbs"] }),
  defineExercise({ name: "Pallof Press", muscleGroup: "Core", equipment: "Cable", primaryMuscles: ["obliques"], secondaryMuscles: ["upperAbs", "lowerAbs"] }),
  defineExercise({ name: "Ab Wheel Rollout", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["upperAbs", "lowerAbs"], secondaryMuscles: ["obliques", "lowerBack", "lats"] }),
  defineExercise({ name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["lowerAbs"], secondaryMuscles: ["upperAbs", "hipFlexors"] }),
  defineExercise({ name: "Hyperextension", muscleGroup: "Back", equipment: "Machine", aliases: ["Hyperextensions", "Back Hyperextensions", "45 Degree Back Extension"], primaryMuscles: ["lowerBack"], secondaryMuscles: ["gluteMax", "hamstrings"] }),

  // Distinct in-app variants kept separate for swaps and library browsing
  defineExercise({ name: "Single-Arm Lat Pulldown", muscleGroup: "Back", equipment: "Cable", primaryMuscles: ["lats"], secondaryMuscles: ["midBack", "biceps", "rearDelts"] }),
  defineExercise({ name: "Machine Lat Pullover", muscleGroup: "Back", equipment: "Machine", primaryMuscles: ["lats"], secondaryMuscles: ["midBack", "triceps"] }),
  defineExercise({ name: "Machine Row", muscleGroup: "Back", equipment: "Machine", primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Single-Arm Seated Row", muscleGroup: "Back", equipment: "Cable", primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Close-Grip Seated Cable Row", muscleGroup: "Back", equipment: "Cable", primaryMuscles: ["midBack", "lats"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Chest-Supported Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell", primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Single-Arm Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell", primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["rearDelts", "biceps"] }),
  defineExercise({ name: "Flat Machine Press", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Plate-Loaded Chest Press", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Smith Machine Flat Press", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] }),
  defineExercise({ name: "Incline Machine Press", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "triceps", "midChest"] }),
  defineExercise({ name: "Smith Incline Press", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["upperChest"], secondaryMuscles: ["frontDelts", "triceps", "midChest"] }),
  defineExercise({ name: "Machine Chest Fly", muscleGroup: "Chest", equipment: "Machine", primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts"] }),
  defineExercise({ name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbell", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps"] }),
  defineExercise({ name: "Machine Shoulder Press", muscleGroup: "Shoulders", equipment: "Machine", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps"] }),
  defineExercise({ name: "Plate-Loaded Shoulder Press", muscleGroup: "Shoulders", equipment: "Machine", primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["upperTraps", "triceps"] }),
  defineExercise({ name: "Rope Pushdown", muscleGroup: "Triceps", equipment: "Cable", primaryMuscles: ["triceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Single-Arm Cable Extension", muscleGroup: "Triceps", equipment: "Cable", primaryMuscles: ["triceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Overhead Rope Extension", muscleGroup: "Triceps", equipment: "Cable", primaryMuscles: ["triceps"], secondaryMuscles: [] }),
  defineExercise({ name: "Cable Bicep Curl", muscleGroup: "Biceps", equipment: "Cable", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] }),
  defineExercise({ name: "Cable Face Pull", muscleGroup: "Shoulders", equipment: "Cable", primaryMuscles: ["rearDelts"], secondaryMuscles: ["midBack", "upperTraps", "biceps"] }),
  defineExercise({ name: "Band Pull-Apart", muscleGroup: "Shoulders", equipment: "Band", primaryMuscles: ["rearDelts"], secondaryMuscles: ["midBack", "upperTraps"] }),

  // App-specific full-body and accessory movements
  defineExercise({ name: "Dead Bug", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["upperAbs", "lowerAbs"], secondaryMuscles: ["obliques", "lowerBack"] }),
  defineExercise({ name: "Standing Cable Rotation", muscleGroup: "Core", equipment: "Cable", primaryMuscles: ["obliques"], secondaryMuscles: ["upperAbs", "lowerAbs"] }),
  defineExercise({ name: "Core Vacuum Hold", muscleGroup: "Core", equipment: "Bodyweight", primaryMuscles: ["upperAbs", "lowerAbs"], secondaryMuscles: ["obliques"] }),
  defineExercise({ name: "Cable Woodchop", muscleGroup: "Core", equipment: "Cable", primaryMuscles: ["obliques"], secondaryMuscles: ["upperAbs", "lowerAbs"] }),
  defineExercise({ name: "Kettlebell Swing", muscleGroup: "Full Body", equipment: "Kettlebell", primaryMuscles: ["gluteMax", "hamstrings"], secondaryMuscles: ["lowerBack", "upperGlutes", "forearms"] }),
  defineExercise({ name: "Medicine Ball Wall Throw", muscleGroup: "Full Body", equipment: "Medicine Ball", primaryMuscles: ["upperAbs", "obliques"], secondaryMuscles: ["frontDelts", "triceps", "quads"] }),
  defineExercise({ name: "Medicine Ball Slam", muscleGroup: "Full Body", equipment: "Medicine Ball", primaryMuscles: ["upperAbs", "lats"], secondaryMuscles: ["obliques", "frontDelts", "triceps"] }),
  defineExercise({ name: "Goblet Squat to Press", muscleGroup: "Full Body", equipment: "Dumbbell", primaryMuscles: ["quads", "frontDelts"], secondaryMuscles: ["gluteMax", "sideDelts", "triceps", "upperAbs"] }),
  defineExercise({ name: "Sled Push", muscleGroup: "Legs", equipment: "Sled", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["calves", "upperAbs", "frontDelts"] }),
  defineExercise({ name: "Battle Rope Slam", muscleGroup: "Full Body", equipment: "Cable", primaryMuscles: ["upperAbs", "frontDelts"], secondaryMuscles: ["obliques", "lats", "triceps"] }),
  defineExercise({ name: "Bike Erg Sprint", muscleGroup: "Full Body", equipment: "Machine", primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["calves", "upperAbs"] }),
];

const EXERCISE_BY_NAME = new Map<string, CanonicalExerciseDefinition>();

for (const definition of CANONICAL_EXERCISES) {
  EXERCISE_BY_NAME.set(normalizeExerciseName(definition.name), definition);
  for (const alias of definition.aliases ?? []) {
    EXERCISE_BY_NAME.set(normalizeExerciseName(alias), definition);
  }
}

const MUSCLE_GROUP_FALLBACKS: Record<MuscleGroup, ExerciseMuscleProfile> = {
  Chest: { primaryMuscles: ["midChest", "upperChest"], secondaryMuscles: ["frontDelts", "triceps"] },
  Back: { primaryMuscles: ["lats", "midBack"], secondaryMuscles: ["rearDelts", "biceps", "upperTraps"] },
  Shoulders: { primaryMuscles: ["frontDelts", "sideDelts"], secondaryMuscles: ["rearDelts", "upperTraps", "triceps"] },
  Biceps: { primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] },
  Triceps: { primaryMuscles: ["triceps"], secondaryMuscles: ["frontDelts"] },
  Legs: { primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["hamstrings", "calves", "adductors"] },
  Glutes: { primaryMuscles: ["gluteMax", "upperGlutes"], secondaryMuscles: ["sideGlutes", "hamstrings"] },
  Hamstrings: { primaryMuscles: ["hamstrings"], secondaryMuscles: ["gluteMax", "lowerBack"] },
  Quads: { primaryMuscles: ["quads"], secondaryMuscles: ["gluteMax", "adductors"] },
  Core: { primaryMuscles: ["upperAbs", "lowerAbs"], secondaryMuscles: ["obliques", "lowerBack"] },
  "Full Body": { primaryMuscles: ["quads", "gluteMax"], secondaryMuscles: ["upperAbs", "frontDelts", "lats"] },
};

export function getCanonicalExerciseDefinition(name: string) {
  return EXERCISE_BY_NAME.get(normalizeExerciseName(name)) ?? null;
}

export function areEquivalentExerciseNames(left: string, right: string) {
  const leftDefinition = getCanonicalExerciseDefinition(left);
  const rightDefinition = getCanonicalExerciseDefinition(right);

  if (leftDefinition && rightDefinition) {
    return leftDefinition.name === rightDefinition.name;
  }

  return normalizeExerciseName(left) === normalizeExerciseName(right);
}

export function getExerciseMuscleProfile(
  name: string,
  fallbackMuscleGroup: MuscleGroup,
): ExerciseMuscleProfile {
  const definition = getCanonicalExerciseDefinition(name);
  if (definition) {
    return {
      primaryMuscles: definition.primaryMuscles,
      secondaryMuscles: definition.secondaryMuscles,
    };
  }

  return MUSCLE_GROUP_FALLBACKS[fallbackMuscleGroup] ?? {
    primaryMuscles: [],
    secondaryMuscles: [],
  };
}

function hydrateMuscleProfile<T extends HydratableExerciseLike>(exercise: T) {
  const existingPrimary = exercise.primaryMuscles ?? [];
  const existingSecondary = exercise.secondaryMuscles ?? [];

  if (existingPrimary.length || existingSecondary.length) {
    return {
      primaryMuscles: uniqueMuscles(existingPrimary),
      secondaryMuscles: uniqueMuscles(existingSecondary),
    };
  }

  return getExerciseMuscleProfile(exercise.name, exercise.muscleGroup);
}

export function hydrateExerciseTemplate(
  exercise: Omit<ExerciseTemplate, "primaryMuscles" | "secondaryMuscles"> &
    Partial<Pick<ExerciseTemplate, "primaryMuscles" | "secondaryMuscles">>,
): ExerciseTemplate {
  return {
    ...exercise,
    ...hydrateMuscleProfile(exercise),
  };
}

export function hydrateSessionExercise(
  exercise: Omit<WorkoutSessionExercise, "primaryMuscles" | "secondaryMuscles"> &
    Partial<Pick<WorkoutSessionExercise, "primaryMuscles" | "secondaryMuscles">>,
): WorkoutSessionExercise {
  return {
    ...exercise,
    ...hydrateMuscleProfile({
      name: exercise.exerciseName,
      muscleGroup: exercise.muscleGroup,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
    }),
  };
}

export function hydrateExerciseLibraryItem(
  exercise: Omit<ExerciseLibraryItem, "primaryMuscles" | "secondaryMuscles"> &
    Partial<Pick<ExerciseLibraryItem, "primaryMuscles" | "secondaryMuscles">>,
): ExerciseLibraryItem {
  const definition = getCanonicalExerciseDefinition(exercise.name);

  return {
    ...exercise,
    muscleGroup: definition?.muscleGroup ?? exercise.muscleGroup,
    equipment: definition?.equipment ?? exercise.equipment,
    cues: exercise.cues.length ? exercise.cues : definition?.cues ?? DEFAULT_CUES,
    ...hydrateMuscleProfile(exercise),
  };
}

export function findExerciseLibraryItemByName(library: ExerciseLibraryItem[], name: string) {
  return (
    library.find((item) => areEquivalentExerciseNames(item.name, name)) ??
    library.find((item) => normalizeExerciseName(item.name) === normalizeExerciseName(name)) ??
    null
  );
}

export function buildCanonicalExerciseLibrary(
  library: Array<
    Omit<ExerciseLibraryItem, "primaryMuscles" | "secondaryMuscles"> &
      Partial<Pick<ExerciseLibraryItem, "primaryMuscles" | "secondaryMuscles">>
  >,
) {
  const deduped = new Map<string, ExerciseLibraryItem>();

  for (const item of library) {
    const hydrated = hydrateExerciseLibraryItem(item);
    const definition = getCanonicalExerciseDefinition(hydrated.name);
    const key = definition ? normalizeExerciseName(definition.name) : normalizeExerciseName(hydrated.name);

    if (!deduped.has(key)) {
      deduped.set(key, hydrated);
    }
  }

  for (const definition of CANONICAL_EXERCISES) {
    const key = normalizeExerciseName(definition.name);
    if (deduped.has(key)) {
      continue;
    }

    deduped.set(key, {
      id: slugify(definition.name),
      name: definition.name,
      muscleGroup: definition.muscleGroup,
      primaryMuscles: definition.primaryMuscles,
      secondaryMuscles: definition.secondaryMuscles,
      equipment: definition.equipment,
      cues: definition.cues ?? DEFAULT_CUES,
    });
  }

  return Array.from(deduped.values());
}
