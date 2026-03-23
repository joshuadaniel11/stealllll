import type { DailyMobilityPrompt, MobilityPromptTemplate, StretchCompletion, UserId } from "@/lib/types";

type MobilityFocusKey = "hips" | "lower-back" | "flexibility" | "core" | "light-flow";

const THIRTY_DAY_ROTATION: MobilityFocusKey[] = [
  "hips",
  "lower-back",
  "flexibility",
  "core",
  "hips",
  "lower-back",
  "light-flow",
  "core",
  "hips",
  "flexibility",
  "lower-back",
  "core",
  "hips",
  "light-flow",
  "flexibility",
  "lower-back",
  "core",
  "hips",
  "flexibility",
  "light-flow",
  "lower-back",
  "core",
  "hips",
  "flexibility",
  "lower-back",
  "light-flow",
  "core",
  "hips",
  "flexibility",
  "lower-back",
];

const ctaLabel = "Start Stretch";

const noteLinesByFocus: Record<MobilityFocusKey, string[]> = {
  core: [
    "That control… yeah, it shows.",
    "Hold it there. That’s where it builds.",
    "This kind of control is noticeable.",
    "Keep it steady. Don’t rush it.",
    "Stronger here changes everything.",
    "That control? Yeah… it shows.",
    "Stay clean through the hold.",
    "Quiet control always reads better.",
    "That brace is getting sharper.",
    "Smooth control changes the whole look.",
  ],
  hips: [
    "Move like this more often… you’ll feel it.",
    "That range is opening up nicely.",
    "Yeah… that’s getting smoother.",
    "Let it loosen. Don’t force it.",
    "That movement’s getting cleaner.",
    "Move like that more often.",
    "Those hips are starting to move right.",
    "That glide is getting easier.",
    "Stay soft and let it open.",
    "The smooth version always lands better.",
  ],
  flexibility: [
    "You’re getting more flexible… keep that.",
    "That stretch is hitting right.",
    "Don’t rush it… sit in it.",
    "That range is improving.",
    "Yeah… that’s opening up.",
    "That range… don’t lose it.",
    "You’re getting smoother… noticeable.",
    "That line is opening cleanly.",
    "Stay in it a little longer.",
    "That looseness is starting to show.",
  ],
  "lower-back": [
    "Less tension… better movement.",
    "That release feels better already.",
    "Keep that slow and controlled.",
    "You’ll notice this later.",
    "That’s easing up nicely.",
    "Yeah… that’s a good one.",
    "Let the tension drop out of it.",
    "That reset is landing well.",
    "Keep the spine long and easy.",
    "That release is making everything move cleaner.",
  ],
  "light-flow": [
    "Keep it easy and let the body soften.",
    "A smoother body always reads better.",
    "Move slow. Let the tension go.",
    "That easy range is worth keeping.",
    "Light flow today. Clean movement tomorrow.",
    "Stay loose. It shows.",
    "This is the kind of reset that helps everything.",
    "A little softness goes a long way.",
    "Let it feel unhurried today.",
    "Easy control still counts.",
  ],
};

const mobilityTemplatesByProfile: Record<UserId, Record<MobilityFocusKey, MobilityPromptTemplate[]>> = {
  joshua: {
    hips: [
      {
        key: "joshua-hips-1",
        focusRegions: ["Hips", "Control"],
        primaryStretch: {
          name: "Deep hip flexor stretch",
          why: "Opens the front of the hips so your lower body moves cleaner and stronger.",
        },
        secondaryStretches: [
          {
            name: "90/90 hip rotation",
            why: "Improves hip rotation so movement feels less blocked.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-hips-2",
        focusRegions: ["Hips", "Hamstrings"],
        primaryStretch: {
          name: "World’s greatest stretch",
          why: "Loosens hips and stride so you stop moving like everything is still tight.",
        },
        secondaryStretches: [
          {
            name: "Cossack hold",
            why: "Builds range through the hips with a little more control.",
          },
          {
            name: "Deep squat pry",
            why: "Opens the hips and ankles together.",
          },
        ],
        note: "",
      },
    ],
    "lower-back": [
      {
        key: "joshua-lower-back-1",
        focusRegions: ["Lower Back", "Spine"],
        primaryStretch: {
          name: "Child’s pose reach",
          why: "Takes tension out of the low back and gives the spine an easy reset.",
        },
        secondaryStretches: [
          {
            name: "Cat-cow",
            why: "Restores smooth spinal movement without overthinking it.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-lower-back-2",
        focusRegions: ["Lower Back", "Hips"],
        primaryStretch: {
          name: "Knees-to-chest hold",
          why: "Relieves stiffness through the lower back and lets the hips relax.",
        },
        secondaryStretches: [
          {
            name: "Supine twist",
            why: "Adds a soft rotational reset through the spine.",
          },
        ],
        note: "",
      },
    ],
    flexibility: [
      {
        key: "joshua-flexibility-1",
        focusRegions: ["Hamstrings", "Flexibility"],
        primaryStretch: {
          name: "Long forward fold",
          why: "Lengthens the back line so hinges and setup positions feel cleaner.",
        },
        secondaryStretches: [
          {
            name: "Single-leg hamstring reach",
            why: "Improves side-to-side flexibility and control.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-flexibility-2",
        focusRegions: ["Flexibility", "Hips", "Hamstrings"],
        primaryStretch: {
          name: "Seated straddle fold",
          why: "Opens adductors and hamstrings for smoother range through the hips.",
        },
        secondaryStretches: [
          {
            name: "Standing calf stretch",
            why: "Helps the whole back line open more evenly.",
          },
        ],
        note: "",
      },
    ],
    core: [
      {
        key: "joshua-core-1",
        focusRegions: ["Core", "Control"],
        primaryStretch: {
          name: "Dead bug hold",
          why: "Sharpens trunk control so bracing feels cleaner through everything else.",
        },
        secondaryStretches: [
          {
            name: "Bear plank breathing",
            why: "Builds deeper control through the midline without a lot of time.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-core-2",
        focusRegions: ["Core", "Lower Back"],
        primaryStretch: {
          name: "Open-book rotation",
          why: "Unwinds the trunk and improves control through the spine and ribs.",
        },
        secondaryStretches: [
          {
            name: "Hollow body tuck hold",
            why: "Keeps your core switched on while the torso stays controlled.",
          },
        ],
        note: "",
      },
    ],
    "light-flow": [
      {
        key: "joshua-flow-1",
        focusRegions: ["Hips", "Lower Back", "Flexibility"],
        primaryStretch: {
          name: "Deep squat hold",
          why: "Gives ankles, hips, and lower back one clean reset when everything feels stiff.",
        },
        secondaryStretches: [
          {
            name: "Forward fold hang",
            why: "Lets the whole back line settle down.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-flow-2",
        focusRegions: ["Movement", "Control"],
        primaryStretch: {
          name: "Slow mobility flow",
          why: "Keeps range and coordination feeling easy without turning this into a workout.",
        },
        secondaryStretches: [
          {
            name: "Hip opener reach",
            why: "Restores smooth movement through the hips and trunk.",
          },
        ],
        note: "",
      },
    ],
  },
  natasha: {
    hips: [
      {
        key: "natasha-hips-1",
        focusRegions: ["Hips", "Control"],
        primaryStretch: {
          name: "Couch stretch",
          why: "Opens the front of the hips so your lower-body movement feels cleaner and smoother.",
        },
        secondaryStretches: [
          {
            name: "Figure-four glute stretch",
            why: "Softens hip tension and gives your lower body a freer line.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-hips-2",
        focusRegions: ["Hips", "Glutes", "Control"],
        primaryStretch: {
          name: "90/90 hip stretch",
          why: "Improves hip rotation so glute work and daily movement feel less sticky.",
        },
        secondaryStretches: [
          {
            name: "Deep squat pry",
            why: "Opens the hips and ankles together for cleaner movement.",
          },
        ],
        note: "",
      },
    ],
    "lower-back": [
      {
        key: "natasha-lower-back-1",
        focusRegions: ["Lower Back", "Flexibility"],
        primaryStretch: {
          name: "Child’s pose reach",
          why: "Relieves lower-back tension and makes the whole body feel less compressed.",
        },
        secondaryStretches: [
          {
            name: "Supine twist",
            why: "Adds a softer spinal reset without much effort.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-lower-back-2",
        focusRegions: ["Lower Back", "Core"],
        primaryStretch: {
          name: "Knees-to-chest hold",
          why: "Takes pressure out of the low back and helps movement feel calmer.",
        },
        secondaryStretches: [
          {
            name: "Cat-cow",
            why: "Restores easy spinal movement and control.",
          },
        ],
        note: "",
      },
    ],
    flexibility: [
      {
        key: "natasha-flexibility-1",
        focusRegions: ["Hamstrings", "Flexibility"],
        primaryStretch: {
          name: "Seated straddle fold",
          why: "Opens the back line so your hips and legs move with a softer, cleaner feel.",
        },
        secondaryStretches: [
          {
            name: "Forward fold hang",
            why: "Lets the whole back line settle and lengthen.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-flexibility-2",
        focusRegions: ["Flexibility", "Hips", "Hamstrings"],
        primaryStretch: {
          name: "Single-leg hamstring reach",
          why: "Improves flexibility and control without turning it into a big session.",
        },
        secondaryStretches: [
          {
            name: "Standing calf stretch",
            why: "Keeps the back line opening all the way down.",
          },
        ],
        note: "",
      },
    ],
    core: [
      {
        key: "natasha-core-1",
        focusRegions: ["Core", "Control"],
        primaryStretch: {
          name: "Dead bug hold",
          why: "Builds trunk control so your movement feels tighter and more intentional.",
        },
        secondaryStretches: [
          {
            name: "Side-plank reach",
            why: "Adds oblique control with a lighter feel.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-core-2",
        focusRegions: ["Core", "Lower Back", "Control"],
        primaryStretch: {
          name: "Open-book rotation",
          why: "Unwinds the torso and keeps your midsection moving with more ease.",
        },
        secondaryStretches: [
          {
            name: "Bear plank breathing",
            why: "Sharpens deep control through the core without noise.",
          },
        ],
        note: "",
      },
    ],
    "light-flow": [
      {
        key: "natasha-flow-1",
        focusRegions: ["Hips", "Lower Back", "Flexibility"],
        primaryStretch: {
          name: "Deep squat hold",
          why: "Resets hips, spine, and flexibility all at once when you want a lighter reset.",
        },
        secondaryStretches: [
          {
            name: "Child’s pose reach",
            why: "Keeps the whole line feeling soft and open.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-flow-2",
        focusRegions: ["Movement", "Control"],
        primaryStretch: {
          name: "Slow mobility flow",
          why: "Keeps your body moving well without turning this into a program.",
        },
        secondaryStretches: [
          {
            name: "Hip opener reach",
            why: "Restores a smoother feel through the lower body and waist.",
          },
        ],
        note: "",
      },
    ],
  },
};

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getRotationDay(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const startKey = new Date(startOfYear.getFullYear(), startOfYear.getMonth(), startOfYear.getDate()).getTime();
  const todayKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((todayKey - startKey) / 86400000);
  return (diffDays % 30) + 1;
}

function getPromptFocusKey(rotationDay: number) {
  return THIRTY_DAY_ROTATION[(rotationDay - 1) % THIRTY_DAY_ROTATION.length] ?? "hips";
}

function getPromptTemplate(userId: UserId, rotationDay: number): MobilityPromptTemplate {
  const focusKey = getPromptFocusKey(rotationDay);
  const promptPool = mobilityTemplatesByProfile[userId][focusKey];
  const templateIndex = Math.floor((rotationDay - 1) / 7) % promptPool.length;
  return promptPool[templateIndex] ?? promptPool[0];
}

function getNoteLine(userId: UserId, focusKey: MobilityFocusKey, rotationDay: number) {
  const pool = noteLinesByFocus[focusKey];
  const profileOffset = userId === "natasha" ? 3 : 0;
  return pool[(rotationDay + profileOffset) % pool.length] ?? pool[0];
}

export function selectDailyMobilityPrompt(
  userId: UserId,
  date = new Date(),
): DailyMobilityPrompt {
  const rotationDay = getRotationDay(date);
  const focusKey = getPromptFocusKey(rotationDay);
  const template = getPromptTemplate(userId, rotationDay);

  return {
    ...template,
    secondaryStretches: template.secondaryStretches?.slice(0, 2) ?? [],
    note: getNoteLine(userId, focusKey, rotationDay),
    ctaLabel: "Start 30s",
    rotationDay,
  };
}

export function isMobilityCompletedToday(completions: StretchCompletion[], date = new Date()) {
  const todayKey = getLocalDateKey(date);
  return completions.some((entry) => getLocalDateKey(new Date(entry.date)) === todayKey);
}
