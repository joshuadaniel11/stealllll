import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";

const options = ["Strong", "Solid", "Tough"] as const;

export function WorkoutFeelingModal({
  onSelect,
  onClose,
}: {
  onSelect: (feeling: (typeof options)[number]) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel sheet-detent-medium animate-sheet-up" onClick={(event) => event.stopPropagation()}>
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />
          <ScrollReveal delay={0} y={18} scale={0.994}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">End workout</p>
                <h3 className="large-title mt-1 font-semibold">
                  How did today feel?
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Finish the workout as done, even if you trimmed the session.
                </p>
              </div>
              <button
                className="sheet-close-button rounded-full px-3 py-2 text-sm font-medium"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={70} y={18} scale={0.994}>
            <div className="mt-5 space-y-3">
              {options.map((option) => (
                <button
                  key={option}
                  className="sheet-action-secondary w-full rounded-[22px] px-4 py-4 text-left text-base font-semibold"
                  onClick={() => onSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </Card>
      </div>
    </div>
  );
}
