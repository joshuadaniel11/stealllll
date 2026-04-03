import type {
  ExerciseLibraryItem,
  ExerciseTemplate,
  MuscleCeilingResponse,
  MuscleCeilingState,
  MuscleGroup,
  MuscleKey,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/lib/types";
import {
  buildCanonicalExerciseLibrary,
  getExerciseMuscleProfile,
  normalizeExerciseName,
} from "@/lib/exercise-data";
import { getExerciseSwapOptions } from "@/lib/exercise-swaps";
import type { WeddingPhaseProfile } from "@/lib/wedding-date";

export type TrainingLoadGroupId =
  | "chest"
  | "shoulders"
  | "back"
  | "core"
  | "glutes"
  | "arms"
  | "legs";

export type TrainingLoadZone =
  | "upperChest"
  | "midChest"
  | "frontDelts"
  | "sideDelts"
  | "triceps"
  | "upperTraps"
  | "lats"
  | "midBack"
  | "rearDelts"
  | "biceps"
  | "forearms"
  | "upperAbs"
  | "lowerAbs"
  | "obliques"
  | "lowerBack"
  | "quads"
  | "hamstrings"
  | "upperGlutes"
  | "gluteMax"
  | "sideGlutes"
  | "hipFlexors"
  | "calves"
  | "adductors";

export type TrainingLoadMetric = {
  id: TrainingLoadZone;
  label: string;
  group: TrainingLoadGroupId;
  color: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  contributors: Array<{
    exerciseName: string;
    effectiveSets: number;
  }>;
};

export type TrainingLoadGroup = {
  id: TrainingLoadGroupId;
  label: string;
  color: string;
  targetSets: number;
  effectiveSets: number;
  percentage: number;
  overload: boolean;
  zones: TrainingLoadZone[];
};

export type WeekWindow = {
  start: Date;
  end: Date;
  key: string;
  label: string;
};

export type WeeklyTrainingLoad = {
  week: WeekWindow;
  metrics: TrainingLoadMetric[];
  groups: TrainingLoadGroup[];
  topZones: TrainingLoadMetric[];
  activeDays: Set<string>;
  recentLoad: RecentLoadProfile;
  summary: TrainingLoadSummary;
};

export type TrainingLoadSummary = {
  mostTrained: TrainingLoadMetric[];
  needsWork: TrainingLoadMetric[];
  suggestedNextFocus: NextWorkoutFocus;
  lowActivity: boolean;
};

export type NextWorkoutFocus = {
  zoneIds: TrainingLoadZone[];
  labels: string[];
  text: string;
};

export type SuggestedWorkoutDestination = {
  workoutId: string;
  workoutName: string;
  matchedZoneIds: TrainingLoadZone[];
  matchedLabels: string[];
  helperText: string;
  isFallback: boolean;
};

export type SuggestedFocusSessionExercise = {
  exerciseId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: TrainingLoadZone[];
  secondaryMuscles: TrainingLoadZone[];
  sets: number | null;
  repRange: string | null;
  suggestedRepTarget?: number | null;
  note?: string;
  matchedZoneIds: TrainingLoadZone[];
  matchedLabels: string[];
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
};

export type SuggestedFocusSession = {
  focusText: string;
  exercises: SuggestedFocusSessionExercise[];
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
  targetLabels: string[];
  totalSets: number;
  estimatedDurationMinutes: number;
  helperText: string;
  actionLabel: string;
  canStartDirectly: boolean;
  isFallback: boolean;
  ceilingPreviewLine?: string | null;
  ceilingAppliedResponses?: Partial<Record<MuscleGroup, MuscleCeilingResponse>>;
};

type LiftReadySignalInput = {
  readinessLevel: "early" | "developing" | "building" | "strong" | "ready";
  trend: "rising" | "steady" | "slipping";
};

type NatashaPriorityLockInput = {
  lockedPrimary: string[];
  lockedSecondary: string[];
  minimumFrequency: Record<string, number>;
  phaseOverrides: {
    noNewExercises?: boolean;
    noHeavyLoading?: boolean;
    repRangeBias?: "high";
    lightOnly?: boolean;
    noSoreness?: boolean;
    avoidSwelling?: boolean;
  };
} | null;

type NatashaWaistProtocolInput = {
  active: boolean;
  obliquePriority: "low" | "medium" | "high";
  targetMovementTypes: string[];
  setsPerSession: number;
  avoidMovements: string[];
} | null;

type NatashaBackRevealInput = {
  active: boolean;
  weeksRemaining: number;
  backPriorityLevel: "elevated" | "high" | "peak";
  targetMuscles: string[];
  movementBias: string[];
  volumeAddition: number;
} | null;

type NatashaWaistMovementType =
  | "cable_oblique"
  | "rotational"
  | "anti_rotation"
  | "lateral_flexion"
  | "core_vacuum"
  | "light_rotational";

type NatashaBackRevealMovementType =
  | "lat_pulldown"
  | "cable_row"
  | "single_arm_row"
  | "face_pull"
  | "rear_delt"
  | "band_pull_apart"
  | "light_lat_pulldown";

const HEAVY_COMPOUND_KEYWORDS = [
  "squat",
  "barbell row",
  "romanian deadlift",
  "deadlift",
  "hip thrust",
  "walking lunge",
  "reverse lunge",
  "bulgarian split squat",
  "shoulder press",
  "press",
] as const;

export type RecentLoadProfile = {
  zonePenalties: Record<TrainingLoadZone, number>;
  recentSessionsConsidered: number;
};

type FocusExerciseCandidate = {
  key: string;
  exerciseId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number | null;
  repRange: string | null;
  note?: string;
  matchedZoneIds: TrainingLoadZone[];
  totalFocusScore: number;
  recoveryAdjustedScore: number;
  strongestZoneScore: number;
  sourceWorkoutId: string | null;
  sourceWorkoutName: string | null;
  preferredWorkout: boolean;
  favorite: boolean;
  phasePriorityScore: number;
  phaseAdjustedScore: number;
  stableOrder: number;
};

function getPhasePriorityScore(matchedZoneIds: TrainingLoadZone[], phaseProfile?: WeddingPhaseProfile | null) {
  if (!phaseProfile?.priorityMuscles.length) {
    return 0;
  }

  return matchedZoneIds.reduce((score, zoneId) => {
    const priorityIndex = phaseProfile.priorityMuscles.indexOf(zoneId);
    return priorityIndex === -1 ? score : score + (phaseProfile.priorityMuscles.length - priorityIndex);
  }, 0);
}

function isHeavyCompoundExercise(name: string) {
  const normalized = name.toLowerCase();
  return HEAVY_COMPOUND_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function adjustRepRangeForPhase(repRange: string | null, phaseProfile?: WeddingPhaseProfile | null) {
  if (!repRange || !phaseProfile) {
    return repRange;
  }

  if (phaseProfile.currentPhase === "wedding_week") {
    return "10-15";
  }

  if (phaseProfile.intensityBias === "definition") {
    return "10-15";
  }

  if (phaseProfile.intensityBias === "maintenance") {
    return "8-12";
  }

  return repRange;
}

function isNatashaBackOrGluteExercise(exercise: FocusExerciseCandidate) {
  if (exercise.muscleGroup === "Glutes" || exercise.muscleGroup === "Back") {
    return true;
  }

  return Object.entries(
    getExerciseMuscleContribution({
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
    }),
  ).some(([zoneId, weight]) =>
    weight > 0 &&
    ["upperGlutes", "gluteMax", "sideGlutes", "lats", "midBack", "upperTraps"].includes(zoneId),
  );
}

function isNatashaHighDomsRiskExercise(name: string) {
  const normalized = normalizeExerciseName(name);
  return (
    normalized.includes("hip thrust") ||
    normalized.includes("romanian deadlift") ||
    normalized.includes("bulgarian split squat") ||
    normalized.includes("sumo deadlift")
  );
}

function shouldAvoidNatashaExercise(
  exercise: FocusExerciseCandidate,
  priorityLock: NatashaPriorityLockInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  if (!priorityLock || !phaseProfile) {
    return false;
  }

  const normalized = normalizeExerciseName(exercise.name);
  const isHighDoms = isNatashaHighDomsRiskExercise(normalized);
  const isBackOrGlute = isNatashaBackOrGluteExercise(exercise);

  if (phaseProfile.currentPhase === "wedding_week" && priorityLock.phaseOverrides.lightOnly) {
    if (isHighDoms) {
      return true;
    }
    if (exercise.muscleGroup === "Glutes") {
      return !(
        normalized.includes("cable") ||
        normalized.includes("band") ||
        normalized.includes("abductor") ||
        normalized.includes("bridge")
      );
    }
    if (exercise.muscleGroup === "Back") {
      return normalized.includes("barbell row") || normalized.includes("deadlift");
    }
  }

  if (phaseProfile.currentPhase === "peak" && priorityLock.phaseOverrides.noHeavyLoading && isBackOrGlute) {
    return isHighDoms || isHeavyCompoundExercise(normalized);
  }

  return false;
}

function adjustRepRangeForNatashaPriorityLock(
  exercise: FocusExerciseCandidate,
  repRange: string | null,
  priorityLock: NatashaPriorityLockInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  if (!repRange || !priorityLock || !phaseProfile) {
    return repRange;
  }

  const shouldBiasHigh =
    (phaseProfile.currentPhase === "peak" && priorityLock.phaseOverrides.repRangeBias === "high") ||
    phaseProfile.currentPhase === "wedding_week";

  if (shouldBiasHigh && isNatashaBackOrGluteExercise(exercise)) {
    return "15-20";
  }

  return repRange;
}

function getNatashaPriorityPreviewLine(
  phase: WeddingPhaseProfile["currentPhase"],
  hasLockedPrimary: boolean,
) {
  if (!hasLockedPrimary) {
    return null;
  }

  switch (phase) {
    case "build":
      return "Glutes lead today. Build the base.";
    case "define":
      return "Shape work. Glutes, back, and waist.";
    case "peak":
      return "Definition session. Light, controlled, clean.";
    case "wedding_week":
      return "One last session. Keep it light and beautiful.";
    default:
      return null;
  }
}

const NATASHA_WAIST_MOVEMENT_PRIORITY: Array<{
  name: string;
  movementType: NatashaWaistMovementType;
  note: string;
}> = [
  {
    name: "Cable Oblique Crunch",
    movementType: "cable_oblique",
    note: "Slow squeeze through the waist. No heaving.",
  },
  {
    name: "Pallof Press",
    movementType: "anti_rotation",
    note: "Brace hard and resist the pull. Stay quiet through the ribs.",
  },
  {
    name: "Side Plank Reach",
    movementType: "lateral_flexion",
    note: "Stay long through the waist and move with control.",
  },
  {
    name: "Standing Cable Rotation",
    movementType: "rotational",
    note: "Rotate cleanly from the trunk. No rushing.",
  },
  {
    name: "Cable Woodchop",
    movementType: "light_rotational",
    note: "Light rotation. Smooth and controlled.",
  },
  {
    name: "Core Vacuum Hold",
    movementType: "core_vacuum",
    note: "Exhale fully and hold the shape without strain.",
  },
];

const NATASHA_BACK_REVEAL_MOVEMENTS: Array<{
  name: string;
  movementType: NatashaBackRevealMovementType;
  note: string;
}> = [
  {
    name: "Lat Pulldown",
    movementType: "lat_pulldown",
    note: "Control the lower and feel the lat sweep through the whole rep.",
  },
  {
    name: "Straight-Arm Cable Pulldown",
    movementType: "lat_pulldown",
    note: "Keep arms long and sweep through the lats without loading it heavy.",
  },
  {
    name: "Single-Arm Lat Pulldown",
    movementType: "single_arm_row",
    note: "Pull elbow into hip and keep the line clean.",
  },
  {
    name: "Seated Cable Row",
    movementType: "cable_row",
    note: "High chest, upper-back squeeze, slow return.",
  },
  {
    name: "Face Pull",
    movementType: "face_pull",
    note: "Pull wide and high for upper-back detail.",
  },
  {
    name: "Rear Delt Cable Fly",
    movementType: "rear_delt",
    note: "Light weight, open wide, stay in the rear delts.",
  },
  {
    name: "Band Pull-Apart",
    movementType: "band_pull_apart",
    note: "Light tension, long line, no fatigue chase.",
  },
];

function getWaistProtocolPreviewLine(phase: WeddingPhaseProfile["currentPhase"], active: boolean) {
  if (!active) {
    return null;
  }

  switch (phase) {
    case "define":
      return "Waist work included. Controlled and focused.";
    case "peak":
      return "Core definition included. Light and precise.";
    case "wedding_week":
      return "Light core. That's all it needs.";
    default:
      return null;
  }
}

function getBackRevealPreviewLine(backReveal: NatashaBackRevealInput) {
  if (!backReveal?.active) {
    return null;
  }

  switch (backReveal.backPriorityLevel) {
    case "elevated":
      return "Back included today. Building the sweep.";
    case "high":
      return "Back work in every session now. Definition is the goal.";
    case "peak":
      return "Light back work. The sweep is already there.";
    default:
      return null;
  }
}

function getBackRevealRepRange(backReveal: NatashaBackRevealInput) {
  switch (backReveal?.backPriorityLevel) {
    case "elevated":
      return "10-15";
    case "high":
      return "12-20";
    case "peak":
      return "15-25";
    default:
      return "10-15";
  }
}

function getBackRevealSets(backReveal: NatashaBackRevealInput) {
  switch (backReveal?.backPriorityLevel) {
    case "elevated":
      return 1;
    case "high":
      return 2;
    case "peak":
      return 1;
    default:
      return 1;
  }
}

function getNatashaWaistProtocolRepRange(phase: WeddingPhaseProfile["currentPhase"]) {
  switch (phase) {
    case "define":
      return "15-20";
    case "peak":
      return "15-25";
    case "wedding_week":
      return "20-25";
    default:
      return "15-20";
  }
}

function getNatashaWaistProtocolMovement(
  targetMovementTypes: string[],
  exerciseLibrary: ExerciseLibraryItem[],
  selectedSlice: FocusExerciseCandidate[],
) {
  const canonicalLibrary = buildCanonicalExerciseLibrary(exerciseLibrary);

  for (const option of NATASHA_WAIST_MOVEMENT_PRIORITY) {
    if (!targetMovementTypes.includes(option.movementType)) {
      continue;
    }
    if (selectedSlice.some((exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(option.name))) {
      continue;
    }

    const libraryItem = canonicalLibrary.find((exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(option.name));
    if (!libraryItem) {
      continue;
    }

    return {
      libraryItem,
      movementType: option.movementType,
      note: option.note,
    };
  }

  return null;
}

function isNatashaWaistProtocolExercise(name: string) {
  return NATASHA_WAIST_MOVEMENT_PRIORITY.some(
    (option) => normalizeExerciseName(option.name) === normalizeExerciseName(name),
  );
}

function buildNatashaWaistProtocolExercise(
  selection: NonNullable<ReturnType<typeof getNatashaWaistProtocolMovement>>,
  phaseProfile: WeddingPhaseProfile,
  waistProtocol: NatashaWaistProtocolInput,
): FocusExerciseCandidate {
  const repRange = getNatashaWaistProtocolRepRange(phaseProfile.currentPhase);
  const sets = Math.max(1, waistProtocol?.setsPerSession ?? 2);
  const contribution = getExerciseMuscleContribution({
    exerciseName: selection.libraryItem.name,
    muscleGroup: selection.libraryItem.muscleGroup,
  });
  const matchedZoneIds = Object.entries(contribution)
    .filter(([, weight]) => weight > 0)
    .map(([zoneId]) => zoneId as TrainingLoadZone);

  return {
    key: `waist-${selection.libraryItem.id}`,
    exerciseId: selection.libraryItem.id,
    name: selection.libraryItem.name,
    muscleGroup: selection.libraryItem.muscleGroup,
    sets,
    repRange,
    note: selection.note,
    matchedZoneIds,
    totalFocusScore: 0,
    recoveryAdjustedScore: 0,
    strongestZoneScore: 0,
    sourceWorkoutId: null,
    sourceWorkoutName: null,
    preferredWorkout: false,
    favorite: false,
    phasePriorityScore: 0,
    phaseAdjustedScore: 0,
    stableOrder: 90000,
  };
}

function weaveNatashaWaistProtocolIntoSession(
  selectedSlice: FocusExerciseCandidate[],
  exerciseLibrary: ExerciseLibraryItem[],
  waistProtocol: NatashaWaistProtocolInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  if (!waistProtocol?.active || !phaseProfile) {
    return { exercises: selectedSlice, added: false };
  }

  const existingCoreIndex = selectedSlice.findIndex(
    (exercise) => exercise.muscleGroup === "Core" || isNatashaWaistProtocolExercise(exercise.name),
  );

  const adjusted = selectedSlice.map((exercise) => ({ ...exercise }));

  if (existingCoreIndex !== -1) {
    adjusted[existingCoreIndex] = {
      ...adjusted[existingCoreIndex],
      sets: Math.max(1, waistProtocol.setsPerSession),
      repRange: getNatashaWaistProtocolRepRange(phaseProfile.currentPhase),
      note: adjusted[existingCoreIndex].note ?? "Control the trunk and keep the reps clean.",
    };
    return { exercises: adjusted, added: true };
  }

  const movement = getNatashaWaistProtocolMovement(waistProtocol.targetMovementTypes, exerciseLibrary, adjusted);
  if (!movement) {
    return { exercises: adjusted, added: false };
  }

  const protocolExercise = buildNatashaWaistProtocolExercise(movement, phaseProfile, waistProtocol);
  const lockedPrimaryIndex = adjusted.reduce((bestIndex, exercise, index) => {
    const contribution = getExerciseMuscleContribution({
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
    });
    const isPrimary = (contribution.gluteMax ?? 0) > 0 || (contribution.upperGlutes ?? 0) > 0 || (contribution.sideGlutes ?? 0) > 0;
    return isPrimary ? index : bestIndex;
  }, -1);
  const insertIndex = Math.max(1, Math.min(adjusted.length - 1, lockedPrimaryIndex + 1));
  adjusted.splice(insertIndex, 0, protocolExercise);

  return { exercises: adjusted, added: true };
}

function adjustRepRangeForNatashaWaistProtocol(
  exercise: FocusExerciseCandidate,
  repRange: string | null,
  waistProtocol: NatashaWaistProtocolInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  if (!waistProtocol?.active || !phaseProfile || !repRange) {
    return repRange;
  }

  if (exercise.muscleGroup === "Core" && isNatashaWaistProtocolExercise(exercise.name)) {
    return getNatashaWaistProtocolRepRange(phaseProfile.currentPhase);
  }

  return repRange;
}

function adjustSetsForNatashaWaistProtocol(
  exercise: FocusExerciseCandidate,
  sets: number | null,
  waistProtocol: NatashaWaistProtocolInput,
) {
  if (!waistProtocol?.active || sets == null) {
    return sets;
  }

  if (exercise.muscleGroup === "Core" && isNatashaWaistProtocolExercise(exercise.name)) {
    return Math.max(1, waistProtocol.setsPerSession);
  }

  return sets;
}

function isNatashaBackPrimarySession(selectedSlice: FocusExerciseCandidate[], focus: NextWorkoutFocus) {
  if (focus.zoneIds.some((zoneId) => zoneId === "lats" || zoneId === "midBack" || zoneId === "upperTraps")) {
    return true;
  }

  const backCount = selectedSlice.filter((exercise) => exercise.muscleGroup === "Back").length;
  return backCount >= 2;
}

function getNatashaBackRevealMovement(
  backReveal: NatashaBackRevealInput,
  exerciseLibrary: ExerciseLibraryItem[],
  selectedSlice: FocusExerciseCandidate[],
) {
  if (!backReveal?.active) {
    return null;
  }

  const canonicalLibrary = buildCanonicalExerciseLibrary(exerciseLibrary);
  for (const option of NATASHA_BACK_REVEAL_MOVEMENTS) {
    if (!backReveal.movementBias.includes(option.movementType)) {
      continue;
    }
    if (selectedSlice.some((exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(option.name))) {
      continue;
    }

    const item = canonicalLibrary.find((exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(option.name));
    if (!item) {
      continue;
    }

    return { item, note: option.note };
  }

  return null;
}

function weaveNatashaBackRevealIntoSession(
  selectedSlice: FocusExerciseCandidate[],
  focus: NextWorkoutFocus,
  exerciseLibrary: ExerciseLibraryItem[],
  backReveal: NatashaBackRevealInput,
) {
  if (!backReveal?.active || isNatashaBackPrimarySession(selectedSlice, focus)) {
    return { exercises: selectedSlice, added: false };
  }

  const adjusted = selectedSlice.map((exercise) => ({ ...exercise }));
  const movement = getNatashaBackRevealMovement(backReveal, exerciseLibrary, adjusted);
  if (!movement) {
    return { exercises: adjusted, added: false };
  }

  const contribution = getExerciseMuscleContribution({
    exerciseName: movement.item.name,
    muscleGroup: movement.item.muscleGroup,
  });
  const matchedZoneIds = Object.entries(contribution)
    .filter(([, weight]) => weight > 0)
    .map(([zoneId]) => zoneId as TrainingLoadZone);
  const insertIndex = Math.max(1, adjusted.length - 1);
  adjusted.splice(insertIndex, 0, {
    key: `back-reveal-${movement.item.id}`,
    exerciseId: movement.item.id,
    name: movement.item.name,
    muscleGroup: movement.item.muscleGroup,
    sets: getBackRevealSets(backReveal),
    repRange: getBackRevealRepRange(backReveal),
    note: movement.note,
    matchedZoneIds,
    totalFocusScore: 0,
    recoveryAdjustedScore: 0,
    strongestZoneScore: 0,
    sourceWorkoutId: null,
    sourceWorkoutName: null,
    preferredWorkout: false,
    favorite: false,
    phasePriorityScore: 0,
    phaseAdjustedScore: 0,
    stableOrder: 91000,
  });

  return { exercises: adjusted, added: true };
}

function adjustRepRangeForNatashaBackReveal(
  exercise: FocusExerciseCandidate,
  repRange: string | null,
  backReveal: NatashaBackRevealInput,
) {
  if (!backReveal?.active || !repRange) {
    return repRange;
  }

  if (NATASHA_BACK_REVEAL_MOVEMENTS.some((option) => normalizeExerciseName(option.name) === normalizeExerciseName(exercise.name))) {
    return getBackRevealRepRange(backReveal);
  }

  return repRange;
}

function adjustSetsForNatashaBackReveal(
  exercise: FocusExerciseCandidate,
  sets: number | null,
  backReveal: NatashaBackRevealInput,
) {
  if (!backReveal?.active || sets == null) {
    return sets;
  }

  if (NATASHA_BACK_REVEAL_MOVEMENTS.some((option) => normalizeExerciseName(option.name) === normalizeExerciseName(exercise.name))) {
    return Math.max(1, getBackRevealSets(backReveal));
  }

  return sets;
}

function matchesNatashaSecondary(exercise: FocusExerciseCandidate, secondaryZones: string[]) {
  return Object.entries(
    getExerciseMuscleContribution({
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
    }),
  ).some(([zoneId, weight]) => weight > 0 && secondaryZones.includes(zoneId));
}

function findNatashaReplacement(
  exercise: FocusExerciseCandidate,
  candidates: FocusExerciseCandidate[],
  selectedSlice: FocusExerciseCandidate[],
  priorityLock: NatashaPriorityLockInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  return (
    candidates.find((candidate) => {
      if (selectedSlice.some((selected) => normalizeExerciseName(selected.name) === normalizeExerciseName(candidate.name))) {
        return false;
      }
      if (
        candidate.muscleGroup !== exercise.muscleGroup &&
        !candidate.matchedZoneIds.some((zoneId) => exercise.matchedZoneIds.includes(zoneId))
      ) {
        return false;
      }
      return !shouldAvoidNatashaExercise(candidate, priorityLock, phaseProfile);
    }) ?? null
  );
}

function enforceNatashaPrioritySessionShape(
  selectedSlice: FocusExerciseCandidate[],
  candidates: FocusExerciseCandidate[],
  priorityLock: NatashaPriorityLockInput,
  phaseProfile?: WeddingPhaseProfile | null,
) {
  if (!priorityLock || !phaseProfile) {
    return selectedSlice;
  }

  const adjusted = selectedSlice.map((exercise) => ({ ...exercise }));

  for (let index = adjusted.length - 1; index >= 0; index -= 1) {
    const exercise = adjusted[index];
    if (!shouldAvoidNatashaExercise(exercise, priorityLock, phaseProfile)) {
      continue;
    }

    const replacement = findNatashaReplacement(exercise, candidates, adjusted, priorityLock, phaseProfile);
    if (replacement) {
      adjusted[index] = { ...replacement };
      continue;
    }

    if (phaseProfile.currentPhase === "wedding_week") {
      adjusted.splice(index, 1);
    }
  }

  if (phaseProfile.currentPhase === "define") {
    const hasRequiredSecondary = adjusted.some((exercise) => matchesNatashaSecondary(exercise, ["lats", "obliques"]));

    if (!hasRequiredSecondary) {
      const secondaryCandidate = candidates.find((candidate) => {
        if (adjusted.some((selected) => normalizeExerciseName(selected.name) === normalizeExerciseName(candidate.name))) {
          return false;
        }
        if (!matchesNatashaSecondary(candidate, ["lats", "obliques"])) {
          return false;
        }
        return !shouldAvoidNatashaExercise(candidate, priorityLock, phaseProfile);
      });

      if (secondaryCandidate) {
        const replaceIndex = adjusted.findIndex(
          (exercise) => !exercise.matchedZoneIds.some((zoneId) => priorityLock.lockedPrimary.includes(zoneId)),
        );
        adjusted[replaceIndex === -1 ? adjusted.length - 1 : replaceIndex] = { ...secondaryCandidate };
      }
    }
  }

  return adjusted;
}

function getSuggestedRepTarget(repRange: string | null) {
  if (!repRange) {
    return null;
  }

  const match = repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) {
    const parsed = Number.parseInt(repRange, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return Number.parseInt(match[1], 10);
}

function shiftRepRangeForCeiling(repRange: string | null) {
  if (!repRange) {
    return "8-12";
  }

  const match = repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  const lower = match ? Number.parseInt(match[1], 10) : Number.parseInt(repRange, 10);

  if (Number.isNaN(lower)) {
    return "8-12";
  }

  if (lower >= 12) {
    return "6-8";
  }

  if (lower >= 8) {
    return "12-15";
  }

  return "8-12";
}

function getCeilingPreviewLine(
  userId: UserId,
  muscleGroup: MuscleGroup,
  response: MuscleCeilingResponse,
) {
  const muscleLabel = muscleGroup.toLowerCase();
  const copy = {
    joshua: {
      technique_swap: `Mixing up the approach on ${muscleLabel} today.`,
      rep_range_shift: `Shifting the rep range on ${muscleLabel}.`,
      rest: `${muscleGroup} is lighter today. Intentional.`,
    },
    natasha: {
      technique_swap: `Different angle on ${muscleLabel} this session.`,
      rep_range_shift: `Changing the rep range on ${muscleLabel} today.`,
      rest: `Easier on ${muscleLabel} today. By design.`,
    },
  } as const;

  return copy[userId][response];
}

function getLiftReadyPriorityBoost(
  userId: UserId,
  matchedZoneIds: TrainingLoadZone[],
  muscleGroup: MuscleGroup,
  liftReady?: LiftReadySignalInput | null,
) {
  if (userId !== "joshua" || !liftReady) {
    return 0;
  }

  if (liftReady.readinessLevel === "early" || liftReady.readinessLevel === "developing") {
    return matchedZoneIds.some((zoneId) => zoneId === "upperChest" || zoneId === "midChest") ? 4 : 0;
  }

  if (liftReady.readinessLevel === "building") {
    if (matchedZoneIds.some((zoneId) => zoneId === "upperChest" || zoneId === "midChest")) {
      return 2.5;
    }
    if (matchedZoneIds.some((zoneId) => zoneId === "sideDelts" || zoneId === "frontDelts") || muscleGroup === "Shoulders") {
      return 2.5;
    }
  }

  if (liftReady.readinessLevel === "strong" || liftReady.readinessLevel === "ready") {
    return muscleGroup === "Chest" || muscleGroup === "Shoulders" ? 1.5 : 0;
  }

  return 0;
}

function adjustSetsForPhase(sets: number | null, exerciseName: string, phaseProfile?: WeddingPhaseProfile | null) {
  if (sets === null || !phaseProfile) {
    return sets;
  }

  let adjusted = Math.max(1, Math.round(sets * phaseProfile.volumeModifier));

  if ((phaseProfile.currentPhase === "peak" || phaseProfile.currentPhase === "wedding_week") && isHeavyCompoundExercise(exerciseName)) {
    adjusted = Math.max(1, Math.round(adjusted * 0.8));
  }

  return adjusted;
}

export const TRAINING_LOAD_VIEW_ZONES: Record<"front" | "back", TrainingLoadZone[]> = {
  front: [
    "upperChest",
    "midChest",
    "frontDelts",
    "sideDelts",
    "triceps",
    "biceps",
    "forearms",
    "upperAbs",
    "lowerAbs",
    "obliques",
    "hipFlexors",
    "sideGlutes",
    "adductors",
    "quads",
    "calves",
  ],
  back: [
    "rearDelts",
    "upperTraps",
    "lats",
    "midBack",
    "lowerBack",
    "triceps",
    "biceps",
    "forearms",
    "upperGlutes",
    "gluteMax",
    "sideGlutes",
    "hamstrings",
    "calves",
  ],
};

const PROFILE_PRIORITY_ZONES: Record<UserId, TrainingLoadZone[]> = {
  joshua: [
    "upperChest",
    "midChest",
    "sideDelts",
    "rearDelts",
    "lats",
    "upperAbs",
    "lowerAbs",
    "biceps",
    "triceps",
  ],
  natasha: [
    "upperGlutes",
    "gluteMax",
    "sideGlutes",
    "lats",
    "midBack",
    "lowerAbs",
    "obliques",
    "sideDelts",
  ],
};

export function getProfilePriorityZones(userId: UserId) {
  return PROFILE_PRIORITY_ZONES[userId];
}

const MOST_TRAINED_MIN_PERCENTAGE = 18;
const MOST_TRAINED_MIN_EFFECTIVE_SETS = 1.5;

type ZoneContribution = Partial<Record<TrainingLoadZone, number>>;

type ExerciseLike = {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  primaryMuscles?: MuscleKey[];
  secondaryMuscles?: MuscleKey[];
};

type CalendarCell = {
  key: string;
  dayLabel: string;
  dayNumber: number;
  completed: boolean;
  isToday: boolean;
  joshuaCompleted: boolean;
  natashaCompleted: boolean;
  joshuaWorkouts: string[];
  natashaWorkouts: string[];
};

type CalendarRow = {
  label: string;
  isCurrentWeek: boolean;
  days: CalendarCell[];
};

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export const TRAINING_LOAD_GROUP_META: Record<TrainingLoadGroupId, { label: string; color: string }> = {
  chest: { label: "Chest", color: "#ff8f73" },
  shoulders: { label: "Shoulders", color: "#ffb45b" },
  back: { label: "Back", color: "#5a9bff" },
  core: { label: "Core", color: "#33d1a0" },
  glutes: { label: "Glutes", color: "#8b6aff" },
  arms: { label: "Arms", color: "#e8cf62" },
  legs: { label: "Legs", color: "#77cf73" },
};

export const TRAINING_LOAD_ZONE_META: Record<
  TrainingLoadZone,
  { label: string; group: TrainingLoadGroupId; color: string; targetSets: number }
> = {
  upperChest: { label: "Upper chest", group: "chest", color: "#ff8e72", targetSets: 5 },
  midChest: { label: "Mid chest", group: "chest", color: "#ffa57a", targetSets: 7 },
  frontDelts: { label: "Front delts", group: "shoulders", color: "#ff9f58", targetSets: 5 },
  sideDelts: { label: "Side delts", group: "shoulders", color: "#ffbc63", targetSets: 7 },
  triceps: { label: "Triceps", group: "arms", color: "#f5be67", targetSets: 6 },
  upperTraps: { label: "Upper traps", group: "back", color: "#55c0ff", targetSets: 5 },
  lats: { label: "Lats", group: "back", color: "#589bff", targetSets: 8 },
  midBack: { label: "Mid back", group: "back", color: "#4caef6", targetSets: 8 },
  rearDelts: { label: "Rear delts", group: "shoulders", color: "#f0d15c", targetSets: 7 },
  biceps: { label: "Biceps", group: "arms", color: "#ebd35f", targetSets: 6 },
  forearms: { label: "Forearms", group: "arms", color: "#f2db7e", targetSets: 4 },
  upperAbs: { label: "Upper abs", group: "core", color: "#39d4aa", targetSets: 5 },
  lowerAbs: { label: "Lower abs", group: "core", color: "#4be0b6", targetSets: 5 },
  obliques: { label: "Obliques", group: "core", color: "#69e3c6", targetSets: 4 },
  lowerBack: { label: "Lower back", group: "back", color: "#53d3d0", targetSets: 5 },
  quads: { label: "Quads", group: "legs", color: "#7bd26f", targetSets: 8 },
  hamstrings: { label: "Hamstrings", group: "legs", color: "#61c37d", targetSets: 6 },
  upperGlutes: { label: "Upper glutes", group: "glutes", color: "#9877ff", targetSets: 6 },
  gluteMax: { label: "Glute max", group: "glutes", color: "#8264ff", targetSets: 8 },
  sideGlutes: { label: "Side glutes", group: "glutes", color: "#ac88ff", targetSets: 5 },
  hipFlexors: { label: "Hip flexors", group: "legs", color: "#84cf90", targetSets: 3 },
  calves: { label: "Calves", group: "legs", color: "#95db72", targetSets: 4 },
  adductors: { label: "Adductors", group: "legs", color: "#a0d77b", targetSets: 4 },
};

const TARGET_DISPLAY_LABELS: Record<TrainingLoadZone, string> = {
  upperChest: "Upper chest",
  midChest: "Mid chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  triceps: "Triceps",
  upperTraps: "Upper traps",
  lats: "Lats",
  midBack: "Mid back",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  forearms: "Forearms",
  upperAbs: "Upper abs",
  lowerAbs: "Lower abs",
  obliques: "Obliques",
  lowerBack: "Lower back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  upperGlutes: "Glute shelf",
  gluteMax: "Lower glute",
  sideGlutes: "Side glute",
  hipFlexors: "Hip flexors",
  calves: "Calves",
  adductors: "Adductors",
};

const USER_TARGET_OVERRIDES: Record<UserId, Partial<Record<TrainingLoadZone, number>>> = {
  joshua: {
    upperChest: 6,
    midChest: 8,
    frontDelts: 5,
    sideDelts: 7,
    triceps: 7,
    upperTraps: 5,
    lats: 8,
    midBack: 8,
    rearDelts: 6,
    biceps: 7,
    forearms: 4,
    upperAbs: 4,
    lowerAbs: 4,
    obliques: 3,
    lowerBack: 5,
    quads: 6,
    hamstrings: 5,
    upperGlutes: 4,
    gluteMax: 5,
    sideGlutes: 3,
    hipFlexors: 2,
    calves: 4,
    adductors: 3,
  },
  natasha: {
    upperChest: 4,
    midChest: 5,
    frontDelts: 4,
    sideDelts: 6,
    triceps: 5,
    upperTraps: 5,
    lats: 8,
    midBack: 7,
    rearDelts: 6,
    biceps: 5,
    forearms: 3,
    upperAbs: 4,
    lowerAbs: 4,
    obliques: 4,
    lowerBack: 4,
    quads: 7,
    hamstrings: 6,
    upperGlutes: 8,
    gluteMax: 10,
    sideGlutes: 7,
    hipFlexors: 5,
    calves: 4,
    adductors: 5,
  },
};

function toLocalDayKey(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function getTargetSets(userId: UserId, zone: TrainingLoadZone) {
  return USER_TARGET_OVERRIDES[userId]?.[zone] ?? TRAINING_LOAD_ZONE_META[zone].targetSets;
}

function getZoneLabel(zone: TrainingLoadZone) {
  return TRAINING_LOAD_ZONE_META[zone].label;
}

export function getTargetDisplayLabel(zone: TrainingLoadZone) {
  return TARGET_DISPLAY_LABELS[zone] ?? getZoneLabel(zone);
}

export function getCurrentWeekWindow(referenceDate = new Date()): WeekWindow {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    key: toLocalDayKey(start),
    label: `${new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(start)} to ${new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(end)}`,
  };
}

function getCompletedSetCount(exercise: WorkoutSessionExercise) {
  return exercise.sets.filter((set) => set.completed).length;
}

function buildContributionFromMuscles(
  primaryMuscles: MuscleKey[],
  secondaryMuscles: MuscleKey[],
): ZoneContribution {
  const contribution: ZoneContribution = {};

  for (const muscle of primaryMuscles) {
    contribution[muscle] = Math.max(contribution[muscle] ?? 0, 1);
  }

  for (const muscle of secondaryMuscles) {
    contribution[muscle] = Math.max(contribution[muscle] ?? 0, 0.5);
  }

  return contribution;
}

export function getExerciseMuscleContribution(exercise: ExerciseLike): ZoneContribution {
  const profile =
    exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length
      ? {
          primaryMuscles: exercise.primaryMuscles ?? [],
          secondaryMuscles: exercise.secondaryMuscles ?? [],
        }
      : getExerciseMuscleProfile(exercise.exerciseName, exercise.muscleGroup);

  return buildContributionFromMuscles(profile.primaryMuscles, profile.secondaryMuscles);
}

export function getExerciseTargetLabels(exercise: ExerciseLike, limit = 2) {
  return Object.entries(getExerciseMuscleContribution(exercise))
    .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
    .slice(0, limit)
    .map(([zoneId]) => getTargetDisplayLabel(zoneId as TrainingLoadZone));
}

export function getExerciseTargetSummary(exercise: ExerciseLike, limit = 2) {
  const labels = getExerciseTargetLabels(exercise, limit);
  return labels.length ? labels.join(" • ") : exercise.muscleGroup;
}

function getTemplateExerciseContribution(exercise: ExerciseTemplate) {
  return getExerciseMuscleContribution({
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
  });
}

function scoreContributionForFocus(contribution: ZoneContribution, focusZoneIds: TrainingLoadZone[]) {
  const zoneScores = focusZoneIds.reduce<Record<TrainingLoadZone, number>>((accumulator, zoneId) => {
    accumulator[zoneId] = contribution[zoneId] ?? 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);

  const matchedZoneIds = focusZoneIds.filter((zoneId) => zoneScores[zoneId] > 0);

  return {
    zoneScores,
    matchedZoneIds,
    totalFocusScore: focusZoneIds.reduce((sum, zoneId) => sum + zoneScores[zoneId], 0),
    strongestZoneScore: Math.max(0, ...focusZoneIds.map((zoneId) => zoneScores[zoneId])),
  };
}

function buildEmptyZoneRecord() {
  return Object.keys(TRAINING_LOAD_ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
}

function getRecentSessionWeight(performedAt: string, referenceDate: Date) {
  const hoursSince = Math.max(0, (referenceDate.getTime() - new Date(performedAt).getTime()) / 36e5);

  if (hoursSince <= 24) {
    return 1;
  }
  if (hoursSince <= 48) {
    return 0.72;
  }
  if (hoursSince <= 72) {
    return 0.5;
  }
  return 0.32;
}

function getRecentLoadProfile(
  userId: UserId,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
): RecentLoadProfile {
  const zoneLoads = buildEmptyZoneRecord();
  const sortedSessions = [...sessions].sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
  const recentSessions = sortedSessions.filter((session, index) => {
    const hoursSince = Math.max(0, (referenceDate.getTime() - new Date(session.performedAt).getTime()) / 36e5);
    return hoursSince <= 72 || index < 2;
  });

  for (const session of recentSessions) {
    const weight = getRecentSessionWeight(session.performedAt, referenceDate);
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }
      const contribution = getExerciseMuscleContribution(exercise);
      for (const [zoneId, zoneWeight] of Object.entries(contribution) as Array<[TrainingLoadZone, number]>) {
        zoneLoads[zoneId] += completedSets * zoneWeight * weight;
      }
    }
  }

  const zonePenalties = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<
    Record<TrainingLoadZone, number>
  >((accumulator, zoneId) => {
    const targetSets = getTargetSets(userId, zoneId);
    accumulator[zoneId] = Math.min(1, zoneLoads[zoneId] / Math.max(2, targetSets * 0.8));
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);

  return {
    zonePenalties,
    recentSessionsConsidered: recentSessions.length,
  };
}

function roundDurationToFive(minutes: number) {
  return Math.max(15, Math.round(minutes / 5) * 5);
}

function estimateSuggestedSessionDuration(exercises: FocusExerciseCandidate[], sourceWorkout: WorkoutPlanDay | null) {
  const templateSets = exercises.reduce((sum, exercise) => sum + (exercise.sets ?? 0), 0);

  if (sourceWorkout?.durationMinutes) {
    const sourceSetCount = sourceWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (sourceSetCount > 0 && templateSets > 0) {
      const scaledDuration = (templateSets / sourceSetCount) * sourceWorkout.durationMinutes;
      return roundDurationToFive(Math.max(18, scaledDuration));
    }
  }

  return roundDurationToFive(templateSets * 2.6 + exercises.length * 1.5);
}

export function getCurrentWeekSessions(sessions: WorkoutSession[], referenceDate = new Date()) {
  const week = getCurrentWeekWindow(referenceDate);
  return sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= week.start && performedAt <= week.end;
  });
}

function buildEmptyZoneTotals() {
  return Object.keys(TRAINING_LOAD_ZONE_META).reduce<Record<TrainingLoadZone, number>>((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = 0;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
}

function buildZoneMetrics(
  userId: UserId,
  totals: Record<TrainingLoadZone, number>,
  contributorTotals: Record<TrainingLoadZone, Record<string, number>>,
) {
  return (Object.entries(TRAINING_LOAD_ZONE_META) as Array<
    [TrainingLoadZone, (typeof TRAINING_LOAD_ZONE_META)[TrainingLoadZone]]
  >).map(([id, meta]) => {
    const effectiveSets = roundToSingleDecimal(totals[id]);
    const targetSets = getTargetSets(userId, id);
    const rawPercentage = targetSets ? (effectiveSets / targetSets) * 100 : 0;
    const contributors = Object.entries(contributorTotals[id] ?? {})
      .map(([exerciseName, sets]) => ({
        exerciseName,
        effectiveSets: roundToSingleDecimal(sets),
      }))
      .sort((a, b) => b.effectiveSets - a.effectiveSets)
      .slice(0, 4);

    return {
      id,
      label: meta.label,
      group: meta.group,
      color: meta.color,
      targetSets,
      effectiveSets,
      percentage: Math.min(100, Math.round(rawPercentage)),
      overload: rawPercentage > 100,
      contributors,
    };
  });
}

function buildGroupMetrics(metrics: TrainingLoadMetric[]) {
  return (Object.entries(TRAINING_LOAD_GROUP_META) as Array<
    [TrainingLoadGroupId, (typeof TRAINING_LOAD_GROUP_META)[TrainingLoadGroupId]]
  >).map(([id, meta]) => {
    const zoneMetrics = metrics.filter((metric) => metric.group === id);
    const effectiveSets = roundToSingleDecimal(zoneMetrics.reduce((sum, metric) => sum + metric.effectiveSets, 0));
    const targetSets = zoneMetrics.reduce((sum, metric) => sum + metric.targetSets, 0);
    const rawPercentage = targetSets ? (effectiveSets / targetSets) * 100 : 0;

    return {
      id,
      label: meta.label,
      color: meta.color,
      targetSets,
      effectiveSets,
      percentage: Math.min(100, Math.round(rawPercentage)),
      overload: rawPercentage > 100,
      zones: zoneMetrics.map((metric) => metric.id),
    };
  });
}

function getPriorityRank(userId: UserId, zone: TrainingLoadZone) {
  const index = PROFILE_PRIORITY_ZONES[userId].indexOf(zone);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getAveragePenaltyForZones(zoneIds: TrainingLoadZone[], recentLoad?: RecentLoadProfile) {
  if (!zoneIds.length || !recentLoad) {
    return 0;
  }

  return (
    zoneIds.reduce((sum, zoneId) => sum + (recentLoad.zonePenalties[zoneId] ?? 0), 0) /
    zoneIds.length
  );
}

function getFocusHelperText(
  focusLabels: string[],
  matchedZoneLabels: string[],
  isFallback: boolean,
) {
  const focusText = focusLabels.join(" + ");
  const matchedText = matchedZoneLabels.join(" + ");

  if (isFallback) {
    return `Closest real workout for ${focusText}`;
  }

  if (matchedText && matchedText !== focusText) {
    return `Best match for ${matchedText}`;
  }

  return `Best match for ${focusText}`;
}

function buildSuggestedNextFocus(
  userId: UserId,
  metrics: TrainingLoadMetric[],
  lowActivity: boolean,
  recentLoad: RecentLoadProfile,
): NextWorkoutFocus {
  const priorityZones = PROFILE_PRIORITY_ZONES[userId];
  const priorityMetrics = priorityZones
    .map((zone) => metrics.find((metric) => metric.id === zone))
    .filter((metric): metric is TrainingLoadMetric => Boolean(metric));

  const pickZones = (pool: TrainingLoadMetric[]) =>
    [...pool]
      .sort((a, b) => {
        const aAdjustedPercentage = a.percentage + recentLoad.zonePenalties[a.id] * 22;
        const bAdjustedPercentage = b.percentage + recentLoad.zonePenalties[b.id] * 22;

        if (aAdjustedPercentage !== bAdjustedPercentage) {
          return aAdjustedPercentage - bAdjustedPercentage;
        }
        if (a.effectiveSets !== b.effectiveSets) {
          return a.effectiveSets - b.effectiveSets;
        }
        if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
          return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
        }
        return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
      })
      .slice(0, 2);

  const selectedMetrics = lowActivity
    ? [...priorityMetrics.slice(0, Math.min(5, priorityMetrics.length))]
        .sort((a, b) => {
          if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
            return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
          }
          return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
        })
        .slice(0, 2)
    : (() => {
        const lagging = priorityMetrics.filter((metric) => metric.percentage < 80);
        if (lagging.length >= 2) {
          return pickZones(lagging);
        }

        const belowTarget = priorityMetrics.filter((metric) => metric.percentage < 100);
        if (belowTarget.length >= 2) {
          return pickZones(belowTarget);
        }

        return pickZones(priorityMetrics);
      })();

  const labels = selectedMetrics.map((metric) => getZoneLabel(metric.id));

  return {
    zoneIds: selectedMetrics.map((metric) => metric.id),
    labels,
    text: labels.join(" + "),
  };
}

export function getSuggestedWorkoutDestination(
  userId: UserId,
  workoutPlan: WorkoutPlanDay[],
  focus: NextWorkoutFocus,
  recentLoad?: RecentLoadProfile,
): SuggestedWorkoutDestination | null {
  if (!workoutPlan.length) {
    return null;
  }

  const scoredWorkouts = workoutPlan.map((workout, index) => {
    const zoneScores = focus.zoneIds.reduce<Record<TrainingLoadZone, number>>((accumulator, zoneId) => {
      accumulator[zoneId] = 0;
      return accumulator;
    }, {} as Record<TrainingLoadZone, number>);

    for (const exercise of workout.exercises) {
      const contribution = getTemplateExerciseContribution(exercise);
      for (const zoneId of focus.zoneIds) {
        zoneScores[zoneId] += contribution[zoneId] ?? 0;
      }
    }

    const matchedZoneIds = focus.zoneIds.filter((zoneId) => zoneScores[zoneId] > 0);
    const totalFocusScore = focus.zoneIds.reduce((sum, zoneId) => sum + zoneScores[zoneId], 0);

    return {
      workout,
      index,
      matchedZoneIds,
      totalFocusScore,
      adjustedFocusScore: totalFocusScore - focus.zoneIds.reduce(
        (sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0) * (zoneScores[zoneId] > 0 ? 0.32 : 0),
        0,
      ),
      strongestZoneScore: Math.max(0, ...focus.zoneIds.map((zoneId) => zoneScores[zoneId])),
    };
  });

  const bestMatch = [...scoredWorkouts].sort((a, b) => {
    if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
      return b.matchedZoneIds.length - a.matchedZoneIds.length;
    }
    if (b.adjustedFocusScore !== a.adjustedFocusScore) {
      return b.adjustedFocusScore - a.adjustedFocusScore;
    }
    if (b.totalFocusScore !== a.totalFocusScore) {
      return b.totalFocusScore - a.totalFocusScore;
    }
    if (b.strongestZoneScore !== a.strongestZoneScore) {
      return b.strongestZoneScore - a.strongestZoneScore;
    }
    return a.index - b.index;
  })[0];

  if (!bestMatch) {
    return null;
  }

  const matchedZoneIds = bestMatch.matchedZoneIds.length ? bestMatch.matchedZoneIds : focus.zoneIds;
  const matchedLabels = matchedZoneIds.map(getZoneLabel);

  return {
    workoutId: bestMatch.workout.id,
    workoutName: bestMatch.workout.name,
    matchedZoneIds,
    matchedLabels,
    helperText: getFocusHelperText(focus.labels, matchedLabels, bestMatch.matchedZoneIds.length === 0),
    isFallback: bestMatch.matchedZoneIds.length === 0,
  };
}

export function getSuggestedFocusSession(
  userId: UserId,
  workoutPlan: WorkoutPlanDay[],
  focus: NextWorkoutFocus,
  exerciseLibrary: ExerciseLibraryItem[] = [],
  recentLoad?: RecentLoadProfile,
  phaseProfile?: WeddingPhaseProfile | null,
  ceilingStates: MuscleCeilingState[] = [],
  liftReady?: LiftReadySignalInput | null,
  natashaPriorityLock: NatashaPriorityLockInput = null,
  natashaWaistProtocol: NatashaWaistProtocolInput = null,
  natashaBackReveal: NatashaBackRevealInput = null,
): SuggestedFocusSession | null {
  if (!focus.zoneIds.length) {
    return null;
  }

  const destination = getSuggestedWorkoutDestination(userId, workoutPlan, focus, recentLoad);
  const preferredWorkoutId = destination?.workoutId ?? null;
  const preferredWorkoutName = destination?.workoutName ?? null;
  const sourceWorkout = preferredWorkoutId
    ? workoutPlan.find((workout) => workout.id === preferredWorkoutId) ?? null
    : null;

  const scoredTemplateExercises: FocusExerciseCandidate[] = workoutPlan.flatMap((workout, workoutIndex) =>
    workout.exercises.map((exercise, exerciseIndex) => {
      const contribution = getTemplateExerciseContribution(exercise);
      const score = scoreContributionForFocus(contribution, focus.zoneIds);

      return {
        key: `template-${workout.id}-${exercise.id}`,
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets,
        repRange: exercise.repRange,
        note: exercise.note,
        matchedZoneIds: score.matchedZoneIds,
        totalFocusScore: score.totalFocusScore,
        recoveryAdjustedScore:
          score.totalFocusScore *
          Math.max(
            0.55,
            1 -
              score.matchedZoneIds.reduce((sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0), 0) /
                Math.max(1, score.matchedZoneIds.length) *
                0.45,
          ),
        strongestZoneScore: score.strongestZoneScore,
        sourceWorkoutId: workout.id,
        sourceWorkoutName: workout.name,
        preferredWorkout: workout.id === preferredWorkoutId,
        favorite: Boolean(exercise.favorite),
        phasePriorityScore: getPhasePriorityScore(score.matchedZoneIds, phaseProfile),
        phaseAdjustedScore:
          score.totalFocusScore +
          getPhasePriorityScore(score.matchedZoneIds, phaseProfile) * 0.35 +
          getLiftReadyPriorityBoost(userId, score.matchedZoneIds, exercise.muscleGroup, liftReady),
        stableOrder: workoutIndex * 100 + exerciseIndex,
      };
    }),
  );

  const dedupedTemplateExercises = Array.from(
    new Map(
      scoredTemplateExercises
        .sort((a, b) => {
          if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
            return b.matchedZoneIds.length - a.matchedZoneIds.length;
          }
          if (b.recoveryAdjustedScore !== a.recoveryAdjustedScore) {
            return b.recoveryAdjustedScore - a.recoveryAdjustedScore;
          }
          if (b.phaseAdjustedScore !== a.phaseAdjustedScore) {
            return b.phaseAdjustedScore - a.phaseAdjustedScore;
          }
          if (b.totalFocusScore !== a.totalFocusScore) {
            return b.totalFocusScore - a.totalFocusScore;
          }
          if (Number(b.preferredWorkout) !== Number(a.preferredWorkout)) {
            return Number(b.preferredWorkout) - Number(a.preferredWorkout);
          }
          if (Number(b.favorite) !== Number(a.favorite)) {
            return Number(b.favorite) - Number(a.favorite);
          }
          if (b.strongestZoneScore !== a.strongestZoneScore) {
            return b.strongestZoneScore - a.strongestZoneScore;
          }
          return a.stableOrder - b.stableOrder;
        })
        .map((exercise) => [normalizeExerciseName(exercise.name), exercise] as const),
    ).values(),
  );

  const matchedTemplateExercises = dedupedTemplateExercises.filter((exercise) => exercise.totalFocusScore > 0);
  const selectedExercises: FocusExerciseCandidate[] = [];
  const targetCount = phaseProfile?.currentPhase === "wedding_week" ? 3 : 4;
  const usedMuscleGroups = new Set<MuscleGroup>();
  const activeCeilingStates = new Map(
    ceilingStates.filter((state) => state.ceilingDetected).map((state) => [state.muscleGroup, state] as const),
  );

  for (const zoneId of focus.zoneIds) {
    const bestForZone = matchedTemplateExercises.find(
      (exercise) =>
        !selectedExercises.includes(exercise) &&
        exercise.matchedZoneIds.includes(zoneId) &&
        (!usedMuscleGroups.has(exercise.muscleGroup) || exercise.matchedZoneIds.length > 1),
    );
    if (bestForZone) {
      selectedExercises.push(bestForZone);
      usedMuscleGroups.add(bestForZone.muscleGroup);
    }
  }

  for (const exercise of matchedTemplateExercises) {
    if (selectedExercises.length >= targetCount) {
      break;
    }
    if (selectedExercises.includes(exercise)) {
      continue;
    }
    if (usedMuscleGroups.has(exercise.muscleGroup) && selectedExercises.length < Math.min(targetCount, 3)) {
      continue;
    }
    selectedExercises.push(exercise);
    usedMuscleGroups.add(exercise.muscleGroup);
  }

  if (selectedExercises.length) {
    selectedExercises.sort((a, b) => {
      const aResponse = activeCeilingStates.get(a.muscleGroup)?.suggestedResponse;
      const bResponse = activeCeilingStates.get(b.muscleGroup)?.suggestedResponse;
      const aRestPenalty = aResponse === "rest" ? 1 : 0;
      const bRestPenalty = bResponse === "rest" ? 1 : 0;
      if (aRestPenalty !== bRestPenalty) {
        return aRestPenalty - bRestPenalty;
      }
      return 0;
    });
  }

  if (selectedExercises.length < targetCount) {
    if (phaseProfile?.restrictNewExercises || (userId === "joshua" && liftReady?.trend === "slipping")) {
      // Peak and wedding-week sessions stay inside known exercise patterns.
      const selectedSlice = selectedExercises.slice(0, targetCount);
      if (!selectedSlice.length) {
        return null;
      }
    } else {
    const libraryFallbacks = buildCanonicalExerciseLibrary(exerciseLibrary)
      .map((exercise, index) => {
        const contribution = getExerciseMuscleContribution({
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
        });
        const score = scoreContributionForFocus(contribution, focus.zoneIds);

        return {
          key: `library-${exercise.id}`,
          exerciseId: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: null,
          repRange: null,
          note: exercise.cues[0],
          matchedZoneIds: score.matchedZoneIds,
          totalFocusScore: score.totalFocusScore,
          recoveryAdjustedScore:
            score.totalFocusScore *
            Math.max(
              0.55,
              1 -
                score.matchedZoneIds.reduce((sum, zoneId) => sum + (recentLoad?.zonePenalties[zoneId] ?? 0), 0) /
                  Math.max(1, score.matchedZoneIds.length) *
                  0.45,
            ),
          strongestZoneScore: score.strongestZoneScore,
          sourceWorkoutId: null,
          sourceWorkoutName: null,
          preferredWorkout: false,
          favorite: false,
          phasePriorityScore: getPhasePriorityScore(score.matchedZoneIds, phaseProfile),
          phaseAdjustedScore:
            score.totalFocusScore +
            getPhasePriorityScore(score.matchedZoneIds, phaseProfile) * 0.35 +
            getLiftReadyPriorityBoost(userId, score.matchedZoneIds, exercise.muscleGroup, liftReady),
          stableOrder: 10000 + index,
        };
      })
      .filter((exercise) => exercise.totalFocusScore > 0)
      .sort((a, b) => {
        if (b.matchedZoneIds.length !== a.matchedZoneIds.length) {
          return b.matchedZoneIds.length - a.matchedZoneIds.length;
        }
        if (b.recoveryAdjustedScore !== a.recoveryAdjustedScore) {
          return b.recoveryAdjustedScore - a.recoveryAdjustedScore;
        }
        if (b.phaseAdjustedScore !== a.phaseAdjustedScore) {
          return b.phaseAdjustedScore - a.phaseAdjustedScore;
        }
        if (b.totalFocusScore !== a.totalFocusScore) {
          return b.totalFocusScore - a.totalFocusScore;
        }
        if (b.strongestZoneScore !== a.strongestZoneScore) {
          return b.strongestZoneScore - a.strongestZoneScore;
        }
        return a.stableOrder - b.stableOrder;
      });

    for (const fallbackExercise of libraryFallbacks) {
      if (selectedExercises.length >= targetCount) {
        break;
      }
      const alreadySelected = selectedExercises.some(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(fallbackExercise.name),
      );
      if (alreadySelected) {
        continue;
      }
      selectedExercises.push(fallbackExercise);
      usedMuscleGroups.add(fallbackExercise.muscleGroup);
    }
    }
  }

  if (!selectedExercises.length) {
    return null;
  }

  let selectedSlice = selectedExercises.slice(0, targetCount).map((exercise) => ({ ...exercise }));
  const appliedResponses: Partial<Record<MuscleGroup, MuscleCeilingResponse>> = {};
  const adjustedMuscleGroups = new Set<MuscleGroup>();

  for (const exercise of selectedSlice) {
    const ceilingState = activeCeilingStates.get(exercise.muscleGroup);
    if (!ceilingState?.suggestedResponse || adjustedMuscleGroups.has(exercise.muscleGroup)) {
      continue;
    }

    appliedResponses[exercise.muscleGroup] = ceilingState.suggestedResponse;
    adjustedMuscleGroups.add(exercise.muscleGroup);

    if (ceilingState.suggestedResponse === "rep_range_shift") {
      exercise.repRange = shiftRepRangeForCeiling(adjustRepRangeForPhase(exercise.repRange, phaseProfile));
      continue;
    }

    if (ceilingState.suggestedResponse === "technique_swap") {
      const swap = getExerciseSwapOptions(userId, exercise.name, exercise.muscleGroup, exerciseLibrary)[0];
      if (swap) {
        exercise.exerciseId = swap.id;
        exercise.name = swap.name;
        exercise.note = swap.cues[0] ?? exercise.note;
        exercise.sourceWorkoutId = null;
        exercise.sourceWorkoutName = null;
      }
    }

  }

  if (userId === "joshua" && (liftReady?.readinessLevel === "early" || liftReady?.readinessLevel === "developing")) {
    const chestExercise = selectedSlice.find((exercise) => exercise.muscleGroup === "Chest" && typeof exercise.sets === "number");
    if (chestExercise && typeof chestExercise.sets === "number") {
      chestExercise.sets += 1;
    }
  }

  if (userId === "joshua" && liftReady?.trend === "slipping") {
    selectedSlice.sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.stableOrder - b.stableOrder);
  }

  if (userId === "joshua" && liftReady?.readinessLevel === "building") {
    selectedSlice.sort((a, b) => {
      const aShoulders = Number(a.muscleGroup === "Shoulders");
      const bShoulders = Number(b.muscleGroup === "Shoulders");
      if (aShoulders !== bShoulders) {
        return bShoulders - aShoulders;
      }
      return a.stableOrder - b.stableOrder;
    });
  }

  if (userId === "joshua" && (liftReady?.readinessLevel === "strong" || liftReady?.readinessLevel === "ready")) {
    for (const exercise of selectedSlice) {
      if (typeof exercise.sets === "number") {
        exercise.sets = Math.max(1, exercise.sets - 1);
      }
    }
  }

  if (userId === "natasha") {
    selectedSlice = enforceNatashaPrioritySessionShape(
      selectedSlice,
      dedupedTemplateExercises,
      natashaPriorityLock,
      phaseProfile,
    );
  }

  if (!selectedSlice.length) {
    return null;
  }

  let backRevealAdded = false;
  if (userId === "natasha") {
    const wovenBack = weaveNatashaBackRevealIntoSession(
      selectedSlice,
      focus,
      exerciseLibrary,
      natashaBackReveal,
    );
    selectedSlice = wovenBack.exercises;
    backRevealAdded = wovenBack.added;
  }

  let waistProtocolAdded = false;
  if (userId === "natasha") {
    const woven = weaveNatashaWaistProtocolIntoSession(
      selectedSlice,
      exerciseLibrary,
      natashaWaistProtocol,
      phaseProfile,
    );
    selectedSlice = woven.exercises;
    waistProtocolAdded = woven.added;
  }

  const sourceWorkoutName =
    selectedSlice.find((exercise) => exercise.sourceWorkoutId === preferredWorkoutId)?.sourceWorkoutName ??
    selectedSlice.find((exercise) => exercise.sourceWorkoutName)?.sourceWorkoutName ??
    preferredWorkoutName;
  const canStartDirectly = selectedSlice.every(
    (exercise) => Boolean(exercise.exerciseId) && Boolean(exercise.sets) && Boolean(exercise.repRange),
  );
  const targetLabels = Array.from(
    new Set([
      ...focus.labels,
      ...selectedSlice.flatMap((exercise) => exercise.matchedZoneIds.map(getZoneLabel)),
    ]),
  ).slice(0, 3);
  const totalSets = selectedSlice.reduce((sum, exercise) => sum + (exercise.sets ?? 0), 0);
  const estimatedDurationMinutes = estimateSuggestedSessionDuration(selectedSlice, sourceWorkout);
  const previewMuscleGroup = selectedSlice.find(
    (exercise) => activeCeilingStates.get(exercise.muscleGroup)?.suggestedResponse,
  )?.muscleGroup;
  const previewResponse = previewMuscleGroup ? activeCeilingStates.get(previewMuscleGroup)?.suggestedResponse ?? null : null;
  const natashaPreviewLine =
    userId === "natasha" && phaseProfile && natashaPriorityLock
      ? getNatashaPriorityPreviewLine(
          phaseProfile.currentPhase,
          selectedSlice.some((exercise) =>
            Object.entries(
              getExerciseMuscleContribution({
                exerciseName: exercise.name,
                muscleGroup: exercise.muscleGroup,
              }),
            ).some(([zoneId, weight]) => weight > 0 && natashaPriorityLock.lockedPrimary.includes(zoneId)),
          ),
        )
      : null;
  const backRevealPreviewLine =
    userId === "natasha" ? getBackRevealPreviewLine(backRevealAdded ? natashaBackReveal : null) : null;
  const waistProtocolPreviewLine =
    userId === "natasha" && phaseProfile
      ? getWaistProtocolPreviewLine(phaseProfile.currentPhase, waistProtocolAdded)
      : null;

  return {
    focusText: phaseProfile?.currentPhase === "wedding_week" ? "This week." : focus.text,
    exercises: selectedSlice.map((exercise) => ({
      ...getExerciseMuscleProfile(exercise.name, exercise.muscleGroup),
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: adjustSetsForNatashaWaistProtocol(
        exercise,
        adjustSetsForNatashaBackReveal(
          exercise,
          adjustSetsForPhase(exercise.sets, exercise.name, phaseProfile),
          natashaBackReveal,
        ),
        natashaWaistProtocol,
      ),
      repRange: adjustRepRangeForNatashaWaistProtocol(
        exercise,
        adjustRepRangeForNatashaBackReveal(
          exercise,
          adjustRepRangeForNatashaPriorityLock(
            exercise,
            adjustRepRangeForPhase(exercise.repRange, phaseProfile),
            natashaPriorityLock,
            phaseProfile,
          ),
          natashaBackReveal,
        ),
        natashaWaistProtocol,
        phaseProfile,
      ),
      suggestedRepTarget: getSuggestedRepTarget(
        adjustRepRangeForNatashaWaistProtocol(
          exercise,
          adjustRepRangeForNatashaBackReveal(
            exercise,
            adjustRepRangeForNatashaPriorityLock(
              exercise,
              adjustRepRangeForPhase(exercise.repRange, phaseProfile),
              natashaPriorityLock,
              phaseProfile,
            ),
            natashaBackReveal,
          ),
          natashaWaistProtocol,
          phaseProfile,
        ),
      ),
      note: exercise.note,
      matchedZoneIds: exercise.matchedZoneIds,
      matchedLabels: exercise.matchedZoneIds.map(getZoneLabel),
      sourceWorkoutId: exercise.sourceWorkoutId,
      sourceWorkoutName: exercise.sourceWorkoutName,
    })),
    sourceWorkoutId: preferredWorkoutId,
    sourceWorkoutName,
    targetLabels,
    totalSets: selectedSlice.reduce(
      (sum, exercise) =>
        sum +
        (adjustSetsForNatashaWaistProtocol(
          exercise,
          adjustSetsForNatashaBackReveal(
            exercise,
            adjustSetsForPhase(exercise.sets, exercise.name, phaseProfile),
            natashaBackReveal,
          ),
          natashaWaistProtocol,
        ) ?? 0),
      0,
    ),
    estimatedDurationMinutes,
    helperText: sourceWorkoutName
      ? getAveragePenaltyForZones(focus.zoneIds, recentLoad) >= 0.5
        ? `Built from ${sourceWorkoutName}, with fresher support work around your focus`
        : `Built from ${sourceWorkoutName}`
      : "Built from your current focus priorities",
    actionLabel: canStartDirectly ? "Start session" : "Open workout",
    canStartDirectly,
    isFallback: selectedSlice.some((exercise) => exercise.sourceWorkoutId === null),
    ceilingPreviewLine:
      previewMuscleGroup && previewResponse
        ? getCeilingPreviewLine(userId, previewMuscleGroup, previewResponse)
        : backRevealPreviewLine ?? waistProtocolPreviewLine ?? natashaPreviewLine,
    ceilingAppliedResponses: appliedResponses,
  };
}

function buildTrainingLoadSummary(
  userId: UserId,
  metrics: TrainingLoadMetric[],
  recentLoad: RecentLoadProfile,
): TrainingLoadSummary {
  const priorityZones = new Set(PROFILE_PRIORITY_ZONES[userId]);
  const lowActivity = metrics.every((metric) => metric.effectiveSets < MOST_TRAINED_MIN_EFFECTIVE_SETS);

  if (lowActivity) {
    return {
      mostTrained: [],
      needsWork: PROFILE_PRIORITY_ZONES[userId]
        .slice(0, 3)
        .map((zone) => metrics.find((metric) => metric.id === zone))
        .filter((metric): metric is TrainingLoadMetric => Boolean(metric)),
      suggestedNextFocus: buildSuggestedNextFocus(userId, metrics, true, recentLoad),
      lowActivity: true,
    };
  }

  const thresholdQualified = metrics.filter(
    (metric) =>
      metric.effectiveSets >= MOST_TRAINED_MIN_EFFECTIVE_SETS || metric.percentage >= MOST_TRAINED_MIN_PERCENTAGE,
  );

  const mostTrainedPool = thresholdQualified.length
    ? thresholdQualified
    : metrics.filter((metric) => priorityZones.has(metric.id) && metric.effectiveSets > 0);

  const mostTrained = [...mostTrainedPool]
    .sort((a, b) => {
      if (priorityZones.has(a.id) !== priorityZones.has(b.id)) {
        return priorityZones.has(a.id) ? -1 : 1;
      }
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      if (b.effectiveSets !== a.effectiveSets) {
        return b.effectiveSets - a.effectiveSets;
      }
      return a.label.localeCompare(b.label);
    })
    .slice(0, 3);

  const needsWork = metrics
    .filter((metric) => priorityZones.has(metric.id))
    .sort((a, b) => {
      if (a.percentage !== b.percentage) {
        return a.percentage - b.percentage;
      }
      if (a.effectiveSets !== b.effectiveSets) {
        return a.effectiveSets - b.effectiveSets;
      }
      if (recentLoad.zonePenalties[a.id] !== recentLoad.zonePenalties[b.id]) {
        return recentLoad.zonePenalties[a.id] - recentLoad.zonePenalties[b.id];
      }
      return getPriorityRank(userId, a.id) - getPriorityRank(userId, b.id);
    })
    .slice(0, 3);

  return {
    mostTrained,
    needsWork,
    suggestedNextFocus: buildSuggestedNextFocus(userId, metrics, lowActivity, recentLoad),
    lowActivity,
  };
}

export function getWeeklyTrainingLoad(
  sessions: WorkoutSession[],
  userId: UserId,
  referenceDate = new Date(),
): WeeklyTrainingLoad {
  const week = getCurrentWeekWindow(referenceDate);
  const currentWeekSessions = getCurrentWeekSessions(sessions, referenceDate);
  const recentLoad = getRecentLoadProfile(userId, sessions, referenceDate);
  const totals = buildEmptyZoneTotals();
  const contributorTotals = Object.keys(TRAINING_LOAD_ZONE_META).reduce<
    Record<TrainingLoadZone, Record<string, number>>
  >((accumulator, key) => {
    accumulator[key as TrainingLoadZone] = {};
    return accumulator;
  }, {} as Record<TrainingLoadZone, Record<string, number>>);

  for (const session of currentWeekSessions) {
    for (const exercise of session.exercises) {
      const completedSets = getCompletedSetCount(exercise);
      if (!completedSets) {
        continue;
      }

      const contribution = getExerciseMuscleContribution(exercise);
      for (const [zone, weight] of Object.entries(contribution) as Array<[TrainingLoadZone, number]>) {
        const effectiveContribution = completedSets * weight;
        totals[zone] += effectiveContribution;
        contributorTotals[zone][exercise.exerciseName] =
          (contributorTotals[zone][exercise.exerciseName] ?? 0) + effectiveContribution;
      }
    }
  }

  const metrics = buildZoneMetrics(userId, totals, contributorTotals);
  const groups = buildGroupMetrics(metrics);
  const topZones = [...metrics]
    .filter((metric) => metric.effectiveSets > 0)
    .sort((a, b) => b.percentage - a.percentage || b.effectiveSets - a.effectiveSets)
    .slice(0, 5);
  const summary = buildTrainingLoadSummary(userId, metrics, recentLoad);

  return {
    week,
    metrics,
    groups,
    topZones,
    activeDays: new Set(currentWeekSessions.map((session) => toLocalDayKey(session.performedAt))),
    recentLoad,
    summary,
  };
}

export function getWeeklyCalendarRows(
  sessions: WorkoutSession[],
  weeksToShow = 6,
  referenceDate = new Date(),
): CalendarRow[] {
  const currentWeek = getCurrentWeekWindow(referenceDate);
  const workoutDays = sessions.reduce<
    Record<
      string,
      {
        joshuaCompleted: boolean;
        natashaCompleted: boolean;
        joshuaWorkouts: string[];
        natashaWorkouts: string[];
      }
    >
  >((accumulator, session) => {
    const key = toLocalDayKey(session.performedAt);
    const current = accumulator[key] ?? {
      joshuaCompleted: false,
      natashaCompleted: false,
      joshuaWorkouts: [],
      natashaWorkouts: [],
    };
    if (session.userId === "joshua") {
      current.joshuaCompleted = true;
      if (!current.joshuaWorkouts.includes(session.workoutName)) {
        current.joshuaWorkouts.push(session.workoutName);
      }
    }
    if (session.userId === "natasha") {
      current.natashaCompleted = true;
      if (!current.natashaWorkouts.includes(session.workoutName)) {
        current.natashaWorkouts.push(session.workoutName);
      }
    }
    accumulator[key] = current;
    return accumulator;
  }, {});
  const todayKey = toLocalDayKey(referenceDate);

  return Array.from({ length: weeksToShow }, (_, index) => {
    const offset = weeksToShow - index - 1;
    const weekStart = new Date(currentWeek.start);
    weekStart.setDate(weekStart.getDate() - offset * 7);

    return {
      label: `W${index + 1}`,
      isCurrentWeek: offset === 0,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        const key = toLocalDayKey(date);
        const dayCompletion = workoutDays[key] ?? {
          joshuaCompleted: false,
          natashaCompleted: false,
          joshuaWorkouts: [],
          natashaWorkouts: [],
        };

        return {
          key,
          dayLabel: DAY_LABELS[dayIndex],
          dayNumber: date.getDate(),
          completed: dayCompletion.joshuaCompleted || dayCompletion.natashaCompleted,
          isToday: key === todayKey,
          joshuaCompleted: dayCompletion.joshuaCompleted,
          natashaCompleted: dayCompletion.natashaCompleted,
          joshuaWorkouts: dayCompletion.joshuaWorkouts,
          natashaWorkouts: dayCompletion.natashaWorkouts,
        };
      }),
    };
  });
}
