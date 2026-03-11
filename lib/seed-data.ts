import type {
  AppState,
  BibleVerse,
  ExerciseLibraryItem,
  ExerciseTemplate,
  Profile,
  WeeklySummary,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

const targetLabels: Record<string, string> = {
  Chest: "Targets chest strength and fullness.",
  Back: "Targets back width, posture, and definition.",
  Shoulders: "Targets shoulder shape and upper-body width.",
  Biceps: "Targets biceps size and arm definition.",
  Triceps: "Targets triceps tone and arm shape.",
  Legs: "Targets lower-body strength and athletic power.",
  Glutes: "Targets glute growth and lower-body shape.",
  Hamstrings: "Targets hamstrings and posterior-chain control.",
  Quads: "Targets quad strength and leg shape.",
  Core: "Targets core control and trunk definition.",
  "Full Body": "Targets full-body power and coordination.",
};

function withTargetNotes(exercises: ExerciseTemplate[]) {
  return exercises.map((exercise) => ({
    ...exercise,
    note: exercise.note
      ? `${targetLabels[exercise.muscleGroup]} ${exercise.note}`
      : targetLabels[exercise.muscleGroup],
  }));
}

function withWorkoutNotes(plan: WorkoutPlanDay[]) {
  return plan.map((day) => ({
    ...day,
    exercises: withTargetNotes(day.exercises),
  }));
}

const natashaPlan: WorkoutPlanDay[] = [
  {
    id: "natasha-glutes-hams",
    name: "Glutes + Hamstrings",
    focus: "Glute growth with clean hinge and curl work, then 10 minutes of core",
    dayLabel: "Day 1",
    durationMinutes: 60,
    exercises: [
      { id: "barbell-hip-thrust", name: "Barbell Hip Thrust", muscleGroup: "Glutes", sets: 4, repRange: "8-10", restSeconds: 120, note: "Pause at the top for a full second.", progressionNote: "Add weight when all four sets reach 10 strong reps.", favorite: true },
      { id: "romanian-dumbbell-deadlift", name: "Dumbbell Romanian Deadlift", muscleGroup: "Hamstrings", sets: 3, repRange: "10-12", restSeconds: 90, note: "Soft knees, long hamstring stretch." },
      { id: "seated-leg-curl", name: "Seated Leg Curl", muscleGroup: "Hamstrings", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "smith-bulgarian-split-squat", name: "Smith Bulgarian Split Squat", muscleGroup: "Glutes", sets: 3, repRange: "8-10", restSeconds: 90, note: "Slight forward lean to bias glutes." },
      { id: "cable-glute-kickback", name: "Cable Glute Kickback", muscleGroup: "Glutes", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "weighted-plank", name: "Weighted Plank", muscleGroup: "Core", sets: 3, repRange: "30-45", restSeconds: 60, note: "Seconds per set. Keep ribs tucked." },
    ],
  },
  {
    id: "natasha-back-arms",
    name: "Back + Arms",
    focus: "Back width and upper-back detail for a stronger V-taper look",
    dayLabel: "Day 2",
    durationMinutes: 60,
    exercises: [
      { id: "lat-pulldown", name: "Wide-Grip Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "8-10", restSeconds: 90, favorite: true, note: "Lead with elbows down to build width." },
      { id: "single-arm-high-row", name: "Single-Arm High Cable Row", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 60, note: "Pull from a high angle to hit upper lats and rear shoulder line." },
      { id: "straight-arm-pulldown", name: "Straight-Arm Pulldown", muscleGroup: "Back", sets: 2, repRange: "12-15", restSeconds: 60, note: "Smooth arc to bias lat length and width." },
      { id: "face-pull-backday", name: "Face Pull", muscleGroup: "Back", sets: 2, repRange: "12-15", restSeconds: 60, note: "Pull high and wide for upper-back detail and posture." },
      { id: "back-extension-low-back", name: "45 Degree Back Extension", muscleGroup: "Back", sets: 2, repRange: "12-15", restSeconds: 60, note: "Round lightly through the upper back and focus on lower-back control, not speed." },
      { id: "rope-triceps-pressdown", name: "Rope Triceps Pressdown", muscleGroup: "Triceps", sets: 2, repRange: "12-15", restSeconds: 60 },
      { id: "incline-dumbbell-curl", name: "Incline Dumbbell Curl", muscleGroup: "Biceps", sets: 2, repRange: "10-12", restSeconds: 60 },
      { id: "overhead-rope-extension-nat", name: "Overhead Rope Extension", muscleGroup: "Triceps", sets: 2, repRange: "12-15", restSeconds: 60, note: "Smooth triceps stretch and full lockout." },
    ],
  },
  {
    id: "natasha-glutes-quads",
    name: "Glutes + Quads",
    focus: "Round glutes with leg press and squat patterns, then 10 minutes of core",
    dayLabel: "Day 3",
    durationMinutes: 60,
    exercises: [
      { id: "smith-squat", name: "Smith Machine Squat", muscleGroup: "Quads", sets: 4, repRange: "8-10", restSeconds: 120 },
      { id: "leg-press-glute-bias", name: "Leg Press (Glute Bias)", muscleGroup: "Glutes", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "walking-lunge", name: "Walking Dumbbell Lunge", muscleGroup: "Glutes", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "leg-extension", name: "Leg Extension", muscleGroup: "Quads", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "abductor-machine", name: "Abductor Machine", muscleGroup: "Glutes", sets: 3, repRange: "15-20", restSeconds: 60 },
      { id: "cable-crunch", name: "Cable Crunch", muscleGroup: "Core", sets: 3, repRange: "12-15", restSeconds: 60 },
    ],
  },
  {
    id: "natasha-upper-core",
    name: "Upper Body + Shape",
    focus: "Shoulder cap, posture, and extra back definition for hourglass shape",
    dayLabel: "Day 4",
    durationMinutes: 55,
    exercises: [
      { id: "seated-dumbbell-press", name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", sets: 3, repRange: "8-10", restSeconds: 90 },
      { id: "cable-lateral-raise", name: "Cable Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "reverse-pec-deck", name: "Reverse Pec Deck", muscleGroup: "Back", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "single-arm-lat-prayer", name: "Single-Arm Cable Lat Pull-In", muscleGroup: "Back", sets: 2, repRange: "12-15", restSeconds: 60, note: "A lighter finisher to keep building lat shape." },
      { id: "machine-chest-press", name: "Machine Chest Press", muscleGroup: "Chest", sets: 2, repRange: "10-12", restSeconds: 90 },
      { id: "face-pull", name: "Face Pull", muscleGroup: "Back", sets: 2, repRange: "12-15", restSeconds: 60, note: "Keep the upper back tall and elbows high." },
      { id: "rope-hammer-curl", name: "Rope Hammer Curl", muscleGroup: "Biceps", sets: 2, repRange: "12-15", restSeconds: 60 },
    ],
  },
  {
    id: "natasha-core-explosive",
    name: "Core + Full Body Power",
    focus: "Simple explosive training with a focused 10 minute core finish",
    dayLabel: "Day 5",
    durationMinutes: 55,
    exercises: [
      { id: "kettlebell-swing", name: "Kettlebell Swing", muscleGroup: "Full Body", sets: 4, repRange: "12-15", restSeconds: 60, note: "Explode through the hips and stay crisp." },
      { id: "med-ball-wall-throw", name: "Medicine Ball Wall Throw", muscleGroup: "Full Body", sets: 4, repRange: "8-10", restSeconds: 60, note: "Throw hard, catch softly, and reset each rep." },
      { id: "box-step-up-drive", name: "Box Step-Up with Knee Drive", muscleGroup: "Legs", sets: 3, repRange: "8-10", restSeconds: 60, note: "Drive up quickly, control the way down." },
      { id: "med-ball-slam", name: "Medicine Ball Slam", muscleGroup: "Full Body", sets: 3, repRange: "10-12", restSeconds: 60, note: "Keep reps sharp and powerful." },
      { id: "goblet-squat-to-press", name: "Goblet Squat to Press", muscleGroup: "Full Body", sets: 3, repRange: "10-12", restSeconds: 90, note: "Smooth full-body effort without rushing." },
      { id: "walking-sled-push", name: "Sled Push", muscleGroup: "Legs", sets: 3, repRange: "20-30", restSeconds: 60, note: "Meters or seconds, smooth effort with intent." },
      { id: "cable-woodchop", name: "Cable Woodchop", muscleGroup: "Core", sets: 3, repRange: "10-12", restSeconds: 60, note: "Reps per side. Finish with 10 calm minutes of core." },
    ],
  },
];

const joshuaPlan: WorkoutPlanDay[] = [
  {
    id: "joshua-chest-triceps",
    name: "Chest + Triceps A",
    focus: "Heavy dumbbell chest work with direct triceps volume for size and strength",
    dayLabel: "Day 1",
    durationMinutes: 60,
    exercises: [
      { id: "incline-dumbbell-press-day1", name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: 4, repRange: "6-8", restSeconds: 120, favorite: true, note: "Drive the upper chest with a clean press path and full control." },
      { id: "flat-dumbbell-press-day1", name: "Flat Dumbbell Press", muscleGroup: "Chest", sets: 3, repRange: "8-10", restSeconds: 90, favorite: true, note: "Stable dumbbell pressing for chest thickness without locking out too hard." },
      { id: "machine-chest-fly-day1", name: "Machine Chest Fly", muscleGroup: "Chest", sets: 3, repRange: "10-12", restSeconds: 60, note: "Stretch deep and squeeze inward to finish the chest." },
      { id: "cable-tricep-pushdown-day1", name: "Cable Tricep Pushdown", muscleGroup: "Triceps", sets: 4, repRange: "10-12", restSeconds: 60, note: "Pin elbows in and chase a full lockout." },
      { id: "overhead-cable-tricep-extension-day1", name: "Overhead Cable Tricep Extension", muscleGroup: "Triceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Use the stretched position to light up the long head." },
      { id: "cable-skull-crusher-day1", name: "Cable Skull Crusher", muscleGroup: "Triceps", sets: 3, repRange: "8-10", restSeconds: 60, note: "Keep upper arms still and lower under control." },
    ],
  },
  {
    id: "joshua-back-biceps",
    name: "Back + Biceps A",
    focus: "Lat width, back thickness, and direct biceps work with simple commercial-gym staples",
    dayLabel: "Day 2",
    durationMinutes: 60,
    exercises: [
      { id: "lat-pulldown-day2", name: "Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "6-8", restSeconds: 120, favorite: true, note: "Drive elbows down and keep the chest tall for lat width." },
      { id: "chest-supported-dumbbell-row-day2", name: "Chest-Supported Dumbbell Row", muscleGroup: "Back", sets: 3, repRange: "8-10", restSeconds: 90, note: "Pull low and keep tension on the mid-back." },
      { id: "seated-cable-row-day2", name: "Seated Cable Row", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 90, note: "Pause the squeeze and control the reach." },
      { id: "straight-arm-cable-pulldown-day2", name: "Straight-Arm Cable Pulldown", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 60, note: "Stay long through the lats and sweep the bar to the hips." },
      { id: "back-hyperextensions-day2", name: "Back Hyperextensions", muscleGroup: "Back", sets: 3, repRange: "10-15", restSeconds: 60, note: "Control the lower back and glutes through the whole rep." },
      { id: "incline-dumbbell-curl-day2", name: "Incline Dumbbell Curl", muscleGroup: "Biceps", sets: 3, repRange: "8-10", restSeconds: 60, note: "Let the biceps lengthen fully before curling up." },
      { id: "cable-bicep-curl-day2", name: "Cable Bicep Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Keep constant cable tension through the whole curl." },
      { id: "hammer-curl-day2", name: "Hammer Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Drive the thumbs up and keep shoulders quiet." },
    ],
  },
  {
    id: "joshua-legs",
    name: "Shoulders + Legs",
    focus: "Round shoulders first, then strong legs with simple lower-body staples",
    dayLabel: "Day 3",
    durationMinutes: 60,
    exercises: [
      { id: "dumbbell-shoulder-press-day3", name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", sets: 4, repRange: "6-8", restSeconds: 120, note: "Press smoothly and keep ribs stacked." },
      { id: "dumbbell-lateral-raise-day3", name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", sets: 4, repRange: "10-12", restSeconds: 60, note: "Lead with elbows and keep the swing out of it." },
      { id: "cable-lateral-raise-day3", name: "Cable Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60, note: "Use the cable for smooth tension at the top." },
      { id: "reverse-pec-deck-day3", name: "Reverse Pec Deck", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60, note: "Open wide and squeeze the rear delts, not the traps." },
      { id: "cable-face-pull-day3", name: "Cable Face Pull", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60, note: "Pull high and wide to hit rear delts and upper back." },
      { id: "squat-day3", name: "Squat", muscleGroup: "Legs", sets: 4, repRange: "6-8", restSeconds: 120, favorite: true, note: "Brace hard and keep the rep path consistent." },
      { id: "seated-leg-curl-day3", name: "Seated Leg Curl", muscleGroup: "Hamstrings", sets: 3, repRange: "10-12", restSeconds: 90, note: "Control the stretch and finish each curl hard." },
    ],
  },
  {
    id: "joshua-shoulders-arms",
    name: "Chest + Triceps B",
    focus: "Second chest and triceps touchpoint to drive size with slightly different loading",
    dayLabel: "Day 4",
    durationMinutes: 60,
    exercises: [
      { id: "flat-dumbbell-press-day4", name: "Flat Dumbbell Press", muscleGroup: "Chest", sets: 4, repRange: "6-8", restSeconds: 120, note: "Drive hard through the chest and keep the setup tight." },
      { id: "incline-dumbbell-press-day4", name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: 3, repRange: "8-10", restSeconds: 90, note: "Smooth upper-chest pressing with full control." },
      { id: "machine-chest-fly-day4", name: "Machine Chest Fly", muscleGroup: "Chest", sets: 3, repRange: "10-12", restSeconds: 60, note: "Stretch and squeeze without rushing the return." },
      { id: "overhead-cable-tricep-extension-day4", name: "Overhead Cable Tricep Extension", muscleGroup: "Triceps", sets: 4, repRange: "10-12", restSeconds: 60, note: "Stay long through the bottom and finish each rep cleanly." },
      { id: "cable-tricep-pushdown-day4", name: "Cable Tricep Pushdown", muscleGroup: "Triceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Keep elbows locked by your sides and press all the way through." },
      { id: "cable-skull-crusher-day4", name: "Cable Skull Crusher", muscleGroup: "Triceps", sets: 3, repRange: "8-10", restSeconds: 60, note: "Keep tension on the triceps the whole rep." },
    ],
  },
  {
    id: "joshua-upper-strength",
    name: "Back + Biceps B",
    focus: "A second back and biceps session to reinforce width, rows, and direct arm volume",
    dayLabel: "Day 5",
    durationMinutes: 60,
    exercises: [
      { id: "neutral-grip-lat-pulldown-day5", name: "Neutral-Grip Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "6-8", restSeconds: 120, note: "Use a strong elbow drive and stay heavy without shrugging." },
      { id: "single-arm-dumbbell-row-day5", name: "Single-Arm Dumbbell Row", muscleGroup: "Back", sets: 3, repRange: "8-10", restSeconds: 90, note: "Pull the elbow to the hip and keep the torso steady." },
      { id: "close-grip-seated-cable-row-day5", name: "Close-Grip Seated Cable Row", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 90, note: "Stay tall and squeeze hard through the mid-back." },
      { id: "straight-arm-cable-pulldown-day5", name: "Straight-Arm Cable Pulldown", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 60, note: "Keep arms long and let the lats do the work." },
      { id: "back-hyperextensions-day5", name: "Back Hyperextensions", muscleGroup: "Back", sets: 3, repRange: "10-15", restSeconds: 60, note: "Move with control and keep the lower back active." },
      { id: "preacher-curl-day5", name: "Preacher Curl", muscleGroup: "Biceps", sets: 3, repRange: "8-10", restSeconds: 60, note: "Lower slowly and keep the upper arm pinned." },
      { id: "cable-bicep-curl-day5", name: "Cable Bicep Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Smooth cable tension with no swinging." },
      { id: "hammer-curl-day5", name: "Hammer Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", restSeconds: 60, note: "Keep wrists neutral and squeeze through the top." },
    ],
  },
];

const profiles: Profile[] = [
  {
    id: "natasha",
    name: "Natasha",
    age: 27,
    tagline: "Glute, back, and shape-focused training",
    accent: "#f28fb2",
    goalSummary: "Rounder glutes, defined back, balanced shape.",
    goals: [
      { id: "n1", title: "Glute Growth", focus: "Lower body", target: "Add shape and fullness", progress: 74 },
      { id: "n2", title: "Back Definition", focus: "Upper body", target: "More visible upper-back detail", progress: 61 },
      { id: "n3", title: "Hourglass Shape", focus: "Physique", target: "Build shoulders and glutes", progress: 67 },
      { id: "n4", title: "Flatter Stomach", focus: "Core", target: "Stay consistent with core work", progress: 58 },
    ],
    notes: ["Keep hip thrust reps smooth at lockout.", "Use straps for rows if grip starts to limit back work.", "Core work stays crisp and controlled, not rushed."],
    workoutPlan: withWorkoutNotes(natashaPlan),
    stretchPlan: [
      { dayLabel: "Sunday", title: "Lower Body Reset", focus: "Hips and hamstrings", durationMinutes: 10, bendSearch: "hips hamstrings", note: "Open Bend and sink into those hips and hamstrings slowly. Stay loose, stay wickedly flexible, and give Joshua something sinful to think about later." },
      { dayLabel: "Monday", title: "Glute Day Mobility", focus: "Hip flexors and glutes", durationMinutes: 8, bendSearch: "hip flexor glute", note: "Use Bend after glute work and open those hips properly. The softer and smoother you move, the more Joshua is going to lose his mind over it." },
      { dayLabel: "Tuesday", title: "Upper Back Release", focus: "Lats and shoulders", durationMinutes: 8, bendSearch: "upper back shoulders", note: "Run a shoulder-opening flow and stretch that upper back out. Keep that line long and tempting so Joshua cannot stop staring when you turn away." },
      { dayLabel: "Wednesday", title: "Core and Posture", focus: "Spine and obliques", durationMinutes: 8, bendSearch: "spine posture", note: "Choose a calm Bend flow that opens your trunk and posture. A soft waist, a pretty posture, and that little arch will stay in Joshua's head all day." },
      { dayLabel: "Thursday", title: "Leg Length Flow", focus: "Quads and glutes", durationMinutes: 10, bendSearch: "quads glutes", note: "Use Bend to lengthen the quads and keep the glutes loose. Stretch into that long, sexy leg line and let Joshua keep imagining how good you move." },
      { dayLabel: "Friday", title: "Shoulder Ease", focus: "Chest and shoulders", durationMinutes: 8, bendSearch: "chest shoulders", note: "Open the chest and shoulders until everything feels elegant and easy. Stay loose through the upper body and give Joshua that irresistible soft-but-dangerous look." },
      { dayLabel: "Saturday", title: "Full Body Unwind", focus: "Whole body", durationMinutes: 12, bendSearch: "full body recovery", note: "Finish the week with a full-body Bend flow and let every part of you loosen up. Relax into it, move slow, and keep Joshua craving the way your body looks and feels." },
    ],
    favoriteExerciseIds: ["barbell-hip-thrust", "lat-pulldown", "abductor-machine"],
  },
  {
    id: "joshua",
    name: "Joshua",
    age: 29,
    tagline: "Chest, arms, strength, and athletic legs",
    accent: "#7fa8ff",
    goalSummary: "Build chest and arms while getting stronger overall.",
    goals: [
      { id: "j1", title: "Bigger Chest", focus: "Chest", target: "Increase pressing volume and strength", progress: 71 },
      { id: "j2", title: "Bigger Arms", focus: "Arms", target: "Add visible arm size", progress: 64 },
      { id: "j3", title: "Stronger Legs", focus: "Legs", target: "Improve squat and machine strength", progress: 69 },
      { id: "j4", title: "Visible Abs", focus: "Core", target: "Train abs 2 to 3 times weekly", progress: 56 },
    ],
    notes: ["Keep bench press reps powerful with consistent pauses.", "No deadlifts or dips in the rotation.", "Ab sessions should stay challenging but quick."],
    workoutPlan: withWorkoutNotes(joshuaPlan),
    stretchPlan: [
      { dayLabel: "Sunday", title: "Athletic Reset", focus: "Ankles, hips, and spine", durationMinutes: 10, bendSearch: "athletic recovery", note: "Open Bend and run an athletic reset that loosens your hips and spine. Move clean, stay dangerous, and give Natasha that strong, flexible look she keeps thinking about." },
      { dayLabel: "Monday", title: "Chest Opener", focus: "Chest and triceps", durationMinutes: 8, bendSearch: "chest opener", note: "Use Bend after pressing and open the chest fully. Stay broad, loose, and tempting enough that Natasha wants to melt against you the second she gets close." },
      { dayLabel: "Tuesday", title: "Back and Biceps Release", focus: "Lats and forearms", durationMinutes: 8, bendSearch: "lats forearms", note: "Pick a short Bend flow that decompresses the lats and forearms. The looser that upper body feels, the more powerful and filthy good you look to Natasha." },
      { dayLabel: "Wednesday", title: "Leg Recovery", focus: "Quads, calves, and hips", durationMinutes: 10, bendSearch: "leg recovery", note: "Use Bend to recover the quads, calves, and hips after leg work. Keep the lower body loose and athletic so Natasha keeps noticing how strong and solid you feel." },
      { dayLabel: "Thursday", title: "Flexibility Builder", focus: "Hips and hamstrings", durationMinutes: 10, bendSearch: "hamstrings hips", note: "Take the extra time on hips and hamstrings and really open up. The smoother you move and the more flexible you feel, the more Natasha is going to want all of you close." },
      { dayLabel: "Friday", title: "Shoulder Motion", focus: "Shoulders and thoracic spine", durationMinutes: 8, bendSearch: "shoulder mobility", note: "Use Bend to free up the shoulders and upper spine. Stay open and loose through the upper body so Natasha gets that broad, wrapped-up-in-you feeling she loves." },
      { dayLabel: "Saturday", title: "Full Body Restore", focus: "Whole body", durationMinutes: 12, bendSearch: "full body restore", note: "Finish with a full-body Bend reset and let everything relax without getting lazy. Stay supple, strong, and sexy enough that Natasha can feel the difference the moment she is on you." },
    ],
    favoriteExerciseIds: ["incline-dumbbell-press-day1", "lat-pulldown-day2", "squat-day3"],
  },
];

const sessions: WorkoutSession[] = [];

const weeklySummaries: Record<"natasha" | "joshua", WeeklySummary> = {
  natasha: { userId: "natasha", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Glutes", consistencyLabel: "Building rhythm with a clean start" },
  joshua: { userId: "joshua", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Chest", consistencyLabel: "Building rhythm with a clean start" },
};

const exerciseLibrary: ExerciseLibraryItem[] = [
  ...profiles.flatMap((profile) =>
    profile.workoutPlan.flatMap((day) =>
      day.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.name.includes("Cable")
          ? "Cable"
          : exercise.name.includes("Machine")
            ? "Machine"
            : exercise.name.includes("Dumbbell")
              ? "Dumbbell"
              : "Barbell",
        cues: [exercise.note ?? "Smooth tempo and stable setup.", "Leave 1 to 2 good reps in reserve."],
      })),
    ),
  ),
  { id: "smith-machine-hip-thrust", name: "Smith Machine Hip Thrust", muscleGroup: "Glutes", equipment: "Machine", cues: ["Use the same hip thrust setup with a more stable bar path.", "Drive through heels and pause hard at lockout."] },
  { id: "machine-hip-thrust", name: "Machine Hip Thrust", muscleGroup: "Glutes", equipment: "Machine", cues: ["Let the machine keep you stable and focus on full glute squeeze.", "Control the lower and pause at the top."] },
  { id: "glute-bridge-machine", name: "Glute Bridge Machine", muscleGroup: "Glutes", equipment: "Machine", cues: ["Shorter range, constant glute tension.", "Keep chin tucked and ribs down."] },
  { id: "leg-press-high-feet", name: "Leg Press High Foot Placement", muscleGroup: "Glutes", equipment: "Machine", cues: ["Place feet high and slightly wider to bias glutes.", "Control the bottom and drive evenly."] },
  { id: "single-arm-lat-pulldown", name: "Single-Arm Lat Pulldown", muscleGroup: "Back", equipment: "Cable", cues: ["Pull elbow into hip for lat focus.", "Stay tall and avoid shrugging."] },
  { id: "assisted-pull-up", name: "Assisted Pull-Up", muscleGroup: "Back", equipment: "Machine", cues: ["Use assistance to stay in the target rep range.", "Lead with elbows and chest tall."] },
  { id: "machine-lat-pullover", name: "Machine Lat Pullover", muscleGroup: "Back", equipment: "Machine", cues: ["Drive through the elbows and keep lats loaded.", "Smooth stretch and squeeze."] },
  { id: "seated-cable-row", name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable", cues: ["Pull to lower ribs and keep chest high.", "Pause the squeeze before returning."] },
  { id: "incline-machine-press", name: "Incline Machine Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Stable upper-chest pressing with a controlled path.", "Keep shoulders down and press smoothly."] },
  { id: "flat-machine-press", name: "Flat Machine Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Press through palms and keep tension on the chest.", "Control the negative."] },
  { id: "smith-flat-press", name: "Smith Machine Flat Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Fixed bar path for stable heavy pressing.", "Keep elbows under wrists."] },
  { id: "plate-loaded-shoulder-press", name: "Plate-Loaded Shoulder Press", muscleGroup: "Shoulders", equipment: "Machine", cues: ["Stable shoulder press with clean overload.", "Keep ribcage stacked and press straight up."] },
  { id: "seated-dumbbell-lateral-raise", name: "Seated Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", cues: ["Use a shorter range and steady tempo.", "Lead with elbows, not wrists."] },
  { id: "cable-front-raise", name: "Cable Front Raise", muscleGroup: "Shoulders", equipment: "Cable", cues: ["Keep shoulders down and lift smoothly.", "Use light load and clean control."] },
  { id: "walking-lunge-alt", name: "Walking Lunge", muscleGroup: "Legs", equipment: "Dumbbell", cues: ["Take long controlled steps and stay balanced.", "Drive through the front foot."] },
  { id: "goblet-squat", name: "Goblet Squat", muscleGroup: "Quads", equipment: "Dumbbell", cues: ["Keep torso tall and heels grounded.", "Use a controlled descent."] },
  { id: "pendulum-squat", name: "Pendulum Squat", muscleGroup: "Quads", equipment: "Machine", cues: ["Stay deep and keep pressure through mid-foot.", "Let the machine support the path."] },
  { id: "seated-hamstring-curl", name: "Seated Hamstring Curl", muscleGroup: "Hamstrings", equipment: "Machine", cues: ["Pull hard and control the stretch.", "Keep hips planted."] },
  { id: "dumbbell-step-up", name: "Dumbbell Step-Up", muscleGroup: "Legs", equipment: "Dumbbell", cues: ["Drive through the working leg only.", "Stand tall at the top."] },
  { id: "rope-pushdown", name: "Rope Pushdown", muscleGroup: "Triceps", equipment: "Cable", cues: ["Split rope at the bottom and lock out cleanly.", "Keep elbows pinned."] },
  { id: "single-arm-cable-extension", name: "Single-Arm Cable Extension", muscleGroup: "Triceps", equipment: "Cable", cues: ["Use full triceps stretch and lockout.", "Keep shoulder quiet."] },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", muscleGroup: "Biceps", equipment: "Barbell", cues: ["Curl smoothly and lower under control.", "Keep elbows tucked."] },
  { id: "cable-curl", name: "Cable Curl", muscleGroup: "Biceps", equipment: "Cable", cues: ["Constant tension through the full range.", "Stand tall and avoid swinging."] },
  { id: "captains-chair-knee-raise", name: "Captain's Chair Knee Raise", muscleGroup: "Core", equipment: "Bodyweight", cues: ["Curl pelvis up, not just knees.", "Move slowly and avoid swinging."] },
  { id: "dead-bug", name: "Dead Bug", muscleGroup: "Core", equipment: "Bodyweight", cues: ["Keep ribs down and lower back flat.", "Slow, controlled limbs."] },
  { id: "bike-erg-sprint", name: "Bike Erg Sprint", muscleGroup: "Full Body", equipment: "Machine", cues: ["Keep output sharp and short.", "Recover fully between efforts."] },
  { id: "battle-rope-slam", name: "Battle Rope Slam", muscleGroup: "Full Body", equipment: "Cable", cues: ["Stay athletic and slam with intent.", "Keep core braced."] },
];

const bibleVerses: BibleVerse[] = [
  {
    id: "philippians-4-13",
    reference: "Philippians 4:13",
    preview: "I can do all this through him who gives me strength.",
    fullText: "I can do all this through him who gives me strength.",
    encouragement: "A steady reminder that strength is not only physical. Show up calmly, trust the process, and keep moving forward.",
    themes: ["Strength", "Growth"],
  },
  {
    id: "galatians-6-9",
    reference: "Galatians 6:9",
    preview: "Let us not become weary in doing good...",
    fullText:
      "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    encouragement: "Consistency compounds quietly. Even simple sessions matter when you keep returning with patience.",
    themes: ["Perseverance", "Growth"],
  },
  {
    id: "2-timothy-1-7",
    reference: "2 Timothy 1:7",
    preview: "For the Spirit God gave us does not make us timid...",
    fullText:
      "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    encouragement: "Discipline does not have to feel harsh. It can look calm, clear, and faithful in the small choices of the day.",
    themes: ["Discipline", "Strength"],
  },
  {
    id: "hebrews-12-1",
    reference: "Hebrews 12:1",
    preview: "Let us run with perseverance the race marked out for us.",
    fullText:
      "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us.",
    encouragement: "You do not need a perfect session, only a willing one. Stay steady and keep your eyes on the next right step.",
    themes: ["Perseverance", "Discipline"],
  },
  {
    id: "joshua-1-9",
    reference: "Joshua 1:9",
    preview: "Be strong and courageous. Do not be afraid...",
    fullText:
      "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    encouragement: "Confidence grows through repetition. Walk into the gym with a calm heart and let courage look simple and steady.",
    themes: ["Strength", "Perseverance"],
  },
  {
    id: "proverbs-24-16",
    reference: "Proverbs 24:16",
    preview: "Though the righteous fall seven times, they rise again.",
    fullText:
      "For though the righteous fall seven times, they rise again, but the wicked stumble when calamity strikes.",
    encouragement: "Missed sessions do not define you. Returning does. Progress often looks like getting back up with grace.",
    themes: ["Perseverance", "Growth"],
  },
  {
    id: "1-corinthians-9-24",
    reference: "1 Corinthians 9:24",
    preview: "Run in such a way as to get the prize.",
    fullText:
      "Do you not know that in a race all the runners run, but only one gets the prize? Run in such a way as to get the prize.",
    encouragement: "Train with intention, not pressure. Every focused set is another vote for the person you are becoming.",
    themes: ["Discipline", "Growth"],
  },
];

export function createSeedState(): AppState {
  return {
    selectedUserId: "joshua",
    profiles,
    sessions,
    personalBests: {
      natasha: [],
      joshua: [],
    },
    weeklySummaries,
    sharedSummary: {
      combinedWorkouts: 0,
      teamStreak: 0,
      weeklyHighlight: "A fresh week to build momentum together.",
      recentMilestones: [
        "Preset plans are ready",
        "Both profiles are set up",
        "Start today whenever you are ready",
      ],
    },
    bibleVerses,
    measurements: {
      natasha: [],
      joshua: [],
    },
      stretchCompletions: {
        natasha: [],
        joshua: [],
      },
      workoutOverrides: {
        natasha: { nextWorkoutId: null, updatedAt: null },
        joshua: { nextWorkoutId: null, updatedAt: null },
      },
      exerciseSwapMemory: {
        natasha: {},
        joshua: {},
      },
      exerciseLibrary,
      activeWorkout: null,
    };
  }
