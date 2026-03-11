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

export type SetLog = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
};

export type ExerciseTemplate = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repRange: string;
  restSeconds: 60 | 90 | 120;
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
  sets: SetLog[];
  note?: string;
};

export type WorkoutSession = {
  id: string;
  userId: UserId;
  workoutDayId: string;
  workoutName: string;
  performedAt: string;
  durationMinutes: number;
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

export type StrengthPrediction = {
  exerciseName: string;
  currentBest: string;
  projectedPerformance: string;
  note: string;
};

export type StretchRecommendation = {
  dayLabel: string;
  title: string;
  focus: string;
  durationMinutes: number;
  bendSearch: string;
  note: string;
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
  motivationLines?: string[];
  workoutPlan: WorkoutPlanDay[];
  stretchPlan: StretchRecommendation[];
  favoriteExerciseIds: string[];
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
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

export type ActiveWorkout = {
  id: string;
  userId: UserId;
  startedAt: string;
  workoutDayId: string;
  workoutName: string;
  exercises: WorkoutSessionExercise[];
};

export type AppState = {
  selectedUserId: UserId;
  profiles: Profile[];
  sessions: WorkoutSession[];
  personalBests: Record<UserId, PersonalBest[]>;
  weeklySummaries: Record<UserId, WeeklySummary>;
  sharedSummary: SharedSummary;
  bibleVerses: BibleVerse[];
  measurements: Record<UserId, MeasurementEntry[]>;
  stretchCompletions: Record<UserId, StretchCompletion[]>;
  exerciseLibrary: ExerciseLibraryItem[];
  activeWorkout: ActiveWorkout | null;
};
