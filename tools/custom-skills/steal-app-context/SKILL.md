---
name: steal-app-context
description: Permanent architecture and product context for the STEAL fitness app. Use when working on the STEAL codebase, extending workout logic, refining Joshua or Natasha behavior, changing Home/Workout/Progress/Settings flows, touching wedding-aware or rivalry-aware features, updating Supabase shared sync, or making product/copy decisions that must stay aligned with STEAL's existing selectors, services, and premium private product identity.
---

# STEAL App Context

## Overview

Use this skill when working inside the STEAL app so Codex does not need the product and architecture re-explained. Treat STEAL as a sophisticated private product, not a generic workout tracker.

## Core Identity

- Treat STEAL as a premium dark-mode mobile-first fitness app for two profiles: Joshua and Natasha.
- Preserve the product as wedding-aware, rivalry-aware, and profile-aware throughout.
- Prefer calm, private, premium surfaces over dashboard clutter or gamified noise.
- Keep copy short, restrained, intimate, and direct. Avoid corny, hype-heavy, or gym-bro language.

## Non-Negotiable Rules

- Keep all calculation logic in helpers, selectors, or services.
- Never move business logic into UI components.
- Preserve centralized training-load logic in [training-load.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\training-load.ts).
- Preserve centralized profile-training-state logic in [profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts).
- Do not duplicate business logic across screens or components.
- Keep mobility fully independent. Never merge mobility into training logic.
- Maintain profile-awareness in recommendations, copy, and visual emphasis.
- Let hidden intelligence improve recommendations silently instead of surfacing more visible metrics.

## Product Structure

- Home is the command surface and shared context layer.
- Workout owns preview, logging, swap behavior, live signals, and completion.
- Progress owns weekly status, training load, calendar, and compressed details.
- Settings/Profile owns profile-level identity, toggles, signature lifts, and training age.
- The app shell lives in [workout-tracker-app.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-tracker-app.tsx).

## Profiles

### Joshua

- Priority muscles: `upperChest`, `midChest`, `sideDelts`, `rearDelts`, `lats`, `upperAbs`, `lowerAbs`, `biceps`, `triceps`
- Tone: sharp, grounded, strong, performance-forward
- Wedding goal: chest, upper-body strength, wedding-ready upper body

### Natasha

- Priority muscles: `upperGlutes`, `gluteMax`, `sideGlutes`, `lats`, `upperBack`, `lowerAbs`, `obliques`, `sideDelts`
- Tone: shape-forward, feminine, premium, never generic
- Wedding goal: glutes, waist definition, back shape

## Confirmed Systems Already Built

The following exist in code and should be extended rather than rebuilt:

- Workout logging: start, resume, partial save, complete, edit, set logging, active session state
- Profile persistence per phone via local storage
- Shared competitive calendar via Supabase sync
- Weekly rivalry system with steals and weekly archive
- Wedding date engine targeting November 2nd
- Wedding phase system: `build`, `define`, `peak`, `wedding_week`, `complete`
- Hidden training intelligence and selector-driven insights
- Live session signal with `push`, `hold`, `bank`, `pr_close`, and `strong_day`
- Streak, profile maturity, training age, and signature lifts
- Hidden Joshua lift-ready score
- Natasha priority lock, waist protocol, and back reveal systems
- Muscle ceiling detection and silent recommendation shifts
- Monthly report card and archive
- Centralized haptics
- Body activation visual / body map component
- Supabase shared sync with local fallback

## Key Files

- App shell: [workout-tracker-app.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-tracker-app.tsx)
- Home: [home-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\home-screen.tsx)
- Workout: [workout-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-screen.tsx)
- Progress: [progress-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\progress-screen.tsx)
- Settings/Profile: [settings-modal.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\settings-modal.tsx)
- Profile selectors: [profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)
- Training load and session generation: [training-load.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\training-load.ts)
- Wedding engine: [wedding-date.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\wedding-date.ts)
- Live session intelligence: [live-session-signal.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\live-session-signal.ts)
- Haptics: [haptics.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\haptics.ts)
- Session building/resume: [workout-session.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\workout-session.ts)
- State mutations: [app-actions.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-actions.ts)
- Local storage: [storage.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\storage.ts)
- Supabase client: [supabase.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\supabase.ts)
- Cloud sync: [cloud-sync.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\cloud-sync.ts)
- Body map visual: [body-activation-visual.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\body-activation-visual.tsx)

## Supabase Sync Rules

- Shared sync uses table `app_state_snapshots`.
- Environment variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SUPABASE_SYNC_ID`.
- Keep `selectedUserId`, `isSessionActive`, `activeWorkout`, and `lastSeenWeddingPhase` local to each phone.
- Keep cloud sync optional. If env vars are missing, local storage fallback must still work.
- Review [references/codebase-map.md](./references/codebase-map.md) for exact sync file behavior.

## Working Rules

- Read the central selector or service before changing any related UI.
- Extend existing selectors before creating new parallel ones.
- When touching Joshua- or Natasha-only wedding logic, confirm the behavior remains profile-specific.
- When touching countdown, phase, rivalry, or wedding behavior, read [wedding-date.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\wedding-date.ts) and the relevant selector sections in [profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts).
- When touching recommendation generation, read [training-load.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\training-load.ts) first.
- When touching state persistence or cross-device behavior, read [storage.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\storage.ts), [supabase.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\supabase.ts), and [cloud-sync.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\cloud-sync.ts).

## Read This Reference When Needed

- Read [references/codebase-map.md](./references/codebase-map.md) when you need the confirmed file map, major selectors, sync behavior, and the concrete list of already-built systems.
