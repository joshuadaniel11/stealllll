# STEAL

A mobile-first couple workout tracker for Joshua and Natasha, built with Next.js, TypeScript, Tailwind CSS, and Recharts.

## Features

- Dedicated profile entry flow for Joshua and Natasha
- Preset workout plans with progress tracking, auto-filled weights, and quick swaps
- Focused Workout Mode with picker-first exercise flow
- Strength predictions, progress insights, and measurement tracking
- Daily Bend stretch prompts and shared wedding countdown
- Local storage persistence per phone/browser
- Optional Supabase cloud sync so both phones share sessions and calendar state
- Install polish for iPhone home screen with manifest, icon, and Apple web app metadata
- Playwright smoke test harness for real browser tap-through checks

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Optional Supabase Sync

To share training history across both phones:

1. Copy `.env.example` to `.env.local`
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_SYNC_ID`
3. Run the SQL in [C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\supabase\app_state_snapshots.sql](C:\Users\sales\OneDrive\Desktop\Joshua\AEWV\WORKOUTTT\supabase\app_state_snapshots.sql)

The app will then:
- hydrate from the newest local/cloud shared state
- keep profile lock and active workout state local to each phone
- sync completed sessions and shared progress data back to Supabase automatically

## Helpful Commands

```bash
npm run build
npm run test:e2e
```

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Playwright
