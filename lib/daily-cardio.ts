import type { DailyCardioPrompt, UserId } from "@/lib/types";

const cardioPromptsByProfile: Record<UserId, Record<string, DailyCardioPrompt>> = {
  natasha: {
    "natasha-glutes-hams": {
      key: "natasha-cardio-day1",
      workoutDayId: "natasha-glutes-hams",
      title: "Treadmill incline walk",
      duration: "20 min",
      intensity: "Incline 10-12, 4.8-5.5 km/h, steady zone 2",
      why: "Keeps fat loss moving and gives the glutes some clean work without beating up lower-body recovery.",
    },
    "natasha-back-arms": {
      key: "natasha-cardio-day2",
      workoutDayId: "natasha-back-arms",
      title: "Rower intervals",
      duration: "20 min",
      intensity: "5 min easy, then 5 rounds of 2 min moderate + 1 min hard",
      why: "Puts the harder conditioning on a push day so her glute sessions stay fresher for growth.",
    },
    "natasha-glutes-quads": {
      key: "natasha-cardio-day3",
      workoutDayId: "natasha-glutes-quads",
      title: "Bike steady ride",
      duration: "20 min",
      intensity: "Resistance 5-6, 80-90 rpm, low to moderate",
      why: "Adds calorie burn and a leg flush after quad work without extra impact that could flatten recovery.",
    },
    "natasha-upper-core": {
      key: "natasha-cardio-day4",
      workoutDayId: "natasha-upper-core",
      title: "Stairmaster climb",
      duration: "20 min",
      intensity: "Level 6 for 10 min, then level 8 for 10 min",
      why: "Drives calorie burn and glute demand on an upper-body day, which fits the wedding cut without stealing from glute growth days.",
    },
    "natasha-core-explosive": {
      key: "natasha-cardio-day5",
      workoutDayId: "natasha-core-explosive",
      title: "Elliptical mixed effort",
      duration: "20 min",
      intensity: "Resistance 6-8 with a 30 sec surge every 3 min",
      why: "Keeps weekly conditioning high with low impact so she stays fresh going back into the next lower-body block.",
    },
  },
  joshua: {
    "joshua-chest-triceps": {
      key: "joshua-cardio-day1",
      workoutDayId: "joshua-chest-triceps",
      title: "Treadmill incline walk",
      duration: "35 min",
      intensity: "Incline 10-12, 5.5-6.1 km/h, steady zone 2",
      why: "Builds the aerobic base that supports fat loss, heart health, and the blood-flow side of sexual function.",
    },
    "joshua-back-biceps": {
      key: "joshua-cardio-day2",
      workoutDayId: "joshua-back-biceps",
      title: "Rower intervals",
      duration: "28 min",
      intensity: "6 min easy, 8 rounds of 45 sec hard + 1:45 easy, 4 min easy",
      why: "Pushes conditioning and stamina harder without needing a long pounding run, which helps both body comp and bedroom engine.",
    },
    "joshua-legs": {
      key: "joshua-cardio-day3",
      workoutDayId: "joshua-legs",
      title: "Bike recovery ride",
      duration: "30 min",
      intensity: "Resistance 4-6, 85-95 rpm, low to moderate",
      why: "Flushes the legs after squats while still keeping weekly calorie burn high for getting leaner through the waist.",
    },
    "joshua-shoulders-arms": {
      key: "joshua-cardio-day4",
      workoutDayId: "joshua-shoulders-arms",
      title: "Elliptical threshold blocks",
      duration: "30 min",
      intensity: "4 min easy, then 3 rounds of 6 min hard-ish + 2 min easy",
      why: "Builds repeat-effort stamina and cardiovascular ceiling, which is useful for sex, sport, and staying sharp while cutting.",
    },
    "joshua-upper-strength": {
      key: "joshua-cardio-day5",
      workoutDayId: "joshua-upper-strength",
      title: "Long treadmill incline walk",
      duration: "40 min",
      intensity: "Incline 8-10, 5.3-6.0 km/h, nose-breathing zone 2",
      why: "Gives him a bigger weekly calorie burn and more steady-state work to help chip away at tummy fat without wrecking recovery.",
    },
  },
};

export function selectDailyCardioPrompt(
  userId: UserId,
  workoutDayId: string | null | undefined,
): DailyCardioPrompt | null {
  if (!workoutDayId) {
    return null;
  }

  return cardioPromptsByProfile[userId][workoutDayId] ?? null;
}
