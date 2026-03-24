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
import { buildCanonicalExerciseLibrary } from "@/lib/exercise-data";

const targetLabels: Record<string, string> = {
  Chest: "Targets: Chest",
  Back: "Targets: Back",
  Shoulders: "Targets: Shoulders",
  Biceps: "Targets: Biceps",
  Triceps: "Targets: Triceps",
  Legs: "Targets: Legs",
  Glutes: "Targets: Glutes",
  Hamstrings: "Targets: Hamstrings",
  Quads: "Targets: Quads",
  Core: "Targets: Core",
  "Full Body": "Targets: Full body",
};

function withTargetNotes(exercises: ExerciseTemplate[]) {
  return exercises.map((exercise) => ({
    ...exercise,
    note: targetLabels[exercise.muscleGroup] ?? `Targets: ${exercise.muscleGroup}`,
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
    focus: "Glute growth with hip thrusts, hinge work, calf work, and a little power",
    dayLabel: "Day 1",
    durationMinutes: 60,
    exercises: [
      { id: "machine-hip-thrust-day1", name: "Machine Hip Thrust", muscleGroup: "Glutes", sets: 4, repRange: "8", note: "Pause at the top for a full second.", progressionNote: "Add weight when all four sets hit 8 clean reps.", favorite: true },
      { id: "romanian-dumbbell-deadlift", name: "Dumbbell Romanian Deadlift", muscleGroup: "Hamstrings", sets: 3, repRange: "8", note: "Soft knees, long hamstring stretch." },
      { id: "reverse-lunge-day1-nat", name: "Reverse Lunge", muscleGroup: "Glutes", sets: 3, repRange: "8", note: "Stay balanced and drive through the front glute." },
      { id: "hamstring-curl-day1-nat", name: "Hamstring Curl", muscleGroup: "Hamstrings", sets: 3, repRange: "10", note: "Control the stretch and squeeze the curl hard." },
      { id: "cable-glute-kickback", name: "Cable Glute Kickback", muscleGroup: "Glutes", sets: 3, repRange: "10", note: "Keep the hips square and finish with a full glute squeeze." },
      { id: "kettlebell-swing-day1-nat", name: "Kettlebell Swing", muscleGroup: "Full Body", sets: 3, repRange: "12-15", note: "Explode through the hips and keep the reps crisp." },
      { id: "standing-calf-raise-day1-nat", name: "Standing Calf Raise", muscleGroup: "Legs", sets: 3, repRange: "12-15", note: "Pause at the top and lower under control." },
    ],
  },
  {
    id: "natasha-back-arms",
    name: "Back + Biceps",
    focus: "Lat width, back detail, and direct biceps work for a sharper V-taper look",
    dayLabel: "Day 2",
    durationMinutes: 60,
    exercises: [
      { id: "lat-pulldown-day2-nat", name: "Lat Pulldown", muscleGroup: "Back", sets: 3, repRange: "10", favorite: true, note: "Drive elbows down and keep the chest tall." },
      { id: "lat-pullover-day2-nat", name: "Lat Pullover", muscleGroup: "Back", sets: 3, repRange: "12", note: "Stay long through the lats and squeeze through the bottom." },
      { id: "barbell-row-day2-nat", name: "Barbell Row", muscleGroup: "Back", sets: 4, repRange: "10", note: "Pull to the lower ribs and keep the torso steady." },
      { id: "single-arm-seated-row-day2-nat", name: "Single-Arm Seated Row", muscleGroup: "Back", sets: 3, repRange: "10", note: "Work each side evenly and pause at the squeeze." },
      { id: "face-pull-backday", name: "Face Pull", muscleGroup: "Back", sets: 3, repRange: "10", note: "Pull high and wide for upper-back detail and posture." },
      { id: "dumbbell-bicep-curl-day2-nat", name: "Dumbbell Bicep Curl", muscleGroup: "Biceps", sets: 3, repRange: "10", note: "Keep elbows tucked and lower slowly." },
      { id: "hammer-curl-day2-nat", name: "Hammer Curl", muscleGroup: "Biceps", sets: 3, repRange: "10", note: "Stay neutral through the wrist and squeeze through the top." },
      { id: "hyperextensions-day2-nat", name: "Hyperextensions", muscleGroup: "Back", sets: 3, repRange: "10-15", note: "Move under control and keep tension through the lower back and glutes." },
    ],
  },
  {
    id: "natasha-glutes-quads",
    name: "Glutes + Quads",
    focus: "Glute and quad work with simple staples, calf work, and a power finisher",
    dayLabel: "Day 3",
    durationMinutes: 60,
    exercises: [
      { id: "machine-hip-thrust-day3", name: "Machine Hip Thrust", muscleGroup: "Glutes", sets: 4, repRange: "8-10", note: "Pause at the top and keep the glutes loaded." },
      { id: "walking-lunge-day3-nat", name: "Walking Lunge", muscleGroup: "Glutes", sets: 3, repRange: "10", note: "Take long steps and drive through the front leg." },
      { id: "leg-press-day3-nat", name: "Leg Press", muscleGroup: "Quads", sets: 3, repRange: "10", note: "Stay controlled through the bottom and push evenly." },
      { id: "bulgarian-split-squat-day3-nat", name: "Bulgarian Split Squat", muscleGroup: "Glutes", sets: 3, repRange: "10", note: "Keep the front foot planted and stay balanced through the glute." },
      { id: "leg-extension", name: "Leg Extension", muscleGroup: "Quads", sets: 3, repRange: "10", note: "Control the squeeze and lower slowly." },
      { id: "kettlebell-swing-day3-nat", name: "Kettlebell Swing", muscleGroup: "Full Body", sets: 3, repRange: "12-15", note: "Drive hard through the hips and stay sharp." },
      { id: "standing-calf-raise-day3-nat", name: "Standing Calf Raise", muscleGroup: "Legs", sets: 3, repRange: "12-15", note: "Use a full stretch and pause at the top." },
    ],
  },
  {
    id: "natasha-upper-core",
    name: "Upper Body + Shape",
    focus: "Shoulder cap, posture, and extra back definition for hourglass shape",
    dayLabel: "Day 4",
    durationMinutes: 55,
    exercises: [
      { id: "seated-dumbbell-press", name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", sets: 3, repRange: "8-10" },
      { id: "cable-lateral-raise", name: "Cable Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15" },
      { id: "reverse-pec-deck", name: "Reverse Pec Deck", muscleGroup: "Back", sets: 3, repRange: "12-15" },
      { id: "single-arm-lat-prayer", name: "Single-Arm Cable Lat Pull-In", muscleGroup: "Back", sets: 2, repRange: "12-15", note: "A lighter finisher to keep building lat shape." },
      { id: "machine-chest-press", name: "Machine Chest Press", muscleGroup: "Chest", sets: 2, repRange: "10-12" },
      { id: "face-pull", name: "Face Pull", muscleGroup: "Back", sets: 2, repRange: "12-15", note: "Keep the upper back tall and elbows high." },
      { id: "rope-hammer-curl", name: "Rope Hammer Curl", muscleGroup: "Biceps", sets: 2, repRange: "12-15" },
    ],
  },
  {
    id: "natasha-core-explosive",
    name: "Core + Full Body Power",
    focus: "Simple explosive training with a focused 10 minute core finish",
    dayLabel: "Day 5",
    durationMinutes: 55,
    exercises: [
      { id: "kettlebell-swing", name: "Kettlebell Swing", muscleGroup: "Full Body", sets: 4, repRange: "12-15", note: "Explode through the hips and stay crisp." },
      { id: "med-ball-wall-throw", name: "Medicine Ball Wall Throw", muscleGroup: "Full Body", sets: 4, repRange: "8-10", note: "Throw hard, catch softly, and reset each rep." },
      { id: "box-step-up-drive", name: "Box Step-Up with Knee Drive", muscleGroup: "Legs", sets: 3, repRange: "8-10", note: "Drive up quickly, control the way down." },
      { id: "med-ball-slam", name: "Medicine Ball Slam", muscleGroup: "Full Body", sets: 3, repRange: "10-12", note: "Keep reps sharp and powerful." },
      { id: "goblet-squat-to-press", name: "Goblet Squat to Press", muscleGroup: "Full Body", sets: 3, repRange: "10-12", note: "Smooth full-body effort without rushing." },
      { id: "walking-sled-push", name: "Sled Push", muscleGroup: "Legs", sets: 3, repRange: "20-30", note: "Meters or seconds, smooth effort with intent." },
      { id: "cable-woodchop", name: "Cable Woodchop", muscleGroup: "Core", sets: 3, repRange: "10-12", note: "Reps per side. Finish with 10 calm minutes of core." },
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
      { id: "incline-dumbbell-press-day1", name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: 4, repRange: "6-8", favorite: true, note: "Drive the upper chest with a clean press path and full control." },
      { id: "flat-dumbbell-press-day1", name: "Flat Dumbbell Press", muscleGroup: "Chest", sets: 3, repRange: "8-10", favorite: true, note: "Stable dumbbell pressing for chest thickness without locking out too hard." },
      { id: "machine-chest-fly-day1", name: "Machine Chest Fly", muscleGroup: "Chest", sets: 3, repRange: "10-12", note: "Stretch deep and squeeze inward to finish the chest." },
      { id: "cable-tricep-pushdown-day1", name: "Cable Tricep Pushdown", muscleGroup: "Triceps", sets: 4, repRange: "10-12", note: "Pin elbows in and chase a full lockout." },
      { id: "overhead-cable-tricep-extension-day1", name: "Overhead Cable Tricep Extension", muscleGroup: "Triceps", sets: 3, repRange: "10-12", note: "Use the stretched position to light up the long head." },
      { id: "cable-skull-crusher-day1", name: "Cable Skull Crusher", muscleGroup: "Triceps", sets: 3, repRange: "8-10", note: "Keep upper arms still and lower under control." },
    ],
  },
  {
    id: "joshua-back-biceps",
    name: "Back + Biceps A",
    focus: "Lat width, back thickness, and direct biceps work with simple commercial-gym staples",
    dayLabel: "Day 2",
    durationMinutes: 60,
    exercises: [
      { id: "lat-pulldown-day2", name: "Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "6-8", favorite: true, note: "Drive elbows down and keep the chest tall for lat width." },
      { id: "chest-supported-dumbbell-row-day2", name: "Chest-Supported Dumbbell Row", muscleGroup: "Back", sets: 3, repRange: "8-10", note: "Pull low and keep tension on the mid-back." },
      { id: "seated-cable-row-day2", name: "Seated Cable Row", muscleGroup: "Back", sets: 3, repRange: "10-12", note: "Pause the squeeze and control the reach." },
      { id: "straight-arm-cable-pulldown-day2", name: "Straight-Arm Cable Pulldown", muscleGroup: "Back", sets: 3, repRange: "10-12", note: "Stay long through the lats and sweep the bar to the hips." },
      { id: "back-hyperextensions-day2", name: "Back Hyperextensions", muscleGroup: "Back", sets: 3, repRange: "10-15", note: "Control the lower back and glutes through the whole rep." },
      { id: "incline-dumbbell-curl-day2", name: "Incline Dumbbell Curl", muscleGroup: "Biceps", sets: 3, repRange: "8-10", note: "Let the biceps lengthen fully before curling up." },
      { id: "cable-bicep-curl-day2", name: "Cable Bicep Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", note: "Keep constant cable tension through the whole curl." },
      { id: "hammer-curl-day2", name: "Hammer Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", note: "Drive the thumbs up and keep shoulders quiet." },
    ],
  },
  {
    id: "joshua-legs",
    name: "Shoulders + Legs",
    focus: "Round shoulders first, then strong legs with simple lower-body staples",
    dayLabel: "Day 3",
    durationMinutes: 60,
    exercises: [
      { id: "dumbbell-shoulder-press-day3", name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", sets: 4, repRange: "6-8", note: "Press smoothly and keep ribs stacked." },
      { id: "dumbbell-lateral-raise-day3", name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", sets: 4, repRange: "10-12", note: "Lead with elbows and keep the swing out of it." },
      { id: "cable-lateral-raise-day3", name: "Cable Lateral Raise", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", note: "Use the cable for smooth tension at the top." },
      { id: "reverse-pec-deck-day3", name: "Reverse Pec Deck", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", note: "Open wide and squeeze the rear delts, not the traps." },
      { id: "cable-face-pull-day3", name: "Cable Face Pull", muscleGroup: "Shoulders", sets: 3, repRange: "12-15", note: "Pull high and wide to hit rear delts and upper back." },
      { id: "squat-day3", name: "Squat", muscleGroup: "Legs", sets: 4, repRange: "6-8", favorite: true, note: "Brace hard and keep the rep path consistent." },
      { id: "seated-leg-curl-day3", name: "Seated Leg Curl", muscleGroup: "Hamstrings", sets: 3, repRange: "10-12", note: "Control the stretch and finish each curl hard." },
    ],
  },
  {
    id: "joshua-shoulders-arms",
    name: "Chest + Triceps B",
    focus: "Second chest and triceps touchpoint to drive size with slightly different loading",
    dayLabel: "Day 4",
    durationMinutes: 60,
    exercises: [
      { id: "flat-dumbbell-press-day4", name: "Flat Dumbbell Press", muscleGroup: "Chest", sets: 4, repRange: "6-8", note: "Drive hard through the chest and keep the setup tight." },
      { id: "incline-dumbbell-press-day4", name: "Incline Dumbbell Press", muscleGroup: "Chest", sets: 3, repRange: "8-10", note: "Smooth upper-chest pressing with full control." },
      { id: "machine-chest-fly-day4", name: "Machine Chest Fly", muscleGroup: "Chest", sets: 3, repRange: "10-12", note: "Stretch and squeeze without rushing the return." },
      { id: "overhead-cable-tricep-extension-day4", name: "Overhead Cable Tricep Extension", muscleGroup: "Triceps", sets: 4, repRange: "10-12", note: "Stay long through the bottom and finish each rep cleanly." },
      { id: "cable-tricep-pushdown-day4", name: "Cable Tricep Pushdown", muscleGroup: "Triceps", sets: 3, repRange: "10-12", note: "Keep elbows locked by your sides and press all the way through." },
      { id: "cable-skull-crusher-day4", name: "Cable Skull Crusher", muscleGroup: "Triceps", sets: 3, repRange: "8-10", note: "Keep tension on the triceps the whole rep." },
    ],
  },
  {
    id: "joshua-upper-strength",
    name: "Back + Biceps B",
    focus: "A second back and biceps session to reinforce width, rows, and direct arm volume",
    dayLabel: "Day 5",
    durationMinutes: 60,
    exercises: [
      { id: "neutral-grip-lat-pulldown-day5", name: "Neutral-Grip Lat Pulldown", muscleGroup: "Back", sets: 4, repRange: "6-8", note: "Use a strong elbow drive and stay heavy without shrugging." },
      { id: "single-arm-dumbbell-row-day5", name: "Single-Arm Dumbbell Row", muscleGroup: "Back", sets: 3, repRange: "8-10", note: "Pull the elbow to the hip and keep the torso steady." },
      { id: "close-grip-seated-cable-row-day5", name: "Close-Grip Seated Cable Row", muscleGroup: "Back", sets: 3, repRange: "10-12", note: "Stay tall and squeeze hard through the mid-back." },
      { id: "straight-arm-cable-pulldown-day5", name: "Straight-Arm Cable Pulldown", muscleGroup: "Back", sets: 3, repRange: "10-12", note: "Keep arms long and let the lats do the work." },
      { id: "back-hyperextensions-day5", name: "Back Hyperextensions", muscleGroup: "Back", sets: 3, repRange: "10-15", note: "Move with control and keep the lower back active." },
      { id: "preacher-curl-day5", name: "Preacher Curl", muscleGroup: "Biceps", sets: 3, repRange: "8-10", note: "Lower slowly and keep the upper arm pinned." },
      { id: "cable-bicep-curl-day5", name: "Cable Bicep Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", note: "Smooth cable tension with no swinging." },
      { id: "hammer-curl-day5", name: "Hammer Curl", muscleGroup: "Biceps", sets: 3, repRange: "10-12", note: "Keep wrists neutral and squeeze through the top." },
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
      {
        dayLabel: "Sunday",
        focusRegions: ["Hips", "Hamstrings", "Lower back"],
        primaryStretch: {
          name: "Seated straddle fold",
          why: "Opens the back line so your hips and hamstrings stop feeling tight and short.",
        },
        secondaryStretches: [
          {
            name: "90/90 hip switches",
            why: "Keeps hip rotation smooth so glute work feels cleaner this week.",
          },
          {
            name: "Child's pose reach",
            why: "Decompresses the low back and gives your torso a softer reset.",
          },
        ],
        note: "Move slowly and let that loose lower-body glide do a little flirting for you.",
      },
      {
        dayLabel: "Monday",
        focusRegions: ["Hip flexors", "Glutes", "Adductors"],
        primaryStretch: {
          name: "Couch stretch",
          why: "Releases the front of the hips so glute sessions hit harder without that stiff pull.",
        },
        secondaryStretches: [
          {
            name: "Figure-four glute stretch",
            why: "Takes the edge off heavy hip work and keeps lockout smoother.",
          },
        ],
        note: "A little extra hip opening keeps your lower-body shape looking effortless.",
      },
      {
        dayLabel: "Tuesday",
        focusRegions: ["Lats", "Shoulders", "Upper back"],
        primaryStretch: {
          name: "Bench lat prayer stretch",
          why: "Lengthens the lats so your back and shoulders stop feeling compressed.",
        },
        secondaryStretches: [
          {
            name: "Thread the needle",
            why: "Frees up the upper back so posture looks cleaner and softer.",
          },
          {
            name: "Doorway chest opener",
            why: "Balances shoulder tension and helps you stay open through the front.",
          },
        ],
        note: "Open the upper body and let that long, easy posture do some quiet damage.",
      },
      {
        dayLabel: "Wednesday",
        focusRegions: ["Core", "Obliques", "Spine"],
        primaryStretch: {
          name: "Open-book rotation",
          why: "Unwinds the trunk so your waist and ribcage move without feeling jammed.",
        },
        secondaryStretches: [
          {
            name: "Side bend reach",
            why: "Gives the obliques a longer line and helps your torso feel lighter.",
          },
        ],
        note: "A smoother twist and softer waist always reads a little more dangerous.",
      },
      {
        dayLabel: "Thursday",
        focusRegions: ["Quads", "Glutes", "Calves"],
        primaryStretch: {
          name: "Half-kneeling quad stretch",
          why: "Takes stiffness out of the thighs so your stride and leg line feel cleaner.",
        },
        secondaryStretches: [
          {
            name: "Standing calf wall stretch",
            why: "Restores ankle range so lower-body sessions feel less clunky.",
          },
          {
            name: "Pigeon pose",
            why: "Keeps the glutes loose after heavy leg work.",
          },
        ],
        note: "Loose legs and smooth steps make the whole look feel a lot more intentional.",
      },
      {
        dayLabel: "Friday",
        focusRegions: ["Chest", "Shoulders", "Thoracic spine"],
        primaryStretch: {
          name: "Foam roller chest opener",
          why: "Releases the front of the upper body so your shoulders sit back more naturally.",
        },
        secondaryStretches: [
          {
            name: "Wall slide",
            why: "Improves overhead motion and keeps shoulder shape looking cleaner.",
          },
        ],
        note: "A more open upper body gives your whole silhouette that polished little tease.",
      },
      {
        dayLabel: "Saturday",
        focusRegions: ["Hips", "Back", "Flexibility"],
        primaryStretch: {
          name: "Deep squat hold",
          why: "Resets ankles, hips, and spine all at once when the week feels stiff.",
        },
        secondaryStretches: [
          {
            name: "Forward fold hang",
            why: "Lets the back line downshift and opens overall flexibility.",
          },
          {
            name: "Cat-cow flow",
            why: "Brings a gentle full-body reset without turning into a long session.",
          },
        ],
        note: "Keep it unhurried and let that easy flexibility feel a little bit unfair.",
      },
    ],
    favoriteExerciseIds: ["machine-hip-thrust-day1", "lat-pulldown-day2-nat", "abductor-machine"],
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
      {
        dayLabel: "Sunday",
        focusRegions: ["Ankles", "Hips", "Spine"],
        primaryStretch: {
          name: "Deep squat pry",
          why: "Opens the ankles and hips so you move more athletic instead of stiff.",
        },
        secondaryStretches: [
          {
            name: "World's greatest stretch",
            why: "Cleans up hip and thoracic rotation in one pass.",
          },
          {
            name: "Cat-cow flow",
            why: "Lets the spine downshift and reset without overthinking it.",
          },
        ],
        note: "Loose, athletic movement always lands a little better than forcing it.",
      },
      {
        dayLabel: "Monday",
        focusRegions: ["Chest", "Triceps", "Shoulders"],
        primaryStretch: {
          name: "Doorway pec stretch",
          why: "Opens pressing-tight chest and front shoulders so you stay broad instead of jammed.",
        },
        secondaryStretches: [
          {
            name: "Overhead triceps stretch",
            why: "Takes tension off the elbows and long head after heavy extensions.",
          },
        ],
        note: "A looser chest and cleaner posture make the strong look feel even smoother.",
      },
      {
        dayLabel: "Tuesday",
        focusRegions: ["Lats", "Forearms", "Upper back"],
        primaryStretch: {
          name: "Bench lat stretch",
          why: "Lengthens the lats so rows and pulldowns stop leaving you glued together.",
        },
        secondaryStretches: [
          {
            name: "Forearm wall stretch",
            why: "Relieves grip tension and keeps pulling days from lingering in the elbows.",
          },
          {
            name: "Thread the needle",
            why: "Frees up the upper back so width work doesn't make posture collapse.",
          },
        ],
        note: "Open up the back and let that wide, relaxed look do the heavy lifting.",
      },
      {
        dayLabel: "Wednesday",
        focusRegions: ["Quads", "Calves", "Hips"],
        primaryStretch: {
          name: "Half-kneeling hip flexor stretch",
          why: "Restores hip extension so leg work feels stronger and less sticky.",
        },
        secondaryStretches: [
          {
            name: "Standing quad stretch",
            why: "Loosens the front of the thigh after squats and split work.",
          },
          {
            name: "Wall calf stretch",
            why: "Improves ankle motion and keeps lower-body movement cleaner.",
          },
        ],
        note: "Move like you own the room, not like your legs are still arguing with yesterday.",
      },
      {
        dayLabel: "Thursday",
        focusRegions: ["Hips", "Hamstrings", "Core"],
        primaryStretch: {
          name: "Single-leg hamstring reach",
          why: "Takes tension out of the back line so hinging and bracing feel sharper.",
        },
        secondaryStretches: [
          {
            name: "90/90 hip stretch",
            why: "Improves rotation and keeps the hips from feeling blocked.",
          },
        ],
        note: "A little more flexibility gives your whole movement a calmer kind of confidence.",
      },
      {
        dayLabel: "Friday",
        focusRegions: ["Shoulders", "Thoracic spine", "Neck"],
        primaryStretch: {
          name: "Wall slide with lift-off",
          why: "Improves overhead range and stops the upper back from feeling pinned down.",
        },
        secondaryStretches: [
          {
            name: "Threaded shoulder opener",
            why: "Smooths out the back of the shoulder after pressing and rows.",
          },
          {
            name: "Thoracic extension over bench",
            why: "Lets the chest lift and the upper spine move again.",
          },
        ],
        note: "Open shoulders and easy posture quietly make the strong look more unfair.",
      },
      {
        dayLabel: "Saturday",
        focusRegions: ["Back", "Hips", "Flexibility"],
        primaryStretch: {
          name: "Long forward fold",
          why: "Downshifts the whole back line and gives you a simple full-body reset.",
        },
        secondaryStretches: [
          {
            name: "Child's pose reach",
            why: "Loosens the low back and lats without turning into a program.",
          },
          {
            name: "Cossack squat hold",
            why: "Keeps side-to-side hip range from getting rusty.",
          },
        ],
        note: "Stay loose, stay sharp, and let the movement feel a little too easy.",
      },
    ],
    favoriteExerciseIds: ["incline-dumbbell-press-day1", "lat-pulldown-day2", "squat-day3"],
  },
];

const sessions: WorkoutSession[] = [];

const weeklySummaries: Record<"natasha" | "joshua", WeeklySummary> = {
  natasha: { userId: "natasha", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Glutes", consistencyLabel: "Building rhythm with a clean start" },
  joshua: { userId: "joshua", workoutsCompleted: 0, totalSets: 0, totalVolume: 0, personalBests: 0, mostTrainedMuscleGroup: "Chest", consistencyLabel: "Building rhythm with a clean start" },
};

const rawExerciseLibrary: ExerciseLibraryItem[] = [
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
  { id: "abductor-machine", name: "Abductor Machine", muscleGroup: "Glutes", equipment: "Machine", cues: ["Drive knees out under control and hold the outer-glute squeeze.", "Keep torso stable and stay in the glutes."] },
  { id: "leg-press-high-feet", name: "Leg Press High Foot Placement", muscleGroup: "Glutes", equipment: "Machine", cues: ["Place feet high and slightly wider to bias glutes.", "Control the bottom and drive evenly."] },
  { id: "single-arm-lat-pulldown", name: "Single-Arm Lat Pulldown", muscleGroup: "Back", equipment: "Cable", cues: ["Pull elbow into hip for lat focus.", "Stay tall and avoid shrugging."] },
  { id: "assisted-pull-up", name: "Assisted Pull-Up", muscleGroup: "Back", equipment: "Machine", cues: ["Use assistance to stay in the target rep range.", "Lead with elbows and chest tall."] },
  { id: "machine-lat-pullover", name: "Machine Lat Pullover", muscleGroup: "Back", equipment: "Machine", cues: ["Drive through the elbows and keep lats loaded.", "Smooth stretch and squeeze."] },
  { id: "machine-row", name: "Machine Row", muscleGroup: "Back", equipment: "Machine", cues: ["Drive elbows back without shrugging.", "Pause the squeeze through the mid-back."] },
  { id: "seated-cable-row", name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable", cues: ["Pull to lower ribs and keep chest high.", "Pause the squeeze before returning."] },
  { id: "incline-machine-press", name: "Incline Machine Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Stable upper-chest pressing with a controlled path.", "Keep shoulders down and press smoothly."] },
  { id: "flat-machine-press", name: "Flat Machine Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Press through palms and keep tension on the chest.", "Control the negative."] },
  { id: "plate-loaded-chest-press", name: "Plate-Loaded Chest Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Use a stable pressing path and chase a full chest squeeze.", "Control the lowering phase and keep shoulders packed."] },
  { id: "smith-flat-press", name: "Smith Machine Flat Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Fixed bar path for stable heavy pressing.", "Keep elbows under wrists."] },
  { id: "smith-incline-press", name: "Smith Incline Press", muscleGroup: "Chest", equipment: "Machine", cues: ["Bias upper chest with a fixed incline pressing path.", "Keep the elbows stacked and press cleanly."] },
  { id: "plate-loaded-shoulder-press", name: "Plate-Loaded Shoulder Press", muscleGroup: "Shoulders", equipment: "Machine", cues: ["Stable shoulder press with clean overload.", "Keep ribcage stacked and press straight up."] },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", muscleGroup: "Shoulders", equipment: "Machine", cues: ["Use the fixed path to load the delts cleanly.", "Keep the shoulders down and press smoothly."] },
  { id: "seated-dumbbell-lateral-raise", name: "Seated Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell", cues: ["Use a shorter range and steady tempo.", "Lead with elbows, not wrists."] },
  { id: "cable-front-raise", name: "Cable Front Raise", muscleGroup: "Shoulders", equipment: "Cable", cues: ["Keep shoulders down and lift smoothly.", "Use light load and clean control."] },
  { id: "walking-lunge-alt", name: "Walking Lunge", muscleGroup: "Legs", equipment: "Dumbbell", cues: ["Take long controlled steps and stay balanced.", "Drive through the front foot."] },
  { id: "goblet-squat", name: "Goblet Squat", muscleGroup: "Quads", equipment: "Dumbbell", cues: ["Keep torso tall and heels grounded.", "Use a controlled descent."] },
  { id: "pendulum-squat", name: "Pendulum Squat", muscleGroup: "Quads", equipment: "Machine", cues: ["Stay deep and keep pressure through mid-foot.", "Let the machine support the path."] },
  { id: "seated-hamstring-curl", name: "Seated Hamstring Curl", muscleGroup: "Hamstrings", equipment: "Machine", cues: ["Pull hard and control the stretch.", "Keep hips planted."] },
  { id: "dumbbell-step-up", name: "Dumbbell Step-Up", muscleGroup: "Legs", equipment: "Dumbbell", cues: ["Drive through the working leg only.", "Stand tall at the top."] },
  { id: "rope-pushdown", name: "Rope Pushdown", muscleGroup: "Triceps", equipment: "Cable", cues: ["Split rope at the bottom and lock out cleanly.", "Keep elbows pinned."] },
  { id: "single-arm-cable-extension", name: "Single-Arm Cable Extension", muscleGroup: "Triceps", equipment: "Cable", cues: ["Use full triceps stretch and lockout.", "Keep shoulder quiet."] },
  { id: "overhead-rope-extension", name: "Overhead Rope Extension", muscleGroup: "Triceps", equipment: "Cable", cues: ["Stay long through the stretch and finish with clean elbow extension.", "Keep the upper arm stable."] },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", muscleGroup: "Biceps", equipment: "Barbell", cues: ["Curl smoothly and lower under control.", "Keep elbows tucked."] },
  { id: "cable-curl", name: "Cable Curl", muscleGroup: "Biceps", equipment: "Cable", cues: ["Constant tension through the full range.", "Stand tall and avoid swinging."] },
  { id: "captains-chair-knee-raise", name: "Captain's Chair Knee Raise", muscleGroup: "Core", equipment: "Bodyweight", cues: ["Curl pelvis up, not just knees.", "Move slowly and avoid swinging."] },
  { id: "dead-bug", name: "Dead Bug", muscleGroup: "Core", equipment: "Bodyweight", cues: ["Keep ribs down and lower back flat.", "Slow, controlled limbs."] },
  { id: "bike-erg-sprint", name: "Bike Erg Sprint", muscleGroup: "Full Body", equipment: "Machine", cues: ["Keep output sharp and short.", "Recover fully between efforts."] },
  { id: "battle-rope-slam", name: "Battle Rope Slam", muscleGroup: "Full Body", equipment: "Cable", cues: ["Stay athletic and slam with intent.", "Keep core braced."] },
  { id: "standing-calf-raise", name: "Standing Calf Raise", muscleGroup: "Legs", equipment: "Machine", cues: ["Pause hard at the top and lower slowly.", "Keep pressure through the big toe and ball of the foot."] },
  { id: "45-degree-back-extension", name: "45 Degree Back Extension", muscleGroup: "Back", equipment: "Machine", cues: ["Move slowly and keep tension through glutes and lower back.", "Do not throw the torso through the top."] },
];

const exerciseLibrary: ExerciseLibraryItem[] = buildCanonicalExerciseLibrary(rawExerciseLibrary);

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
    longestStreaks: {
      natasha: 0,
      joshua: 0,
    },
    rivalryArchive: [],
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

