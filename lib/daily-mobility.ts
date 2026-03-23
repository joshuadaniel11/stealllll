import type { DailyMobilityPrompt, MobilityPromptTemplate, Profile, StretchCompletion } from "@/lib/types";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function getCurrentWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getCurrentWeekCompletionCount(completions: StretchCompletion[], date: Date) {
  const weekStart = getCurrentWeekStart(date);
  return completions.filter((entry) => new Date(entry.date) >= weekStart).length;
}

function getFeedbackLine(completions: StretchCompletion[], date: Date) {
  const weeklyCount = getCurrentWeekCompletionCount(completions, date);

  if (weeklyCount >= 5) {
    return "Mobility improving";
  }

  if (weeklyCount >= 3) {
    return "Consistency building";
  }

  if (weeklyCount >= 1) {
    return "Range opening up";
  }

  return "Easy win for today";
}

function getPromptTemplate(profile: Profile, date: Date): MobilityPromptTemplate {
  const today = days[date.getDay()];
  return profile.stretchPlan.find((prompt) => prompt.dayLabel === today) ?? profile.stretchPlan[0];
}

export function selectDailyMobilityPrompt(
  profile: Profile,
  completions: StretchCompletion[],
  date = new Date(),
): DailyMobilityPrompt {
  const prompt = getPromptTemplate(profile, date);

  return {
    ...prompt,
    secondaryStretches: prompt.secondaryStretches ?? [],
    feedback: getFeedbackLine(completions, date),
  };
}
