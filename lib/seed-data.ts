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
    name: "Chest + Triceps",
    focus: "Chest growth with stable dumbbell and machine pressing, plus a short core finish",
    dayLabel: "Day 1",
    durationMinutes: 60,
    exercises: [
      { id: "flat-dumbbell-press", name: "Flat Dumbbell Press", muscleGroup: "Chest", sets: 4, repRange: "6-8", restSeconds: 120, favorite: true },
      { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: 3, repRange: "8-10", restSeconds: 90 },
      { id: "plate-loaded-chest-press", name: "Plate-Loaded Chest Press", muscleGroup: "Chest", sets: 3, repRange: "10-12", restSeconds: 90, note: "Stable pressing to drive chest volume without fly work." },
      { id: "smith-incline-press", name: "Smith Incline Press", muscleGroup: "Chest", sets: 2, repRange: "8-10", restSeconds: 90, note: "Controlled upper-chest work." },
      { id: "cable-triceps-extension", name: "Cable Triceps Extension", muscleGroup: "Triceps", sets: 3, repRange: "10-12", restSeconds: 60 },
      { id: "overhead-rope-extension", name: "Overhead Rope Extension", muscleGroup: "Triceps", sets: 2, repRange: "12-15", restSeconds: 60 },
      { id: "ab-wheel", name: "Ab Wheel Rollout", muscleGroup: "Core", sets: 3, repRange: "8-12", restSeconds: 60 },
    ],
  },
  {
    id: "joshua-back-biceps",
    name: "Back + Biceps",
    focus: "Width, thickness, and arm size with mostly machines and dumbbells",
    dayLabel: "Day 2",
    durationMinutes: 58,
    exercises: [
      { id: "neutral-lat-pulldown-heavy", name: "Neutral-Grip Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "8-10", restSeconds: 90 },
      { id: "chest-supported-tbar", name: "Chest-Supported T-Bar Row", muscleGroup: "Back", sets: 3, repRange: "8-10", restSeconds: 90 },
      { id: "machine-row-close", name: "Close-Grip Machine Row", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "neutral-lat-pulldown", name: "Neutral-Grip Lat Pulldown", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "alternating-dumbbell-curl-backday", name: "Alternating Dumbbell Curl", muscleGroup: "Biceps", sets: 3, repRange: "8-10", restSeconds: 60 },
      { id: "machine-preacher-curl", name: "Machine Preacher Curl", muscleGroup: "Biceps", sets: 2, repRange: "10-12", restSeconds: 60 },
    ],
  },
  {
    id: "joshua-legs",
    name: "Legs + Shoulders",
    focus: "Athletic legs with clean shoulder work and a short core finisher",
    dayLabel: "Day 3",
    durationMinutes: 60,
    exercises: [
      { id: "hack-squat", name: "Hack Squat", muscleGroup: "Legs", sets: 4, repRange: "6-8", restSeconds: 120 },
      { id: "dumbbell-rdl", name: "Dumbbell Romanian Deadlift", muscleGroup: "Hamstrings", sets: 3, repRange: "8-10", restSeconds: 90, note: "Controlled hinge with stable dumbbells." },
      { id: "leg-press", name: "Leg Press", muscleGroup: "Quads", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "lying-leg-curl", name: "Lying Leg Curl", muscleGroup: "Hamstrings", sets: 3, repRange: "10-12", restSeconds: 60 },
      { id: "machine-shoulder-press-main", name: "Machine Shoulder Press", muscleGroup: "Shoulders", sets: 3, repRange: "8-10", restSeconds: 90 },
      { id: "dumbbell-lateral-raise", name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "hanging-knee-raise", name: "Hanging Knee Raise", muscleGroup: "Core", sets: 3, repRange: "10-15", restSeconds: 60, note: "Short core finisher for abs and trunk control." },
    ],
  },
  {
    id: "joshua-shoulders-arms",
    name: "Shoulders + Triceps",
    focus: "Round shoulders and stronger triceps with stable machine and cable work",
    dayLabel: "Day 4",
    durationMinutes: 56,
    exercises: [
      { id: "machine-shoulder-press-heavy", name: "Machine Shoulder Press", muscleGroup: "Shoulders", sets: 4, repRange: "6-8", restSeconds: 120 },
      { id: "dumbbell-lateral-raise-heavy", name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "rear-delt-machine", name: "Rear Delt Machine", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", restSeconds: 60 },
      { id: "dual-rope-pressdown", name: "Dual Rope Pressdown", muscleGroup: "Triceps", sets: 3, repRange: "10-12", restSeconds: 60 },
      { id: "overhead-cable-extension-josh", name: "Overhead Cable Extension", muscleGroup: "Triceps", sets: 2, repRange: "12-15", restSeconds: 60 },
      { id: "cable-lateral-raise-josh", name: "Cable Lateral Raise", muscleGroup: "Shoulders", sets: 2, repRange: "12-15", restSeconds: 60 },
      { id: "single-arm-pressdown-josh", name: "Single-Arm Cable Pressdown", muscleGroup: "Triceps", sets: 2, repRange: "12-15", restSeconds: 60 },
    ],
  },
  {
    id: "joshua-upper-strength",
    name: "Back + Biceps",
    focus: "Back width, thickness, direct biceps work, and a short core finisher",
    dayLabel: "Day 5",
    durationMinutes: 60,
    exercises: [
      { id: "neutral-lat-pulldown-friday", name: "Neutral-Grip Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "8-10", restSeconds: 90 },
      { id: "machine-row-friday", name: "Machine Row", muscleGroup: "Back", sets: 3, repRange: "8-10", restSeconds: 90 },
      { id: "chest-supported-tbar-friday", name: "Chest-Supported T-Bar Row", muscleGroup: "Back", sets: 3, repRange: "10-12", restSeconds: 90 },
      { id: "bayesian-curl", name: "Bayesian Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", restSeconds: 60 },
      { id: "alternating-dumbbell-curl", name: "Alternating Dumbbell Curl", muscleGroup: "Biceps", sets: 2, repRange: "10-12", restSeconds: 60 },
      { id: "machine-preacher-curl-friday", name: "Machine Preacher Curl", muscleGroup: "Biceps", sets: 2, repRange: "12-15", restSeconds: 60 },
      { id: "cable-crunch-josh-day5", name: "Cable Crunch", muscleGroup: "Core", sets: 3, repRange: "12-15", restSeconds: 60 },
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
      { dayLabel: "Sunday", title: "Lower Body Reset", focus: "Hips and hamstrings", durationMinutes: 10, bendSearch: "hips hamstrings", note: "Open Bend and choose a gentle hips and hamstrings flow." },
      { dayLabel: "Monday", title: "Glute Day Mobility", focus: "Hip flexors and glutes", durationMinutes: 8, bendSearch: "hip flexor glute", note: "Use Bend after training to loosen hips and support glute work." },
      { dayLabel: "Tuesday", title: "Upper Back Release", focus: "Lats and shoulders", durationMinutes: 8, bendSearch: "upper back shoulders", note: "Use Bend for a quick shoulder-opening session after back day." },
      { dayLabel: "Wednesday", title: "Core and Posture", focus: "Spine and obliques", durationMinutes: 8, bendSearch: "spine posture", note: "Choose a calm Bend routine that opens the trunk and improves posture." },
      { dayLabel: "Thursday", title: "Leg Length Flow", focus: "Quads and glutes", durationMinutes: 10, bendSearch: "quads glutes", note: "Use Bend to recover from lower-body training and stay loose." },
      { dayLabel: "Friday", title: "Shoulder Ease", focus: "Chest and shoulders", durationMinutes: 8, bendSearch: "chest shoulders", note: "A short Bend stretch here keeps upper body work feeling smooth." },
      { dayLabel: "Saturday", title: "Full Body Unwind", focus: "Whole body", durationMinutes: 12, bendSearch: "full body recovery", note: "Finish the week with a full-body Bend recovery flow." },
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
      { dayLabel: "Sunday", title: "Athletic Reset", focus: "Ankles, hips, and spine", durationMinutes: 10, bendSearch: "athletic recovery", note: "Open Bend and run an athletic recovery flow to stay loose for the week." },
      { dayLabel: "Monday", title: "Chest Opener", focus: "Chest and triceps", durationMinutes: 8, bendSearch: "chest opener", note: "Use Bend after pressing to open the chest and front delts." },
      { dayLabel: "Tuesday", title: "Back and Biceps Release", focus: "Lats and forearms", durationMinutes: 8, bendSearch: "lats forearms", note: "Pick a short Bend flow that decompresses the upper back." },
      { dayLabel: "Wednesday", title: "Leg Recovery", focus: "Quads, calves, and hips", durationMinutes: 10, bendSearch: "leg recovery", note: "Use Bend for a lower-body recovery session after leg day." },
      { dayLabel: "Thursday", title: "Flexibility Builder", focus: "Hips and hamstrings", durationMinutes: 10, bendSearch: "hamstrings hips", note: "A dedicated Bend mobility session helps with your flexibility goal." },
      { dayLabel: "Friday", title: "Shoulder Motion", focus: "Shoulders and thoracic spine", durationMinutes: 8, bendSearch: "shoulder mobility", note: "Use Bend to keep pressing and arm work feeling smooth." },
      { dayLabel: "Saturday", title: "Full Body Restore", focus: "Whole body", durationMinutes: 12, bendSearch: "full body restore", note: "Finish with a Bend full-body reset to stay fresh and mobile." },
    ],
    favoriteExerciseIds: ["flat-dumbbell-press", "hack-squat", "alternating-dumbbell-curl-backday"],
  },
];

const sessions: WorkoutSession[] = [];

const weeklySummaries: Record<"natasha" | "joshua", WeeklySummary> = {
  natasha: { userId: "natasha", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Glutes", consistencyLabel: "Building rhythm with a clean start" },
  joshua: { userId: "joshua", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Chest", consistencyLabel: "Building rhythm with a clean start" },
};

const exerciseLibrary: ExerciseLibraryItem[] = profiles.flatMap((profile) =>
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
);

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
    exerciseLibrary,
    activeWorkout: null,
  };
}
