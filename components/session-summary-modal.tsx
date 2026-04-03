"use client";

import { useEffect, useState } from "react";

import { startTransition } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CardHelpButton } from "@/components/card-help-button";
import { Card } from "@/components/ui";
import type { PostWorkoutIntelligenceRecap, PostWorkoutRecapCard } from "@/lib/types";

export type SessionSummary = {
  sessionId?: string;
  workoutDayId?: string;
  userId: "joshua" | "natasha";
  workoutName: string;
  durationMinutes: number;
  completedSets: number;
  feeling: "Strong" | "Solid" | "Tough";
  partial?: boolean;
  prHighlights?: string[];
  prCount?: number;
  intelligenceRecap?: PostWorkoutIntelligenceRecap | null;
};

function getAfterWorkoutTease(summary: SessionSummary) {
  const lowerName = summary.workoutName.toLowerCase();

  if (summary.userId === "natasha") {
    if (lowerName.includes("glute")) {
      return "Glute work landed. That softer, rounder shape is getting harder for Joshua to ignore.";
    }
    if (lowerName.includes("back")) {
      return "Back day done. Joshua is going to notice that tempting line through your shoulders and waist.";
    }
    if (lowerName.includes("upper")) {
      return "Upper-body shape work keeps that feminine, dangerous silhouette looking even better.";
    }
    return "You showed up, moved well, and kept building the kind of shape Joshua keeps thinking about.";
  }

  if (lowerName.includes("chest")) {
    return "Chest work is stacking up. Natasha is going to feel that thicker upper body when she gets close.";
  }
  if (lowerName.includes("back")) {
    return "Back and biceps are building that wider, wrapped-around-her look Natasha loves.";
  }
  if (lowerName.includes("shoulder") || lowerName.includes("leg")) {
    return "Shoulders and legs keep that athletic, hard-to-ignore look getting stronger every week.";
  }
  return "Another strong session in. Natasha is going to notice how much more solid and tempting you feel.";
}

function getRecapCardClasses(tone: PostWorkoutRecapCard["tone"]) {
  if (tone === "positive") {
    return "border-white/[0.07] bg-[var(--card-strong)]";
  }
  if (tone === "attention") {
    return "border-white/[0.10] bg-white/[0.04]";
  }
  return "border-white/8 bg-[var(--card-strong)]";
}

function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) {
      startTransition(() => setValue(target));
      return;
    }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

const PROFILE_COLOR: Record<string, string> = {
  joshua: "rgba(29,185,84,0.12)",
  natasha: "rgba(45,139,255,0.12)",
};

export function SessionSummaryModal({
  summary,
  nextInsight,
  onClose,
  onMarkComplete,
  onViewProgress,
}: {
  summary: SessionSummary | null;
  nextInsight?: string | null;
  onClose: () => void;
  onMarkComplete?: (summary: SessionSummary) => void;
  onViewProgress?: () => void;
}) {
  const isComplete = summary ? !summary.partial : false;
  const accentGlow = summary ? (PROFILE_COLOR[summary.userId] ?? "rgba(29,185,84,0.1)") : "rgba(29,185,84,0.1)";

  const durationDisplay = useCountUp(summary?.durationMinutes ?? 0, 900, isComplete);
  const setsDisplay = useCountUp(summary?.completedSets ?? 0, 700, isComplete);

  if (!summary) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel sheet-detent-medium animate-sheet-up" onClick={(event) => event.stopPropagation()}>
        <Card className="sheet-card bg-[var(--surface)] relative overflow-hidden">
          {/* Top glow for completed sessions */}
          {isComplete ? (
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-40"
              style={{
                background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${accentGlow} 0%, transparent 70%)`,
              }}
            />
          ) : null}

          <div className="relative">
            <div className="sheet-drag-handle" />
            <ScrollReveal delay={0} y={18} scale={0.994}>
              <div>
                <p className="text-sm text-muted">{summary.partial ? "Saved" : "Complete"}</p>
                <h3
                  className="mt-2 text-[1.6rem] font-semibold leading-tight tracking-[-0.04em] text-text"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {summary.workoutName}
                </h3>
                {summary.partial ? (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Pick it back up from Workout whenever you want.
                  </p>
                ) : null}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={70} y={18} scale={0.994}>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Length</p>
                  <p className="mt-2 text-[1.4rem] font-bold leading-none tracking-[-0.04em] text-text">
                    {isComplete ? durationDisplay : summary.durationMinutes}
                    <span className="ml-1 text-sm font-normal text-muted">min</span>
                  </p>
                </div>
                <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Sets</p>
                  <p className="mt-2 text-[1.4rem] font-bold leading-none tracking-[-0.04em] text-text">
                    {isComplete ? setsDisplay : summary.completedSets}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Felt</p>
                  <p className="mt-2 text-[1.4rem] font-bold leading-none tracking-[-0.04em] text-text">
                    {summary.feeling}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={95} y={14} scale={0.996}>
              <p className="mt-5 text-sm leading-6 text-muted">{getAfterWorkoutTease(summary)}</p>
            </ScrollReveal>

            {!summary.partial && summary.intelligenceRecap ? (
              <ScrollReveal delay={100} y={14} scale={0.996}>
                <div className="mt-4 rounded-[24px] border border-white/8 bg-[var(--card-strong)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-muted">Coach read</p>
                    <CardHelpButton
                      title="Coach read"
                      summary="This is the app's quick interpretation of what this workout actually changed, not just what got logged."
                      points={[
                        "Session impact points to the body area that got the clearest push from this workout.",
                        "Current and support signals explain how this session fits into your weekly direction.",
                        "Next move tells you what the next useful session should care about.",
                        "Plateau watch only shows when a region looks flat enough to watch or intervene on.",
                      ]}
                      className="h-8 w-8"
                    />
                  </div>
                  <p className="mt-2 text-base font-semibold text-text">{summary.intelligenceRecap.headline}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{summary.intelligenceRecap.summary}</p>
                </div>
              </ScrollReveal>
            ) : null}

            {!summary.partial && summary.intelligenceRecap?.cards.length ? (
              <ScrollReveal delay={104} y={14} scale={0.996}>
                <div className="mt-4 space-y-3">
                  {summary.intelligenceRecap.cards.map((card) => (
                    <div
                      key={`${card.label}-${card.value}`}
                      className={`rounded-[24px] border px-4 py-4 ${getRecapCardClasses(card.tone)}`}
                    >
                      <p className="text-sm text-muted">{card.label}</p>
                      <p className="mt-2 text-base font-semibold text-text">{card.value}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{card.detail}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            ) : null}

            {!summary.partial && (summary.intelligenceRecap?.nextMove ?? nextInsight) ? (
              <ScrollReveal delay={102} y={14} scale={0.996}>
                <div className="mt-4 rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Next move</p>
                  <p className="mt-2 text-base font-semibold text-text">
                    {summary.intelligenceRecap?.nextMove ?? nextInsight}
                  </p>
                </div>
              </ScrollReveal>
            ) : null}

            {!summary.partial && summary.intelligenceRecap?.plateauIntervention ? (
              <ScrollReveal delay={106} y={14} scale={0.996}>
                <div className="mt-4 rounded-[24px] border border-white/[0.10] bg-white/[0.04] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted">{summary.intelligenceRecap.plateauIntervention.title}</p>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                      {summary.intelligenceRecap.plateauIntervention.confidenceLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-text">
                    {summary.intelligenceRecap.plateauIntervention.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {summary.intelligenceRecap.plateauIntervention.detail}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/86">
                    {summary.intelligenceRecap.plateauIntervention.intervention}
                  </p>
                </div>
              </ScrollReveal>
            ) : null}

            {summary.prCount ? (
              <ScrollReveal delay={108} y={14} scale={0.996}>
                <div className="mt-4 rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">
                    {summary.prCount} PR{summary.prCount === 1 ? "" : "s"} today
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {summary.prHighlights?.map((highlight) => (
                      <p key={highlight} className="text-sm font-medium text-text">
                        {highlight}
                      </p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ) : null}

            <ScrollReveal delay={120} y={14} scale={0.996}>
              <div
                className={`mt-6 grid gap-3 ${
                  summary.partial || (!summary.partial && onViewProgress) ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {summary.partial ? (
                  <button
                    className="sheet-action-secondary rounded-[28px] px-4 py-4 text-sm font-semibold"
                    onClick={() => onMarkComplete?.(summary)}
                  >
                    Mark done
                  </button>
                ) : null}
                {!summary.partial && onViewProgress ? (
                  <button
                    className="sheet-action-primary rounded-[28px] px-4 py-4 text-sm font-semibold"
                    onClick={onViewProgress}
                  >
                    View progress
                  </button>
                ) : null}
                <button
                  className={`${!summary.partial && onViewProgress ? "sheet-action-secondary" : "sheet-action-primary"} rounded-[28px] px-4 py-4 text-sm font-semibold`}
                  onClick={onClose}
                >
                  {summary.partial ? "Done" : "Close"}
                </button>
              </div>
            </ScrollReveal>
          </div>
        </Card>
      </div>
    </div>
  );
}
