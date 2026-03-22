import assert from "node:assert/strict";

import { isValidImportedState, mergeStateWithSeed } from "@/lib/app-state";
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

const tests = [
  ["reject invalid imported state", testInvalidImportedState],
  ["merge imported state safely", testSafeStateMerge],
  ["bias next focus away from just-trained zones", testRecoveryAwareNextFocus],
  ["keep suggested session actionable", testSuggestedSessionIsActionable],
  ["canonicalize exercise library names", testExerciseLibraryCanonicalization],
  ["keep favorite exercise ids resolvable", testFavoriteIdsStayResolvable],
] as const;

for (const [label, run] of tests) {
  run();
  console.log(`PASS ${label}`);
}
