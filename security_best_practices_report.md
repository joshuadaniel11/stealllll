# STEAL Security Audit

## Executive Summary

STEAL had one confirmed critical deployment issue in the repo configuration: the shared Supabase snapshot table SQL explicitly disabled Row Level Security. I fixed that in the codebase SQL, added runtime validation around cloud sync payloads, and tightened workout set input sanitization so invalid negative or non-finite values cannot be saved through the normal logging flow.

The main remaining deployment risk is architectural rather than a broken code path: the shared sync model still relies on a public client-side sync identifier plus a public Supabase anon key. That can be acceptable for a private couple app, but it is not strong authorization. If STEAL is meant to resist arbitrary third-party access, the sync layer needs authenticated users or a server-side proxy.

## Critical

### SEC-001: RLS was disabled on the shared Supabase snapshot table
- Severity: Critical
- Location: [supabase/app_state_snapshots.sql](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\supabase\app_state_snapshots.sql):12-35
- Evidence: the repo SQL previously ended with `alter table public.app_state_snapshots disable row level security;`
- Impact: any access allowed by the anon key would bypass table-level row protections entirely
- Fix: enabled RLS and added select/insert/update policies scoped to the shared snapshot row id
- Status: Fixed in repo SQL

## High

### SEC-002: Shared sync authorization is still effectively based on a public client value
- Severity: High
- Location: [lib/supabase.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\supabase.ts):5-15, [lib/cloud-sync.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\cloud-sync.ts):47-58, [supabase/app_state_snapshots.sql](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\supabase\app_state_snapshots.sql):18-35
- Evidence: the browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_SYNC_ID`, and the SQL policy allows access to the fixed row id
- Impact: anyone who knows the project URL, public key, and shared row id can attempt to read or overwrite the shared snapshot
- Fix: no safe full fix exists inside the current anonymous-only design. Proper remediation is one of:
  - authenticated per-user access with server-issued identity
  - a server-side sync proxy using server-only credentials
  - a non-public shared secret that is not shipped in the client bundle
- Mitigation: at minimum, use a long random sync id instead of the default and rerun the SQL with that exact id

### SEC-003: Cloud snapshot payloads were trusted without runtime validation
- Severity: High
- Location: [lib/cloud-sync.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\cloud-sync.ts):47-89, [lib/app-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-state.ts):337-450
- Evidence: load/save sync paths previously accepted arbitrary `state` JSON from Supabase without validation
- Impact: malformed or hostile data in the shared snapshot could corrupt client state across devices
- Fix: `loadCloudSnapshot()` and `saveCloudSnapshot()` now reject payloads that fail `isValidImportedState(...)`
- Status: Fixed

### SEC-004: Workout set inputs allowed negative or non-finite values into active state
- Severity: High
- Location: [components/workout-tracker-app.tsx](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\components\workout-tracker-app.tsx):208-218, 1256-1274
- Evidence: `updateSet()` previously stored raw numeric input except `NaN`
- Impact: negative weights/reps or bad numeric values could persist into state and then into local/cloud storage
- Fix: added `sanitizeSetInput(...)` to clamp invalid values to `0`, floor reps, and normalize weight precision
- Status: Fixed

## Medium

### SEC-005: Runtime state validators did not reject negative or non-finite set values
- Severity: Medium
- Location: [lib/app-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-state.ts):43-55
- Evidence: set validation previously accepted any `number`, including negative values
- Impact: imported or cloud-sourced invalid training data could still be accepted
- Fix: validators now require finite, non-negative `weight` and `reps`
- Status: Fixed

### SEC-006: Measurement validators accepted invalid numeric values
- Severity: Medium
- Location: [lib/app-state.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\app-state.ts):105-117
- Evidence: measurement validation previously accepted any numeric bodyweight/body-fat values
- Impact: invalid imported or synced measurement data could pollute state
- Fix: validators now require positive finite bodyweight and non-negative finite body-fat values
- Status: Fixed

### SEC-007: Tailwind dependency tree currently reports a high transitive advisory
- Severity: Medium
- Location: [package.json](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\package.json)
- Evidence: `npm audit --json` reports `picomatch` ReDoS via the Tailwind toolchain
- Impact: this affects the development/build toolchain rather than the deployed client bundle, but it should still be patched when a safe update path exists
- Fix: monitor Tailwind and transitive updates; upgrade once the dependency chain pulls a patched `picomatch`
- Status: Not fixed here because `npm audit` reports no clean direct fix path from the current dependency set

## Low

### SEC-008: Public Supabase config is visible in client-side code by design
- Severity: Low
- Location: [lib/supabase.ts](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\lib\supabase.ts):5-15
- Evidence: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are read in browser code
- Impact: this is expected for Supabase anon/public usage, but only safe if RLS strictly limits what that key can do
- Fix: keep using only publishable/anon credentials in the client and never expose `service_role`
- Status: No `service_role` usage found in app code
