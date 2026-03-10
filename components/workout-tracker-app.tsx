"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Activity, ChartColumn, Dumbbell, HeartHandshake, Search, Settings, UserRound } from "lucide-react";

import { BibleVerseModal } from "@/components/bible-verse-modal";
import { CompletionCelebration } from "@/components/completion-celebration";
import { DateTimeChip } from "@/components/date-time-chip";
import { ExerciseDetailModal } from "@/components/exercise-detail-modal";
import { HomeScreen } from "@/components/home-screen";
import { LibraryScreen } from "@/components/library-screen";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProgressScreen } from "@/components/progress-screen";
import { RestTimer } from "@/components/rest-timer";
import { SettingsModal } from "@/components/settings-modal";
import { Card } from "@/components/ui";
import { WorkoutFeelingModal } from "@/components/workout-feeling-modal";
import { WorkoutScreen } from "@/components/workout-screen";
import { createSeedState } from "@/lib/seed-data";
import { loadState, saveState } from "@/lib/storage";
import type {
  ActiveWorkout,
  AppState,
  ExerciseLibraryItem,
  ExerciseTemplate,
  MuscleGroup,
  Profile,
  SetLog,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

type TabId = "home" | "workout" | "progress" | "library";

const navItems = [
  { id: "home" as const, label: "Home", icon: Activity },
  { id: "workout" as const, label: "Workout", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: ChartColumn },
  { id: "library" as const, label: "Library", icon: Search },
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ONBOARDING_KEY = "workout-together-onboarding-seen-v1";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

const formatVolume = (session: WorkoutSession) =>
  session.exercises.flatMap((exercise) => exercise.sets).reduce((sum, set) => sum + set.weight * set.reps, 0);

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  next.setHours(0, 0, 0, 0);
  return next;
}

function getTodayWorkout(profile: Profile) {
  const today = days[new Date().getDay()];
  return profile.workoutPlan.find((workout) => workout.dayLabel === today) ?? profile.workoutPlan[0];
}

function getTodayStretch(profile: Profile) {
  const today = days[new Date().getDay()];
  return profile.stretchPlan.find((stretch) => stretch.dayLabel === today) ?? profile.stretchPlan[0];
}

function isSameLocalDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

function getUserSessions(state: AppState, userId: UserId) {
  return state.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getWorkoutsCompletedThisWeek(sessions: WorkoutSession[]) {
  const start = getWeekStart();
  return sessions.filter((session) => new Date(session.performedAt) >= start).length;
}

function getDynamicWeeklySummary(profile: Profile, sessions: WorkoutSession[]) {
  const weeklySessions = sessions.filter((session) => new Date(session.performedAt) >= getWeekStart());
  const totalSets = weeklySessions.reduce(
    (sum, session) => sum + session.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.length, 0),
    0,
  );
  const totalVolume = weeklySessions.reduce((sum, session) => sum + formatVolume(session), 0);
  const muscleCount = weeklySessions
    .flatMap((session) => session.exercises.map((exercise) => exercise.muscleGroup))
    .reduce<Record<string, number>>((accumulator, muscle) => {
      accumulator[muscle] = (accumulator[muscle] ?? 0) + 1;
      return accumulator;
    }, {});
  const mostTrainedMuscleGroup =
    Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    profile.workoutPlan[0].exercises[0].muscleGroup;
  const workoutsCompleted = weeklySessions.length;
  const consistencyLabel =
    workoutsCompleted >= 4
      ? "Excellent momentum this week"
      : workoutsCompleted >= 2
        ? "Solid consistency and steady progress"
        : "Building rhythm with a clean start";

  return {
    userId: profile.id,
    workoutsCompleted,
    totalSets,
    totalVolume,
    personalBests: Math.max(1, Math.min(weeklySessions.length, 3)),
    mostTrainedMuscleGroup,
    consistencyLabel,
  };
}

function getStreak(sessions: WorkoutSession[]) {
  const uniqueDays = Array.from(new Set(sessions.map((session) => new Date(session.performedAt).toDateString())));
  if (!uniqueDays.length) {
    return 0;
  }
  let streak = 0;
  let cursor = new Date();
  while (true) {
    if (uniqueDays.includes(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (uniqueDays.includes(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }
    break;
  }
  return streak;
}

function buildEmptySets(exercise: ExerciseTemplate): SetLog[] {
  return Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.id}-${index}-${Date.now()}`,
    weight: 0,
    reps: 0,
    completed: false,
  }));
}

function toActiveWorkout(userId: UserId, workout: WorkoutPlanDay): ActiveWorkout {
  return {
    id: `active-${Date.now()}`,
    userId,
    startedAt: new Date().toISOString(),
    workoutDayId: workout.id,
    workoutName: workout.name,
    exercises: workout.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      note: "",
      sets: buildEmptySets(exercise),
    })),
  };
}

function dedupeLibrary(items: ExerciseLibraryItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function mergeStateWithSeed(seed: AppState, incoming: Partial<AppState>): AppState {
  return {
    ...seed,
    ...incoming,
    measurements: {
      ...seed.measurements,
      ...(incoming.measurements ?? {}),
    },
    stretchCompletions: {
      ...seed.stretchCompletions,
      ...(incoming.stretchCompletions ?? {}),
    },
    bibleVerses: incoming.bibleVerses?.length ? incoming.bibleVerses : seed.bibleVerses,
  };
}

export function WorkoutTrackerApp() {
  const [state, setState] = useState<AppState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showDailyVerse, setShowDailyVerse] = useState(false);
  const [showWorkoutFeelingPrompt, setShowWorkoutFeelingPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState<MuscleGroup>("Full Body");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerBase, setTimerBase] = useState(90);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);

  useEffect(() => {
    const localState = loadState();
    if (localState) {
      const seed = createSeedState();
      setState(mergeStateWithSeed(seed, localState));
    }
    if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  useEffect(() => {
    if (!showCompletionCelebration) {
      return;
    }
    const timeout = window.setTimeout(() => setShowCompletionCelebration(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [showCompletionCelebration]);

  const selectedProfile = useMemo(
    () => state.profiles.find((profile) => profile.id === state.selectedUserId) ?? state.profiles[0],
    [state.profiles, state.selectedUserId],
  );

  const userSessions = useMemo(() => getUserSessions(state, selectedProfile.id), [state, selectedProfile.id]);
  const todaysWorkout = useMemo(() => getTodayWorkout(selectedProfile), [selectedProfile]);
  const todaysStretch = useMemo(() => getTodayStretch(selectedProfile), [selectedProfile]);
  const weeklyCount = getWorkoutsCompletedThisWeek(userSessions);
  const dynamicWeeklySummary = useMemo(
    () => getDynamicWeeklySummary(selectedProfile, userSessions),
    [selectedProfile, userSessions],
  );
  const streak = getStreak(userSessions);
  const recentWorkouts = userSessions.slice(0, 3);
  const activeWorkoutTemplate = selectedProfile.workoutPlan.find(
    (workout) => workout.id === state.activeWorkout?.workoutDayId,
  );

  const selectedExercise = useMemo(() => {
    if (!selectedExerciseId) {
      return null;
    }
    return (
      selectedProfile.workoutPlan.flatMap((workout) => workout.exercises).find((exercise) => exercise.id === selectedExerciseId) ??
      state.exerciseLibrary.find((exercise) => exercise.id === selectedExerciseId) ??
      null
    );
  }, [selectedExerciseId, selectedProfile, state.exerciseLibrary]);

  const trendData = useMemo(
    () =>
      userSessions
        .slice()
        .reverse()
        .map((session) => ({
          date: formatDate(session.performedAt),
          volume: formatVolume(session),
        })),
    [userSessions],
  );

  const filteredLibrary = useMemo(
    () =>
      dedupeLibrary(
        state.exerciseLibrary.filter((item) => {
          const query = deferredLibraryQuery.toLowerCase();
          return item.name.toLowerCase().includes(query) || item.muscleGroup.toLowerCase().includes(query);
        }),
      ),
    [state.exerciseLibrary, deferredLibraryQuery],
  );

  const dailyVerse = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return state.bibleVerses[dayOfYear % state.bibleVerses.length];
  }, [state.bibleVerses]);

  const stretchCompletedToday = useMemo(
    () =>
      state.stretchCompletions[selectedProfile.id].some((entry) =>
        isSameLocalDay(entry.date, new Date()),
      ),
    [selectedProfile.id, state.stretchCompletions],
  );

  const startWorkout = (workout: WorkoutPlanDay) => {
    setState((current) => ({
      ...current,
      activeWorkout: toActiveWorkout(selectedProfile.id, workout),
    }));
    startTransition(() => setActiveTab("workout"));
  };

  const openWorkoutCompletionPrompt = () => {
    if (!state.activeWorkout) {
      return;
    }
    setShowWorkoutFeelingPrompt(true);
  };

  const completeWorkout = (feeling: WorkoutSession["feeling"]) => {
    if (!state.activeWorkout) {
      return;
    }
    const completedSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      userId: state.activeWorkout.userId,
      workoutDayId: state.activeWorkout.workoutDayId,
      workoutName: state.activeWorkout.workoutName,
      performedAt: new Date().toISOString(),
      durationMinutes: Math.max(25, Math.round((Date.now() - +new Date(state.activeWorkout.startedAt)) / 60000)),
      feeling,
      exercises: state.activeWorkout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)),
      })),
    };
    setState((current) => ({
      ...current,
      sessions: [completedSession, ...current.sessions],
      activeWorkout: null,
      sharedSummary: {
        ...current.sharedSummary,
        combinedWorkouts: current.sharedSummary.combinedWorkouts + 1,
        weeklyHighlight: `${selectedProfile.name} finished ${completedSession.workoutName.toLowerCase()} and kept the team momentum going.`,
        recentMilestones: [`${selectedProfile.name} completed ${completedSession.workoutName}`, ...current.sharedSummary.recentMilestones.slice(0, 2)],
      },
    }));
    setShowWorkoutFeelingPrompt(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    setCompletionMessage(`${selectedProfile.name} logged a ${feeling.toLowerCase()} session.`);
    setShowCompletionCelebration(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(18);
    }
    startTransition(() => setActiveTab("progress"));
  };

  const saveMeasurement = (entry: Omit<AppState["measurements"][UserId][number], "id" | "date">) => {
    if (!entry.bodyweightKg) {
      return;
    }
    setState((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [selectedProfile.id]: [
          {
            id: `measurement-${Date.now()}`,
            date: new Date().toISOString(),
            ...entry,
          },
          ...current.measurements[selectedProfile.id],
        ],
      },
    }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-together-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const importData = async (file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AppState>;
      const seed = createSeedState();
      setState(mergeStateWithSeed(seed, parsed));
      startTransition(() => setActiveTab("home"));
      setCompletionMessage("Backup imported successfully.");
      setShowCompletionCelebration(true);
    } catch {
      setCompletionMessage("Import failed. Please use a valid workout backup file.");
      setShowCompletionCelebration(true);
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => {
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const targetSet = next.activeWorkout.exercises[exerciseIndex].sets[setIndex];
      targetSet[field] = Number.isNaN(value) ? 0 : value;
      if (targetSet.weight > 0 || targetSet.reps > 0) {
        targetSet.completed = true;
      }
      return next;
    });
  };

  const duplicateLastSet = (exerciseIndex: number, setIndex: number) => {
    setState((current) => {
      if (!current.activeWorkout || setIndex === 0) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const previous = next.activeWorkout.exercises[exerciseIndex].sets[setIndex - 1];
      next.activeWorkout.exercises[exerciseIndex].sets[setIndex] = {
        ...previous,
        id: `${previous.id}-copy-${Date.now()}`,
      };
      return next;
    });
  };

  const updateExerciseNote = (exerciseIndex: number, note: string) => {
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      next.activeWorkout.exercises[exerciseIndex].note = note;
      return next;
    });
  };

  const addCustomExercise = () => {
    if (!customExerciseName.trim()) {
      return;
    }
    setState((current) => ({
      ...current,
      exerciseLibrary: [
        {
          id: `custom-${Date.now()}`,
          name: customExerciseName.trim(),
          muscleGroup: customMuscleGroup,
          equipment: "Custom",
          cues: ["Add your own notes and rep targets."],
          isCustom: true,
        },
        ...current.exerciseLibrary,
      ],
    }));
    setCustomExerciseName("");
  };

  const triggerTimer = (seconds: number) => {
    setTimerBase(seconds);
    setTimerSeconds(seconds);
    setTimerRunning(true);
  };

  const completeStretch = () => {
    if (stretchCompletedToday) {
      return;
    }
    setState((current) => ({
      ...current,
      stretchCompletions: {
        ...current.stretchCompletions,
        [selectedProfile.id]: [
          {
            id: `stretch-${Date.now()}`,
            userId: selectedProfile.id,
            date: new Date().toISOString(),
            stretchTitle: todaysStretch.title,
          },
          ...current.stretchCompletions[selectedProfile.id],
        ],
      },
    }));
    setCompletionMessage(`${selectedProfile.name} finished today’s Bend stretch.`);
    setShowCompletionCelebration(true);
  };

  const closeOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setShowOnboarding(false);
  };

  const resetProfileData = () => {
    const seed = createSeedState();
    setState((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.userId !== selectedProfile.id),
      personalBests: {
        ...current.personalBests,
        [selectedProfile.id]: seed.personalBests[selectedProfile.id],
      },
      measurements: {
        ...current.measurements,
        [selectedProfile.id]: [],
      },
      stretchCompletions: {
        ...current.stretchCompletions,
        [selectedProfile.id]: [],
      },
      activeWorkout:
        current.activeWorkout?.userId === selectedProfile.id ? null : current.activeWorkout,
    }));
    setCompletionMessage(`${selectedProfile.name}'s saved progress was reset on this phone.`);
    setShowCompletionCelebration(true);
    setShowSettings(false);
    startTransition(() => setActiveTab("home"));
  };

  const resetAllData = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ONBOARDING_KEY);
    }
    setState(createSeedState());
    setShowSettings(false);
    setShowOnboarding(true);
    setCompletionMessage("The app was reset to a clean start.");
    setShowCompletionCelebration(true);
    startTransition(() => setActiveTab("home"));
  };

  return (
    <main className="min-h-screen bg-app-light px-4 pb-28 pt-6 text-text transition-colors duration-500 dark:bg-app-dark sm:px-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <Card className="animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">STEALLLLL</p>
              <h1 className="balanced-text mt-1 text-[30px] font-semibold tracking-[-0.04em]">Calm progress for two.</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Preset gym workouts, elegant logging, and a shared rhythm for Joshua and Natasha.
              </p>
              <div className="mt-4">
                <DateTimeChip />
              </div>
            </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-[24px] bg-white/70 p-3 text-muted shadow-card dark:bg-white/10"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-5 w-5" />
                </button>
                <div className="rounded-[24px] bg-accentSoft p-3 text-accent shadow-glow">
                  <HeartHandshake className="h-6 w-6" />
                </div>
              </div>
            </div>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-[24px] bg-black/5 p-1 dark:bg-white/5">
            {state.profiles.map((profile) => (
              <button
                key={profile.id}
                className={clsx(
                  "rounded-[20px] px-4 py-3 text-left transition",
                  profile.id === selectedProfile.id ? "bg-white text-text shadow-card dark:bg-white/10" : "text-muted",
                )}
                onClick={() => {
                  setSelectedExerciseId(null);
                  setState((current) => ({ ...current, selectedUserId: profile.id }));
                  startTransition(() => setActiveTab("home"));
                }}
              >
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span className="text-sm font-medium">{profile.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{profile.tagline}</p>
              </button>
            ))}
          </div>
        </Card>

        {activeTab === "home" && (
          <HomeScreen
            profile={selectedProfile}
            todaysWorkout={todaysWorkout}
            activeWorkoutName={state.activeWorkout?.userId === selectedProfile.id ? state.activeWorkout.workoutName : null}
            weeklyCount={weeklyCount}
            streak={streak}
            pbCount={state.personalBests[selectedProfile.id].length}
            dailyVerse={dailyVerse}
            dailyStretch={todaysStretch}
            stretchCompletedToday={stretchCompletedToday}
            sharedSummary={state.sharedSummary}
            recentWorkouts={recentWorkouts}
            onOpenDailyVerse={() => setShowDailyVerse(true)}
            onCompleteStretch={completeStretch}
            onStartWorkout={() => startWorkout(todaysWorkout)}
            onResumeWorkout={() => setActiveTab("workout")}
            onBrowse={() => setActiveTab("workout")}
            onOpenExercise={setSelectedExerciseId}
          />
        )}

        {activeTab === "workout" && (
          <WorkoutScreen
            profile={selectedProfile}
            todaysWorkoutId={todaysWorkout.id}
            activeWorkout={state.activeWorkout}
            activeWorkoutTemplate={activeWorkoutTemplate}
            userSessions={userSessions}
            exerciseLibrary={state.exerciseLibrary}
            onStartWorkout={startWorkout}
            onUpdateSet={updateSet}
            onDuplicateLastSet={duplicateLastSet}
            onUpdateExerciseNote={updateExerciseNote}
            onOpenExercise={setSelectedExerciseId}
            onSwapExercise={(exerciseIndex, exerciseId) => {
              setState((current) => {
                if (!current.activeWorkout) {
                  return current;
                }
                const replacement = current.exerciseLibrary.find((item) => item.id === exerciseId);
                if (!replacement) {
                  return current;
                }
                const next = structuredClone(current);
                if (!next.activeWorkout) {
                  return current;
                }
                const existing = next.activeWorkout.exercises[exerciseIndex];
                next.activeWorkout.exercises[exerciseIndex] = {
                  ...existing,
                  exerciseId: replacement.id,
                  exerciseName: replacement.name,
                  muscleGroup: replacement.muscleGroup,
                  note: replacement.cues[0] ?? "",
                  sets: existing.sets.map((_, setIndex) => ({
                    id: `${replacement.id}-${setIndex}-${Date.now()}`,
                    weight: 0,
                    reps: 0,
                    completed: false,
                  })),
                };
                return next;
              });
            }}
            onTriggerTimer={triggerTimer}
            onCompleteWorkout={openWorkoutCompletionPrompt}
          />
        )}

        {activeTab === "progress" && (
          <ProgressScreen
            profile={selectedProfile}
            totalWorkouts={userSessions.length}
            weeklySummary={dynamicWeeklySummary}
            trendData={trendData}
            measurements={state.measurements[selectedProfile.id]}
            userSessions={userSessions}
            stretchCompletions={state.stretchCompletions[selectedProfile.id]}
            onSaveMeasurement={saveMeasurement}
            onExportData={exportData}
            onImportData={importData}
          />
        )}

        {activeTab === "library" && (
          <LibraryScreen
            query={libraryQuery}
            onQueryChange={setLibraryQuery}
            customExerciseName={customExerciseName}
            customMuscleGroup={customMuscleGroup}
            muscleOptions={["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Hamstrings", "Quads", "Core", "Full Body"]}
            filteredLibrary={filteredLibrary}
            onCustomExerciseNameChange={setCustomExerciseName}
            onCustomMuscleGroupChange={setCustomMuscleGroup}
            onAddCustomExercise={addCustomExercise}
            onOpenExercise={setSelectedExerciseId}
          />
        )}
      </div>

      <ExerciseDetailModal exercise={selectedExercise} userSessions={userSessions} onClose={() => setSelectedExerciseId(null)} />
      <BibleVerseModal verse={showDailyVerse ? dailyVerse : null} onClose={() => setShowDailyVerse(false)} />
      <CompletionCelebration visible={showCompletionCelebration} message={completionMessage} />
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      {showSettings && (
        <SettingsModal
          profile={selectedProfile}
          onClose={() => setShowSettings(false)}
          onExport={exportData}
          onImport={importData}
          onResetProfile={resetProfileData}
          onResetAll={resetAllData}
        />
      )}
      {showWorkoutFeelingPrompt && (
        <WorkoutFeelingModal
          onSelect={completeWorkout}
          onClose={() => setShowWorkoutFeelingPrompt(false)}
        />
      )}

      <RestTimer
        seconds={timerSeconds}
        running={timerRunning}
        onToggle={() => setTimerRunning((value) => !value)}
        onSkip={() => {
          setTimerRunning(false);
          setTimerSeconds(0);
        }}
        onRestart={() => {
          setTimerSeconds(timerBase);
          setTimerRunning(true);
        }}
        onSetPreset={triggerTimer}
      />

      <nav className="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-stroke bg-[var(--card)] px-3 py-3 shadow-card backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={clsx(
                "flex min-w-[72px] flex-col items-center gap-1 rounded-[20px] px-3 py-2 text-xs transition",
                isActive ? "bg-accentSoft text-accent" : "text-muted",
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}
