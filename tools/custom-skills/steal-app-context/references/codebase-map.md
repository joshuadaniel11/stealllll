# STEAL Codebase Map

## Product Summary

STEAL is a premium dark-mode mobile-first fitness app for Joshua and Natasha. The app is private, wedding-aware, rivalry-aware, and profile-aware. It relies on centralized selectors and services instead of distributing business logic through UI components.

## Core UI Surfaces

- App shell: [components/workout-tracker-app.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-tracker-app.tsx)
- Home: [components/home-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\home-screen.tsx)
- Workout: [components/workout-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-screen.tsx)
- Progress: [components/progress-screen.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\progress-screen.tsx)
- Settings/Profile: [components/settings-modal.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\settings-modal.tsx)
- Body map visual: [components/body-activation-visual.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\body-activation-visual.tsx)
- Shared calendar: [components/weekly-training-calendar.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\weekly-training-calendar.tsx)

## Workout and Session Foundations

- Session construction and resume: [lib/workout-session.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\workout-session.ts)
- State mutations: [lib/app-actions.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-actions.ts)
- App state shape and merge utilities: [lib/app-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-state.ts)
- Seed state: [lib/seed-data.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\seed-data.ts)
- Canonical exercise data: [lib/exercise-data.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\exercise-data.ts)
- Exercise swaps: [lib/exercise-swaps.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\exercise-swaps.ts)

Confirmed workout system behavior:

- start session
- resume session
- partial save
- complete session
- edit session
- active workout state
- direct set logging
- current exercise progression
- live signal banner integration

## Central Training Selectors

Primary central selector file:

- [lib/profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)

Key confirmed selectors and sync helpers in that file:

- `getProfileTrainingState`
- `getStreakAndMomentum`
- `getProfileMaturityState`
- `getTrainingAge`
- `getSignatureLifts`
- `getWeeklyRivalryState`
- `getStealState`
- `getWeddingRivalryState`
- `getMonthlyReportCard`
- `getLiftReadyScore`
- `getNatashaPriorityLock`
- `getWaistProtocol`
- `getBackRevealState`
- `syncWeeklyRivalryArchive`
- `syncStealArchive`
- `syncMonthlyReportArchive`
- `syncLiftReadyHistory`

This file also owns:

- rivalry copy
- rest-day reads
- momentum copy
- monthly report archive shaping
- progress-phase indicator shaping
- goal dashboard shaping
- lift-ready home line shaping

## Training Load and Recommendation Engine

Primary file:

- [lib/training-load.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\training-load.ts)

Confirmed responsibilities:

- weekly load calculations
- target zone mapping
- group summaries
- calendar row generation
- next-focus recommendations
- suggested session generation
- wedding phase priorities through `WeddingPhaseProfile`
- Natasha-only priority lock input
- Natasha waist protocol weaving
- Natasha back reveal weaving
- muscle ceiling response integration
- target display labels and muscle-zone labels

The app expects recommendation logic to stay here or in adjacent services, not in components.

## Wedding Engine

Primary file:

- [lib/wedding-date.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\wedding-date.ts)

Confirmed state and concepts:

- `WeddingDateService`
- fixed target date: November 2nd
- `build`
- `define`
- `peak`
- `wedding_week`
- `complete`
- urgency levels `low`, `medium`, `high`, `final`
- profile-aware `phaseLabel`
- `getWeddingPhaseProfile`
- `getWeddingCountdownCardState`
- phase transition copy helpers

This is the single source of truth for wedding time context.

## Live Session Intelligence

Primary file:

- [lib/live-session-signal.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\live-session-signal.ts)

Confirmed behavior:

- one-fire-per-session signal logic
- signal types:
  - `push`
  - `hold`
  - `bank`
  - `pr_close`
  - `strong_day`
- `getStrongDayState`
- `getLiveSessionSignal`
- profile-aware rotating copy
- session signal logging helpers

## Haptics

Primary file:

- [lib/haptics.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\haptics.ts)

Confirmed behavior:

- centralized `HapticService`
- events:
  - `pr_approach`
  - `session_complete`
  - `rivalry_lead_change`
  - `week_streak`
  - `set_saved`
- per-profile enable/disable support
- cooldown and burst guards
- week streak milestone tracking

## Supabase Shared Sync

Files:

- [lib/supabase.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\supabase.ts)
- [lib/cloud-sync.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\cloud-sync.ts)
- [lib/storage.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\storage.ts)
- [supabase/app_state_snapshots.sql](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\supabase\app_state_snapshots.sql)

Confirmed sync details:

- table: `app_state_snapshots`
- env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_SYNC_ID`
- cloud sync optional
- local storage fallback exists
- local-only fields excluded from cloud sync:
  - `selectedUserId`
  - `isSessionActive`
  - `activeWorkout`
  - `lastSeenWeddingPhase`

## Profile-Specific Systems

### Joshua

- hidden lift-ready score in [lib/profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)
- wedding-oriented chest/upper body shaping via wedding phase profile
- tone should stay sharp, grounded, strong

### Natasha

- priority lock in [lib/profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)
- waist protocol in [lib/profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)
- back reveal in [lib/profile-training-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\profile-training-state.ts)
- session weaving and soreness filtering in [lib/training-load.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\training-load.ts)
- tone should stay shape-forward, feminine, premium

## Other Built Systems Confirmed in Code

- profile persistence per phone
- active session atmosphere state
- rest-day card logic
- momentum pill logic
- rivalry card with wedding-goal row
- monthly report card
- signature lifts section
- training age line
- body activation visual
- daily mobility prompt card

## Copy Style Rules

- Keep copy short.
- Keep it restrained.
- Keep it premium and intimate.
- Prefer one quiet line over explanatory UI.
- Avoid corny or hype-heavy language.
- Avoid gym-bro tone.
- Avoid adding visible metrics unless clearly necessary.
