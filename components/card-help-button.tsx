"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X } from "lucide-react";

import { Card } from "@/components/ui";

export function CardHelpButton({
  title,
  summary,
  points,
  buttonLabel = "Explain this card",
  className = "",
}: {
  title: string;
  summary: string;
  points: string[];
  buttonLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={buttonLabel}
        onClick={() => setOpen(true)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-transparent text-white/58 ${className}`}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={1.6} />
      </button>
      {portalTarget && open
        ? createPortal(
            <div className="sheet-backdrop z-[120]" onClick={() => setOpen(false)}>
              <div className="sheet-panel sheet-detent-medium" onClick={(event) => event.stopPropagation()}>
                <Card className="sheet-card bg-[var(--bg-overlay)]">
                  <div className="sheet-drag-handle" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-eyebrow">Card guide</p>
                      <h3 className="card-title mt-3 text-white/92">{title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close explanation"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] text-white/58"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="secondary-copy mt-4">{summary}</p>
                  <div className="mt-5 space-y-3">
                    {points.map((point) => (
                      <div key={point} className="rounded-[16px] border border-white/[0.07] bg-[var(--bg-surface)] px-4 py-3">
                        <p className="body-copy text-white/78">{point}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
