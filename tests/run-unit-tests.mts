import assert from "node:assert/strict";

import { addStretchCompletion, appendSession, replaceSession } from "@/lib/app-actions";
import { isValidImportedState, mergeStateWithSeed } from "@/lib/app-state";
import { selectDailyMobilityPrompt } from "@/lib/daily-mobility";
import { buildCanonicalExerciseLibrary, findExerciseLibraryItemByName } from "@/lib/exercise-data";
import { getWeekStreakMilestone, isPrApproachSet, shouldTriggerHaptic } from "@/lib/haptics";
import { buildSessionSignalLogEntry, getLiveSessionSignal, getStrongDayState } from "@/lib/live-session-signal";
import { getExerciseMuscleContribution, getSuggestedFocusSession } from "@/lib/training-load";
import {
  buildMuscleCeilingLogEntries,
  getBackRevealState,
  getLiftReadyScore,
  getMomentumPillCopy,
  getMuscleCeilingState,
  getNatashaPriorityLock,
  getMonthlyReportCard,
  getProfileMaturityState,
  getProfileTrainingState,
  getRivalryCardCopy,
  getSignatureLifts,
  getStealState,
  getStreakAndMomentum,
  getTrainingAge,
  getWaistProtocol,
  getWeddingRivalryState,
  getWeeklyRivalryState,
  syncLiftReadyHistory,
  syncProfileMaturityState,
  syncTrainingAgeState,
  syncMonthlyReportArchive,
  syncStealArchive,
  syncWeeklyRivalryArchive,
  getRestDayRead,
} from "@/lib/profile-training-state";
import { createSeedState } from "@/lib/seed-data";
import { getWeddingCountdownCardState, getWeddingPhaseProfile, getWeddingPhaseTransitionCopy, WeddingDateService } from "@/lib/wedding-date";

const referenceDate = new Date("2026-03-23T12:00:00.000Z");

function testInvalidImportedState() {
  assert.equal(
    isValidImportedState({
      selectedUserId: "someone-else",
    } as never),
    false,
  );

  assert.equal(
    isValidImportedState({
      sessions: {} as never,
    }),
    false,
  );
}

function testSafeStateMerge() {
  const seed = createSeedState();

  const merged = mergeStateWithSeed(seed, {
    selectedUserId: "natasha",
    sessions: [
      {
        id: "valid-session",
        userId: "natasha",
        workoutDayId: "natasha-glutes-hams",
        workoutName: "Glutes + Hamstrings",
        performedAt: "2026-03-23T09:00:00.000Z",
        durationMinutes: 48,
        feeling: "Solid",
        exercises: [
          {
            exerciseId: "machine-hip-thrust-day1",
            exerciseName: "Machine Hip Thrust",
            muscleGroup: "Glutes",
            sets: [{ id: "set-1", weight: 40, reps: 8, completed: true }],
          },
        ],
      },
      {
        id: "broken-session",
        userId: "natasha",
        workoutDayId: "bad",
        workoutName: "Bad data",
        performedAt: "2026-03-23T09:00:00.000Z",
        durationMinutes: "bad-minutes",
        feeling: "Solid",
        exercises: [],
      } as never,
    ],
    activeWorkout: {
      id: "bad-active",
      userId: "natasha",
      startedAt: "2026-03-23T10:00:00.000Z",
      workoutDayId: "broken",
      workoutName: "Broken",
      exercises: "nope",
    } as never,
  });

  assert.equal(merged.selectedUserId, "natasha");
  assert.equal(merged.sessions.length, 1);
  assert.equal(merged.sessions[0]?.id, "valid-session");
  assert.equal(merged.activeWorkout, null);
  assert.deepEqual(merged.longestStreaks, seed.longestStreaks);
}

function testStreakAndMomentumSelector() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");
  const localReferenceDate = new Date("2026-03-25T12:00:00+13:00");

  assert.ok(joshua);

  const sessions = [
    {
      id: "streak-1",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-25T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [{ exerciseId: "a", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "a", weight: 30, reps: 8, completed: true }] }],
    },
    {
      id: "streak-2",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-24T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [{ exerciseId: "b", exerciseName: "Lat Pulldown", muscleGroup: "Back" as const, sets: [{ id: "b", weight: 60, reps: 8, completed: true }] }],
    },
    {
      id: "streak-3",
      userId: "joshua",
      workoutDayId: "joshua-legs",
      workoutName: "Shoulders + Legs",
      performedAt: "2026-03-23T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [{ exerciseId: "c", exerciseName: "Squat", muscleGroup: "Legs" as const, sets: [{ id: "c", weight: 80, reps: 8, completed: true }] }],
    },
  ];

  const momentum = getStreakAndMomentum(joshua, sessions, localReferenceDate, 2);

  assert.equal(momentum.currentStreak, 3);
  assert.equal(momentum.longestStreak, 3);
  assert.equal(momentum.momentumState, "steady");
  assert.equal(momentum.lastSessionDaysAgo, 0);
  assert.ok(momentum.weeklyConsistency > 0.5 && momentum.weeklyConsistency < 1);
  assert.equal(getMomentumPillCopy("joshua", momentum, true), "Consistent. Good.");
}

function testMomentumPillHidesWithoutCompletedHistory() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const momentum = getStreakAndMomentum(natasha, [], referenceDate, 0);

  assert.equal(momentum.momentumState, "cold");
  assert.equal(getMomentumPillCopy("natasha", momentum, false), null);
}

function testProfileMaturityObservesThenActivates() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const observing = getProfileMaturityState(
    joshua,
    [],
    "2026-03-20T00:00:00+13:00",
    null,
    new Date("2026-03-25T12:00:00+13:00"),
  );
  assert.equal(observing.isObserving, true);
  assert.equal(observing.activationTriggered, false);

  const activatedBySessions = getProfileMaturityState(
    joshua,
    Array.from({ length: 8 }, (_, index) => ({
      id: `maturity-${index}`,
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: `2026-03-${String(index + 1).padStart(2, "0")}T08:00:00+13:00`,
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: `maturity-set-${index}`, weight: 30, reps: 8, completed: true }],
        },
      ],
    })),
    "2026-03-20T00:00:00+13:00",
    null,
    new Date("2026-03-25T12:00:00+13:00"),
  );
  assert.equal(activatedBySessions.isObserving, false);
  assert.equal(activatedBySessions.activationTriggered, true);
}

function testProfileMaturitySyncStoresActivationDateOnce() {
  const seed = createSeedState();
  const state = {
    ...seed,
    profileCreatedAt: {
      joshua: "2026-03-01T00:00:00+13:00",
      natasha: seed.profileCreatedAt.natasha,
    },
    sessions: [
      {
        id: "maturity-sync-1",
        userId: "joshua" as const,
        workoutDayId: "joshua-chest-triceps",
        workoutName: "Chest + Triceps A",
        performedAt: "2026-03-25T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "incline-dumbbell-press-day1",
            exerciseName: "Incline Dumbbell Press",
            muscleGroup: "Chest" as const,
            sets: [{ id: "maturity-sync-set", weight: 32, reps: 8, completed: true }],
          },
        ],
      },
    ],
  };

  const synced = syncProfileMaturityState(state, new Date("2026-03-25T12:00:00+13:00"));
  assert.equal(typeof synced.profileActivationDates.joshua, "string");
  assert.equal(syncProfileMaturityState(synced, new Date("2026-03-25T12:05:00+13:00")).profileActivationDates.joshua, synced.profileActivationDates.joshua);
}

function testObservationWindowSuppressesSignals() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const momentum = getStreakAndMomentum(joshua, [], referenceDate, 0);
  assert.equal(getMomentumPillCopy("joshua", momentum, true, true), null);
  assert.equal(getRestDayRead("joshua", "scheduled", true), "Rest day.");
  assert.equal(getSignatureLifts(joshua, seed.sessions, true).ready, false);
  const observingRivalry = getRivalryCardCopy(
    "joshua",
    {
      joshuaSessions: 2,
      natashaSessions: 1,
      joshuaVolume: 10,
      natashaVolume: 6,
      joshuaConsistency: 0.5,
      natashaConsistency: 0.25,
      leader: "joshua",
      leaderBy: "sessions",
      margin: "close",
      weekComplete: false,
    },
    undefined,
    true,
  );
  assert.equal(observingRivalry.headline, "");
  assert.equal(observingRivalry.detail, "");
}

function testTrainingAgeBuildsWeightedLabelAndMilestone() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const history = Array.from({ length: 16 }, (_, index) => ({
    id: `training-age-${index}`,
    userId: "natasha" as const,
    workoutDayId: "natasha-glutes-hams",
    workoutName: "Glutes + Hamstrings",
    performedAt: `2026-03-${String((index % 28) + 1).padStart(2, "0")}T08:00:00+13:00`,
    durationMinutes: 52,
    feeling: "Solid" as const,
    exercises: Array.from({ length: 7 }, (_, exerciseIndex) => ({
      exerciseId: `ta-ex-${exerciseIndex}`,
      exerciseName: `Exercise ${exerciseIndex}`,
      muscleGroup: "Glutes" as const,
      sets: Array.from({ length: 3 }, (_, setIndex) => ({
        id: `ta-set-${index}-${exerciseIndex}-${setIndex}`,
        weight: 20,
        reps: 10,
        completed: true,
      })),
    })),
  }));

  const trainingAge = getTrainingAge(natasha, history);
  assert.equal(trainingAge.rawSessionCount, 16);
  assert.ok(trainingAge.weightedAge >= 4);
  assert.equal(trainingAge.trainingAgeLabel, "Finding the rhythm");
  assert.equal(trainingAge.milestone, "A month in.");
}

function testTrainingAgeSyncPersistsSnapshot() {
  const seed = createSeedState();
  const synced = syncTrainingAgeState({
    ...seed,
    sessions: Array.from({ length: 4 }, (_, index) => ({
      id: `training-age-sync-${index}`,
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: `2026-03-${String(index + 20).padStart(2, "0")}T08:00:00+13:00`,
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: `training-age-sync-set-${index}`, weight: 32, reps: 8, completed: true }],
        },
      ],
    })),
  });

  assert.equal(synced.trainingAgeState.joshua.rawSessionCount, 4);
  assert.ok(synced.trainingAgeState.joshua.weightedAge > 0);
}

function testWeddingDateServiceBuildPhaseUsesCurrentYearWedding() {
  const weddingDate = WeddingDateService.getState(new Date("2026-03-25T12:00:00+13:00"));

  assert.equal(weddingDate.weddingDate.getFullYear(), 2026);
  assert.equal(weddingDate.weddingDate.getMonth(), 10);
  assert.equal(weddingDate.weddingDate.getDate(), 2);
  assert.equal(weddingDate.currentPhase, "build");
  assert.equal(weddingDate.urgencyLevel, "low");
  assert.equal(weddingDate.isPastWedding, false);
  assert.equal(weddingDate.phaseLabel.joshua, "Building the base.");
  assert.equal(weddingDate.phaseLabel.natasha, "Building the shape.");
}

function testWeddingDateServiceTransitionsThroughWeddingWeekAndComplete() {
  const peak = WeddingDateService.getState(new Date("2026-10-10T12:00:00+13:00"));
  const weddingWeek = WeddingDateService.getState(new Date("2026-11-02T12:00:00+13:00"));
  const complete = WeddingDateService.getState(new Date("2026-11-05T12:00:00+13:00"));

  assert.equal(peak.currentPhase, "peak");
  assert.equal(peak.urgencyLevel, "final");
  assert.equal(weddingWeek.currentPhase, "wedding_week");
  assert.equal(weddingWeek.isWeddingWeek, true);
  assert.equal(complete.currentPhase, "complete");
  assert.equal(complete.isPastWedding, true);
  assert.equal(complete.phaseLabel.joshua, "You did the work.");
}

function testWeddingPhaseProfileShiftsPrioritiesAndTransitionCopy() {
  const defineState = WeddingDateService.getState(new Date("2026-08-12T12:00:00+12:00"));
  const peakState = WeddingDateService.getState(new Date("2026-10-10T12:00:00+13:00"));

  const joshuaDefine = getWeddingPhaseProfile("joshua", defineState);
  const natashaPeak = getWeddingPhaseProfile("natasha", peakState);

  assert.deepEqual(joshuaDefine.priorityMuscles.slice(0, 3), ["upperChest", "sideDelts", "upperAbs"]);
  assert.equal(joshuaDefine.volumeModifier, 0.88);
  assert.equal(natashaPeak.restrictNewExercises, true);
  assert.equal(natashaPeak.intensityBias, "maintenance");
  assert.equal(
    getWeddingPhaseTransitionCopy("natasha", "define", "peak"),
    "Four weeks. The shape is there. Now we protect it.",
  );
}

function testWeddingWeekSuggestedSessionUsesPhaseProfile() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const focus = {
    zoneIds: ["upperChest", "midChest", "sideDelts"],
    labels: ["Upper chest", "Mid chest", "Side delts"],
    text: "Chest and shoulders need more this week.",
  } as const;
  const weddingWeekPhase = getWeddingPhaseProfile("joshua", WeddingDateService.getState(new Date("2026-11-02T12:00:00+13:00")));
  const session = getSuggestedFocusSession(
    "joshua",
    joshua.workoutPlan,
    focus,
    seed.exerciseLibrary,
    undefined,
    weddingWeekPhase,
  );

  assert.ok(session);
  assert.equal(session?.focusText, "This week.");
  assert.ok((session?.exercises.length ?? 0) <= 3);
  assert.ok(session?.exercises.every((exercise) => (exercise.sets ?? 0) <= 3));
  assert.ok(session?.exercises.every((exercise) => exercise.repRange === "10-15"));
}

function testWeddingCountdownCardStateSwitchesFromWeeksToDaysAndHidesAfter() {
  const buildState = WeddingDateService.getState(new Date("2026-03-25T12:00:00+13:00"));
  const weekState = WeddingDateService.getState(new Date("2026-10-30T12:00:00+13:00"));
  const dayState = WeddingDateService.getState(new Date("2026-11-02T12:00:00+13:00"));
  const afterState = WeddingDateService.getState(new Date("2026-11-05T12:00:00+13:00"));

  const buildCard = getWeddingCountdownCardState("natasha", buildState);
  const weekCard = getWeddingCountdownCardState("joshua", weekState);
  const dayCard = getWeddingCountdownCardState("natasha", dayState);
  const afterCard = getWeddingCountdownCardState("joshua", afterState);

  assert.equal(buildCard.visible, true);
  assert.equal(buildCard.heroUnit, "weeks");
  assert.equal(buildCard.copy, "Build the shape. November 2nd is the goal.");
  assert.equal(weekCard.heroUnit, "days");
  assert.equal(weekCard.copy, "This is the week you trained for.");
  assert.equal(dayCard.copy, "Today.");
  assert.equal(dayCard.heroValue, null);
  assert.equal(afterCard.visible, false);
}

function testNatashaPriorityLockReturnsPhaseSpecificShapeStack() {
  const buildLock = getNatashaPriorityLock("build", 20);
  const peakLock = getNatashaPriorityLock("peak", 3);

  assert.deepEqual(buildLock.lockedPrimary, ["gluteMax", "upperGlutes"]);
  assert.deepEqual(buildLock.minimumFrequency, {
    gluteMax: 3,
    upperGlutes: 2,
    lats: 1,
    obliques: 1,
  });
  assert.deepEqual(peakLock.lockedPrimary, ["upperGlutes", "sideGlutes", "lats"]);
  assert.equal(peakLock.phaseOverrides.noHeavyLoading, true);
  assert.equal(peakLock.phaseOverrides.repRangeBias, "high");
}

function testNatashaDefineSessionAlwaysCarriesBackOrWaistSecondary() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const defineState = WeddingDateService.getState(new Date("2026-08-20T12:00:00+12:00"));
  const definePhase = getWeddingPhaseProfile("natasha", defineState);
  const priorityLock = getNatashaPriorityLock(defineState.currentPhase, defineState.weeksRemaining);
  const session = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    {
      zoneIds: ["gluteMax", "upperGlutes"],
      labels: ["Glute max", "Upper glutes"],
      text: "Glutes first today.",
    },
    seed.exerciseLibrary,
    undefined,
    definePhase,
    [],
    null,
    priorityLock,
  );

  assert.ok(session);
  assert.equal(session?.ceilingPreviewLine, "Shape work. Glutes, back, and waist.");
  assert.ok(
    session?.exercises.some((exercise) =>
      Object.entries(getExerciseMuscleContribution({ exerciseName: exercise.name, muscleGroup: exercise.muscleGroup })).some(
        ([zoneId, weight]) => weight > 0 && (zoneId === "lats" || zoneId === "obliques"),
      ),
    ),
  );
}

function testNatashaPeakAndWeddingSessionsProtectAgainstSoreness() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const focus = {
    zoneIds: ["upperGlutes", "sideGlutes", "lats"],
    labels: ["Upper glutes", "Side glutes", "Lats"],
    text: "Glutes and back need the edge.",
  } as const;

  const peakState = WeddingDateService.getState(new Date("2026-10-10T12:00:00+13:00"));
  const peakSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    focus,
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", peakState),
    [],
    null,
    getNatashaPriorityLock(peakState.currentPhase, peakState.weeksRemaining),
  );
  const weddingWeekState = WeddingDateService.getState(new Date("2026-11-02T12:00:00+13:00"));
  const weddingWeekSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    focus,
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", weddingWeekState),
    [],
    null,
    getNatashaPriorityLock(weddingWeekState.currentPhase, weddingWeekState.weeksRemaining),
  );

  assert.ok(peakSession);
  assert.ok(weddingWeekSession);
  assert.equal(peakSession?.ceilingPreviewLine, "Definition session. Light, controlled, clean.");
  assert.equal(weddingWeekSession?.ceilingPreviewLine, "One last session. Keep it light and beautiful.");
  assert.ok(
    peakSession?.exercises.every(
      (exercise) =>
        !/hip thrust|romanian deadlift|bulgarian split squat|sumo deadlift/i.test(exercise.name) &&
        (exercise.muscleGroup === "Back" || exercise.muscleGroup === "Glutes" ? exercise.repRange === "15-20" : true),
    ),
  );
  assert.ok(
    weddingWeekSession?.exercises.every(
      (exercise) =>
        !/hip thrust|romanian deadlift|bulgarian split squat|sumo deadlift/i.test(exercise.name) &&
        (exercise.muscleGroup === "Back" || exercise.muscleGroup === "Glutes" ? exercise.repRange === "15-20" : true),
    ),
  );
}

function testWaistProtocolOnlyActivatesOutsideBuildAndUsesPhaseRules() {
  const defineProtocol = getWaistProtocol([], "define");
  const peakProtocol = getWaistProtocol([], "peak");
  const buildProtocol = getWaistProtocol([], "build");

  assert.equal(buildProtocol.active, false);
  assert.equal(defineProtocol.active, true);
  assert.equal(defineProtocol.obliquePriority, "medium");
  assert.equal(defineProtocol.setsPerSession, 2);
  assert.deepEqual(peakProtocol.targetMovementTypes, ["cable_oblique", "rotational", "core_vacuum", "lateral_flexion"]);
  assert.equal(peakProtocol.setsPerSession, 3);
}

function testNatashaWaistProtocolWeavesQuietCoreWorkIntoDefineSession() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const defineState = WeddingDateService.getState(new Date("2026-08-20T12:00:00+12:00"));
  const session = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    {
      zoneIds: ["gluteMax", "upperGlutes"],
      labels: ["Glute max", "Upper glutes"],
      text: "Glutes first today.",
    },
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", defineState),
    [],
    null,
    getNatashaPriorityLock(defineState.currentPhase, defineState.weeksRemaining),
    getWaistProtocol([], defineState.currentPhase),
  );

  assert.ok(session);
  const coreIndex = session.exercises.findIndex((exercise) => exercise.muscleGroup === "Core");
  assert.ok(coreIndex > 0);
  assert.ok(coreIndex < session.exercises.length - 1);
  assert.equal(session.ceilingPreviewLine, "Waist work included. Controlled and focused.");
  assert.ok(["Cable Oblique Crunch", "Pallof Press", "Side Plank Reach", "Standing Cable Rotation", "Cable Woodchop"].includes(session.exercises[coreIndex].name));
  assert.equal(session.exercises[coreIndex].repRange, "15-20");
  assert.equal(session.exercises[coreIndex].sets, 2);
}

function testNatashaWaistProtocolStaysLightInPeakAndWeddingWeek() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const focus = {
    zoneIds: ["upperGlutes", "lats"],
    labels: ["Upper glutes", "Lats"],
    text: "Glutes and back need the edge.",
  } as const;
  const peakState = WeddingDateService.getState(new Date("2026-10-10T12:00:00+13:00"));
  const peakSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    focus,
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", peakState),
    [],
    null,
    getNatashaPriorityLock(peakState.currentPhase, peakState.weeksRemaining),
    getWaistProtocol([], peakState.currentPhase),
  );
  const weddingWeekState = WeddingDateService.getState(new Date("2026-11-02T12:00:00+13:00"));
  const weddingWeekSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    focus,
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", weddingWeekState),
    [],
    null,
    getNatashaPriorityLock(weddingWeekState.currentPhase, weddingWeekState.weeksRemaining),
    getWaistProtocol([], weddingWeekState.currentPhase),
  );

  assert.ok(peakSession);
  assert.ok(weddingWeekSession);
  const peakCore = peakSession.exercises.find((exercise) => exercise.muscleGroup === "Core");
  const weddingCore = weddingWeekSession.exercises.find((exercise) => exercise.muscleGroup === "Core");
  assert.ok(peakCore);
  assert.ok(weddingCore);
  assert.equal(peakSession.ceilingPreviewLine, "Core definition included. Light and precise.");
  assert.equal(weddingWeekSession.ceilingPreviewLine, "Light core. That's all it needs.");
  assert.equal(peakCore?.repRange, "15-25");
  assert.equal(peakCore?.sets, 3);
  assert.equal(weddingCore?.repRange, "20-25");
  assert.equal(weddingCore?.sets, 1);
  assert.ok(["Cable Woodchop", "Core Vacuum Hold"].includes(weddingCore?.name ?? ""));
}

function testBackRevealActivatesOnlyInsideFinalEightWeeks() {
  const inactive = getBackRevealState([], 9, "define");
  const elevated = getBackRevealState([], 8, "define");
  const high = getBackRevealState([], 4, "define");
  const peak = getBackRevealState([], 1, "peak");

  assert.equal(inactive.active, false);
  assert.equal(elevated.active, true);
  assert.equal(elevated.backPriorityLevel, "elevated");
  assert.equal(high.backPriorityLevel, "high");
  assert.equal(peak.backPriorityLevel, "peak");
}

function testNatashaBackRevealAddsQuietBackWorkToGluteDays() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const defineState = WeddingDateService.getState(new Date("2026-09-10T12:00:00+12:00"));
  const session = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    {
      zoneIds: ["gluteMax", "upperGlutes"],
      labels: ["Glute max", "Upper glutes"],
      text: "Glutes first today.",
    },
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", defineState),
    [],
    null,
    getNatashaPriorityLock(defineState.currentPhase, defineState.weeksRemaining),
    getWaistProtocol([], defineState.currentPhase),
    getBackRevealState([], defineState.weeksRemaining, defineState.currentPhase),
  );

  assert.ok(session);
  assert.equal(session.ceilingPreviewLine, "Back included today. Building the sweep.");
  const backMoves = session.exercises.filter((exercise) => exercise.muscleGroup === "Back");
  assert.ok(backMoves.length >= 1);
  assert.ok(backMoves.some((exercise) => ["Lat Pulldown", "Seated Cable Row", "Single-Arm Lat Pulldown", "Straight-Arm Cable Pulldown"].includes(exercise.name)));
  assert.ok(backMoves.every((exercise) => exercise.repRange === "10-15"));
}

function testNatashaBackRevealDoesNotDoubleAddOnBackDaysAndStaysLightAtPeak() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const defineState = WeddingDateService.getState(new Date("2026-09-10T12:00:00+12:00"));
  const backDaySession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    {
      zoneIds: ["lats", "upperBack"],
      labels: ["Lats", "Upper back"],
      text: "Back detail next.",
    },
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", defineState),
    [],
    null,
    getNatashaPriorityLock(defineState.currentPhase, defineState.weeksRemaining),
    getWaistProtocol([], defineState.currentPhase),
    getBackRevealState([], defineState.weeksRemaining, defineState.currentPhase),
  );
  const peakState = WeddingDateService.getState(new Date("2026-10-28T12:00:00+13:00"));
  const peakGluteSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    {
      zoneIds: ["upperGlutes"],
      labels: ["Upper glutes"],
      text: "Upper glutes first.",
    },
    seed.exerciseLibrary,
    undefined,
    getWeddingPhaseProfile("natasha", peakState),
    [],
    null,
    getNatashaPriorityLock(peakState.currentPhase, peakState.weeksRemaining),
    getWaistProtocol([], peakState.currentPhase),
    getBackRevealState([], peakState.weeksRemaining, peakState.currentPhase),
  );

  assert.ok(backDaySession);
  assert.ok(peakGluteSession);
  assert.notEqual(backDaySession.ceilingPreviewLine, "Back included today. Building the sweep.");
  assert.ok((backDaySession.exercises.filter((exercise) => exercise.muscleGroup === "Back").length) <= 4);
  const peakBack = peakGluteSession.exercises.find((exercise) => exercise.muscleGroup === "Back");
  assert.ok(peakBack);
  assert.equal(peakGluteSession.ceilingPreviewLine, "Light back work. The sweep is already there.");
  assert.equal(peakBack?.repRange, "15-25");
  assert.ok(["Face Pull", "Band Pull-Apart", "Lat Pulldown"].includes(peakBack?.name ?? ""));
}

function testSignatureLiftsRequireEnoughHistoryAndRankTopThree() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sparse = getSignatureLifts(
    joshua,
    Array.from({ length: 7 }, (_, index) => ({
      id: `sig-sparse-${index}`,
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: `2026-03-${String(index + 1).padStart(2, "0")}T08:00:00+13:00`,
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: `sig-sparse-set-${index}`, weight: 30, reps: 8, completed: true }],
        },
      ],
    })),
  );

  assert.equal(sparse.ready, false);

  const richHistory = Array.from({ length: 8 }, (_, index) => ({
    id: `sig-rich-${index}`,
    userId: "joshua" as const,
    workoutDayId: index % 2 === 0 ? "joshua-chest-triceps" : "joshua-back-biceps",
    workoutName: index % 2 === 0 ? "Chest + Triceps A" : "Back + Biceps A",
    performedAt: `2026-03-${String(index + 10).padStart(2, "0")}T08:00:00+13:00`,
    durationMinutes: 50,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [
          { id: `sig-ip-${index}-1`, weight: 34, reps: 8, completed: true },
          { id: `sig-ip-${index}-2`, weight: 34, reps: 8, completed: true },
        ],
      },
      {
        exerciseId: "lat-pulldown-day1",
        exerciseName: "Lat Pulldown",
        muscleGroup: "Back" as const,
        sets: [
          { id: `sig-lp-${index}-1`, weight: 65, reps: 10, completed: true },
          { id: `sig-lp-${index}-2`, weight: 65, reps: 10, completed: true },
        ],
      },
      {
        exerciseId: "cable-lateral-raise-day1",
        exerciseName: "Cable Lateral Raise",
        muscleGroup: "Shoulders" as const,
        sets: [
          { id: `sig-clr-${index}-1`, weight: 12, reps: 14, completed: true },
          { id: `sig-clr-${index}-2`, weight: 12, reps: 14, completed: true },
        ],
      },
      ...(index < 4
        ? [
            {
              exerciseId: "rope-pushdown-day1",
              exerciseName: "Rope Pushdown",
              muscleGroup: "Triceps" as const,
              sets: [{ id: `sig-rp-${index}-1`, weight: 25, reps: 12, completed: true }],
            },
          ]
        : []),
    ],
  }));

  const signatures = getSignatureLifts(joshua, richHistory);

  assert.equal(signatures.ready, true);
  assert.equal(signatures.signatures.length, 3);
  assert.deepEqual(
    signatures.signatures.map((entry) => entry.rank),
    [1, 2, 3],
  );
  assert.ok(signatures.signatures.some((entry) => entry.exerciseName === "Incline Dumbbell Press"));
  assert.ok(signatures.signatures.some((entry) => entry.exerciseName === "Lat Pulldown"));
  assert.ok(signatures.signatures.some((entry) => entry.exerciseName === "Cable Lateral Raise"));
}

function testWeekStreakMilestoneOnlyAdvancesToNewThreshold() {
  const sessions = [
    "2026-03-24T08:00:00+13:00",
    "2026-03-18T08:00:00+13:00",
    "2026-03-11T08:00:00+13:00",
    "2026-03-04T08:00:00+13:00",
  ].map((performedAt, index) => ({
    id: `week-streak-${index}`,
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt,
    durationMinutes: 45,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [{ id: `week-streak-set-${index}`, weight: 32, reps: 8, completed: true }],
      },
    ],
  }));

  assert.equal(getWeekStreakMilestone(sessions, [], new Date("2026-03-25T12:00:00+13:00")), 4);
  assert.equal(getWeekStreakMilestone(sessions, [2, 4], new Date("2026-03-25T12:00:00+13:00")), null);
}

function testPrApproachDetectionUsesPreviousBestWindow() {
  const history = [
    {
      id: "pr-hist-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-20T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "pr-hist-set-1", weight: 40, reps: 8, completed: true }],
        },
      ],
    },
  ];

  assert.equal(
    isPrApproachSet("Incline Dumbbell Press", { weight: 38, reps: 8 }, history),
    true,
  );
  assert.equal(
    isPrApproachSet("Incline Dumbbell Press", { weight: 32, reps: 8 }, history),
    false,
  );
}

function testHapticGuardDropsSpamAndDuplicateWindows() {
  const now = 1_000;
  const baseState = {
    enabled: true,
    visible: true,
    suppressUntil: 0,
    recentEvents: [now - 100, now - 200, now - 300],
    lastByEvent: {},
  };

  assert.equal(shouldTriggerHaptic("set_saved", now, baseState), false);
  assert.equal(
    shouldTriggerHaptic("set_saved", now, {
      ...baseState,
      recentEvents: [now - 100],
      lastByEvent: { set_saved: now - 5_000 },
    }),
    false,
  );
  assert.equal(
    shouldTriggerHaptic("set_saved", now, {
      ...baseState,
      recentEvents: [now - 100],
      lastByEvent: { set_saved: now - 20_000 },
    }),
    true,
  );
}

function testLiveSessionSignalPrefersPrCloseAndRotatesCopy() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const exerciseHistory = [
    {
      id: "live-hist-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-20T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "lh-a", weight: 31, reps: 9, completed: true, rir: 2 },
            { id: "lh-b", weight: 31, reps: 9, completed: true, rir: 2 },
            { id: "lh-c", weight: 31, reps: 9, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "live-hist-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-17T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "lh-d", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "lh-e", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "lh-f", weight: 32, reps: 8, completed: true, rir: 1 },
          ],
        },
      ],
    },
  ];

  const currentSession = {
    id: "active-live-1",
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [
          { id: "cl-a", weight: 31, reps: 8, completed: true, rir: 2 },
          { id: "cl-b", weight: 31, reps: 8, completed: true, rir: 2 },
          { id: "cl-c", weight: 31, reps: 9, completed: true, rir: 2 },
          { id: "cl-d", weight: 0, reps: 0, completed: false },
        ],
      },
    ],
  };

  const signal = getLiveSessionSignal(
    joshua,
    currentSession,
    exerciseHistory,
    [
      {
        sessionId: "prior-signal",
        userId: "joshua",
        exercise: "Incline Dumbbell Press",
        signalType: "pr_close",
        firedAt: "2026-03-20T08:30:00+13:00",
        copyIndex: 0,
      },
    ],
    new Date("2026-03-25T10:00:00+13:00"),
  );

  assert.equal(signal.shouldFire, true);
  assert.equal(signal.signalType, "pr_close");
  assert.equal(signal.copyIndex, 1);
  assert.ok(signal.message.includes("PR range") || signal.message.includes("Close to your best"));
}

function testLiveSessionSignalBanksOnlyAfterFirstSessionOfWeek() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const exerciseHistory = [
    {
      id: "bank-week-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-24T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "bw-a", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "bw-b", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "bw-c", weight: 60, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "bank-hist-2",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-17T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "bw-d", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "bw-e", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "bw-f", weight: 60, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const currentSession = {
    id: "active-bank-1",
    userId: "natasha" as const,
    workoutDayId: "natasha-glutes-hams",
    workoutName: "Glutes + Hamstrings",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "machine-hip-thrust-day1",
        exerciseName: "Machine Hip Thrust",
        muscleGroup: "Glutes" as const,
        sets: [
          { id: "cb-a", weight: 45, reps: 8, completed: true, rir: 2 },
          { id: "cb-b", weight: 45, reps: 8, completed: true, rir: 2 },
          { id: "cb-c", weight: 45, reps: 8, completed: true, rir: 2 },
        ],
      },
    ],
  };

  const signal = getLiveSessionSignal(
    natasha,
    currentSession,
    exerciseHistory,
    [],
    new Date("2026-03-25T10:00:00+13:00"),
  );

  assert.equal(signal.shouldFire, true);
  assert.equal(signal.signalType, "bank");
  assert.ok(signal.message.includes("Hold the shape") || signal.message.includes("Harder day"));
}

function testLiveSessionSignalStaysQuietWhenAlreadyFiredAndBuildsLogEntry() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const currentSession = {
    id: "active-live-fired",
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Solid" as const,
    liveSignal: {
      signalType: "hold" as const,
      targetExercise: "Incline Dumbbell Press",
      message: "Steady session. Lock it in.",
      firedAt: "2026-03-25T08:20:00+13:00",
      copyIndex: 0,
      dismissedAt: null,
    },
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [
          { id: "cf-a", weight: 30, reps: 8, completed: true, rir: 2 },
          { id: "cf-b", weight: 30, reps: 8, completed: true, rir: 2 },
          { id: "cf-c", weight: 30, reps: 8, completed: true, rir: 2 },
        ],
      },
    ],
  };

  const signal = getLiveSessionSignal(joshua, currentSession, [], [], new Date("2026-03-25T10:00:00+13:00"));
  const logEntry = buildSessionSignalLogEntry({
    ...currentSession,
    id: "session-live-fired",
    durationMinutes: 46,
  });

  assert.equal(signal.shouldFire, false);
  assert.ok(logEntry);
  assert.equal(logEntry?.signalType, "hold");
  assert.equal(logEntry?.exercise, "Incline Dumbbell Press");
}

function testStrongDayStateDetectsImprovedSecondSetAgainstLastSession() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const exerciseHistory = [
    {
      id: "strong-day-hist-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-upper-body-shape",
      workoutName: "Upper Body + Shape",
      performedAt: "2026-03-22T08:00:00+13:00",
      durationMinutes: 46,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "dumbbell-shoulder-press-day4",
          exerciseName: "Dumbbell Shoulder Press",
          muscleGroup: "Shoulders" as const,
          sets: [
            { id: "sdh-a", weight: 12, reps: 10, completed: true, rir: 2 },
            { id: "sdh-b", weight: 12, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const currentSession = {
    id: "strong-day-current-1",
    userId: "natasha" as const,
    workoutDayId: "natasha-upper-body-shape",
    workoutName: "Upper Body + Shape",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "dumbbell-shoulder-press-day4",
        exerciseName: "Dumbbell Shoulder Press",
        muscleGroup: "Shoulders" as const,
        sets: [
          { id: "sdc-a", weight: 12, reps: 10, completed: true, rir: 2 },
          { id: "sdc-b", weight: 14, reps: 12, completed: true, rir: 2 },
        ],
      },
    ],
  };

  const strongDay = getStrongDayState(natasha, currentSession, exerciseHistory);

  assert.equal(strongDay.strongDayDetected, true);
  assert.equal(strongDay.detectedAfterSet, 2);
  assert.equal(strongDay.triggerExercise, "Dumbbell Shoulder Press");
  assert.equal(strongDay.repsDelta, 2);
  assert.equal(strongDay.strengthLevel, "exceptional");
  assert.ok(strongDay.weightDeltaPercent > 10);
}

function testStrongDaySignalOverridesPrCloseAndLogsMetadata() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const exerciseHistory = [
    {
      id: "strong-pr-hist-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-22T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "spr-a", weight: 30, reps: 8, completed: true, rir: 2 },
            { id: "spr-b", weight: 30, reps: 8, completed: true, rir: 2 },
            { id: "spr-c", weight: 30, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "strong-pr-hist-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps-b",
      workoutName: "Chest + Triceps B",
      performedAt: "2026-03-18T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day4",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "spr-d", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "spr-e", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "spr-f", weight: 32, reps: 8, completed: true, rir: 1 },
          ],
        },
      ],
    },
  ];

  const currentSession = {
    id: "strong-pr-current",
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Strong" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [
          { id: "spc-a", weight: 30, reps: 8, completed: true, rir: 2 },
          { id: "spc-b", weight: 34, reps: 10, completed: true, rir: 1 },
          { id: "spc-c", weight: 34, reps: 10, completed: true, rir: 1 },
        ],
      },
    ],
  };

  const signal = getLiveSessionSignal(joshua, currentSession, exerciseHistory, [], new Date("2026-03-25T10:00:00+13:00"));
  const logEntry = buildSessionSignalLogEntry({
    ...currentSession,
    id: "strong-pr-session",
    durationMinutes: 52,
    liveSignal: {
      signalType: signal.signalType!,
      targetExercise: signal.targetExercise,
      message: signal.message,
      firedAt: "2026-03-25T08:18:00+13:00",
      copyIndex: signal.copyIndex,
      strongDayState: signal.strongDayState ?? null,
      dismissedAt: null,
    },
  });

  assert.equal(signal.shouldFire, true);
  assert.equal(signal.signalType, "strong_day");
  assert.ok(signal.message.length > 0);
  assert.equal(signal.strongDayState?.strengthLevel, "exceptional");
  assert.ok(logEntry);
  assert.equal(logEntry?.signalType, "strong_day");
  assert.equal(logEntry?.strongDayState?.triggerExercise, "Incline Dumbbell Press");
}

function testStrongDayDoesNotFireWhenRepsDropAtHigherWeight() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const exerciseHistory = [
    {
      id: "strong-no-fire-hist-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-21T08:00:00+13:00",
      durationMinutes: 44,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day1",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "snf-a", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "snf-b", weight: 60, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const currentSession = {
    id: "strong-no-fire-current",
    userId: "joshua" as const,
    workoutDayId: "joshua-back-biceps",
    workoutName: "Back + Biceps A",
    performedAt: "2026-03-25T08:00:00+13:00",
    durationMinutes: 0,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "lat-pulldown-day1",
        exerciseName: "Lat Pulldown",
        muscleGroup: "Back" as const,
        sets: [
          { id: "snf-c", weight: 60, reps: 10, completed: true, rir: 2 },
          { id: "snf-d", weight: 65, reps: 9, completed: true, rir: 2 },
        ],
      },
    ],
  };

  const strongDay = getStrongDayState(joshua, currentSession, exerciseHistory);
  const signal = getLiveSessionSignal(joshua, currentSession, exerciseHistory, [], new Date("2026-03-25T10:00:00+13:00"));

  assert.equal(strongDay.strongDayDetected, false);
  assert.equal(signal.shouldFire, false);
  assert.equal(signal.signalType, null);
}

function testWeeklyRivalryStatePrefersSessionsThenVolume() {
  const weekStart = new Date("2026-03-23T00:00:00+13:00");
  const reference = new Date("2026-03-25T12:00:00+13:00");
  const joshuaHistory = [
    {
      id: "rivalry-j-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-24T08:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "j-a", weight: 32, reps: 8, completed: true, rir: 2 },
            { id: "j-b", weight: 32, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "rivalry-j-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-25T08:00:00+13:00",
      durationMinutes: 44,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "j-c", weight: 60, reps: 8, completed: true, rir: 2 },
            { id: "j-d", weight: 60, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];
  const natashaHistory = [
    {
      id: "rivalry-n-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-24T09:00:00+13:00",
      durationMinutes: 46,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "n-a", weight: 55, reps: 10, completed: true, rir: 2 },
            { id: "n-b", weight: 55, reps: 10, completed: true, rir: 2 },
            { id: "n-c", weight: 55, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const state = getWeeklyRivalryState(joshuaHistory, natashaHistory, weekStart, reference);

  assert.equal(state.leader, "joshua");
  assert.equal(state.leaderBy, "sessions");
  assert.equal(state.margin, "close");
  assert.ok(state.joshuaConsistency > state.natashaConsistency);
}

function testWeeklyRivalryCardCopyHandlesTiesAndWeekComplete() {
  const tiedCopy = getRivalryCardCopy("joshua", {
    joshuaSessions: 2,
    natashaSessions: 2,
    joshuaVolume: 12,
    natashaVolume: 12,
    joshuaConsistency: 0.5,
    natashaConsistency: 0.5,
    leader: "tied",
    leaderBy: null,
    margin: "close",
    weekComplete: false,
  });
  const settledCopy = getRivalryCardCopy("natasha", {
    joshuaSessions: 3,
    natashaSessions: 5,
    joshuaVolume: 18,
    natashaVolume: 28,
    joshuaConsistency: 0.6,
    natashaConsistency: 1,
    leader: "natasha",
    leaderBy: "sessions",
    margin: "clear",
    weekComplete: true,
  });

  assert.equal(tiedCopy.headline, "Dead even. Someone's got to move.");
  assert.ok(tiedCopy.detail.includes("4 sessions"));
  assert.equal(tiedCopy.stealDetail, null);
  assert.equal(settledCopy.headline, "Natasha took this week.");
  assert.ok(settledCopy.detail.includes("Natasha"));
  assert.equal(settledCopy.stealDetail, null);
  assert.equal(settledCopy.weddingGoalDetail, null);
}

function testWeddingRivalryStateTracksGoalAdherenceAndTone() {
  const joshuaHistory = [
    {
      id: "wr-j-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-10-07T09:00:00+13:00",
      durationMinutes: 50,
      feeling: "Great" as const,
      partial: false,
      exercises: [
        { exerciseId: "incline-dumbbell-press-day1", name: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ weight: 30, reps: 8, completed: true }] },
      ],
    },
    {
      id: "wr-j-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-shoulders-legs",
      workoutName: "Shoulders + Legs",
      performedAt: "2026-10-09T09:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      partial: false,
      exercises: [
        { exerciseId: "dumbbell-shoulder-press-day3", name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders" as const, sets: [{ weight: 20, reps: 8, completed: true }] },
      ],
    },
    {
      id: "wr-j-3",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-10-10T09:00:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      partial: false,
      exercises: [
        { exerciseId: "lat-pulldown-day2", name: "Lat Pulldown", muscleGroup: "Back" as const, sets: [{ weight: 65, reps: 8, completed: true }] },
      ],
    },
    {
      id: "wr-j-4",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps-b",
      workoutName: "Chest + Triceps B",
      performedAt: "2026-10-10T18:00:00+13:00",
      durationMinutes: 49,
      feeling: "Solid" as const,
      partial: false,
      exercises: [
        { exerciseId: "incline-machine-press", name: "Incline Machine Press", muscleGroup: "Chest" as const, sets: [{ weight: 70, reps: 10, completed: true }] },
      ],
    },
  ];
  const natashaHistory = [
    {
      id: "wr-n-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-10-08T09:00:00+13:00",
      durationMinutes: 52,
      feeling: "Great" as const,
      partial: false,
      exercises: [
        { exerciseId: "machine-hip-thrust-day1", name: "Machine Hip Thrust", muscleGroup: "Glutes" as const, sets: [{ weight: 60, reps: 8, completed: true }] },
      ],
    },
  ];

  const state = getWeddingRivalryState(
    joshuaHistory,
    natashaHistory,
    "peak",
    3,
    new Date("2026-10-10T12:00:00+13:00"),
  );

  assert.equal(state.rivalryTone, "final");
  assert.equal(state.goalLeader, "joshua");
  assert.equal(state.joshuaOnTrack, false);
  assert.equal(state.natashaOnTrack, false);
  assert.ok(state.joshuaGoalAdherence > state.natashaGoalAdherence);
}

function testRivalryCardCopyAddsWeddingGoalLayerBeforeWeddingOnly() {
  const rivalryCopy = getRivalryCardCopy(
    "natasha",
    {
      joshuaSessions: 3,
      natashaSessions: 2,
      joshuaVolume: 18,
      natashaVolume: 14,
      joshuaConsistency: 0.75,
      natashaConsistency: 0.5,
      leader: "joshua",
      leaderBy: "sessions",
      margin: "close",
      weekComplete: false,
    },
    undefined,
    false,
    {
      joshuaGoalAdherence: 0.9,
      natashaGoalAdherence: 0.5,
      joshuaOnTrack: true,
      natashaOnTrack: false,
      goalLeader: "joshua",
      weeklySessionGap: 1,
      phaseUrgency: "high",
      rivalryTone: "sharp",
    },
  );

  assert.equal(rivalryCopy.weddingGoalDetail, "He's more consistent. Take it back.");
}

function testStealStateTracksLatestStealAndRunLength() {
  const weekStart = new Date("2026-03-23T00:00:00+13:00");
  const reference = new Date("2026-03-26T09:00:00+13:00");

  const joshuaHistory = [
    {
      id: "steal-j-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-24T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "steal-j-a", weight: 30, reps: 8, completed: true }],
        },
      ],
    },
    {
      id: "steal-j-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-25T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day1",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [{ id: "steal-j-b", weight: 60, reps: 8, completed: true }],
        },
      ],
    },
  ];

  const natashaHistory: typeof joshuaHistory = [];

  const stealState = getStealState(joshuaHistory, natashaHistory, weekStart, reference);

  assert.equal(stealState.todayIsStolen, true);
  assert.equal(stealState.stolenBy, "joshua");
  assert.equal(stealState.consecutiveSteals, 2);
  assert.equal(stealState.weekSteals.joshua, 2);
  assert.equal(stealState.weekSteals.natasha, 0);
  assert.equal(stealState.lastStealDate, "2026-03-25");
}

function testRivalryCopyAddsStealDetailFromViewerPerspective() {
  const copy = getRivalryCardCopy(
    "natasha",
    {
      joshuaSessions: 2,
      natashaSessions: 1,
      joshuaVolume: 10,
      natashaVolume: 6,
      joshuaConsistency: 0.5,
      natashaConsistency: 0.25,
      leader: "joshua",
      leaderBy: "sessions",
      margin: "close",
      weekComplete: false,
    },
    {
      todayIsStolen: true,
      stolenBy: "joshua",
      consecutiveSteals: 2,
      weekSteals: { joshua: 2, natasha: 0 },
      lastStealDate: "2026-03-25",
    },
  );

  assert.equal(copy.headline, "Joshua's got it. Take it back.");
  assert.equal(copy.stealDetail, "Two days. He's taking ground.");
}

function testWeeklyRivalryArchiveStoresPreviousWeekOnce() {
  const seed = createSeedState();
  const monday = new Date("2026-03-30T09:00:00+13:00");
  const stateWithHistory = {
    ...seed,
    sessions: [
      {
        id: "archive-j-1",
        userId: "joshua" as const,
        workoutDayId: "joshua-chest-triceps",
        workoutName: "Chest + Triceps A",
        performedAt: "2026-03-24T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "incline-dumbbell-press-day1",
            exerciseName: "Incline Dumbbell Press",
            muscleGroup: "Chest" as const,
            sets: [{ id: "archive-a", weight: 30, reps: 8, completed: true, rir: 2 }],
          },
        ],
      },
      {
        id: "archive-n-1",
        userId: "natasha" as const,
        workoutDayId: "natasha-glutes-hams",
        workoutName: "Glutes + Hamstrings",
        performedAt: "2026-03-26T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "machine-hip-thrust-day1",
            exerciseName: "Machine Hip Thrust",
            muscleGroup: "Glutes" as const,
            sets: [{ id: "archive-b", weight: 50, reps: 10, completed: true, rir: 2 }],
          },
        ],
      },
      {
        id: "archive-n-2",
        userId: "natasha" as const,
        workoutDayId: "natasha-back-arms",
        workoutName: "Back + Biceps",
        performedAt: "2026-03-28T08:00:00+13:00",
        durationMinutes: 42,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "lat-pulldown-day2-nat",
            exerciseName: "Lat Pulldown",
            muscleGroup: "Back" as const,
            sets: [{ id: "archive-c", weight: 40, reps: 10, completed: true, rir: 2 }],
          },
        ],
      },
    ],
  };

  const archived = syncWeeklyRivalryArchive(stateWithHistory, monday);
  const archivedAgain = syncWeeklyRivalryArchive(archived, monday);

  assert.equal(archived.rivalryArchive.length, 1);
  assert.equal(archived.rivalryArchive[0].winner, "natasha");
  assert.equal(archived.rivalryArchive[0].weekStart, "2026-03-23");
  assert.equal(archivedAgain.rivalryArchive.length, 1);
}

function testStealArchiveStoresPastStealsOnce() {
  const seed = createSeedState();
  const monday = new Date("2026-03-30T09:00:00+13:00");
  const stateWithHistory = {
    ...seed,
    sessions: [
      {
        id: "steal-archive-j-1",
        userId: "joshua" as const,
        workoutDayId: "joshua-chest-triceps",
        workoutName: "Chest + Triceps A",
        performedAt: "2026-03-24T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "incline-dumbbell-press-day1",
            exerciseName: "Incline Dumbbell Press",
            muscleGroup: "Chest" as const,
            sets: [{ id: "steal-archive-a", weight: 30, reps: 8, completed: true }],
          },
        ],
      },
      {
        id: "steal-archive-j-2",
        userId: "joshua" as const,
        workoutDayId: "joshua-back-biceps",
        workoutName: "Back + Biceps A",
        performedAt: "2026-03-25T08:00:00+13:00",
        durationMinutes: 44,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "lat-pulldown-day1",
            exerciseName: "Lat Pulldown",
            muscleGroup: "Back" as const,
            sets: [{ id: "steal-archive-b", weight: 60, reps: 8, completed: true }],
          },
        ],
      },
    ],
  };

  const archived = syncStealArchive(stateWithHistory, monday);
  const archivedAgain = syncStealArchive(archived, monday);

  assert.equal(archived.stealArchive.length, 2);
  assert.equal(archived.stealArchive[0].date, "2026-03-25");
  assert.equal(archived.stealArchive[0].consecutiveCount, 2);
  assert.equal(archivedAgain.stealArchive.length, 2);
}

function testMonthlyReportCardBuildsMonthReckoning() {
  const joshuaHistory = [
    {
      id: "month-j-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-03T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "month-j-a", weight: 34, reps: 8, completed: true },
            { id: "month-j-b", weight: 34, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      id: "month-j-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-10T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day1",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "month-j-c", weight: 65, reps: 8, completed: true },
            { id: "month-j-d", weight: 65, reps: 8, completed: true },
          ],
        },
      ],
    },
  ];

  const natashaHistory = [
    {
      id: "month-n-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-04T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "month-n-a", weight: 60, reps: 10, completed: true },
            { id: "month-n-b", weight: 60, reps: 10, completed: true },
          ],
        },
      ],
    },
    {
      id: "month-n-2",
      userId: "natasha" as const,
      workoutDayId: "natasha-back-arms",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-11T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2-nat",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "month-n-c", weight: 45, reps: 10, completed: true },
            { id: "month-n-d", weight: 45, reps: 10, completed: true },
          ],
        },
      ],
    },
    {
      id: "month-n-3",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-18T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "month-n-e", weight: 62, reps: 10, completed: true },
            { id: "month-n-f", weight: 62, reps: 10, completed: true },
          ],
        },
      ],
    },
  ];

  const report = getMonthlyReportCard(joshuaHistory, natashaHistory, 2, 2026);

  assert.equal(report.month, "March");
  assert.equal(report.joshua.sessions, 2);
  assert.equal(report.natasha.sessions, 3);
  assert.equal(report.joshua.totalSets, 4);
  assert.equal(report.natasha.signatureLift, "Machine Hip Thrust");
  assert.ok(["joshua", "natasha", "tied"].includes(report.rivalry.monthWinner));
  assert.equal(typeof report.closingLine.joshua, "string");
  assert.equal(typeof report.closingLine.natasha, "string");
}

function testMonthlyReportArchiveStoresPreviousMonthOnce() {
  const seed = createSeedState();
  const firstOfMonth = new Date("2026-04-01T09:00:00+13:00");
  const stateWithHistory = {
    ...seed,
    sessions: [
      {
        id: "monthly-archive-j-1",
        userId: "joshua" as const,
        workoutDayId: "joshua-chest-triceps",
        workoutName: "Chest + Triceps A",
        performedAt: "2026-03-20T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "incline-dumbbell-press-day1",
            exerciseName: "Incline Dumbbell Press",
            muscleGroup: "Chest" as const,
            sets: [{ id: "monthly-archive-a", weight: 34, reps: 8, completed: true }],
          },
        ],
      },
      {
        id: "monthly-archive-n-1",
        userId: "natasha" as const,
        workoutDayId: "natasha-glutes-hams",
        workoutName: "Glutes + Hamstrings",
        performedAt: "2026-03-22T08:00:00+13:00",
        durationMinutes: 45,
        feeling: "Solid" as const,
        exercises: [
          {
            exerciseId: "machine-hip-thrust-day1",
            exerciseName: "Machine Hip Thrust",
            muscleGroup: "Glutes" as const,
            sets: [{ id: "monthly-archive-b", weight: 60, reps: 10, completed: true }],
          },
        ],
      },
    ],
  };

  const archived = syncMonthlyReportArchive(stateWithHistory, firstOfMonth);
  const archivedAgain = syncMonthlyReportArchive(archived, firstOfMonth);

  assert.equal(archived.monthlyReportArchive.length, 1);
  assert.equal(archived.monthlyReportArchive[0].month, "March");
  assert.equal(archived.monthlyReportArchive[0].year, 2026);
  assert.equal(archivedAgain.monthlyReportArchive.length, 1);
}

function testScheduledRestDayBuildsRestState() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const saturday = new Date("2026-03-28T10:00:00+13:00");
  const trainingState = getProfileTrainingState(joshua, [], seed.exerciseLibrary, saturday);

  assert.equal(trainingState.restDayState.isRest, true);
  assert.equal(trainingState.restDayState.restReason, "scheduled");
  assert.equal(trainingState.restDayState.nextBestSessionDaysOut, 2);
  assert.ok(trainingState.restDayState.nextBestSession.length > 0);
}

function testRecoveryNeededRestDayUsesRecoveryIndex() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const wednesday = new Date("2026-03-25T10:00:00+13:00");
  const sessions = [
    {
      id: "rest-low-recovery-1",
      userId: "natasha" as const,
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T18:30:00+13:00",
      durationMinutes: 85,
      sessionRpe: 9.5,
      feeling: "Tough" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: Array.from({ length: 6 }, (_, index) => ({
            id: `low-rec-a-${index}`,
            weight: 70,
            reps: 8,
            completed: true,
            rir: 0,
          })),
        },
      ],
    },
    {
      id: "rest-low-recovery-2",
      userId: "natasha" as const,
      workoutDayId: "natasha-back-biceps",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-24T18:30:00+13:00",
      durationMinutes: 82,
      sessionRpe: 9.3,
      feeling: "Tough" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2-nat",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: Array.from({ length: 6 }, (_, index) => ({
            id: `low-rec-b-${index}`,
            weight: 45,
            reps: 8,
            completed: true,
            rir: 0,
          })),
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, wednesday);

  assert.ok(trainingState.metrics.recoveryIndex.score < 55);
  assert.equal(trainingState.restDayState.isRest, true);
  assert.equal(trainingState.restDayState.restReason, "recovery_needed");
  assert.equal(trainingState.restDayState.nextBestSessionDaysOut, 1);
}

function testSkippedPlannedDayTurnsIntoRestReset() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const saturday = new Date("2026-03-28T10:00:00+13:00");
  const sessions = [
    {
      id: "skip-reset-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-26T18:30:00+13:00",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "skip-a", weight: 60, reps: 8, completed: true, rir: 2 },
            { id: "skip-b", weight: 60, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, saturday);

  assert.equal(trainingState.restDayState.isRest, true);
  assert.equal(trainingState.restDayState.restReason, "user_skipped");
  assert.equal(trainingState.restDayState.nextBestSessionDaysOut, 0);
}

function testRecoveryAwareNextFocus() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "recent-chest-session",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-22T11:00:00.000Z",
      durationMinutes: 52,
      feeling: "Strong",
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest",
          sets: [
            { id: "a", weight: 30, reps: 8, completed: true },
            { id: "b", weight: 30, reps: 8, completed: true },
            { id: "c", weight: 30, reps: 8, completed: true },
            { id: "d", weight: 30, reps: 8, completed: true },
          ],
        },
      ],
    },
  ] as const;

  const trainingState = getProfileTrainingState(joshua, [...sessions], seed.exerciseLibrary, referenceDate);

  assert.equal(trainingState.trainingLoad.summary.suggestedNextFocus.labels[0], "Side delts");
  assert.ok(!trainingState.trainingLoad.summary.suggestedNextFocus.labels.includes("Upper chest"));
  assert.ok(trainingState.suggestedFocusSession?.focusText.includes("Side delts"));
}

function testSuggestedSessionIsActionable() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sessions = [
    {
      id: "recent-glute-session",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T07:00:00.000Z",
      durationMinutes: 55,
      feeling: "Solid",
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes",
          sets: [
            { id: "a", weight: 45, reps: 8, completed: true },
            { id: "b", weight: 45, reps: 8, completed: true },
            { id: "c", weight: 45, reps: 8, completed: true },
            { id: "d", weight: 45, reps: 8, completed: true },
          ],
        },
      ],
    },
  ] as const;

  const trainingState = getProfileTrainingState(natasha, [...sessions], seed.exerciseLibrary, referenceDate);

  assert.ok(trainingState.nextFocusDestination);
  assert.ok(trainingState.suggestedFocusSession);
  assert.equal(trainingState.suggestedFocusSession?.exercises.length, 4);
  assert.equal(trainingState.suggestedFocusSession?.canStartDirectly, true);
}

function testLowActivityFocusStillAvoidsJustTrainedPriority() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sessions = [
    {
      id: "recent-glute-bias",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T09:30:00.000Z",
      durationMinutes: 28,
      feeling: "Solid",
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes",
          sets: [{ id: "a", weight: 45, reps: 8, completed: true }],
        },
      ],
    },
  ] as const;

  const trainingState = getProfileTrainingState(natasha, [...sessions], seed.exerciseLibrary, referenceDate);

  assert.notEqual(trainingState.trainingLoad.summary.suggestedNextFocus.labels[0], "Upper glutes");
  assert.notEqual(trainingState.trainingLoad.summary.suggestedNextFocus.labels[0], "Glute max");
}

function testSuggestedSessionSpreadsFocusAcrossPatterns() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const trainingState = getProfileTrainingState(joshua, [], seed.exerciseLibrary, referenceDate);
  const exerciseGroups = trainingState.suggestedFocusSession?.exercises.map((exercise) => exercise.muscleGroup) ?? [];

  assert.ok(new Set(exerciseGroups).size >= 2);
}

function testMetricsLayerBuildsEffectiveVolumeCoverage() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "metrics-evs-session",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 52,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "a", weight: 30, reps: 8, completed: true },
            { id: "b", weight: 30, reps: 8, completed: true },
            { id: "c", weight: 30, reps: 8, completed: true },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.ok(trainingState.metrics.effectiveVolumeScore.total > 0);
  assert.ok(trainingState.metrics.weeklyCoverage.byRegion.upperChest > 0);
  assert.ok(trainingState.metrics.regionMetrics.some((metric) => metric.zoneId === "upperChest" && metric.evs > 0));
}

function testEVSCalculatesExactlyForSingleZoneExercise() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  // Leg extension maps fully to quads and counts as stable isolation work,
  // so the exact EVS is easy to verify: 1.0 * 0.8 * 1.0 * 1.0 = 0.8
  const sessions = [
    {
      id: "exact-evs-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 35,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "leg-extension-day3-nat",
          exerciseName: "Leg Extension",
          muscleGroup: "Quads" as const,
          sets: [{ id: "a", weight: 35, reps: 8, completed: true }],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, referenceDate);
  const quadsMetric = trainingState.metrics.regionMetrics.find((metric) => metric.zoneId === "quads");
  const legExtensionEntry = trainingState.metrics.effectiveVolumeScore.byExercise.find(
    (entry) => entry.exerciseName === "Leg Extension",
  );

  assert.ok(quadsMetric && legExtensionEntry);
  assert.equal(legExtensionEntry.score, 0.8);
  assert.equal(quadsMetric.evs, 0.8);
  assert.equal(trainingState.metrics.effectiveVolumeScore.byRegion.quads, 0.8);
}

function testCoverageClampsAtOneHundredTwentyFivePercent() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sessions = [
    {
      id: "coverage-clamp-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 75,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "leg-extension-day3-nat",
          exerciseName: "Leg Extension",
          muscleGroup: "Quads" as const,
          sets: Array.from({ length: 20 }, (_, index) => ({
            id: `quad-${index}`,
            weight: 45,
            reps: 8,
            completed: true,
            rir: 1,
          })),
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, referenceDate);

  assert.equal(trainingState.metrics.weeklyCoverage.byRegion.quads, 125);
}

function testRecoveryIndexRespondsToAccumulatedRecentLoad() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const heavyRecentSessions = [
    {
      id: "recovery-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T08:00:00.000Z",
      durationMinutes: 70,
      sessionRpe: 9,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "machine-hip-thrust-day1", exerciseName: "Machine Hip Thrust", muscleGroup: "Glutes" as const, sets: [{ id: "a", weight: 60, reps: 8, completed: true }] }],
    },
    {
      id: "recovery-2",
      userId: "natasha",
      workoutDayId: "natasha-back-arms",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-22T08:00:00.000Z",
      durationMinutes: 65,
      sessionRpe: 8.5,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "lat-pulldown-day2-nat", exerciseName: "Lat Pulldown", muscleGroup: "Back" as const, sets: [{ id: "a", weight: 45, reps: 10, completed: true }] }],
    },
    {
      id: "recovery-3",
      userId: "natasha",
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-21T08:00:00.000Z",
      durationMinutes: 60,
      sessionRpe: 8.5,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "leg-press-day3-nat", exerciseName: "Leg Press", muscleGroup: "Quads" as const, sets: [{ id: "a", weight: 120, reps: 10, completed: true }] }],
    },
  ];

  const loadedState = getProfileTrainingState(natasha, heavyRecentSessions, seed.exerciseLibrary, referenceDate);
  const emptyState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);

  assert.ok(loadedState.metrics.recoveryIndex.score < emptyState.metrics.recoveryIndex.score);
  assert.ok(loadedState.metrics.recoveryIndex.rolling3dLoad > 0);
  assert.ok(loadedState.metrics.recoveryIndex.score >= 0 && loadedState.metrics.recoveryIndex.score <= 100);
}

function testRecoveryIndexFallsBackCleanlyWithNoRecentLoad() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const trainingState = getProfileTrainingState(joshua, [], seed.exerciseLibrary, referenceDate);

  assert.equal(trainingState.metrics.recoveryIndex.score, 100);
  assert.equal(trainingState.metrics.recoveryIndex.rolling3dLoad, 0);
  assert.equal(trainingState.metrics.recoveryIndex.completionPenalty, 0);
  assert.equal(trainingState.metrics.recoveryIndex.restPenalty, 0);
}

function testProgressVelocityDetectsImprovingExerciseWindow() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "pv-recent",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 50,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "a", weight: 34, reps: 9, completed: true, rir: 1 },
            { id: "b", weight: 34, reps: 9, completed: true, rir: 1 },
          ],
        },
      ],
    },
    {
      id: "pv-baseline",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-02-18T09:00:00.000Z",
      durationMinutes: 50,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "a", weight: 30, reps: 8, completed: true, rir: 3 },
            { id: "b", weight: 30, reps: 8, completed: true, rir: 3 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.ok(trainingState.metrics.progressVelocity.byRegion.upperChest > 0);
  assert.ok(trainingState.metrics.stimulusToFatigueRatio.byExercise.length > 0);
}

function testProgressVelocityStaysStableWithSparseHistory() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "pv-sparse",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 42,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [{ id: "a", weight: 60, reps: 10, completed: true }],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.equal(trainingState.metrics.progressVelocity.byRegion.lats, 0);
  assert.ok(Number.isFinite(trainingState.metrics.progressVelocity.average));
}

function testSfrStaysFiniteWithMissingRirAndZeroDuration() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  // Missing RIR should fall back conservatively to 3.
  // Zero duration should still produce a stable density/fatigue path via safe guards.
  const sessions = [
    {
      id: "sfr-fallback-1",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 0,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "cable-curl-day2",
          exerciseName: "Cable Curl",
          muscleGroup: "Biceps" as const,
          sets: [
            { id: "a", weight: 20, reps: 12, completed: true },
            { id: "b", weight: 20, reps: 12, completed: true },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const bicepsSfr = trainingState.metrics.stimulusToFatigueRatio.byRegion.biceps;
  const density = trainingState.metrics.densityScore.bySession[0]?.density ?? 0;

  assert.ok(Number.isFinite(bicepsSfr));
  assert.ok(bicepsSfr > 0);
  assert.ok(Number.isFinite(density));
  assert.ok(density > 0);
}

function testNextFocusUsesMetricsAwareCoverageRanking() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "focus-metrics-1",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-23T08:30:00.000Z",
      durationMinutes: 55,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "a", weight: 70, reps: 8, completed: true, rir: 1 },
            { id: "b", weight: 70, reps: 8, completed: true, rir: 1 },
            { id: "c", weight: 70, reps: 8, completed: true, rir: 1 },
            { id: "d", weight: 70, reps: 8, completed: true, rir: 1 },
          ],
        },
        {
          exerciseId: "hammer-curl-day2",
          exerciseName: "Hammer Curl",
          muscleGroup: "Biceps" as const,
          sets: [
            { id: "e", weight: 20, reps: 10, completed: true, rir: 2 },
            { id: "f", weight: 20, reps: 10, completed: true, rir: 2 },
            { id: "g", weight: 20, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.deepEqual(trainingState.trainingLoad.summary.suggestedNextFocus.labels, ["Upper chest", "Side delts"]);
}

function testNextFocusMixedDataAvoidsWellCoveredPriority() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sessions = [
    {
      id: "mixed-next-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T08:00:00.000Z",
      durationMinutes: 58,
      sessionRpe: 9,
      feeling: "Tough" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: Array.from({ length: 8 }, (_, index) => ({
            id: `g-${index}`,
            weight: 60,
            reps: 8,
            completed: true,
            rir: 0,
          })),
        },
      ],
    },
    {
      id: "mixed-next-2",
      userId: "natasha",
      workoutDayId: "natasha-back-arms",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-22T08:00:00.000Z",
      durationMinutes: 46,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2-nat",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "l-1", weight: 45, reps: 10, completed: true, rir: 2 },
            { id: "l-2", weight: 45, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, referenceDate);

  assert.ok(!trainingState.trainingLoad.summary.suggestedNextFocus.labels.includes("Upper glutes"));
  assert.ok(
    trainingState.trainingLoad.summary.suggestedNextFocus.labels.includes("Upper back") ||
      trainingState.trainingLoad.summary.suggestedNextFocus.labels.includes("Side glutes") ||
      trainingState.trainingLoad.summary.suggestedNextFocus.labels.includes("Obliques"),
  );
}

function testProfileTargetMultipliersDivergeByPriorityModel() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(joshua);
  assert.ok(natasha);

  const joshuaState = getProfileTrainingState(joshua, [], seed.exerciseLibrary, referenceDate);
  const natashaState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);

  const joshuaUpperChest = joshuaState.metrics.regionMetrics.find((metric) => metric.zoneId === "upperChest");
  const joshuaGluteMax = joshuaState.metrics.regionMetrics.find((metric) => metric.zoneId === "gluteMax");
  const natashaUpperChest = natashaState.metrics.regionMetrics.find((metric) => metric.zoneId === "upperChest");
  const natashaGluteMax = natashaState.metrics.regionMetrics.find((metric) => metric.zoneId === "gluteMax");

  assert.ok(joshuaUpperChest && joshuaGluteMax && natashaUpperChest && natashaGluteMax);
  assert.ok(joshuaUpperChest.priorityMultiplier > 1);
  assert.equal(natashaUpperChest.priorityMultiplier, 1);
  assert.ok(natashaGluteMax.priorityMultiplier > joshuaGluteMax.priorityMultiplier);
}

function testRecoveryModifierSoftensTargetEVSWhenRecoveryDrops() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const heavyRecentSessions = [
    {
      id: "recovery-target-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T08:00:00.000Z",
      durationMinutes: 70,
      sessionRpe: 9,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "machine-hip-thrust-day1", exerciseName: "Machine Hip Thrust", muscleGroup: "Glutes" as const, sets: [{ id: "a", weight: 60, reps: 8, completed: true }] }],
    },
    {
      id: "recovery-target-2",
      userId: "natasha",
      workoutDayId: "natasha-back-arms",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-22T08:00:00.000Z",
      durationMinutes: 65,
      sessionRpe: 8.8,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "lat-pulldown-day2-nat", exerciseName: "Lat Pulldown", muscleGroup: "Back" as const, sets: [{ id: "a", weight: 45, reps: 10, completed: true }] }],
    },
    {
      id: "recovery-target-3",
      userId: "natasha",
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-21T08:00:00.000Z",
      durationMinutes: 60,
      sessionRpe: 8.7,
      feeling: "Tough" as const,
      exercises: [{ exerciseId: "leg-press-day3-nat", exerciseName: "Leg Press", muscleGroup: "Quads" as const, sets: [{ id: "a", weight: 120, reps: 10, completed: true }] }],
    },
  ];

  const loadedState = getProfileTrainingState(natasha, heavyRecentSessions, seed.exerciseLibrary, referenceDate);
  const emptyState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);

  const loadedGlute = loadedState.metrics.regionMetrics.find((metric) => metric.zoneId === "gluteMax");
  const emptyGlute = emptyState.metrics.regionMetrics.find((metric) => metric.zoneId === "gluteMax");

  assert.ok(loadedGlute && emptyGlute);
  assert.ok(loadedGlute.recoveryModifier <= emptyGlute.recoveryModifier);
  assert.ok(loadedGlute.targetEVS < emptyGlute.targetEVS);
}

function testHiddenMetricsLayerBuildsDensityAdaptationConsistencyAndSymmetry() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "hidden-metrics-1",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 48,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "a", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "b", weight: 32, reps: 8, completed: true, rir: 1 },
            { id: "c", weight: 32, reps: 8, completed: true, rir: 1 },
          ],
        },
      ],
    },
    {
      id: "hidden-metrics-2",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-20T09:00:00.000Z",
      durationMinutes: 52,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "a", weight: 65, reps: 8, completed: true, rir: 2 },
            { id: "b", weight: 65, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.ok(trainingState.metrics.densityScore.average > 0);
  assert.ok(trainingState.metrics.densityScore.bySession.length >= 1);
  assert.ok(trainingState.metrics.adaptationScore.byRegion.upperChest > 0);
  assert.ok(trainingState.metrics.consistencyScore.score >= 0 && trainingState.metrics.consistencyScore.score <= 100);
  assert.ok(trainingState.metrics.symmetryScore.score >= 0 && trainingState.metrics.symmetryScore.score <= 100);
}

function testSymmetryAndConsistencyRespectBoundaries() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const emptyState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);
  assert.equal(emptyState.metrics.consistencyScore.score, 0);
  assert.equal(emptyState.metrics.symmetryScore.score, 100);

  const imbalancedSessions = [
    {
      id: "symmetry-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 40,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: Array.from({ length: 10 }, (_, index) => ({
            id: `imb-${index}`,
            weight: 55,
            reps: 8,
            completed: true,
            rir: 1,
          })),
        },
      ],
    },
  ];

  const imbalancedState = getProfileTrainingState(natasha, imbalancedSessions, seed.exerciseLibrary, referenceDate);

  assert.ok(imbalancedState.metrics.symmetryScore.score >= 0 && imbalancedState.metrics.symmetryScore.score <= 100);
  assert.ok(imbalancedState.metrics.symmetryScore.score < 100);
  assert.ok(imbalancedState.metrics.consistencyScore.score >= 0 && imbalancedState.metrics.consistencyScore.score <= 100);
}

function testAdaptationScoreDropsWithRepeatedExposure() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const repeatedSessions = Array.from({ length: 10 }, (_, index) => ({
    id: `adapt-${index}`,
    userId: "natasha" as const,
    workoutDayId: "natasha-glutes-hams",
    workoutName: "Glutes + Hamstrings",
    performedAt: `2026-03-${String(Math.max(1, 23 - index)).padStart(2, "0")}T09:00:00.000Z`,
    durationMinutes: 45,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "machine-hip-thrust-day1",
        exerciseName: "Machine Hip Thrust",
        muscleGroup: "Glutes" as const,
        sets: [{ id: `a-${index}`, weight: 50, reps: 8, completed: true }],
      },
    ],
  }));

  const trainingState = getProfileTrainingState(natasha, repeatedSessions, seed.exerciseLibrary, referenceDate);
  const topExposure = trainingState.metrics.adaptationScore.exposuresByExercise[0];

  assert.ok(topExposure);
  assert.ok(topExposure.sessionsUsedLast42d >= 9);
  assert.ok(topExposure.noveltyFactor < 1);
}

function testTrainingInsightsStayCentralizedAndActionable() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "insight-1",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-23T08:30:00.000Z",
      durationMinutes: 55,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "a", weight: 70, reps: 8, completed: true, rir: 1 },
            { id: "b", weight: 70, reps: 8, completed: true, rir: 1 },
            { id: "c", weight: 70, reps: 8, completed: true, rir: 1 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);

  assert.ok(trainingState.insights.homeAction.length > 0);
  assert.ok(trainingState.insights.completionNext.length > 0);
  assert.ok(trainingState.insights.focusDirection.includes("Upper chest"));
  assert.ok(trainingState.insights.progressSignal.length > 0);
}

function testProgressSignalsUseRealWeeklyStretchCountAndSafeEmptyFallback() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const stretchCompletions = [
    {
      id: "stretch-1",
      userId: "natasha" as const,
      date: "2026-03-23T08:00:00.000Z",
      stretchTitle: "Couch stretch",
    },
    {
      id: "stretch-2",
      userId: "natasha" as const,
      date: "2026-03-24T08:00:00.000Z",
      stretchTitle: "Hamstring fold",
    },
  ];

  const trainingState = getProfileTrainingState(
    natasha,
    [],
    seed.exerciseLibrary,
    referenceDate,
    stretchCompletions,
  );

  assert.equal(trainingState.progressSignals.leadingIndicator.value, "Waiting on first session");
  assert.equal(trainingState.progressSignals.primarySignal.value, "Fresh week");
  assert.ok(trainingState.progressSignals.supportSignal.detail.includes("2 mobility sessions logged this week"));
}

function testPhase1RirIntelligenceHandlesMissingRirAndBoundsRisk() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "phase1-rir-1",
      userId: "joshua",
      workoutDayId: "joshua-back-biceps",
      workoutName: "Back + Biceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "a", weight: 60, reps: 10, completed: true },
            { id: "b", weight: 60, reps: 10, completed: true },
            { id: "c", weight: 60, reps: 10, completed: true, rir: 4 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const lats = trainingState.metrics.rirIntelligence.byRegion.lats;

  assert.ok(lats.missingRirRatio > 0.6);
  assert.equal(lats.averageRir, 2.5);
  assert.ok(lats.confidenceScore < 100);
  assert.ok(lats.sandbagRisk >= 0.2 && lats.sandbagRisk <= 0.85);
  assert.ok(lats.overshootRisk >= 0.2 && lats.overshootRisk <= 0.85);
}

function testPhase1MevTrackerReflectsBelowAtAndAboveStates() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const emptyState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);
  assert.equal(emptyState.metrics.mevTracker.byRegion.gluteMax.status, "below");
  const gluteMaxMev = emptyState.metrics.mevTracker.byRegion.gluteMax.mevEstimate;
  const hipThrustGluteMaxPerSet = 0.625;
  const lowerAtBound = gluteMaxMev * 0.9;
  const upperAtBound = gluteMaxMev * 1.15;
  const atSetCount =
    Array.from({ length: 40 }, (_, index) => index + 1).find((count) => {
      const currentEvs = count * hipThrustGluteMaxPerSet;
      return currentEvs >= lowerAtBound && currentEvs <= upperAtBound;
    }) ?? 1;
  const aboveSetCount = Math.ceil((gluteMaxMev * 1.2) / hipThrustGluteMaxPerSet);

  const atSessions = [
    {
      id: "phase1-mev-at",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 40,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
            sets: Array.from({ length: atSetCount }, (_, index) => ({
              id: `at-${index}`,
              weight: 55,
              reps: 8,
              completed: true,
              rir: 1,
          })),
        },
      ],
    },
  ];
  const atState = getProfileTrainingState(natasha, atSessions, seed.exerciseLibrary, referenceDate);
  assert.equal(atState.metrics.mevTracker.byRegion.gluteMax.status, "at");

  const aboveSessions = [
    {
      ...atSessions[0],
      id: "phase1-mev-above",
      exercises: [
        {
          ...atSessions[0].exercises[0],
            sets: Array.from({ length: aboveSetCount }, (_, index) => ({
              id: `above-${index}`,
              weight: 55,
              reps: 8,
              completed: true,
              rir: 1,
          })),
        },
      ],
    },
  ];
  const aboveState = getProfileTrainingState(natasha, aboveSessions, seed.exerciseLibrary, referenceDate);
  assert.equal(aboveState.metrics.mevTracker.byRegion.gluteMax.status, "above");
}

function testPhase1PlateauDetectionFindsFlatCoveredAdherentRegion() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const buildChestSession = (
    id: string,
    performedAt: string,
    reps: number,
    workoutDayId: string,
    setCount = 8,
  ) => ({
    id,
    userId: "joshua" as const,
    workoutDayId,
    workoutName: workoutDayId === "joshua-chest-triceps" ? "Chest + Triceps A" : "Chest + Triceps B",
    performedAt,
    durationMinutes: 52,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: `${workoutDayId}-${id}`,
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: Array.from({ length: setCount }, (_, index) => ({
          id: `${id}-${index}`,
          weight: 30,
          reps,
          completed: true,
          rir: 2,
        })),
      },
    ],
  });

  const sessions = [
    buildChestSession("plateau-c1", "2026-03-23T06:00:00.000Z", 6, "joshua-chest-triceps"),
    buildChestSession("plateau-c2", "2026-03-23T09:00:00.000Z", 6, "joshua-chest-triceps-b"),
    buildChestSession("plateau-c3", "2026-03-23T12:00:00.000Z", 6, "joshua-chest-triceps"),
    buildChestSession("plateau-c4", "2026-03-23T15:00:00.000Z", 6, "joshua-chest-triceps-b"),
    buildChestSession("plateau-p1", "2026-03-16T06:00:00.000Z", 7, "joshua-chest-triceps"),
    buildChestSession("plateau-p2", "2026-03-15T09:00:00.000Z", 7, "joshua-chest-triceps-b"),
    buildChestSession("plateau-p3", "2026-03-14T12:00:00.000Z", 7, "joshua-chest-triceps"),
    buildChestSession("plateau-p4", "2026-03-13T15:00:00.000Z", 7, "joshua-chest-triceps-b"),
    buildChestSession("plateau-o1", "2026-03-08T06:00:00.000Z", 8, "joshua-chest-triceps"),
    buildChestSession("plateau-o2", "2026-03-07T09:00:00.000Z", 8, "joshua-chest-triceps-b"),
    buildChestSession("plateau-o3", "2026-03-06T12:00:00.000Z", 8, "joshua-chest-triceps"),
    buildChestSession("plateau-o4", "2026-03-05T15:00:00.000Z", 8, "joshua-chest-triceps-b"),
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const upperChestPlateau = trainingState.metrics.plateauDetection.byRegion.upperChest;

  assert.equal(upperChestPlateau.weeksFlat, 2);
  assert.ok(upperChestPlateau.weeklyCoveragePct >= 75);
  assert.ok(upperChestPlateau.adherence >= 0.7);
  assert.equal(upperChestPlateau.plateauDetected, true);
  assert.ok(trainingState.metrics.phase1Insights.progressInsight?.includes("flat"));
}

function testPhase2MrvEstimatorFlagsPressureNearCeiling() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "mrv-1",
      userId: "joshua",
      workoutDayId: "joshua-shoulders-legs",
      workoutName: "Shoulders + Legs",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 72,
      sessionRpe: 9,
      feeling: "Tough" as const,
      exercises: [
        {
          exerciseId: "hack-squat-heavy",
          exerciseName: "Hack Squat",
          muscleGroup: "Quads" as const,
          sets: Array.from({ length: 14 }, (_, index) => ({
            id: `mrv-${index}`,
            weight: 120,
            reps: 8,
            completed: true,
            rir: 1,
          })),
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const quadsMrv = trainingState.metrics.mrvEstimator.byRegion.quads;

  assert.ok(quadsMrv.mrvPressure > 0);
  assert.ok(Number.isFinite(quadsMrv.mrvPressure));
  assert.ok(quadsMrv.estimatedMrv > 0);
}

function testPhase2VelocityLossHandlesDropoffAndConfidence() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sessions = [
    {
      id: "velocity-1",
      userId: "natasha",
      workoutDayId: "natasha-back-arms",
      workoutName: "Back + Biceps",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 44,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "lat-pulldown-day2-nat",
          exerciseName: "Lat Pulldown",
          muscleGroup: "Back" as const,
          sets: [
            { id: "a", weight: 40, reps: 12, completed: true, rir: 2 },
            { id: "b", weight: 45, reps: 10, completed: true, rir: 2 },
            { id: "c", weight: 50, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, referenceDate);
  const latsVelocityLoss = trainingState.metrics.velocityLoss.byRegion.lats;

  assert.ok(latsVelocityLoss.repDropoff > 0.25);
  assert.equal(latsVelocityLoss.fatigueSignal, "high");
  assert.ok(latsVelocityLoss.confidenceScore < 100);
}

function testPhase2RecoveryCurveSupportsSparseAndRecoveredCases() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sparseState = getProfileTrainingState(joshua, [], seed.exerciseLibrary, referenceDate);
  assert.equal(sparseState.metrics.recoveryCurve.byRegion.upperChest.recoverySpeed, "unknown");

  const sessions = [
    {
      id: "curve-1",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-18T08:00:00.000Z",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "a1", weight: 30, reps: 8, completed: true, rir: 2 },
            { id: "a2", weight: 30, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "curve-2",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps-b",
      workoutName: "Chest + Triceps B",
      performedAt: "2026-03-19T08:00:00.000Z",
      durationMinutes: 48,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day4",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "b1", weight: 30, reps: 6, completed: true, rir: 2 },
            { id: "b2", weight: 30, reps: 6, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "curve-3",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-20T20:00:00.000Z",
      durationMinutes: 48,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [
            { id: "c1", weight: 30, reps: 8, completed: true, rir: 2 },
            { id: "c2", weight: 30, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const recoveredState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const upperChestCurve = recoveredState.metrics.recoveryCurve.byRegion.upperChest;

  assert.ok(upperChestCurve.eventCount >= 1);
  assert.equal(upperChestCurve.recoverySpeed, "fast");
  assert.ok((upperChestCurve.avgRecoveryHours ?? 0) <= 36);
}

function testPhase3RepRangeBiasFindsBestRespondingBucket() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const buildSession = (
    id: string,
    performedAt: string,
    exerciseName: string,
    reps: number,
    workoutDayId = "joshua-chest-triceps",
  ) => ({
    id,
    userId: "joshua" as const,
    workoutDayId,
    workoutName: "Chest + Triceps A",
    performedAt,
    durationMinutes: 48,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: `${id}-1`,
        exerciseName,
        muscleGroup: "Chest" as const,
        sets: [
          { id: `${id}-a`, weight: 30, reps, completed: true, rir: 2 },
          { id: `${id}-b`, weight: 30, reps, completed: true, rir: 2 },
          { id: `${id}-c`, weight: 30, reps, completed: true, rir: 2 },
        ],
      },
    ],
  });

  const sessions = [
    buildSession("rr-recent-1", "2026-03-21T08:00:00.000Z", "Incline Dumbbell Press", 12),
    buildSession("rr-recent-2", "2026-03-19T08:00:00.000Z", "Incline Dumbbell Press", 11),
    buildSession("rr-recent-3", "2026-03-17T08:00:00.000Z", "Incline Dumbbell Press", 12),
    buildSession("rr-recent-4", "2026-03-15T08:00:00.000Z", "Incline Dumbbell Press", 11),
    buildSession("rr-base-1", "2026-02-20T08:00:00.000Z", "Incline Dumbbell Press", 8),
    buildSession("rr-base-2", "2026-02-18T08:00:00.000Z", "Incline Dumbbell Press", 8),
    buildSession("rr-high-1", "2026-03-22T08:00:00.000Z", "Cable Fly", 16),
    buildSession("rr-high-2", "2026-03-14T08:00:00.000Z", "Cable Fly", 15),
    buildSession("rr-high-base-1", "2026-02-19T08:00:00.000Z", "Cable Fly", 15),
    buildSession("rr-high-base-2", "2026-02-17T08:00:00.000Z", "Cable Fly", 15),
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const upperChestBias = trainingState.metrics.repRangeBias.byRegion.upperChest;

  assert.equal(upperChestBias.bestRespondingRepRange, "10-15");
  assert.ok(upperChestBias.byBucket["10-15"].score > upperChestBias.byBucket["15-20"].score);
  assert.ok(upperChestBias.confidenceScore > 0);
}

function testPhase3SpilloverAdjustsIndirectFatigue() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const sessions = [
    {
      id: "spillover-1",
      userId: "joshua",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-23T09:00:00.000Z",
      durationMinutes: 58,
      sessionRpe: 8.5,
      feeling: "Tough" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: Array.from({ length: 6 }, (_, index) => ({
            id: `spill-${index}`,
            weight: 34,
            reps: 8,
            completed: true,
            rir: 1,
          })),
        },
      ],
    },
  ];

  const trainingState = getProfileTrainingState(joshua, sessions, seed.exerciseLibrary, referenceDate);
  const frontDelts = trainingState.metrics.spilloverAdjustedFatigue.byRegion.frontDelts;

  assert.ok(frontDelts.spilloverFatigue > 0);
  assert.ok(frontDelts.adjustedRegionFatigue > frontDelts.directRegionFatigue);
  assert.equal(frontDelts.topSources[0]?.zoneId, "upperChest");
}

function testPhase3HandlesSparseAdaptiveHistorySafely() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(natasha);

  const sparseState = getProfileTrainingState(natasha, [], seed.exerciseLibrary, referenceDate);
  assert.equal(sparseState.metrics.repRangeBias.byRegion.gluteMax.bestRespondingRepRange, null);
  assert.equal(sparseState.metrics.exerciseFatigueFingerprints.byExercise.length, 0);
  assert.ok(Number.isFinite(sparseState.metrics.spilloverAdjustedFatigue.byRegion.gluteMax.adjustedRegionFatigue));

  const sessions = [
    {
      id: "fingerprint-1",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-18T08:00:00.000Z",
      durationMinutes: 50,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "fp-a", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "fp-b", weight: 60, reps: 9, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "fingerprint-2",
      userId: "natasha",
      workoutDayId: "natasha-glutes-quads",
      workoutName: "Glutes + Quads",
      performedAt: "2026-03-20T08:00:00.000Z",
      durationMinutes: 50,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day3",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "fp-c", weight: 60, reps: 8, completed: true, rir: 2 },
            { id: "fp-d", weight: 60, reps: 8, completed: true, rir: 2 },
          ],
        },
      ],
    },
    {
      id: "fingerprint-3",
      userId: "natasha",
      workoutDayId: "natasha-glutes-hams",
      workoutName: "Glutes + Hamstrings",
      performedAt: "2026-03-23T20:00:00.000Z",
      durationMinutes: 50,
      feeling: "Strong" as const,
      exercises: [
        {
          exerciseId: "machine-hip-thrust-day1",
          exerciseName: "Machine Hip Thrust",
          muscleGroup: "Glutes" as const,
          sets: [
            { id: "fp-e", weight: 60, reps: 10, completed: true, rir: 2 },
            { id: "fp-f", weight: 60, reps: 10, completed: true, rir: 2 },
          ],
        },
      ],
    },
  ];

  const recoveredState = getProfileTrainingState(natasha, sessions, seed.exerciseLibrary, referenceDate);
  const fingerprint = recoveredState.metrics.exerciseFatigueFingerprints.byExercise.find(
    (entry) => entry.exerciseName === "Machine Hip Thrust",
  );

  assert.ok(fingerprint);
  assert.ok(Number.isFinite(fingerprint.systemicFatigueScore));
  assert.ok(Number.isFinite(fingerprint.localFatigueScore));
  assert.ok(Number.isFinite(fingerprint.efficiencyScore));
}

function testExerciseLibraryCanonicalization() {
  const seed = createSeedState();
  const dedupedMachineHipThrusts = seed.exerciseLibrary.filter((exercise) => exercise.name === "Machine Hip Thrust");
  assert.equal(dedupedMachineHipThrusts.length, 1);
  assert.ok(findExerciseLibraryItemByName(seed.exerciseLibrary, "Straight-Arm Pulldown"));
  assert.ok(findExerciseLibraryItemByName(seed.exerciseLibrary, "Machine Row"));
}

function testFavoriteIdsStayResolvable() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");
  assert.ok(natasha);

  const resolvableFavorites = natasha.favoriteExerciseIds.filter(
    (id) =>
      seed.exerciseLibrary.some((exercise) => exercise.id === id) ||
      natasha.workoutPlan.some((workout) => workout.exercises.some((exercise) => exercise.id === id)),
  );

  assert.equal(resolvableFavorites.length, natasha.favoriteExerciseIds.length);
  assert.equal(buildCanonicalExerciseLibrary(seed.exerciseLibrary).length, seed.exerciseLibrary.length);
}

function testDailyMobilityPromptSelection() {
  const prompt = selectDailyMobilityPrompt("joshua", new Date("2026-01-01T12:00:00+13:00"));

  assert.deepEqual(prompt.focusRegions, ["Hips", "Control"]);
  assert.equal(prompt.primaryStretch.name, "Deep hip flexor stretch");
  assert.equal(prompt.ctaLabel, "Start 30s");
  assert.equal(prompt.rotationDay, 1);
}

function testMobilityRotationAvoidsLongRepeats() {
  const focusKeys = Array.from({ length: 30 }, (_, index) =>
    selectDailyMobilityPrompt("natasha", new Date(`2026-01-${String(index + 1).padStart(2, "0")}T12:00:00+13:00`)).key,
  );

  let streak = 1;
  for (let index = 1; index < focusKeys.length; index += 1) {
    streak = focusKeys[index] === focusKeys[index - 1] ? streak + 1 : 1;
    assert.ok(streak <= 2);
  }
}

function testStretchCompletionDedupesSameDay() {
  const seed = createSeedState();
  const withOne = addStretchCompletion(seed, "natasha", "Couch stretch");
  const withTwo = addStretchCompletion(withOne, "natasha", "Couch stretch");

  assert.equal(withOne.stretchCompletions.natasha.length, 1);
  assert.equal(withTwo.stretchCompletions.natasha.length, 1);
}

function testAppendSessionClearsActiveWorkoutAndQueuesOverride() {
  const seed = createSeedState();
  const state = {
    ...seed,
    activeWorkout: {
      id: "active-1",
      userId: "joshua",
      startedAt: "2026-03-23T10:00:00.000Z",
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      exercises: [],
    },
  };
  const session = {
    id: "session-1",
    userId: "joshua",
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A (Partial)",
    performedAt: "2026-03-23T11:00:00.000Z",
    durationMinutes: 20,
    feeling: "Solid" as const,
    partial: true,
    exercises: [],
  };

  const next = appendSession(state, session, {
    clearActiveWorkoutForUser: "joshua",
    nextWorkoutId: "joshua-chest-triceps",
  });

  assert.equal(next.activeWorkout, null);
  assert.equal(next.sessions[0]?.id, "session-1");
  assert.equal(next.workoutOverrides.joshua.nextWorkoutId, "joshua-chest-triceps");
}

function testReplaceSessionAdvanceCycleClearsQueuedWorkout() {
  const seed = createSeedState();
  const session = {
    id: "session-1",
    userId: "natasha",
    workoutDayId: "natasha-glutes-hams",
    workoutName: "Glutes + Hamstrings (Partial)",
    performedAt: "2026-03-23T11:00:00.000Z",
    durationMinutes: 22,
    feeling: "Solid" as const,
    partial: true,
    exercises: [],
  };

  const state = {
    ...seed,
    sessions: [session],
    workoutOverrides: {
      ...seed.workoutOverrides,
      natasha: {
        nextWorkoutId: "natasha-glutes-hams",
        updatedAt: "2026-03-23T12:00:00.000Z",
      },
    },
  };

  const updatedSession = {
    ...session,
    workoutName: "Glutes + Hamstrings",
    partial: undefined,
  };

  const next = replaceSession(state, updatedSession, { advanceWorkoutCycle: true });

  assert.equal(next.sessions[0]?.workoutName, "Glutes + Hamstrings");
  assert.equal(next.workoutOverrides.natasha.nextWorkoutId, null);
}

function testMuscleCeilingDetectsRepOnlyProgressThenShiftsRepRange() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const chestSessions = [
    { id: "ceiling-c1", date: "2026-03-01T08:00:00+13:00", weight: 30, reps: 8 },
    { id: "ceiling-c2", date: "2026-03-05T08:00:00+13:00", weight: 30, reps: 9 },
    { id: "ceiling-c3", date: "2026-03-09T08:00:00+13:00", weight: 30, reps: 10 },
    { id: "ceiling-c4", date: "2026-03-13T08:00:00+13:00", weight: 30, reps: 10 },
    { id: "ceiling-c5", date: "2026-03-17T08:00:00+13:00", weight: 30, reps: 10 },
    { id: "ceiling-c6", date: "2026-03-21T08:00:00+13:00", weight: 30, reps: 10 },
  ].map((entry) => ({
    id: entry.id,
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt: entry.date,
    durationMinutes: 45,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [{ id: `${entry.id}-set`, weight: entry.weight, reps: entry.reps, completed: true }],
      },
    ],
  }));

  const ceiling = getMuscleCeilingState(joshua, "Chest", chestSessions);
  assert.equal(ceiling.ceilingDetected, true);
  assert.equal(ceiling.sessionsSinceProgress, 3);
  assert.equal(ceiling.ceilingType, "weight");
  assert.equal(ceiling.suggestedResponse, "rep_range_shift");

  const session = getSuggestedFocusSession(
    "joshua",
    joshua.workoutPlan,
    { zoneIds: ["upperChest"], labels: ["Upper chest"], text: "Upper chest first" },
    seed.exerciseLibrary,
    undefined,
    null,
    [ceiling],
  );

  assert.ok(session);
  const chestMove = session.exercises.find((exercise) => exercise.muscleGroup === "Chest");
  assert.ok(chestMove);
  assert.equal(chestMove.repRange, "12-15");
  assert.equal(chestMove.suggestedRepTarget, 12);
  assert.equal(session.ceilingPreviewLine, "Shifting the rep range on chest.");
}

function testMuscleCeilingCanSwapTechniqueAndEscalateToRest() {
  const seed = createSeedState();
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(natasha);
  assert.ok(joshua);

  const backSessions = [
    { id: "back-1", date: "2026-03-01T08:00:00+13:00", weight: 55, reps: 8 },
    { id: "back-2", date: "2026-03-05T08:00:00+13:00", weight: 57.5, reps: 8 },
    { id: "back-3", date: "2026-03-09T08:00:00+13:00", weight: 60, reps: 8 },
    { id: "back-4", date: "2026-03-13T08:00:00+13:00", weight: 60, reps: 8 },
    { id: "back-5", date: "2026-03-17T08:00:00+13:00", weight: 60, reps: 8 },
    { id: "back-6", date: "2026-03-21T08:00:00+13:00", weight: 60, reps: 8 },
  ].map((entry) => ({
    id: entry.id,
    userId: "natasha" as const,
    workoutDayId: "natasha-back-arms",
    workoutName: "Back + Biceps",
    performedAt: entry.date,
    durationMinutes: 45,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "lat-pulldown-day2-nat",
        exerciseName: "Lat Pulldown",
        muscleGroup: "Back" as const,
        sets: [{ id: `${entry.id}-set`, weight: entry.weight, reps: entry.reps, completed: true }],
      },
    ],
  }));

  const backCeiling = getMuscleCeilingState(natasha, "Back", backSessions);
  assert.equal(backCeiling.ceilingDetected, true);
  assert.equal(backCeiling.ceilingType, "reps");
  assert.equal(backCeiling.suggestedResponse, "technique_swap");

  const swappedSession = getSuggestedFocusSession(
    "natasha",
    natasha.workoutPlan,
    { zoneIds: ["lats"], labels: ["Lats"], text: "Lats next" },
    seed.exerciseLibrary,
    undefined,
    null,
    [backCeiling],
  );

  assert.ok(swappedSession);
  const swappedBackMove = swappedSession.exercises.find((exercise) => exercise.muscleGroup === "Back");
  assert.ok(swappedBackMove);
  assert.notEqual(swappedBackMove.name, "Lat Pulldown");
  assert.equal(swappedSession.ceilingPreviewLine, "Different angle on back this session.");

  const gluteSessions = Array.from({ length: 7 }, (_, index) => ({
    id: `glute-${index + 1}`,
    userId: "joshua" as const,
    workoutDayId: "joshua-legs",
    workoutName: "Shoulders + Legs",
    performedAt: `2026-02-${String(index + 1).padStart(2, "0")}T08:00:00+13:00`,
    durationMinutes: 45,
    feeling: "Solid" as const,
    exercises: [
      {
        exerciseId: "machine-hip-thrust-day1",
        exerciseName: "Machine Hip Thrust",
        muscleGroup: "Glutes" as const,
        sets: [{ id: `glute-set-${index + 1}`, weight: 80, reps: 8, completed: true }],
      },
    ],
  }));

  const gluteCeiling = getMuscleCeilingState(joshua, "Glutes", gluteSessions);
  assert.equal(gluteCeiling.ceilingDetected, true);
  assert.equal(gluteCeiling.ceilingType, "both");
  assert.equal(gluteCeiling.sessionsSinceProgress, 5);
  assert.equal(gluteCeiling.suggestedResponse, "rest");
}

function testMuscleCeilingLogStoresAppliedResponseAndResolution() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const priorSessions = [
    {
      id: "log-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-01T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "log-1-set", weight: 30, reps: 8, completed: true }],
        },
      ],
    },
    {
      id: "log-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-05T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "log-2-set", weight: 30, reps: 9, completed: true }],
        },
      ],
    },
    {
      id: "log-3",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-09T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "log-3-set", weight: 30, reps: 10, completed: true }],
        },
      ],
    },
    {
      id: "log-4",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-13T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "log-4-set", weight: 30, reps: 10, completed: true }],
        },
      ],
    },
    {
      id: "log-5",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-17T08:00:00+13:00",
      durationMinutes: 45,
      feeling: "Solid" as const,
      exercises: [
        {
          exerciseId: "incline-dumbbell-press-day1",
          exerciseName: "Incline Dumbbell Press",
          muscleGroup: "Chest" as const,
          sets: [{ id: "log-5-set", weight: 30, reps: 10, completed: true }],
        },
      ],
    },
  ];

  const resolvedSession = {
    id: "log-6",
    userId: "joshua" as const,
    workoutDayId: "joshua-chest-triceps",
    workoutName: "Chest + Triceps A",
    performedAt: "2026-03-21T08:00:00+13:00",
    durationMinutes: 45,
    feeling: "Strong" as const,
    exercises: [
      {
        exerciseId: "incline-dumbbell-press-day1",
        exerciseName: "Incline Dumbbell Press",
        muscleGroup: "Chest" as const,
        sets: [{ id: "log-6-set", weight: 32.5, reps: 10, completed: true }],
      },
    ],
  };

  const entries = buildMuscleCeilingLogEntries(joshua, resolvedSession, priorSessions, {
    Chest: "rep_range_shift",
  });
  const chestEntry = entries.find((entry) => entry.muscleGroup === "Chest");

  assert.ok(chestEntry);
  assert.equal(chestEntry.responseApplied, "rep_range_shift");
  assert.equal(chestEntry.progressMadeThisSession, true);
  assert.equal(chestEntry.ceilingDetected, false);
  assert.equal(chestEntry.ceilingType, null);
}

function testLiftReadyScoreBuildsJoshuaReadinessAndTrend() {
  const sessions = [
    {
      id: "lift-ready-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-01T08:00:00+13:00",
      durationMinutes: 50,
      feeling: "Strong" as const,
      exercises: [
        { exerciseId: "incline-dumbbell-press-day1", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "l1", weight: 28, reps: 8, completed: true }] },
        { exerciseId: "dumbbell-shoulder-press-day3", exerciseName: "Dumbbell Shoulder Press", muscleGroup: "Shoulders" as const, sets: [{ id: "l2", weight: 20, reps: 8, completed: true }] },
      ],
    },
    {
      id: "lift-ready-2",
      userId: "joshua" as const,
      workoutDayId: "joshua-legs",
      workoutName: "Shoulders + Legs",
      performedAt: "2026-03-05T08:00:00+13:00",
      durationMinutes: 50,
      feeling: "Strong" as const,
      exercises: [
        { exerciseId: "dumbbell-shoulder-press-day3", exerciseName: "Dumbbell Shoulder Press", muscleGroup: "Shoulders" as const, sets: [{ id: "l3", weight: 22.5, reps: 8, completed: true }] },
        { exerciseId: "cable-woodchop", exerciseName: "Cable Woodchop", muscleGroup: "Core" as const, sets: [{ id: "l4", weight: 20, reps: 12, completed: true }] },
      ],
    },
    {
      id: "lift-ready-3",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-18T08:00:00+13:00",
      durationMinutes: 55,
      feeling: "Strong" as const,
      exercises: [
        { exerciseId: "incline-dumbbell-press-day1", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "l5", weight: 34, reps: 9, completed: true }] },
        { exerciseId: "flat-dumbbell-press-day1", exerciseName: "Flat Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "l6", weight: 36, reps: 9, completed: true }] },
      ],
    },
    {
      id: "lift-ready-4",
      userId: "joshua" as const,
      workoutDayId: "joshua-legs",
      workoutName: "Shoulders + Legs",
      performedAt: "2026-03-21T08:00:00+13:00",
      durationMinutes: 55,
      feeling: "Strong" as const,
      exercises: [
        { exerciseId: "dumbbell-shoulder-press-day3", exerciseName: "Dumbbell Shoulder Press", muscleGroup: "Shoulders" as const, sets: [{ id: "l7", weight: 26, reps: 9, completed: true }] },
        { exerciseId: "dumbbell-lateral-raise-day3", exerciseName: "Dumbbell Lateral Raise", muscleGroup: "Shoulders" as const, sets: [{ id: "l8", weight: 12, reps: 12, completed: true }] },
        { exerciseId: "cable-woodchop", exerciseName: "Cable Woodchop", muscleGroup: "Core" as const, sets: [{ id: "l9", weight: 24, reps: 12, completed: true }] },
      ],
    },
  ];

  const score = getLiftReadyScore(sessions, "define", new Date("2026-03-25T12:00:00+13:00"));
  assert.ok(score.compositeScore > 0);
  assert.equal(score.trend, "rising");
  assert.ok(["developing", "building", "strong", "ready"].includes(score.readinessLevel));
}

function testLiftReadyHistorySyncStoresOneWeeklyEntry() {
  const seed = createSeedState();
  const state = {
    ...seed,
    sessions: [
      {
        id: "lift-week-1",
        userId: "joshua" as const,
        workoutDayId: "joshua-chest-triceps",
        workoutName: "Chest + Triceps A",
        performedAt: "2026-03-24T08:00:00+13:00",
        durationMinutes: 50,
        feeling: "Strong" as const,
        exercises: [
          { exerciseId: "incline-dumbbell-press-day1", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "lw1", weight: 34, reps: 8, completed: true }] },
        ],
      },
    ],
  };

  const synced = syncLiftReadyHistory(state, new Date("2026-03-25T12:00:00+13:00"));
  assert.equal(synced.liftReadyHistory.length, 1);
  assert.equal(syncLiftReadyHistory(synced, new Date("2026-03-26T12:00:00+13:00")).liftReadyHistory.length, 1);
}

function testLiftReadyLineOnlyAppearsForJoshuaOutsideBuildPhase() {
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");
  const natasha = seed.profiles.find((profile) => profile.id === "natasha");

  assert.ok(joshua);
  assert.ok(natasha);

  const sessions = [
    {
      id: "lift-copy-1",
      userId: "joshua" as const,
      workoutDayId: "joshua-chest-triceps",
      workoutName: "Chest + Triceps A",
      performedAt: "2026-03-24T08:00:00+13:00",
      durationMinutes: 50,
      feeling: "Strong" as const,
      exercises: [
        { exerciseId: "incline-dumbbell-press-day1", exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest" as const, sets: [{ id: "lc1", weight: 34, reps: 8, completed: true }] },
      ],
    },
  ];

  const joshuaState = getProfileTrainingState(
    joshua,
    sessions,
    seed.exerciseLibrary,
    new Date("2026-09-20T12:00:00+13:00"),
    [],
    0,
    null,
    seed.profileCreatedAt.joshua,
    seed.profileActivationDates.joshua,
    "build",
  );
  assert.equal(typeof joshuaState.insights.liftReadyLine, "string");

  const natashaState = getProfileTrainingState(
    natasha,
    [],
    seed.exerciseLibrary,
    new Date("2026-09-20T12:00:00+13:00"),
    [],
    0,
    null,
    seed.profileCreatedAt.natasha,
    seed.profileActivationDates.natasha,
    "build",
  );
  assert.equal(natashaState.insights.liftReadyLine, null);
}

const tests = [
  ["reject invalid imported state", testInvalidImportedState],
  ["merge imported state safely", testSafeStateMerge],
  ["build streak and momentum state centrally", testStreakAndMomentumSelector],
  ["hide momentum pill without completed history", testMomentumPillHidesWithoutCompletedHistory],
  ["observe quietly before profile maturity activates", testProfileMaturityObservesThenActivates],
  ["persist profile maturity activation once it is reached", testProfileMaturitySyncStoresActivationDateOnce],
  ["suppress intelligence copy during the observation window", testObservationWindowSuppressesSignals],
  ["build weighted training age and milestone centrally", testTrainingAgeBuildsWeightedLabelAndMilestone],
  ["persist training age snapshots from session history", testTrainingAgeSyncPersistsSnapshot],
  ["build wedding date state from the single source of truth", testWeddingDateServiceBuildPhaseUsesCurrentYearWedding],
  ["transition wedding date state through peak week and complete", testWeddingDateServiceTransitionsThroughWeddingWeekAndComplete],
  ["build wedding phase profiles and transition copy centrally", testWeddingPhaseProfileShiftsPrioritiesAndTransitionCopy],
  ["shape wedding-week suggested sessions from the phase profile", testWeddingWeekSuggestedSessionUsesPhaseProfile],
  ["build wedding countdown card state from the same date engine", testWeddingCountdownCardStateSwitchesFromWeeksToDaysAndHidesAfter],
  ["build Natasha priority locks by wedding phase", testNatashaPriorityLockReturnsPhaseSpecificShapeStack],
  ["keep Natasha define sessions tied to back or waist detail", testNatashaDefineSessionAlwaysCarriesBackOrWaistSecondary],
  ["protect Natasha peak and wedding-week sessions from soreness risk", testNatashaPeakAndWeddingSessionsProtectAgainstSoreness],
  ["build Natasha waist protocol rules by phase", testWaistProtocolOnlyActivatesOutsideBuildAndUsesPhaseRules],
  ["weave Natasha waist work quietly into define sessions", testNatashaWaistProtocolWeavesQuietCoreWorkIntoDefineSession],
  ["keep Natasha waist work light in peak and wedding week", testNatashaWaistProtocolStaysLightInPeakAndWeddingWeek],
  ["activate Natasha back reveal only in the final eight weeks", testBackRevealActivatesOnlyInsideFinalEightWeeks],
  ["quietly add Natasha back reveal work to non-back sessions", testNatashaBackRevealAddsQuietBackWorkToGluteDays],
  ["avoid double-adding Natasha back reveal on back days and keep peak light", testNatashaBackRevealDoesNotDoubleAddOnBackDaysAndStaysLightAtPeak],
  ["detect signature lifts from repeated real work", testSignatureLiftsRequireEnoughHistoryAndRankTopThree],
  ["advance week streak haptics only on new milestones", testWeekStreakMilestoneOnlyAdvancesToNewThreshold],
  ["detect PR approach from live set entry against prior best", testPrApproachDetectionUsesPreviousBestWindow],
  ["guard haptics from duplicate and burst firing", testHapticGuardDropsSpamAndDuplicateWindows],
  ["fire live signals from mid-session reads", testLiveSessionSignalPrefersPrCloseAndRotatesCopy],
  ["only bank live signals after fatigue has context", testLiveSessionSignalBanksOnlyAfterFirstSessionOfWeek],
  ["suppress repeat live signals and log them cleanly", testLiveSessionSignalStaysQuietWhenAlreadyFiredAndBuildsLogEntry],
  ["detect a strong day from improved set-two performance", testStrongDayStateDetectsImprovedSecondSetAgainstLastSession],
  ["let strong day override other live signals and persist cleanly", testStrongDaySignalOverridesPrCloseAndLogsMetadata],
  ["keep strong day quiet when reps fall at higher load", testStrongDayDoesNotFireWhenRepsDropAtHigherWeight],
  ["rank weekly rivalry by sessions before volume", testWeeklyRivalryStatePrefersSessionsThenVolume],
  ["build rivalry copy for ties and settled weeks", testWeeklyRivalryCardCopyHandlesTiesAndWeekComplete],
  ["track wedding rivalry goal adherence and tone centrally", testWeddingRivalryStateTracksGoalAdherenceAndTone],
  ["add the wedding-goal row to rivalry copy before the date", testRivalryCardCopyAddsWeddingGoalLayerBeforeWeddingOnly],
  ["detect stolen days and streak them quietly", testStealStateTracksLatestStealAndRunLength],
  ["add steal-aware rivalry copy from the viewer perspective", testRivalryCopyAddsStealDetailFromViewerPerspective],
  ["archive the previous rivalry week once", testWeeklyRivalryArchiveStoresPreviousWeekOnce],
  ["archive steal events once when the week rolls", testStealArchiveStoresPastStealsOnce],
  ["build a monthly reckoning from session history", testMonthlyReportCardBuildsMonthReckoning],
  ["archive the previous month report once", testMonthlyReportArchiveStoresPreviousMonthOnce],
  ["mark scheduled rest days centrally", testScheduledRestDayBuildsRestState],
  ["rest when recovery is low on a planned day", testRecoveryNeededRestDayUsesRecoveryIndex],
  ["treat missed planned day as reset rest", testSkippedPlannedDayTurnsIntoRestReset],
  ["bias next focus away from just-trained zones", testRecoveryAwareNextFocus],
  ["keep suggested session actionable", testSuggestedSessionIsActionable],
  ["keep low-activity focus from repeating the freshest priority", testLowActivityFocusStillAvoidsJustTrainedPriority],
  ["spread suggested session across useful patterns", testSuggestedSessionSpreadsFocusAcrossPatterns],
  ["detect muscle ceilings and shift rep ranges centrally", testMuscleCeilingDetectsRepOnlyProgressThenShiftsRepRange],
  ["swap or rest muscle groups when ceilings persist", testMuscleCeilingCanSwapTechniqueAndEscalateToRest],
  ["log ceiling responses and clear them once progress resumes", testMuscleCeilingLogStoresAppliedResponseAndResolution],
  ["build Joshua lift-ready score and trend centrally", testLiftReadyScoreBuildsJoshuaReadinessAndTrend],
  ["store one lift-ready history snapshot per week", testLiftReadyHistorySyncStoresOneWeeklyEntry],
  ["show lift-ready copy only for Joshua outside build phase", testLiftReadyLineOnlyAppearsForJoshuaOutsideBuildPhase],
  ["build effective volume and coverage metrics", testMetricsLayerBuildsEffectiveVolumeCoverage],
  ["calculate exact EVS for single-zone work", testEVSCalculatesExactlyForSingleZoneExercise],
  ["clamp weekly coverage at one hundred twenty five percent", testCoverageClampsAtOneHundredTwentyFivePercent],
  ["drop recovery index under stacked recent fatigue", testRecoveryIndexRespondsToAccumulatedRecentLoad],
  ["fall back to a clean recovery score with no recent load", testRecoveryIndexFallsBackCleanlyWithNoRecentLoad],
  ["detect positive progress velocity from improving work", testProgressVelocityDetectsImprovingExerciseWindow],
  ["keep progress velocity stable with sparse history", testProgressVelocityStaysStableWithSparseHistory],
  ["keep sfr finite with missing rir and zero duration", testSfrStaysFiniteWithMissingRirAndZeroDuration],
  ["rank next focus from metrics-aware deficits", testNextFocusUsesMetricsAwareCoverageRanking],
  ["avoid well-covered regions in mixed next-focus data", testNextFocusMixedDataAvoidsWellCoveredPriority],
  ["apply profile-specific target multipliers", testProfileTargetMultipliersDivergeByPriorityModel],
  ["soften target evs when recovery drops", testRecoveryModifierSoftensTargetEVSWhenRecoveryDrops],
  ["build hidden density adaptation consistency and symmetry metrics", testHiddenMetricsLayerBuildsDensityAdaptationConsistencyAndSymmetry],
  ["keep symmetry and consistency inside clean bounds", testSymmetryAndConsistencyRespectBoundaries],
  ["drop adaptation score under repeated exposure", testAdaptationScoreDropsWithRepeatedExposure],
  ["build centralized premium training insights", testTrainingInsightsStayCentralizedAndActionable],
  ["use real weekly stretch count and safe empty-state progress signals", testProgressSignalsUseRealWeeklyStretchCountAndSafeEmptyFallback],
  ["build phase1 rir intelligence with safe fallback", testPhase1RirIntelligenceHandlesMissingRirAndBoundsRisk],
  ["track mev states by region", testPhase1MevTrackerReflectsBelowAtAndAboveStates],
  ["detect plateaus from flat covered adherent work", testPhase1PlateauDetectionFindsFlatCoveredAdherentRegion],
  ["estimate mrv pressure without blowing up on real data", testPhase2MrvEstimatorFlagsPressureNearCeiling],
  ["derive velocity loss and lower confidence when load rises across sets", testPhase2VelocityLossHandlesDropoffAndConfidence],
  ["support sparse and recovered inter-session recovery curves", testPhase2RecoveryCurveSupportsSparseAndRecoveredCases],
  ["find the best responding rep-range bucket from mixed history", testPhase3RepRangeBiasFindsBestRespondingBucket],
  ["propagate fatigue through the spillover matrix", testPhase3SpilloverAdjustsIndirectFatigue],
  ["keep adaptive metrics stable with sparse history", testPhase3HandlesSparseAdaptiveHistorySafely],
  ["select the right daily mobility prompt", testDailyMobilityPromptSelection],
  ["keep mobility rotation from repeating too long", testMobilityRotationAvoidsLongRepeats],
  ["dedupe same-day mobility completions", testStretchCompletionDedupesSameDay],
  ["append partial sessions safely", testAppendSessionClearsActiveWorkoutAndQueuesOverride],
  ["clear queued workout when a partial is marked done", testReplaceSessionAdvanceCycleClearsQueuedWorkout],
  ["canonicalize exercise library names", testExerciseLibraryCanonicalization],
  ["keep favorite exercise ids resolvable", testFavoriteIdsStayResolvable],
] as const;

for (const [label, run] of tests) {
  run();
  console.log(`PASS ${label}`);
}
