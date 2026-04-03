import { BrandEmptyState } from "@/components/brand-empty-state";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import { getExercisePerformance } from "@/lib/progression";
import type { ExerciseLibraryItem, ExerciseTemplate, WorkoutSession } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

export function ExerciseDetailModal({
  exercise,
  userSessions,
  onClose,
}: {
  exercise: ExerciseTemplate | ExerciseLibraryItem | null;
  userSessions: WorkoutSession[];
  onClose: () => void;
}) {
  if (!exercise) {
    return null;
  }

  const history = userSessions
    .flatMap((session) =>
      session.exercises
        .filter((item) => item.exerciseId === exercise.id)
        .map((item) => ({
          date: formatDate(session.performedAt),
          totalReps: item.sets.reduce((sum, set) => sum + set.reps, 0),
          bestSet: Math.max(...item.sets.map((set) => set.weight * set.reps)),
        })),
    )
    .slice(0, 5);

  const performanceRead = "repRange" in exercise ? getExercisePerformance(exercise, userSessions) : null;
  const suggestion = performanceRead?.suggestion ?? null;
  const cues = "cues" in exercise ? exercise.cues : [exercise.note ?? "Smooth tempo and stable setup."];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel sheet-detent-large animate-sheet-up" onClick={(event) => event.stopPropagation()}>
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <ScrollReveal delay={0} y={18} scale={0.994}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Exercise detail</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{exercise.name}</h3>
                <p className="mt-1 text-sm text-muted">{exercise.muscleGroup}</p>
              </div>
              <button
                className="sheet-close-button rounded-full px-3 py-2 text-sm font-medium"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </ScrollReveal>

          {suggestion && (
            <ScrollReveal delay={60} y={18} scale={0.994}>
              <div className="library-summary-card mt-4 rounded-[24px] p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Progress cue</p>
                <p className="mt-2 text-sm leading-6 text-text">{suggestion}</p>
                {performanceRead ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                      <p className="uppercase tracking-[0.14em] text-white/42">Last session</p>
                      <p className="mt-2 text-sm text-white/76">{performanceRead.lastSession}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                      <p className="uppercase tracking-[0.14em] text-white/42">Current best</p>
                      <p className="mt-2 text-sm text-white/76">{performanceRead.bestPerformance}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal delay={85} y={18} scale={0.994}>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="library-stat-tile rounded-[20px] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Primary target</p>
                <p className="mt-1 text-sm font-medium text-text">{exercise.muscleGroup}</p>
              </div>
              <div className="library-stat-tile rounded-[20px] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Recent entries</p>
                <p className="mt-1 text-sm font-medium text-text">{history.length || "No history yet"}</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={110} y={20} scale={0.992}>
            <div className="mt-4 space-y-3">
              {history.length ? (
                history.map((item) => (
                  <div
                    key={`${exercise.id}-${item.date}`}
                    className="library-history-row rounded-[20px] px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text">{item.date}</p>
                      <p className="text-sm text-muted">Best score {item.bestSet}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{item.totalReps} total reps</p>
                  </div>
                ))
              ) : (
                <BrandEmptyState
                  title="Fresh movement"
                  body="This exercise has not built a visible history yet. Your recent sets will show up here once you log them."
                  className="text-sm"
                  compact
                />
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160} y={18} scale={0.994}>
            <div className="library-cue-card mt-4 rounded-[24px] p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Execution notes</p>
              <div className="mt-2 space-y-2 text-sm leading-6 text-muted">
                {cues.map((cue) => (
                  <p key={cue}>{cue}</p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Card>
      </div>
    </div>
  );
}
