import type { DailyMobilityPrompt, MobilityPromptTemplate, StretchCompletion, UserId } from "@/lib/types";

type MobilityFocusKey = "hips" | "lower-back" | "splits" | "arch" | "pelvic-health";

const THIRTY_DAY_ROTATION: MobilityFocusKey[] = [
  "hips",
  "lower-back",
  "splits",
  "arch",
  "hips",
  "lower-back",
  "pelvic-health",
  "splits",
  "hips",
  "arch",
  "lower-back",
  "splits",
  "hips",
  "pelvic-health",
  "arch",
  "lower-back",
  "hips",
  "splits",
  "pelvic-health",
  "arch",
  "lower-back",
  "hips",
  "splits",
  "arch",
  "pelvic-health",
  "lower-back",
  "hips",
  "splits",
  "arch",
  "lower-back",
];

const noteLinesByFocus: Record<MobilityFocusKey, string[]> = {
  hips: [
    "Open the hips first. Everything else moves better after that.",
    "Loose hips make the whole lower body feel smoother.",
    "This is your clean movement work today.",
    "Open the hips and let the lower back stop fighting.",
  ],
  "lower-back": [
    "Less lower-back tension means cleaner movement everywhere else.",
    "This is a reset day for the lower back and the line around it.",
    "Take pressure out of the lower back before it builds up.",
    "A calmer lower back usually makes the whole body feel better.",
  ],
  splits: [
    "This is your split-range work today.",
    "Open the adductors, hamstrings, and hip flexors before anything else.",
    "Longer range here helps both flexibility and shape.",
    "This is the range that opens cleaner lines through the legs and hips.",
  ],
  arch: [
    "This is the arch line today: lower back, hips, and front-body opening.",
    "Open the front of the hips and let the spine move easier.",
    "This supports a cleaner arch and smoother hip extension.",
    "Think arch line, not just one stretch.",
  ],
  "pelvic-health": [
    "This is your intimate-mobility day: hips, inner thighs, and lower back.",
    "Keep the hips and inner thighs soft so the lower body feels freer.",
    "This focus is about pelvic comfort and smoother lower-body movement.",
    "Open the inner line today and let the lower back stay easy.",
  ],
};

const mobilityTemplatesByProfile: Record<UserId, Record<MobilityFocusKey, MobilityPromptTemplate[]>> = {
  joshua: {
    hips: [
      {
        key: "joshua-hips-1",
        focusRegions: ["Hips", "Hip Flexors", "Lower Back"],
        primaryStretch: {
          name: "Deep hip flexor stretch",
          why: "Opens the front of the hips and takes pressure off the lower back.",
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
        focusRegions: ["Hips", "Hamstrings", "Adductors"],
        primaryStretch: {
          name: "World's greatest stretch",
          why: "Opens the hips and hamstrings together so the lower body moves cleaner.",
        },
        secondaryStretches: [
          {
            name: "Cossack hold",
            why: "Builds side-to-side range through the adductors and hips.",
          },
          {
            name: "Deep squat pry",
            why: "Opens hips and ankles together.",
          },
        ],
        note: "",
      },
    ],
    "lower-back": [
      {
        key: "joshua-lower-back-1",
        focusRegions: ["Lower Back", "Glutes", "Spine"],
        primaryStretch: {
          name: "Child's pose reach",
          why: "Takes tension out of the lower back and lets the spine settle.",
        },
        secondaryStretches: [
          {
            name: "Cat-cow",
            why: "Restores easier movement through the spine.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-lower-back-2",
        focusRegions: ["Lower Back", "Hips", "Hamstrings"],
        primaryStretch: {
          name: "Knees-to-chest hold",
          why: "Relieves lower-back stiffness and lets the hips relax.",
        },
        secondaryStretches: [
          {
            name: "Supine twist",
            why: "Adds a soft rotational reset through the trunk.",
          },
        ],
        note: "",
      },
    ],
    splits: [
      {
        key: "joshua-splits-1",
        focusRegions: ["Adductors", "Hamstrings", "Hip Flexors"],
        primaryStretch: {
          name: "Seated straddle fold",
          why: "Builds split-range by opening the inner thighs and hamstrings together.",
        },
        secondaryStretches: [
          {
            name: "Long forward fold",
            why: "Lengthens the whole back line.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-splits-2",
        focusRegions: ["Hamstrings", "Adductors", "Calves"],
        primaryStretch: {
          name: "Single-leg hamstring reach",
          why: "Improves back-line range without turning this into a full mobility block.",
        },
        secondaryStretches: [
          {
            name: "Standing calf stretch",
            why: "Keeps the whole line opening down the leg.",
          },
        ],
        note: "",
      },
    ],
    arch: [
      {
        key: "joshua-arch-1",
        focusRegions: ["Hip Flexors", "Abs", "Lower Back"],
        primaryStretch: {
          name: "Cobra press-up",
          why: "Opens the front of the body so the lower back does not stay compressed.",
        },
        secondaryStretches: [
          {
            name: "Couch stretch",
            why: "Loosens the hip flexors for cleaner extension through the front line.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-arch-2",
        focusRegions: ["Thoracic Spine", "Hip Flexors", "Lower Back"],
        primaryStretch: {
          name: "Sphinx hold",
          why: "Supports a cleaner arch line by opening the front body without forcing it.",
        },
        secondaryStretches: [
          {
            name: "Open-book rotation",
            why: "Helps the upper spine extend and rotate more easily.",
          },
        ],
        note: "",
      },
    ],
    "pelvic-health": [
      {
        key: "joshua-pelvic-1",
        focusRegions: ["Inner Thighs", "Hips", "Lower Back"],
        primaryStretch: {
          name: "Butterfly hold",
          why: "Opens the inner thighs and hips so the lower body feels freer.",
        },
        secondaryStretches: [
          {
            name: "Figure-four glute stretch",
            why: "Softens hip tension around the pelvis and lower back.",
          },
        ],
        note: "",
      },
      {
        key: "joshua-pelvic-2",
        focusRegions: ["Adductors", "Hip Flexors", "Lower Back"],
        primaryStretch: {
          name: "Half-kneeling groin stretch",
          why: "Supports pelvic comfort by opening the inner line of the hips.",
        },
        secondaryStretches: [
          {
            name: "Supine adductor stretch",
            why: "Lets the inner thighs lengthen without strain.",
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
        focusRegions: ["Hips", "Hip Flexors", "Glutes"],
        primaryStretch: {
          name: "Couch stretch",
          why: "Opens the front of the hips so the lower body moves cleaner and smoother.",
        },
        secondaryStretches: [
          {
            name: "Figure-four glute stretch",
            why: "Softens glute and hip tension so the hips move with less pull.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-hips-2",
        focusRegions: ["Hips", "Adductors", "Glutes"],
        primaryStretch: {
          name: "90/90 hip stretch",
          why: "Improves hip rotation so glute work and everyday movement feel less sticky.",
        },
        secondaryStretches: [
          {
            name: "Deep squat pry",
            why: "Opens hips and ankles together for cleaner lower-body range.",
          },
        ],
        note: "",
      },
    ],
    "lower-back": [
      {
        key: "natasha-lower-back-1",
        focusRegions: ["Lower Back", "Hip Flexors", "Glutes"],
        primaryStretch: {
          name: "Child's pose reach",
          why: "Relieves lower-back tension and makes the whole back line feel less compressed.",
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
        focusRegions: ["Lower Back", "Hamstrings", "Hips"],
        primaryStretch: {
          name: "Knees-to-chest hold",
          why: "Takes pressure out of the lower back and helps the hips settle.",
        },
        secondaryStretches: [
          {
            name: "Cat-cow",
            why: "Restores easier spinal movement and control.",
          },
        ],
        note: "",
      },
    ],
    splits: [
      {
        key: "natasha-splits-1",
        focusRegions: ["Adductors", "Hamstrings", "Hip Flexors"],
        primaryStretch: {
          name: "Seated straddle fold",
          why: "Builds split-range by opening the inner thighs and back line together.",
        },
        secondaryStretches: [
          {
            name: "Forward fold hang",
            why: "Lets the whole back line soften and lengthen.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-splits-2",
        focusRegions: ["Adductors", "Hip Flexors", "Calves"],
        primaryStretch: {
          name: "Half split hold",
          why: "Supports front-split range without turning it into a big session.",
        },
        secondaryStretches: [
          {
            name: "Standing calf stretch",
            why: "Keeps the whole line opening down the leg.",
          },
        ],
        note: "",
      },
    ],
    arch: [
      {
        key: "natasha-arch-1",
        focusRegions: ["Lower Back", "Hip Flexors", "Glutes"],
        primaryStretch: {
          name: "Sphinx hold",
          why: "Supports a cleaner arch line by opening the front hips while easing the lower back.",
        },
        secondaryStretches: [
          {
            name: "Couch stretch",
            why: "Loosens the hip flexors so hip extension feels freer.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-arch-2",
        focusRegions: ["Thoracic Spine", "Hip Flexors", "Lower Back"],
        primaryStretch: {
          name: "Cobra press-up",
          why: "Opens the front body and helps the arch line feel smoother instead of jammed.",
        },
        secondaryStretches: [
          {
            name: "Open-book rotation",
            why: "Keeps the upper spine moving so the arch is not all lower-back pressure.",
          },
        ],
        note: "",
      },
    ],
    "pelvic-health": [
      {
        key: "natasha-pelvic-1",
        focusRegions: ["Inner Thighs", "Hips", "Lower Back"],
        primaryStretch: {
          name: "Butterfly hold",
          why: "Supports pelvic comfort by opening the inner thighs and hips without strain.",
        },
        secondaryStretches: [
          {
            name: "Figure-four glute stretch",
            why: "Reduces deep hip tension that can pull on the lower back.",
          },
        ],
        note: "",
      },
      {
        key: "natasha-pelvic-2",
        focusRegions: ["Adductors", "Hip Flexors", "Lower Back"],
        primaryStretch: {
          name: "Half-kneeling groin stretch",
          why: "Keeps the inner line of the hips open for better pelvic comfort and smoother movement.",
        },
        secondaryStretches: [
          {
            name: "Supine adductor stretch",
            why: "Lets the inner thighs lengthen without forcing range.",
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
  return (diffDays % THIRTY_DAY_ROTATION.length) + 1;
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

function getNoteLine(focusKey: MobilityFocusKey, rotationDay: number) {
  const pool = noteLinesByFocus[focusKey];
  return pool[(rotationDay - 1) % pool.length] ?? pool[0];
}

export function selectDailyMobilityPrompt(userId: UserId, date = new Date()): DailyMobilityPrompt {
  const rotationDay = getRotationDay(date);
  const focusKey = getPromptFocusKey(rotationDay);
  const template = getPromptTemplate(userId, rotationDay);

  return {
    ...template,
    secondaryStretches: template.secondaryStretches?.slice(0, 2) ?? [],
    note: getNoteLine(focusKey, rotationDay),
    ctaLabel: "Start 30s",
    rotationDay,
  };
}

export function isMobilityCompletedToday(completions: StretchCompletion[], date = new Date()) {
  const todayKey = getLocalDateKey(date);
  return completions.some((entry) => getLocalDateKey(new Date(entry.date)) === todayKey);
}
