"use client";

import { Settings } from "lucide-react";

import type { Profile } from "@/lib/types";

export function AppShellHeader({
  profile,
  compact = false,
  onOpenSettings,
}: {
  profile: Profile;
  compact?: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <header
      className="flex items-end justify-between gap-4 px-0 transition-all duration-300"
      style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
    >
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p
          className="label-eyebrow flex items-center gap-1.5 transition-all duration-300"
          style={{
            opacity: compact ? 0 : 1,
            maxHeight: compact ? 0 : "1.5rem",
            marginBottom: compact ? 0 : undefined,
            overflow: "hidden",
          }}
        >
          STEAL
          {/* Claude logo mark */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 46 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Claude"
            style={{ opacity: 0.55, flexShrink: 0 }}
          >
            <path
              d="M31.24 8.882c-.498-1.318-1.992-1.981-3.31-1.483L11.3 13.856a2.496 2.496 0 0 0-1.483 3.31l6.457 17.23a2.496 2.496 0 0 0 3.31 1.483l16.63-6.457a2.496 2.496 0 0 0 1.483-3.31L31.24 8.882Z"
              fill="currentColor"
            />
            <path
              d="M22.961 38.614c-.498-1.317-1.992-1.98-3.31-1.483l-4.643 1.804a2.496 2.496 0 0 0-1.483 3.31l.332.855a2.496 2.496 0 0 0 3.31 1.483l4.643-1.804a2.496 2.496 0 0 0 1.483-3.31l-.332-.855Z"
              fill="currentColor"
            />
          </svg>
        </p>
        <h1
          className="screen-title text-white/96 transition-all duration-300"
          style={{
            fontSize: compact ? "17px" : undefined,
            fontWeight: compact ? 500 : undefined,
            letterSpacing: compact ? "-0.01em" : undefined,
            marginTop: compact ? 0 : undefined,
            opacity: compact ? 0.7 : 1,
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {profile.name}
        </h1>
      </div>
      <button
        type="button"
        aria-label="Settings"
        onClick={onOpenSettings}
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-[var(--bg-surface)] text-white/72 transition-transform duration-300"
        style={{
          transform: compact ? "scale(0.88)" : "scale(1)",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <Settings className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </header>
  );
}
