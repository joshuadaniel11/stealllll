import type { Profile } from "@/lib/types";

export type WeddingPhase = "build" | "define" | "peak" | "wedding_week" | "complete";
export type WeddingUrgencyLevel = "low" | "medium" | "high" | "final";

export type WeddingDateState = {
  weddingDate: Date;
  weeksRemaining: number;
  daysRemaining: number;
  currentPhase: WeddingPhase;
  phaseWeekNumber: number;
  phaseWeeksTotal: number;
  urgencyLevel: WeddingUrgencyLevel;
  isWeddingDay: boolean;
  isWeddingWeek: boolean;
  isPastWedding: boolean;
  phaseLabel: Record<Profile["id"], string>;
};

export type WeddingPhaseProfile = {
  currentPhase: WeddingPhase;
  priorityMuscles: string[];
  volumeModifier: number;
  intensityBias: "strength" | "volume" | "definition" | "maintenance";
  restrictNewExercises: boolean;
};

export type WeddingCountdownCardState = {
  visible: boolean;
  heroValue: number | null;
  heroUnit: "weeks" | "days" | null;
  copy: string | null;
  phaseLabel: string | null;
};

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getDaysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / 86400000));
}

function getWeekStartMonday(value: Date) {
  const next = startOfLocalDay(value);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
}

function getWeddingDateForYear(year: number) {
  return new Date(year, 10, 2);
}

function getTrackedWeddingDate(referenceDate: Date) {
  const currentYearWedding = getWeddingDateForYear(referenceDate.getFullYear());
  return startOfLocalDay(referenceDate) <= currentYearWedding
    ? currentYearWedding
    : getWeddingDateForYear(referenceDate.getFullYear() + 1);
}

function getPhaseFromDaysRemaining(daysRemaining: number, isPastWedding: boolean): WeddingPhase {
  if (isPastWedding) {
    return "complete";
  }
  if (daysRemaining <= 7) {
    return "wedding_week";
  }
  if (daysRemaining <= 28) {
    return "peak";
  }
  if (daysRemaining <= 84) {
    return "define";
  }
  return "build";
}

function getPhaseWeekData(daysRemaining: number, currentPhase: WeddingPhase, weeksRemaining: number) {
  switch (currentPhase) {
    case "build":
      return {
        phaseWeekNumber: 1,
        phaseWeeksTotal: Math.max(1, weeksRemaining - 12),
      };
    case "define":
      return {
        phaseWeekNumber: Math.min(8, Math.floor((84 - daysRemaining) / 7) + 1),
        phaseWeeksTotal: 8,
      };
    case "peak":
      return {
        phaseWeekNumber: Math.min(3, Math.floor((28 - daysRemaining) / 7) + 1),
        phaseWeeksTotal: 3,
      };
    case "wedding_week":
    case "complete":
      return {
        phaseWeekNumber: 1,
        phaseWeeksTotal: 1,
      };
  }
}

function getUrgencyLevel(weeksRemaining: number): WeddingUrgencyLevel {
  if (weeksRemaining > 16) {
    return "low";
  }
  if (weeksRemaining >= 8) {
    return "medium";
  }
  if (weeksRemaining >= 4) {
    return "high";
  }
  return "final";
}

function getPhaseLabel(currentPhase: WeddingPhase): WeddingDateState["phaseLabel"] {
  switch (currentPhase) {
    case "build":
      return {
        joshua: "Building the base.",
        natasha: "Building the shape.",
      };
    case "define":
      return {
        joshua: "Defining the detail.",
        natasha: "Defining the curves.",
      };
    case "peak":
      return {
        joshua: "Peak weeks. Everything counts.",
        natasha: "Peak weeks. Every session matters.",
      };
    case "wedding_week":
      return {
        joshua: "This is the week.",
        natasha: "This is the week.",
      };
    case "complete":
      return {
        joshua: "You did the work.",
        natasha: "You did the work.",
      };
  }
}

export class WeddingDateService {
  static getState(referenceDate = new Date()): WeddingDateState {
    const today = startOfLocalDay(referenceDate);
    const currentYearWedding = getWeddingDateForYear(referenceDate.getFullYear());
    const weddingDate = getTrackedWeddingDate(referenceDate);
    const isWeddingDay = today.getTime() === weddingDate.getTime();
    const isPastWedding = today.getTime() > currentYearWedding.getTime() && today.getFullYear() === currentYearWedding.getFullYear();
    const weekStart = getWeekStartMonday(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const isWeddingWeek = weddingDate >= weekStart && weddingDate <= weekEnd;
    const daysRemaining = isPastWedding ? 0 : getDaysBetween(today, weddingDate);
    const weeksRemaining = Math.floor(daysRemaining / 7);
    const currentPhase = getPhaseFromDaysRemaining(daysRemaining, isPastWedding);
    const { phaseWeekNumber, phaseWeeksTotal } = getPhaseWeekData(daysRemaining, currentPhase, weeksRemaining);

    return {
      weddingDate,
      weeksRemaining,
      daysRemaining,
      currentPhase,
      phaseWeekNumber,
      phaseWeeksTotal,
      urgencyLevel: getUrgencyLevel(weeksRemaining),
      isWeddingDay,
      isWeddingWeek,
      isPastWedding,
      phaseLabel: getPhaseLabel(currentPhase),
    };
  }
}

export function getWeddingPhaseProfile(profileId: Profile["id"], weddingDate: WeddingDateState): WeddingPhaseProfile {
  if (profileId === "joshua") {
    switch (weddingDate.currentPhase) {
      case "build":
        return {
          currentPhase: "build",
          priorityMuscles: ["upperChest", "midChest", "sideDelts", "lats", "triceps"],
          volumeModifier: 1,
          intensityBias: "strength",
          restrictNewExercises: false,
        };
      case "define":
        return {
          currentPhase: "define",
          priorityMuscles: ["upperChest", "sideDelts", "upperAbs", "lowerAbs", "midChest"],
          volumeModifier: 0.88,
          intensityBias: "definition",
          restrictNewExercises: false,
        };
      case "peak":
        return {
          currentPhase: "peak",
          priorityMuscles: ["upperChest", "midChest", "sideDelts", "frontDelts", "triceps"],
          volumeModifier: 0.7,
          intensityBias: "maintenance",
          restrictNewExercises: true,
        };
      case "wedding_week":
        return {
          currentPhase: "wedding_week",
          priorityMuscles: ["upperChest", "midChest", "sideDelts", "frontDelts"],
          volumeModifier: 0.55,
          intensityBias: "maintenance",
          restrictNewExercises: true,
        };
      case "complete":
        return {
          currentPhase: "complete",
          priorityMuscles: ["upperChest", "midChest", "sideDelts", "lats"],
          volumeModifier: 1,
          intensityBias: "volume",
          restrictNewExercises: false,
        };
    }
  }

  switch (weddingDate.currentPhase) {
    case "build":
      return {
        currentPhase: "build",
        priorityMuscles: ["gluteMax", "upperGlutes", "lats", "upperBack", "obliques"],
        volumeModifier: 1,
        intensityBias: "volume",
        restrictNewExercises: false,
      };
    case "define":
      return {
        currentPhase: "define",
        priorityMuscles: ["gluteMax", "sideGlutes", "obliques", "lats", "upperBack"],
        volumeModifier: 0.9,
        intensityBias: "definition",
        restrictNewExercises: false,
      };
    case "peak":
      return {
        currentPhase: "peak",
        priorityMuscles: ["gluteMax", "sideGlutes", "obliques", "lats"],
        volumeModifier: 0.7,
        intensityBias: "maintenance",
        restrictNewExercises: true,
      };
    case "wedding_week":
      return {
        currentPhase: "wedding_week",
        priorityMuscles: ["gluteMax", "upperBack", "lats", "sideGlutes"],
        volumeModifier: 0.55,
        intensityBias: "maintenance",
        restrictNewExercises: true,
      };
    case "complete":
      return {
        currentPhase: "complete",
        priorityMuscles: ["gluteMax", "upperGlutes", "sideGlutes", "lats"],
        volumeModifier: 1,
        intensityBias: "volume",
        restrictNewExercises: false,
      };
  }
}

export function getWeddingPriorityMusclesForPhase(
  profileId: Profile["id"],
  currentPhase: WeddingPhase,
): WeddingPhaseProfile["priorityMuscles"] {
  return getWeddingPhaseProfile(profileId, {
    weddingDate: new Date(),
    weeksRemaining: 0,
    daysRemaining: 0,
    currentPhase,
    phaseWeekNumber: 1,
    phaseWeeksTotal: 1,
    urgencyLevel: "low",
    isWeddingDay: false,
    isWeddingWeek: currentPhase === "wedding_week",
    isPastWedding: currentPhase === "complete",
    phaseLabel: {
      joshua: "",
      natasha: "",
    },
  }).priorityMuscles;
}

export function getWeddingPhaseIndicator(currentPhase: WeddingPhase) {
  switch (currentPhase) {
    case "build":
      return { label: "FOUNDATION", description: "Building volume and strength." };
    case "define":
      return { label: "DEFINITION", description: "Sharpening and defining." };
    case "peak":
      return { label: "PEAK", description: "Protecting everything you've built." };
    case "wedding_week":
      return { label: "THIS WEEK", description: "Final week. One session. That's all." };
    case "complete":
      return { label: "COMPLETE", description: "You did the work." };
  }
}

export function getWeddingCountdownCardState(
  profileId: Profile["id"],
  weddingDate: WeddingDateState,
): WeddingCountdownCardState {
  if (weddingDate.isPastWedding) {
    return {
      visible: false,
      heroValue: null,
      heroUnit: null,
      copy: null,
      phaseLabel: null,
    };
  }

  if (weddingDate.isWeddingDay) {
    return {
      visible: true,
      heroValue: null,
      heroUnit: null,
      copy: "Today.",
      phaseLabel: null,
    };
  }

  const profileCopy = {
    joshua: {
      buildLow: "Build the chest. The date is coming.",
      buildMedium: "Chest and shoulders. Every session counts.",
      define: "Definition phase. Don't miss a session.",
      peak: "Peak weeks. Protect what you've built.",
      weddingWeek: "This is the week you trained for.",
    },
    natasha: {
      buildLow: "Build the shape. November 2nd is the goal.",
      buildMedium: "Glutes and back. Stay consistent.",
      define: "Definition phase. The shape is forming.",
      peak: "Peak weeks. Every session matters now.",
      weddingWeek: "This is the week you trained for.",
    },
  } satisfies Record<Profile["id"], Record<string, string>>;

  const phaseIndicator = getWeddingPhaseIndicator(weddingDate.currentPhase);
  const phaseLabel = phaseIndicator.label;

  if (weddingDate.daysRemaining <= 7 || weddingDate.isWeddingWeek) {
    return {
      visible: true,
      heroValue: weddingDate.daysRemaining,
      heroUnit: "days",
      copy: profileCopy[profileId].weddingWeek,
      phaseLabel,
    };
  }

  if (weddingDate.currentPhase === "peak") {
    return {
      visible: true,
      heroValue: weddingDate.weeksRemaining,
      heroUnit: "weeks",
      copy: profileCopy[profileId].peak,
      phaseLabel,
    };
  }

  if (weddingDate.currentPhase === "define") {
    return {
      visible: true,
      heroValue: weddingDate.weeksRemaining,
      heroUnit: "weeks",
      copy: profileCopy[profileId].define,
      phaseLabel,
    };
  }

  return {
    visible: true,
    heroValue: weddingDate.weeksRemaining,
    heroUnit: "weeks",
    copy: weddingDate.urgencyLevel === "low" ? profileCopy[profileId].buildLow : profileCopy[profileId].buildMedium,
    phaseLabel,
  };
}

export function getWeddingPhaseTransitionCopy(
  profileId: Profile["id"],
  previousPhase: WeddingPhase | null,
  currentPhase: WeddingPhase,
) {
  if (!previousPhase || previousPhase === currentPhase) {
    return null;
  }

  if (currentPhase === "define" && previousPhase === "build") {
    return profileId === "joshua"
      ? "12 weeks out. Time to sharpen."
      : "12 weeks out. Definition starts now.";
  }

  if (currentPhase === "peak" && previousPhase === "define") {
    return profileId === "joshua"
      ? "Four weeks. Everything you've built is already there."
      : "Four weeks. The shape is there. Now we protect it.";
  }

  if (currentPhase === "wedding_week") {
    return "One week. You're ready.";
  }

  return null;
}
