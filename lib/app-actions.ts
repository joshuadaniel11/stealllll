import type { AppState, MeasurementEntry, StretchCompletion, UserId, WorkoutSession } from "@/lib/types";

export function setSelectedUserId(state: AppState, userId: UserId): AppState {
  return {
    ...state,
    selectedUserId: userId,
  };
}

export function setWorkoutOverride(state: AppState, userId: UserId, nextWorkoutId: string | null): AppState {
  return {
    ...state,
    workoutOverrides: {
      ...state.workoutOverrides,
      [userId]: {
        nextWorkoutId,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function clearActiveWorkoutForUser(state: AppState, userId: UserId): AppState {
  return {
    ...state,
    activeWorkout: state.activeWorkout?.userId === userId ? null : state.activeWorkout,
  };
}

export function appendSession(
  state: AppState,
  session: WorkoutSession,
  options?: {
    clearActiveWorkoutForUser?: UserId;
    nextWorkoutId?: string | null;
    updateSharedSummary?: boolean;
    sharedSummaryName?: string;
  },
): AppState {
  const nextState = {
    ...state,
    sessions: [session, ...state.sessions],
    activeWorkout:
      options?.clearActiveWorkoutForUser && state.activeWorkout?.userId === options.clearActiveWorkoutForUser
        ? null
        : state.activeWorkout,
    workoutOverrides:
      typeof options?.nextWorkoutId !== "undefined"
        ? {
            ...state.workoutOverrides,
            [session.userId]: {
              nextWorkoutId: options.nextWorkoutId,
              updatedAt: new Date().toISOString(),
            },
          }
        : state.workoutOverrides,
  };

  if (!options?.updateSharedSummary) {
    return nextState;
  }

  return {
    ...nextState,
    sharedSummary: {
      ...state.sharedSummary,
      combinedWorkouts: state.sharedSummary.combinedWorkouts + 1,
      weeklyHighlight: `${options.sharedSummaryName ?? "A profile"} finished ${session.workoutName.toLowerCase()} and kept the team momentum going.`,
      recentMilestones: [`${options.sharedSummaryName ?? "A profile"} completed ${session.workoutName}`, ...state.sharedSummary.recentMilestones.slice(0, 2)],
    },
  };
}

export function saveMeasurementEntry(
  state: AppState,
  userId: UserId,
  entry: Omit<MeasurementEntry, "id" | "date">,
): AppState {
  return {
    ...state,
    measurements: {
      ...state.measurements,
      [userId]: [
        {
          id: `measurement-${Date.now()}`,
          date: new Date().toISOString(),
          ...entry,
        },
        ...state.measurements[userId],
      ],
    },
  };
}

export function addStretchCompletion(
  state: AppState,
  userId: UserId,
  stretchTitle: string,
): AppState {
  const today = new Date().toDateString();
  const alreadyCompletedToday = state.stretchCompletions[userId].some(
    (entry) => new Date(entry.date).toDateString() === today,
  );

  if (alreadyCompletedToday) {
    return state;
  }

  const newEntry: StretchCompletion = {
    id: `stretch-${Date.now()}`,
    userId,
    date: new Date().toISOString(),
    stretchTitle,
  };

  return {
    ...state,
    stretchCompletions: {
      ...state.stretchCompletions,
      [userId]: [newEntry, ...state.stretchCompletions[userId]],
    },
  };
}

export function removeStretchCompletionsForDay(
  state: AppState,
  userId: UserId,
  predicate: (entry: StretchCompletion) => boolean,
): AppState {
  return {
    ...state,
    stretchCompletions: {
      ...state.stretchCompletions,
      [userId]: state.stretchCompletions[userId].filter((entry) => !predicate(entry)),
    },
  };
}

export function replaceSession(
  state: AppState,
  updatedSession: WorkoutSession,
  options?: { advanceWorkoutCycle?: boolean },
): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => (session.id === updatedSession.id ? updatedSession : session)),
    workoutOverrides: options?.advanceWorkoutCycle
      ? {
          ...state.workoutOverrides,
          [updatedSession.userId]: {
            nextWorkoutId: null,
            updatedAt: new Date().toISOString(),
          },
        }
      : state.workoutOverrides,
  };
}

export function resetProfileProgressState(state: AppState, userId: UserId, seed: AppState): AppState {
  return {
    ...state,
    sessions: state.sessions.filter((session) => session.userId !== userId),
    sessionSignalLog: state.sessionSignalLog.filter((entry) => entry.userId !== userId),
    personalBests: {
      ...state.personalBests,
      [userId]: seed.personalBests[userId],
    },
    measurements: {
      ...state.measurements,
      [userId]: [],
    },
    stretchCompletions: {
      ...state.stretchCompletions,
      [userId]: [],
    },
    workoutOverrides: {
      ...state.workoutOverrides,
      [userId]: seed.workoutOverrides[userId],
    },
    exerciseSwapMemory: {
      ...state.exerciseSwapMemory,
      [userId]: {},
    },
    activeWorkout: state.activeWorkout?.userId === userId ? null : state.activeWorkout,
  };
}
