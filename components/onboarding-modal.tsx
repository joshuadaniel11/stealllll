"use client";

import { useState } from "react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";

const onboardingSteps = [
  {
    eyebrow: "Welcome",
    title: "A calmer way to train together.",
    body:
      "STEALLLLL keeps Joshua and Natasha focused on the next workout, with a cleaner flow that feels fast and intimate instead of cluttered.",
  },
  {
    eyebrow: "Private by design",
    title: "Each phone keeps its own progress.",
    body:
      "Joshua's phone keeps Joshua's history. Natasha's phone keeps Natasha's. Nothing is automatically shared unless you choose to back it up yourself.",
  },
  {
    eyebrow: "Best on iPhone",
    title: "Open in Safari and add it to Home Screen.",
    body:
      "That gives the app the smoothest launch feel and helps keep the same local progress data available every day.",
  },
] as const;

export function OnboardingModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const currentStep = onboardingSteps[step];
  const isLastStep = step === onboardingSteps.length - 1;

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />

          <ScrollReveal delay={0} y={20} scale={0.992}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">{currentStep.eyebrow}</p>
              <p className="caption-text text-muted">
                {step + 1} / {onboardingSteps.length}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={40} y={20} scale={0.992}>
            <h2 className="large-title mt-2 font-semibold tracking-[-0.05em]">
              {currentStep.title}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={80} y={18} scale={0.994}>
            <div className="mt-5 rounded-[28px] bg-[var(--card-strong)]/80 p-5">
              <p className="text-sm leading-7 text-muted">{currentStep.body}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={110} y={14} scale={0.996}>
            <div className="mt-5 flex gap-2">
              {onboardingSteps.map((item, index) => (
                <div key={item.title} className="h-1.5 flex-1 rounded-full bg-[var(--card-strong)]">
                  <div
                    className="h-1.5 rounded-full bg-white transition-all duration-300"
                    style={{ width: index <= step ? "100%" : "0%" }}
                  />
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={140} y={14} scale={0.996}>
            <div className="mt-6 flex gap-3">
              {step > 0 ? (
                <button
                  className="flex-1 rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-base font-medium text-text"
                  onClick={() => setStep((current) => current - 1)}
                >
                  Back
                </button>
              ) : null}
              <button
                className="flex-1 rounded-[28px] bg-white px-4 py-4 text-base font-semibold text-black"
                onClick={() => {
                  if (isLastStep) {
                    onClose();
                    return;
                  }
                  setStep((current) => current + 1);
                }}
              >
                {isLastStep ? "Start" : "Continue"}
              </button>
            </div>
          </ScrollReveal>
        </Card>
      </div>
    </div>
  );
}
