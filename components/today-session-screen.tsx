"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card, MiniMetric } from "@/components/ui";
import type { TodaySession } from "@/lib/profile-training-state";

function SessionTopBar({
  status,
  sessionTypeLabel,
}: {
  status: TodaySession["status"];
  sessionTypeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Today&apos;s session</p>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/62">
          {status === "resume" ? "Resume" : status === "low-activity" ? "Restart" : status === "recovery" ? "Recovery-aware" : "Ready"}
        </span>
        <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-medium text-accent">
          {sessionTypeLabel}
        </span>
      </div>
    </div>
  );
}

function TodaySessionHero({ session }: { session: TodaySession }) {
  return (
    <Card className="space-y-4">
      <SessionTopBar status={session.status} sessionTypeLabel={session.sessionTypeLabel} />
      <div className="space-y-2">
        <h1 className="text-[2rem] font-semibold tracking-[-0.06em] text-white">{session.title}</h1>
        <p className="text-sm leading-6 text-white/64">{session.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MiniMetric label="Length" value={`~${session.estimatedDurationMin} min`} />
        <MiniMetric label="Exercises" value={`${session.plan.totalExercises}`} />
        <MiniMetric label="Source" value={session.plan.source === "generated" ? "Adaptive" : "Template"} />
      </div>
    </Card>
  );
}

function TodaySessionWhyCard({ session }: { session: TodaySession }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Focus insight</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">{session.focusRegions.join(" + ")}</h3>
        </div>
        <Sparkles className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{session.why.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {session.why.insightChips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/58"
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {session.why.coverage.map((item) => (
          <div key={item.region} className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">{item.region}</p>
            <p className="mt-1 text-sm font-semibold text-white/88">{item.completionPct}% covered</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TodaySessionExerciseItem({
  exercise,
}: {
  exercise: TodaySession["plan"]["exercises"][number];
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/88">
            {exercise.order}. {exercise.name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/40">
            {exercise.role} | {exercise.sets} x {exercise.repRange}
          </p>
        </div>
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/58">
          {exercise.primaryRegion}
        </span>
      </div>
      {exercise.secondaryRegions.length ? (
        <p className="mt-2 text-sm text-white/58">Also hits {exercise.secondaryRegions.join(", ").toLowerCase()}.</p>
      ) : null}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-[16px] border border-white/5 bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/34">Last performance</p>
          <p className="mt-1 text-sm text-white/80">{exercise.lastPerformance ?? "No logged set yet"}</p>
        </div>
        <div className="rounded-[16px] border border-white/5 bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/34">Target cue</p>
          <p className="mt-1 text-sm text-white/80">{exercise.targetCue ?? "Stay controlled and keep 1 clean rep in reserve."}</p>
        </div>
      </div>
    </div>
  );
}

function TodaySessionPlanCard({
  session,
  planRef,
}: {
  session: TodaySession;
  planRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Card>
      <div ref={planRef} className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Workout plan</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-text">{session.workoutName}</h3>
        </div>
        <div className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/58">
          {session.plan.source}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {session.plan.exercises.map((exercise) => (
          <TodaySessionExerciseItem key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </Card>
  );
}

function TodaySessionNotesCard({ notes }: { notes: string[] }) {
  return (
    <Card>
      <p className="text-sm text-muted">Coaching notes</p>
      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <div key={note} className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/74">
            {note}
          </div>
        ))}
      </div>
    </Card>
  );
}

function TodaySessionSecondaryActionsSheet({
  open,
  onClose,
  onPreviewPlan,
  onRegenerate,
}: {
  open: boolean;
  onClose: () => void;
  onPreviewPlan: () => void;
  onRegenerate: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <p className="text-sm text-muted">Session actions</p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                onPreviewPlan();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4 text-left"
            >
              <div>
                <p className="text-sm font-medium text-white/88">Preview session</p>
                <p className="mt-1 text-sm text-white/56">Jump back to the workout plan section and review the flow.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/42" />
            </button>
            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
              <p className="text-sm font-medium text-white/88">Swap exercises</p>
              <p className="mt-1 text-sm text-white/56">Exercise swaps stay available after the session starts, using the existing equivalent-movement flow.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onRegenerate();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4 text-left"
            >
              <div>
                <p className="text-sm font-medium text-white/88">Regenerate session</p>
                <p className="mt-1 text-sm text-white/56">Refresh the selector using your current profile state and workout rotation.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/42" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-[22px] bg-white px-4 py-4 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TodaySessionStickyCTA({
  session,
  onPrimary,
  onOpenActions,
}: {
  session: TodaySession;
  onPrimary: () => void;
  onOpenActions: () => void;
}) {
  return (
    <div className="fixed inset-x-4 bottom-[5.5rem] z-20 mx-auto max-w-md">
      <div className="glass hairline rounded-[28px] px-4 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenActions}
            className="rounded-[20px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/70"
          >
            More
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="flex-1 rounded-[22px] bg-white px-5 py-3.5 text-base font-semibold text-black"
          >
            {session.cta.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TodaySessionScreen({
  session,
  recentTrainingUpdate,
  onPrimaryAction,
  onRegenerateAction,
}: {
  session: TodaySession;
  recentTrainingUpdate?: string | null;
  onPrimaryAction: () => void;
  onRegenerateAction: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const planRef = useRef<HTMLDivElement | null>(null);

  const recentUpdateCopy = useMemo(() => {
    if (!recentTrainingUpdate) {
      return null;
    }
    return recentTrainingUpdate;
  }, [recentTrainingUpdate]);

  return (
    <div className="space-y-5 pb-40">
      {recentUpdateCopy ? (
        <ScrollReveal delay={0}>
          <div className="training-refresh-chip rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/42">Training state refreshed</p>
            <p className="mt-2 text-sm leading-6 text-white/76">{recentUpdateCopy}</p>
          </div>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={0}>
        <TodaySessionHero session={session} />
      </ScrollReveal>
      <ScrollReveal delay={18}>
        <TodaySessionWhyCard session={session} />
      </ScrollReveal>
      <ScrollReveal delay={36}>
        <TodaySessionPlanCard session={session} planRef={planRef} />
      </ScrollReveal>
      <ScrollReveal delay={54}>
        <TodaySessionNotesCard notes={session.notes} />
      </ScrollReveal>

      <TodaySessionStickyCTA session={session} onPrimary={onPrimaryAction} onOpenActions={() => setShowActions(true)} />
      <TodaySessionSecondaryActionsSheet
        open={showActions}
        onClose={() => setShowActions(false)}
        onPreviewPlan={() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onRegenerate={onRegenerateAction}
      />
    </div>
  );
}
