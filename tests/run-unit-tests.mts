import assert from "node:assert/strict";

import { addStretchCompletion, appendSession, replaceSession } from "@/lib/app-actions";
import { isValidImportedState, mergeStateWithSeed } from "@/lib/app-state";
import { selectDailyMobilityPrompt } from "@/lib/daily-mobility";
import { buildCanonicalExerciseLibrary, findExerciseLibraryItemByName } from "@/lib/exercise-data";
import { getProfileTrainingState } from "@/lib/profile-training-state";
import { createSeedState } from "@/lib/seed-data";

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

  assert.deepEqual(trainingState.trainingLoad.summary.suggestedNextFocus.labels, ["Side delts", "Rear delts"]);
  assert.equal(trainingState.suggestedFocusSession?.focusText, "Side delts + Rear delts");
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

const tests = [
  ["reject invalid imported state", testInvalidImportedState],
  ["merge imported state safely", testSafeStateMerge],
  ["bias next focus away from just-trained zones", testRecoveryAwareNextFocus],
  ["keep suggested session actionable", testSuggestedSessionIsActionable],
  ["keep low-activity focus from repeating the freshest priority", testLowActivityFocusStillAvoidsJustTrainedPriority],
  ["spread suggested session across useful patterns", testSuggestedSessionSpreadsFocusAcrossPatterns],
  ["build effective volume and coverage metrics", testMetricsLayerBuildsEffectiveVolumeCoverage],
  ["drop recovery index under stacked recent fatigue", testRecoveryIndexRespondsToAccumulatedRecentLoad],
  ["detect positive progress velocity from improving work", testProgressVelocityDetectsImprovingExerciseWindow],
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
