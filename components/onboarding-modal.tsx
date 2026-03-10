import { Card } from "@/components/ui";

export function OnboardingModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-md">
        <Card className="bg-[var(--surface)]">
          <p className="text-sm font-medium text-muted">Welcome</p>
          <h2 className="mt-1 text-[30px] font-bold tracking-[-0.05em]">
            Your progress stays on your phone.
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-muted">
            <p>Joshua&apos;s phone keeps Joshua&apos;s workout history. Natasha&apos;s phone keeps Natasha&apos;s workout history.</p>
            <p>Nothing is automatically shared across devices, so each of you can track privately and consistently on your own phone.</p>
            <p>For the most reliable experience on iPhone, open in Safari and use Add to Home Screen.</p>
          </div>
          <button
            className="mt-6 w-full rounded-[22px] bg-accent px-4 py-4 text-base font-bold text-white shadow-glow"
            onClick={onClose}
          >
            Continue
          </button>
        </Card>
      </div>
    </div>
  );
}
