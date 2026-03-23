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
  const seed = createSeedState();
  const joshua = seed.profiles.find((profile) => profile.id === "joshua");

  assert.ok(joshua);

  const prompt = selectDailyMobilityPrompt(
    joshua,
    [
      {
        id: "stretch-1",
        userId: "joshua",
        date: "2026-03-22T08:00:00.000Z",
        stretchTitle: "Doorway pec stretch",
      },
      {
        id: "stretch-2",
        userId: "joshua",
        date: "2026-03-23T08:00:00.000Z",
        stretchTitle: "Bench lat stretch",
      },
      {
        id: "stretch-3",
        userId: "joshua",
        date: "2026-03-24T08:00:00.000Z",
        stretchTitle: "Half-kneeling hip flexor stretch",
      },
    ],
    new Date("2026-03-27T12:00:00+13:00"),
  );

  assert.deepEqual(prompt.focusRegions, ["Shoulders", "Thoracic spine", "Neck"]);
  assert.equal(prompt.primaryStretch.name, "Wall slide with lift-off");
  assert.equal(prompt.feedback, "Consistency building");
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
  ["select the right daily mobility prompt", testDailyMobilityPromptSelection],
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
