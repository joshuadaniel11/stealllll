import type {
  MonthlyReportCard,
  ProfileTrainingState,
  RivalryCardCopy,
  WeeklyRivalryState,
} from "@/lib/profile-training-state";
import type { SuggestedFocusSession } from "@/lib/training-load";
import type { WeddingDateState } from "@/lib/wedding-date";
import type {
  ActiveWorkout,
  BibleVerse,
  DailyCardioPrompt,
  DailyMobilityPrompt,
  ExerciseLibraryItem,
  MeasurementEntry,
  Profile,
  RecentTrainingUpdate,
  SharedSummary,
  SyncStatus,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

function getDefaultRestLine(profileId: Profile["id"]) {
  return profileId === "natasha" ? "Rest day. Let your body settle." : "Rest day. Let it land.";
}

export type CoachReadModel = {
  profileId: Profile["id"];
  homeHeadline: string;
  homeAction: string;
  workoutRationale: string;
  progressionTargetRead: string | null;
  recoveryWarning: string | null;
  progressFocusLine: string;
  completionNext: string;
  syncStatus: SyncStatus;
};

export type HomeViewModel = {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  isSessionActive: boolean;
  activeSessionSetCount: number;
  restDayState: ProfileTrainingState["restDayState"];
  weeklyCount: number;
  dailyVerse: BibleVerse;
  dailyMobilityPrompt: DailyMobilityPrompt | null;
  dailyCardioPrompt: DailyCardioPrompt | null;
  stretchCompletedToday: boolean;
  recentWorkouts: WorkoutSession[];
  weddingDate: WeddingDateState;
  recentTrainingUpdate: RecentTrainingUpdate | null;
  momentumPillText: string | null;
  rivalryState: WeeklyRivalryState;
  rivalryCopy: RivalryCardCopy;
  coach: CoachReadModel;
};

export type WorkoutDayViewModel = {
  profile: Profile;
  todaysWorkoutId: string;
  previewWorkoutId?: string | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  suggestedSessionPreview: boolean;
  signatureLifts: ProfileTrainingState["signatureLifts"];
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  liveSignal: NonNullable<ActiveWorkout["liveSignal"]> | null;
  userSessions: WorkoutSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  coach: CoachReadModel;
};

export type ProgressViewModel = {
  profile: Profile;
  trainingState: ProfileTrainingState;
  measurements: MeasurementEntry[];
  rivalSessions: WorkoutSession[];
  coach: CoachReadModel;
};

export function buildCoachReadModel({
  profile,
  trainingState,
  todaysWorkout,
  activeWorkout,
  suggestedFocusSession,
  restDayRead,
  syncStatus,
}: {
  profile: Profile;
  trainingState: ProfileTrainingState;
  todaysWorkout: WorkoutPlanDay;
  activeWorkout: ActiveWorkout | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  restDayRead: string | null;
  syncStatus: SyncStatus;
}): CoachReadModel {
  const hasActiveWorkout = activeWorkout?.userId === profile.id;
  const defaultRestLine = restDayRead ?? getDefaultRestLine(profile.id);
  const suggestedRationale = suggestedFocusSession?.helperText ?? trainingState.insights.homeAction;
  const homeHeadline = hasActiveWorkout
    ? `${activeWorkout.workoutName} is already open.`
    : trainingState.restDayState.isRest
      ? defaultRestLine
      : `${todaysWorkout.name} is up next.`;
  const homeAction = hasActiveWorkout
    ? "Resume where you left off."
    : trainingState.restDayState.isRest
      ? "Preview the next session and keep the rhythm light."
      : suggestedRationale;
  const recoveryWarning =
    trainingState.restDayState.restReason === "recovery_needed"
      ? `${defaultRestLine} Recovery is low enough that banking the session is the smarter move.`
      : null;

  return {
    profileId: profile.id,
    homeHeadline,
    homeAction,
    workoutRationale: hasActiveWorkout ? `Pick up ${activeWorkout.workoutName} where you left it.` : suggestedRationale,
    progressionTargetRead: trainingState.insights.liftReadyLine ?? suggestedFocusSession?.focusText ?? null,
    recoveryWarning,
    progressFocusLine:
      trainingState.insights.progressSignal || trainingState.insights.focusDirection || trainingState.insights.weeklyStatusDetail,
    completionNext: trainingState.insights.completionNext,
    syncStatus,
  };
}

export function buildHomeViewModel({
  profile,
  todaysWorkout,
  activeWorkoutName,
  isSessionActive,
  activeSessionSetCount,
  weeklyCount,
  dailyVerse,
  dailyMobilityPrompt,
  dailyCardioPrompt,
  stretchCompletedToday,
  recentWorkouts,
  weddingDate,
  recentTrainingUpdate,
  momentumPillText,
  rivalryState,
  rivalryCopy,
  trainingState,
  coach,
}: {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  isSessionActive: boolean;
  activeSessionSetCount: number;
  weeklyCount: number;
  dailyVerse: BibleVerse;
  dailyMobilityPrompt: DailyMobilityPrompt | null;
  dailyCardioPrompt: DailyCardioPrompt | null;
  stretchCompletedToday: boolean;
  recentWorkouts: WorkoutSession[];
  weddingDate: WeddingDateState;
  recentTrainingUpdate: RecentTrainingUpdate | null;
  momentumPillText: string | null;
  rivalryState: WeeklyRivalryState;
  rivalryCopy: RivalryCardCopy;
  trainingState: ProfileTrainingState;
  coach: CoachReadModel;
}): HomeViewModel {
  return {
    profile,
    todaysWorkout,
    activeWorkoutName,
    isSessionActive,
    activeSessionSetCount,
    restDayState: trainingState.restDayState,
    weeklyCount,
    dailyVerse,
    dailyMobilityPrompt,
    dailyCardioPrompt,
    stretchCompletedToday,
    recentWorkouts,
    weddingDate,
    recentTrainingUpdate,
    momentumPillText,
    rivalryState,
    rivalryCopy,
    coach,
  };
}

export function buildWorkoutViewModel({
  profile,
  todaysWorkoutId,
  previewWorkoutId,
  suggestedFocusSession,
  suggestedSessionPreview,
  signatureLifts,
  activeWorkout,
  activeWorkoutTemplate,
  liveSignal,
  userSessions,
  exerciseLibrary,
  coach,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  previewWorkoutId?: string | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  suggestedSessionPreview: boolean;
  signatureLifts: ProfileTrainingState["signatureLifts"];
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  liveSignal: NonNullable<ActiveWorkout["liveSignal"]> | null;
  userSessions: WorkoutSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  coach: CoachReadModel;
}): WorkoutDayViewModel {
  return {
    profile,
    todaysWorkoutId,
    previewWorkoutId,
    suggestedFocusSession,
    suggestedSessionPreview,
    signatureLifts,
    activeWorkout,
    activeWorkoutTemplate,
    liveSignal: liveSignal ?? null,
    userSessions,
    exerciseLibrary,
    coach,
  };
}

export function buildProgressViewModel({
  profile,
  trainingState,
  measurements,
  rivalSessions,
  coach,
}: {
  profile: Profile;
  trainingState: ProfileTrainingState;
  measurements: MeasurementEntry[];
  rivalSessions: WorkoutSession[];
  coach: CoachReadModel;
}): ProgressViewModel {
  return {
    profile,
    trainingState,
    measurements,
    rivalSessions,
    coach,
  };
}
