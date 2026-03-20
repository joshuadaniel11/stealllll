"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui";
import type { WorkoutSession } from "@/lib/types";

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function normalizeWorkoutName(workoutName: string, partial: boolean) {
  const cleaned = workoutName.replace(/\s*\(Partial\)$/i, "");
  return partial ? `${cleaned} (Partial)` : cleaned;
}

function cloneSession(session: WorkoutSession) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set })),
    })),
  };
}

export function EditWorkoutModal({
  session,
  onClose,
  onSave,
}: {
  session: WorkoutSession | null;
  onClose: () => void;
  onSave: (session: WorkoutSession, options?: { countAsDone?: boolean }) => void;
}) {
  const [draft, setDraft] = useState<WorkoutSession | null>(session ? cloneSession(session) : null);

  useEffect(() => {
    setDraft(session ? cloneSession(session) : null);
  }, [session]);

  if (!draft) {
    return null;
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-large animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Edit workout</p>
              <h3 className="large-title mt-2 font-semibold text-text">{draft.workoutName}</h3>
              <p className="caption-text mt-2 text-muted">
                Fix weights or reps if something was logged wrong.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                draft.partial
                  ? "bg-accentSoft text-accent"
                  : "bg-black/10 text-text dark:bg-white/10"
              }`}
            >
              {draft.partial ? "Partial" : "Full"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
              <div className="grid grid-cols-1 gap-3">
                <label className="rounded-[18px] bg-black/10 px-3 py-3 dark:bg-white/5">
                  <span className="caption-text text-muted">Workout date and time</span>
                  <input
                    className="mt-1 w-full bg-transparent text-base font-semibold text-text outline-none"
                    type="datetime-local"
                    value={toDateTimeLocalValue(draft.performedAt)}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              performedAt: fromDateTimeLocalValue(event.target.value),
                            }
                          : current,
                      )
                    }
                  />
                </label>
                {draft.partial ? (
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      className="rounded-[18px] bg-black/10 px-4 py-3 text-sm font-medium text-text dark:bg-white/5"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                partial: false,
                                workoutName: normalizeWorkoutName(current.workoutName, false),
                              }
                            : current,
                        )
                      }
                    >
                      Mark this as a full workout
                    </button>
                    <button
                      className="rounded-[18px] bg-[var(--accentSoft)] px-4 py-3 text-sm font-semibold text-accent"
                      onClick={() =>
                        onSave(
                          {
                            ...draft,
                            partial: false,
                            workoutName: normalizeWorkoutName(draft.workoutName, false),
                          },
                          { countAsDone: true },
                        )
                      }
                    >
                      Count this as done and move on
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {draft.exercises.map((exercise, exerciseIndex) => (
              <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text">{exercise.exerciseName}</p>
                  <p className="caption-text text-muted">{exercise.muscleGroup}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="grid grid-cols-[72px_1fr_1fr] gap-2">
                      <div className="rounded-[18px] bg-black/10 px-3 py-3 text-sm text-muted dark:bg-white/5">
                        Set {setIndex + 1}
                      </div>
                      <label className="rounded-[18px] bg-black/10 px-3 py-3 dark:bg-white/5">
                        <span className="caption-text text-muted">Weight</span>
                        <input
                          className="mt-1 w-full bg-transparent text-base font-semibold text-text outline-none"
                          inputMode="decimal"
                          type="number"
                          value={set.weight || ""}
                          placeholder="0"
                          onChange={(event) =>
                            setDraft((current) => {
                              if (!current) {
                                return current;
                              }
                              const next = cloneSession(current);
                              next.exercises[exerciseIndex].sets[setIndex].weight = Number(event.target.value) || 0;
                              return next;
                            })
                          }
                        />
                      </label>
                      <label className="rounded-[18px] bg-black/10 px-3 py-3 dark:bg-white/5">
                        <span className="caption-text text-muted">Reps</span>
                        <input
                          className="mt-1 w-full bg-transparent text-base font-semibold text-text outline-none"
                          inputMode="numeric"
                          type="number"
                          value={set.reps || ""}
                          placeholder="0"
                          onChange={(event) =>
                            setDraft((current) => {
                              if (!current) {
                                return current;
                              }
                              const next = cloneSession(current);
                              next.exercises[exerciseIndex].sets[setIndex].reps = Number(event.target.value) || 0;
                              return next;
                            })
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              className="sheet-action-secondary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="sheet-action-primary rounded-[28px] px-4 py-4 text-sm font-semibold"
              onClick={() =>
                onSave({
                  ...draft,
                  workoutName: normalizeWorkoutName(draft.workoutName, Boolean(draft.partial)),
                })
              }
            >
              Save changes
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
