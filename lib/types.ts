export type UserId = "joshua" | "natasha";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Legs"
  | "Glutes"
  | "Hamstrings"
  | "Quads"
  | "Core"
  | "Full Body";

export type MuscleKey =
  | "upperChest"
  | "midChest"
  | "frontDelts"
  | "sideDelts"
  | "triceps"
  | "upperTraps"
  | "midBack"
  | "lats"
  | "rearDelts"
  | "biceps"
  | "forearms"
  | "upperAbs"
  | "lowerAbs"
  | "obliques"
  | "lowerBack"
  | "quads"
  | "hamstrings"
  | "gluteMax"
  | "upperGlutes"
  | "sideGlutes"
  | "hipFlexors"
  | "calves"
  | "adductors";

export type ExerciseMuscleProfile = {
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
};

export type SetLog = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  rir?: number;
};

export type ExerciseTemplate = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
  sets: number;
  repRange: string;
  suggestedRepTarget?: number;
  note?: string;
  progressionNote?: string;
  favorite?: boolean;
};

export type WorkoutPlanDay = {
  id: string;
  name: string;
  focus: string;
  dayLabel: string;
  durationMinutes: number;
  exercises: ExerciseTemplate[];
};

export type WorkoutSessionExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
  sets: SetLog[];
  note?: string;
};

export type LiveSessionSignalType = "push" | "hold" | "bank" | "pr_close" | "strong_day";

export type StrongDayStrengthLevel = "strong" | "very_strong" | "exceptional";

export type MuscleCeilingType = "weight" | "reps" | "both";

export type MuscleCeilingResponse = "technique_swap" | "rest" | "rep_range_shift";

export type MuscleCeilingState = {
  muscleGroup: MuscleGroup;
  sessionsSinceProgress: number;
  ceilingDetected: boolean;
  ceilingType: MuscleCeilingType | null;
  lastProgressDate: string | null;
  suggestedResponse: MuscleCeilingResponse | null;
};

export type StrongDayState = {
  strongDayDetected: boolean;
  detectedAfterSet: number;
  triggerExercise: string;
  weightDeltaPercent: number;
  repsDelta: number;
  strengthLevel: StrongDayStrengthLevel;
};

export type HapticEvent =
  | "pr_approach"
  | "session_complete"
  | "rivalry_lead_change"
  | "week_streak"
  | "set_saved";

export type LiveSessionSignal = {
  signalType: LiveSessionSignalType;
  targetExercise: string;
  message: string;
  firedAt: string;
  copyIndex: number;
  strongDayState?: StrongDayState | null;
  dismissedAt?: string | null;
};

export type WorkoutSession = {
  id: string;
  userId: UserId;
  workoutDayId: string;
  workoutName: string;
  performedAt: string;
  durationMinutes: number;
  sessionRpe?: number;
  partial?: boolean;
  liveSignal?: LiveSessionSignal | null;
  exercises: WorkoutSessionExercise[];
  feeling: "Strong" | "Solid" | "Tough";
};

export type Goal = {
  id: string;
  title: string;
  focus: string;
  target: string;
  progress: number;
};

export type PersonalBest = {
  exerciseName: string;
  value: string;
};

export type RecommendationConfidence = "low" | "medium" | "high";

export type StrengthPrediction = {
  exerciseName: string;
  currentBest: string;
  projectedPerformance: string;
  note: string;
  confidence: RecommendationConfidence;
  confidenceLabel: string;
  trendLabel: string;
};

export type IntelligenceCardTone = "positive" | "neutral" | "attention";

export type PostWorkoutRecapCard = {
  label: string;
  value: string;
  detail: string;
  tone: IntelligenceCardTone;
};

export type PlateauIntervention = {
  title: string;
  label: string;
  confidenceLabel: string;
  detail: string;
  intervention: string;
};

export type PostWorkoutIntelligenceRecap = {
  headline: string;
  summary: string;
  cards: PostWorkoutRecapCard[];
  nextMove: string;
  plateauIntervention: PlateauIntervention | null;
};

export type MobilityStretch = {
  name: string;
  why: string;
};

export type MobilityPromptTemplate = {
  key?: string;
  dayLabel?: string;
  focusRegions: string[];
  primaryStretch: MobilityStretch;
  secondaryStretches?: MobilityStretch[];
  note: string;
};

export type DailyMobilityPrompt = Omit<MobilityPromptTemplate, "secondaryStretches"> & {
  secondaryStretches: MobilityStretch[];
  ctaLabel: string;
  rotationDay: number;
};

export type DailyCardioPrompt = {
  key: string;
  workoutDayId: string;
  title: string;
  duration: string;
  intensity: string;
  why: string;
};

export type Profile = {
  id: UserId;
  name: string;
  age: number;
  tagline: string;
  accent: string;
  goalSummary: string;
  goals: Goal[];
  notes: string[];
  workoutPlan: WorkoutPlanDay[];
  stretchPlan: MobilityPromptTemplate[];
  favoriteExerciseIds: string[];
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
  equipment: string;
  cues: string[];
  isCustom?: boolean;
};

export type WeeklySummary = {
  userId: UserId;
  workoutsCompleted: number;
  totalSets: number;
  totalVolume: number;
  personalBests: number;
  mostTrainedMuscleGroup: string;
  consistencyLabel: string;
};

export type SharedSummary = {
  combinedWorkouts: number;
  teamStreak: number;
  weeklyHighlight: string;
  recentMilestones: string[];
};

export type BibleVerse = {
  id: string;
  reference: string;
  preview: string;
  fullText: string;
  encouragement: string;
  themes: Array<"Strength" | "Discipline" | "Perseverance" | "Growth">;
};

export type MeasurementEntry = {
  id: string;
  date: string;
  bodyweightKg: number;
  bodyFatPercent?: number;
};

export type StretchCompletion = {
  id: string;
  userId: UserId;
  date: string;
  stretchTitle: string;
};

export type SyncRecordBase = {
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type SessionRecord = WorkoutSession & SyncRecordBase;

export type MeasurementRecord = MeasurementEntry &
  SyncRecordBase & {
    userId: UserId;
  };

export type CompletionRecord = StretchCompletion &
  SyncRecordBase & {
    completionType: "mobility";
  };

export type WorkoutOverrideRecord = WorkoutOverride &
  SyncRecordBase & {
    userId: UserId;
  };

export type ExerciseSwapMemoryRecord = SyncRecordBase & {
  userId: UserId;
  sourceExerciseId: string;
  swapExerciseId: string;
};

export type SharedFactRecord =
  | (SyncRecordBase & {
      factType: "profile_created_at";
      userId: UserId;
      value: string;
    })
  | (SyncRecordBase & {
      factType: "profile_activation_date";
      userId: UserId;
      value: string | null;
    })
  | (SyncRecordBase & {
      factType: "last_seen_wedding_phase";
      userId: UserId;
      value: "build" | "define" | "peak" | "wedding_week" | "complete" | null;
    })
  | (SyncRecordBase & {
      factType: "fired_week_streak_milestones";
      userId: UserId;
      value: number[];
    })
  | (SyncRecordBase & {
      factType: "training_age_state";
      userId: UserId;
      value: {
        rawSessionCount: number;
        weightedAge: number;
        milestonesShown: string[];
      };
    })
  | (SyncRecordBase & {
      factType: "longest_streak";
      userId: UserId;
      value: number;
    })
  | (SyncRecordBase & {
      factType: "personal_bests";
      userId: UserId;
      value: PersonalBest[];
    })
  | (SyncRecordBase & {
      factType: "shared_summary";
      value: SharedSummary;
    })
  | (SyncRecordBase & {
      factType: "weekly_rivalry_archive";
      value: WeeklyRivalryArchiveEntry;
    })
  | (SyncRecordBase & {
      factType: "steal_archive";
      value: StealArchiveEntry;
    })
  | (SyncRecordBase & {
      factType: "monthly_report_archive";
      value: MonthlyReportArchiveEntry;
    })
  | (SyncRecordBase & {
      factType: "session_signal_log";
      value: SessionSignalLogEntry;
    })
  | (SyncRecordBase & {
      factType: "ceiling_log";
      value: MuscleCeilingLogEntry;
    })
  | (SyncRecordBase & {
      factType: "lift_ready_history";
      value: LiftReadyHistoryEntry;
    });

export type DeviceState = {
  version: 2;
  selectedUserId: UserId;
  lockedProfile: UserId | null;
  rememberedProfile: UserId | null;
  onboardingSeen: boolean;
  hapticPreferences: Record<UserId, boolean>;
  isSessionActive: boolean;
  activeWorkout: ActiveWorkout | null;
};

export type SyncedDomainState = {
  version: 2;
  sessionRecords: SessionRecord[];
  measurementRecords: MeasurementRecord[];
  mobilityCompletionRecords: CompletionRecord[];
  workoutOverrideRecords: WorkoutOverrideRecord[];
  exerciseSwapMemoryRecords: ExerciseSwapMemoryRecord[];
  sharedFactRecords: SharedFactRecord[];
};

export type PersistedAppStateV2 = {
  version: 2;
  savedAt: string;
  deviceState: DeviceState;
  syncedDomainState: SyncedDomainState;
};

export type V2MigrationResult = {
  deviceState: DeviceState;
  syncedDomainState: SyncedDomainState;
  backupKey: string;
};

export type SyncStatus = "local_only" | "syncing" | "synced" | "sync_issue";

export type ActiveWorkout = {
  id: string;
  userId: UserId;
  startedAt: string;
  workoutDayId: string;
  workoutName: string;
  liveSignal?: LiveSessionSignal | null;
  ceilingResponses?: Partial<Record<MuscleGroup, MuscleCeilingResponse>>;
  hapticState?: {
    prApproachSetKeys: string[];
  };
  exercises: WorkoutSessionExercise[];
  templateExercises?: ExerciseTemplate[];
};

export type WorkoutOverride = {
  nextWorkoutId: string | null;
  updatedAt: string | null;
};

export type RecentTrainingUpdate = {
  userId: UserId;
  timestamp: string;
  workoutName: string;
  kind: "partial" | "complete" | "edit";
};

export type WeeklyRivalryArchiveEntry = {
  weekStart: string;
  winner: UserId | "tied";
  joshuaSessions: number;
  natashaSessions: number;
};

export type StealArchiveEntry = {
  date: string;
  stolenBy: UserId;
  consecutiveCount: number;
  weekNumber: number;
};

export type MonthlyReportProfileData = {
  sessions: number;
  totalSets: number;
  topMuscleGroup: string;
  signatureLift: string;
  consistencyScore: number;
  bestWeek: number;
  newPRs: number;
  streakBest: number;
};

export type MonthlyReportRivalryData = {
  weekWins: {
    joshua: number;
    natasha: number;
    tied: number;
  };
  totalSteals: {
    joshua: number;
    natasha: number;
  };
  monthWinner: UserId | "tied";
  goalAdherence?: {
    joshua: number;
    natasha: number;
  };
};

export type MonthlyReportArchiveEntry = {
  month: string;
  year: number;
  joshuaData: MonthlyReportProfileData;
  natashaData: MonthlyReportProfileData;
  rivalryData: MonthlyReportRivalryData;
  closingLines: {
    joshua: string;
    natasha: string;
  };
};

export type LiftReadyReadinessLevel = "early" | "developing" | "building" | "strong" | "ready";

export type LiftReadyTrend = "rising" | "steady" | "slipping";

export type LiftReadyHistoryEntry = {
  weekStart: string;
  compositeScore: number;
  readinessLevel: LiftReadyReadinessLevel;
  trend: LiftReadyTrend;
  phase: "build" | "define" | "peak" | "wedding_week" | "complete";
};

export type SessionSignalLogEntry = {
  sessionId: string;
  userId: UserId;
  exercise: string;
  signalType: LiveSessionSignalType;
  firedAt: string;
  copyIndex: number;
  strongDayState?: StrongDayState | null;
};

export type MuscleCeilingLogEntry = {
  profile: UserId;
  muscleGroup: MuscleGroup;
  sessionId: string;
  date: string;
  ceilingDetected: boolean;
  ceilingType: MuscleCeilingType | null;
  responseApplied: MuscleCeilingResponse | null;
  progressMadeThisSession: boolean;
};

export type AppState = {
  selectedUserId: UserId;
  profiles: Profile[];
  sessions: WorkoutSession[];
  isSessionActive: boolean;
  lastSeenWeddingPhase: Record<UserId, "build" | "define" | "peak" | "wedding_week" | "complete" | null>;
  profileCreatedAt: Record<UserId, string>;
  profileActivationDates: Record<UserId, string | null>;
  hapticPreferences: Record<UserId, boolean>;
  firedWeekStreakMilestones: Record<UserId, number[]>;
  trainingAgeState: Record<
    UserId,
    {
      rawSessionCount: number;
      weightedAge: number;
      milestonesShown: string[];
    }
  >;
  longestStreaks: Record<UserId, number>;
  rivalryArchive: WeeklyRivalryArchiveEntry[];
  stealArchive: StealArchiveEntry[];
  monthlyReportArchive: MonthlyReportArchiveEntry[];
  sessionSignalLog: SessionSignalLogEntry[];
  ceilingLog: MuscleCeilingLogEntry[];
  liftReadyHistory: LiftReadyHistoryEntry[];
  personalBests: Record<UserId, PersonalBest[]>;
  weeklySummaries: Record<UserId, WeeklySummary>;
  sharedSummary: SharedSummary;
  bibleVerses: BibleVerse[];
  measurements: Record<UserId, MeasurementEntry[]>;
  stretchCompletions: Record<UserId, StretchCompletion[]>;
  workoutOverrides: Record<UserId, WorkoutOverride>;
  exerciseSwapMemory: Record<UserId, Record<string, string>>;
  exerciseLibrary: ExerciseLibraryItem[];
  activeWorkout: ActiveWorkout | null;
};
