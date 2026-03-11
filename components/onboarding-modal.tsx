import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";

export function OnboardingModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-medium animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <ScrollReveal delay={0} y={20} scale={0.992}>
            <div>
              <p className="text-sm font-medium text-muted">Welcome</p>
              <h2 className="large-title mt-1 font-semibold tracking-[-0.05em]">
                Your progress stays on your phone.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={70} y={18} scale={0.994}>
            <div className="mt-5 space-y-3 text-sm leading-7 text-muted">
              <p>Joshua&apos;s phone keeps Joshua&apos;s workout history. Natasha&apos;s phone keeps Natasha&apos;s workout history.</p>
              <p>Nothing is automatically shared across devices, so each of you can track privately and consistently on your own phone.</p>
              <p>For the most reliable experience on iPhone, open in Safari and use Add to Home Screen.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={120} y={14} scale={0.996}>
            <button
              className="mt-6 w-full rounded-[28px] bg-white px-4 py-4 text-base font-semibold text-black"
              onClick={onClose}
            >
              Continue
            </button>
          </ScrollReveal>
        </Card>
      </div>
    </div>
  );
}
