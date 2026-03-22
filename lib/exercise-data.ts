import type { ExerciseLibraryItem } from "@/lib/types";

const EXERCISE_NAME_ALIASES: Array<string[]> = [
  ["straight arm pulldown", "straight arm cable pulldown"],
  ["lat pullover", "machine lat pullover"],
  ["hyperextensions", "back hyperextensions", "45 degree back extension"],
  ["machine row", "plate loaded row"],
];

export function normalizeExerciseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[+/]/g, " ")
    .replace(/[-(),]/g, " ")
    .replace(/\btricep\b/g, "triceps")
    .replace(/\bbicep\b/g, "biceps")
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\s+/g, " ")
    .trim();
}

export function getExerciseNameKeys(name: string) {
  const normalized = normalizeExerciseName(name);
  const keys = new Set([normalized]);

  for (const aliasGroup of EXERCISE_NAME_ALIASES) {
    if (aliasGroup.includes(normalized)) {
      aliasGroup.forEach((alias) => keys.add(alias));
    }
  }

  return [...keys];
}

export function areEquivalentExerciseNames(left: string, right: string) {
  const leftKeys = getExerciseNameKeys(left);
  const rightKeys = new Set(getExerciseNameKeys(right));
  return leftKeys.some((key) => rightKeys.has(key));
}

export function findExerciseLibraryItemByName(library: ExerciseLibraryItem[], name: string) {
  const targetKeys = new Set(getExerciseNameKeys(name));
  return library.find((item) => getExerciseNameKeys(item.name).some((key) => targetKeys.has(key))) ?? null;
}

export function buildCanonicalExerciseLibrary(items: ExerciseLibraryItem[]) {
  const canonical = new Map<string, ExerciseLibraryItem>();

  for (const item of items) {
    const key = normalizeExerciseName(item.name);
    const existing = canonical.get(key);
    if (!existing) {
      canonical.set(key, { ...item, cues: [...item.cues] });
      continue;
    }

    canonical.set(key, {
      ...(existing.cues.length >= item.cues.length ? existing : item),
      cues: Array.from(new Set([...existing.cues, ...item.cues])),
    });
  }

  return [...canonical.values()];
}
