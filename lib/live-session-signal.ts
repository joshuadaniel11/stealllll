import { getCurrentWeekWindow } from "@/lib/training-load";
import type {
  LiveSessionSignal,
  LiveSessionSignalType,
  Profile,
  SessionSignalLogEntry,
  StrongDayState,
  WorkoutSession,
} from "@/lib/types";

export type LiveSessionSignalRead = {
  shouldFire: boolean;
  signalType: LiveSessionSignalType | null;
  targetExercise: string;
  message: string;
  copyIndex: number;
  strongDayState?: StrongDayState | null;
};

type HistoricalExerciseSession = {
  performedAt: string;
  setScores: number[];
  bestSetScore: number;
  sets: WorkoutSession["exercises"][number]["sets"];
};

const SESSION_SIGNAL_COPY = {
  joshua: {
    strong_day: {
      strong: [
        "Stronger than last time here. Keep moving.",
        "Above your last session. Use it.",
        "Good numbers early. Don't back off.",
      ],
      very_strong: [
        "Clearly a strong day. Push the ceiling.",
        "Way above pace. This is yours to take.",
        "Best numbers in a while on this. Go.",
      ],
      exceptional: [
        "Best session in weeks on this lift. Lock in.",
        "Exceptional pace. Everything today counts.",
        "This is a training day you'll remember.",
      ],
    },
    push: [
      "You're ahead of pace on this. Push the next set.",
      "Tracking strong. Don't leave weight on the bar.",
      "Better than usual here. Make it count.",
    ],
    hold: [
      "Steady session. Lock it in.",
      "Right on pace. Finish clean.",
    ],
    bank: [
      "Body's working harder than the numbers show. Bank this one.",
      "Fatigue is real today. Smart to hold here.",
    ],
    pr_close: [
      "Close to your best on this. One more clean set.",
      "PR range. You know what to do.",
    ],
  },
  natasha: {
    strong_day: {
      strong: [
        "Stronger than last time here. Stay with it.",
        "Above your last session. Good energy today.",
        "Early numbers are clean. Keep the form.",
      ],
      very_strong: [
        "Clearly a strong day. Stay controlled and push.",
        "Well above your last session. Use this.",
        "Strong energy today. Make the most of it.",
      ],
      exceptional: [
        "Best session in a while on this. Stay smooth.",
        "Exceptional pace. Everything today has potential.",
        "This is a strong day. Own it cleanly.",
      ],
    },
    push: [
      "Stronger than usual here. Use it.",
      "Tracking above your average. Stay controlled and push.",
      "Good session energy. Lean into it.",
    ],
    hold: [
      "Steady. Keep the form clean.",
      "Right where you should be. Finish it.",
    ],
    bank: [
      "Harder day. That's fine. Protect the quality.",
      "Hold the shape, not the weight. Smart session.",
    ],
    pr_close: [
      "Near your best on this. Controlled and strong.",
      "PR range. Stay smooth and take it.",
    ],
  },
} as const;

function getSetScore(weight: number, reps: number) {
  return weight * reps;
}

function getCompletedLoggedSets(sets: WorkoutSession["exercises"][number]["sets"]) {
  return sets.filter((set) => set.completed && (set.weight > 0 || set.reps > 0));
}

function getCompletedSetScores(sets: WorkoutSession["exercises"][number]["sets"]) {
  return getCompletedLoggedSets(sets).map((set) => getSetScore(set.weight, set.reps));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function getLoggedSetCount(currentSession: WorkoutSession) {
  return currentSession.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.weight > 0 || set.reps > 0)).length,
    0,
  );
}

function getCurrentExerciseForSignal(currentSession: WorkoutSession) {
  const exercisesWithWork = currentSession.exercises.filter((exercise) =>
    exercise.sets.some((set) => set.completed && (set.weight > 0 || set.reps > 0)),
  );

  if (!exercisesWithWork.length) {
    return currentSession.exercises[0] ?? null;
  }

  const firstIncompleteWorkedExercise = exercisesWithWork.find((exercise) =>
    exercise.sets.some((set) => !set.completed),
  );

  return firstIncompleteWorkedExercise ?? exercisesWithWork[exercisesWithWork.length - 1] ?? null;
}

function getHistoricalExerciseSessions(exerciseName: string, exerciseHistory: WorkoutSession[]) {
  return exerciseHistory
    .filter((session) => !session.partial)
    .map((session) => {
      const matchedExercise = session.exercises.find((exercise) => exercise.exerciseName === exerciseName);
      if (!matchedExercise) {
        return null;
      }

      const setScores = getCompletedSetScores(matchedExercise.sets);
      if (!setScores.length) {
        return null;
      }

      return {
        performedAt: session.performedAt,
        setScores,
        bestSetScore: Math.max(...setScores),
        sets: matchedExercise.sets,
      } satisfies HistoricalExerciseSession;
    })
    .filter((entry): entry is HistoricalExerciseSession => Boolean(entry))
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getSignalOptions(
  profileId: Profile["id"],
  signalType: LiveSessionSignalType,
  strongDayState?: StrongDayState | null,
) {
  if (signalType === "strong_day") {
    return SESSION_SIGNAL_COPY[profileId].strong_day[strongDayState?.strengthLevel ?? "strong"];
  }

  return SESSION_SIGNAL_COPY[profileId][signalType];
}

function getMessageSelection(
  profileId: Profile["id"],
  targetExercise: string,
  signalType: LiveSessionSignalType,
  signalHistory: SessionSignalLogEntry[],
  strongDayState?: StrongDayState | null,
) {
  const options = getSignalOptions(profileId, signalType, strongDayState);
  const priorExerciseSignals = signalHistory.filter((entry) => entry.exercise === targetExercise);
  const lastExerciseSignal = priorExerciseSignals[0] ?? null;
  let copyIndex = priorExerciseSignals.filter((entry) => entry.signalType === signalType).length % options.length;

  if (lastExerciseSignal && options[copyIndex] === options[lastExerciseSignal.copyIndex % options.length]) {
    copyIndex = (copyIndex + 1) % options.length;
  }

  return {
    copyIndex,
    message: options[copyIndex],
  };
}

export function getStrongDayState(
  _profile: Profile,
  currentSession: WorkoutSession,
  exerciseHistory: WorkoutSession[],
): StrongDayState {
  const currentExercise = getCurrentExerciseForSignal(currentSession);
  if (!currentExercise) {
    return {
      strongDayDetected: false,
      detectedAfterSet: 0,
      triggerExercise: "",
      weightDeltaPercent: 0,
      repsDelta: 0,
      strengthLevel: "strong",
    };
  }

  const currentCompletedSets = getCompletedLoggedSets(currentExercise.sets);
  if (currentCompletedSets.length < 2) {
    return {
      strongDayDetected: false,
      detectedAfterSet: 0,
      triggerExercise: currentExercise.exerciseName,
      weightDeltaPercent: 0,
      repsDelta: 0,
      strengthLevel: "strong",
    };
  }

  const lastSession = getHistoricalExerciseSessions(currentExercise.exerciseName, exerciseHistory)[0];
  if (!lastSession) {
    return {
      strongDayDetected: false,
      detectedAfterSet: 0,
      triggerExercise: currentExercise.exerciseName,
      weightDeltaPercent: 0,
      repsDelta: 0,
      strengthLevel: "strong",
    };
  }

  const lastSessionSets = getCompletedLoggedSets(lastSession.sets);
  for (let index = 1; index < currentCompletedSets.length; index += 1) {
    const currentSet = currentCompletedSets[index];
    const previousSet = lastSessionSets[index];
    if (!currentSet || !previousSet) {
      continue;
    }

    if (currentSet.weight <= previousSet.weight || currentSet.reps < previousSet.reps) {
      continue;
    }

    const weightDeltaPercent =
      previousSet.weight > 0 ? ((currentSet.weight - previousSet.weight) / previousSet.weight) * 100 : 100;
    const repsDelta = currentSet.reps - previousSet.reps;

    let strengthLevel: StrongDayState["strengthLevel"] = "strong";
    if (weightDeltaPercent >= 10 && repsDelta >= 2) {
      strengthLevel = "exceptional";
    } else if (weightDeltaPercent >= 5 || repsDelta >= 2) {
      strengthLevel = "very_strong";
    }

    return {
      strongDayDetected: true,
      detectedAfterSet: index + 1,
      triggerExercise: currentExercise.exerciseName,
      weightDeltaPercent,
      repsDelta,
      strengthLevel,
    };
  }

  return {
    strongDayDetected: false,
    detectedAfterSet: 0,
    triggerExercise: currentExercise.exerciseName,
    weightDeltaPercent: 0,
    repsDelta: 0,
    strengthLevel: "strong",
  };
}

export function getLiveSessionSignal(
  profile: Profile,
  currentSession: WorkoutSession,
  exerciseHistory: WorkoutSession[],
  signalHistory: SessionSignalLogEntry[] = [],
  referenceDate = new Date(),
): LiveSessionSignalRead {
  if (currentSession.liveSignal?.signalType) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentSession.liveSignal.targetExercise,
      message: "",
      copyIndex: currentSession.liveSignal.copyIndex,
      strongDayState: currentSession.liveSignal.strongDayState ?? null,
    };
  }

  const currentExercise = getCurrentExerciseForSignal(currentSession);
  if (!currentExercise) {
    return { shouldFire: false, signalType: null, targetExercise: "", message: "", copyIndex: 0, strongDayState: null };
  }

  const strongDayState = getStrongDayState(profile, currentSession, exerciseHistory);
  if (strongDayState.strongDayDetected) {
    const { copyIndex, message } = getMessageSelection(
      profile.id,
      strongDayState.triggerExercise,
      "strong_day",
      signalHistory,
      strongDayState,
    );

    return {
      shouldFire: true,
      signalType: "strong_day",
      targetExercise: strongDayState.triggerExercise,
      message,
      copyIndex,
      strongDayState,
    };
  }

  if (getLoggedSetCount(currentSession) < 3) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentExercise.exerciseName,
      message: "",
      copyIndex: 0,
      strongDayState: null,
    };
  }

  const currentSetScores = getCompletedSetScores(currentExercise.sets).slice(-3);
  if (currentSetScores.length < 3) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentExercise.exerciseName,
      message: "",
      copyIndex: 0,
      strongDayState: null,
    };
  }

  const historyForExercise = getHistoricalExerciseSessions(currentExercise.exerciseName, exerciseHistory);
  if (historyForExercise.length < 2) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentExercise.exerciseName,
      message: "",
      copyIndex: 0,
      strongDayState: null,
    };
  }

  const comparisonWindow = historyForExercise.slice(0, 4);
  const historicalAverage = average(comparisonWindow.flatMap((entry) => entry.setScores));
  if (historicalAverage <= 0) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentExercise.exerciseName,
      message: "",
      copyIndex: 0,
      strongDayState: null,
    };
  }

  const currentAverage = average(currentSetScores);
  const currentBestSet = Math.max(...currentSetScores);
  const historicalBestSet = Math.max(...historyForExercise.map((entry) => entry.bestSetScore));
  const relativeDelta = (currentAverage - historicalAverage) / historicalAverage;
  const weekWindow = getCurrentWeekWindow(referenceDate);
  const completedSessionsThisWeek = exerciseHistory.filter(
    (session) =>
      !session.partial &&
      new Date(session.performedAt) >= weekWindow.start &&
      new Date(session.performedAt) <= weekWindow.end,
  ).length;

  let signalType: LiveSessionSignalType | null = null;

  if (historicalBestSet > 0 && currentBestSet >= historicalBestSet * 0.95) {
    signalType = "pr_close";
  } else if (relativeDelta >= 0.1) {
    signalType = "push";
  } else if (Math.abs(relativeDelta) <= 0.05) {
    signalType = "hold";
  } else if (relativeDelta <= -0.1 && completedSessionsThisWeek >= 1) {
    signalType = "bank";
  }

  if (!signalType) {
    return {
      shouldFire: false,
      signalType: null,
      targetExercise: currentExercise.exerciseName,
      message: "",
      copyIndex: 0,
      strongDayState: null,
    };
  }

  const { copyIndex, message } = getMessageSelection(profile.id, currentExercise.exerciseName, signalType, signalHistory);

  return {
    shouldFire: true,
    signalType,
    targetExercise: currentExercise.exerciseName,
    message,
    copyIndex,
    strongDayState: null,
  };
}

export function buildActiveLiveSignal(signal: LiveSessionSignalRead): LiveSessionSignal | null {
  if (!signal.shouldFire || !signal.signalType) {
    return null;
  }

  return {
    signalType: signal.signalType,
    targetExercise: signal.targetExercise,
    message: signal.message,
    firedAt: new Date().toISOString(),
    copyIndex: signal.copyIndex,
    strongDayState: signal.strongDayState ?? null,
    dismissedAt: null,
  };
}

export function buildSessionSignalLogEntry(session: WorkoutSession): SessionSignalLogEntry | null {
  if (!session.liveSignal?.signalType) {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    exercise: session.liveSignal.targetExercise,
    signalType: session.liveSignal.signalType,
    firedAt: session.liveSignal.firedAt,
    copyIndex: session.liveSignal.copyIndex,
    strongDayState: session.liveSignal.strongDayState ?? null,
  };
}
