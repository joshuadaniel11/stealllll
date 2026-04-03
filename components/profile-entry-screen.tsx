"use client";

import { useEffect, useState } from "react";

import type { Profile } from "@/lib/types";

const PROFILE_CONFIG: Record<string, { color: string; glow: string; orb: string; initial: string }> = {
  joshua: {
    color: "#1db954",
    glow: "rgba(29,185,84,0.18)",
    orb: "rgba(29,185,84,0.08)",
    initial: "J",
  },
  natasha: {
    color: "#2d8bff",
    glow: "rgba(45,139,255,0.18)",
    orb: "rgba(45,139,255,0.08)",
    initial: "N",
  },
};

function getConfig(profileId: string) {
  return PROFILE_CONFIG[profileId] ?? { color: "#ffffff", glow: "rgba(255,255,255,0.1)", orb: "rgba(255,255,255,0.04)", initial: profileId[0].toUpperCase() };
}

export function ProfileEntryScreen({
  profiles,
  onSelect,
  canInstall,
  installLabel,
  installHint,
  onInstall,
}: {
  profiles: Profile[];
  onSelect: (profileId: Profile["id"]) => void;
  canInstall: boolean;
  installLabel: string;
  installHint: string;
  onInstall: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main
      className="relative flex min-h-screen items-end overflow-hidden px-5 pb-10 pt-8 text-white sm:items-center sm:justify-center"
      style={{ background: "#080808" }}
    >
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {profiles.map((profile, i) => {
          const cfg = getConfig(profile.id);
          return (
            <div
              key={profile.id}
              className="absolute rounded-full transition-opacity duration-1000"
              style={{
                width: "70vw",
                height: "70vw",
                maxWidth: 420,
                maxHeight: 420,
                background: `radial-gradient(circle, ${cfg.orb} 0%, transparent 70%)`,
                left: i === 0 ? "-10%" : "40%",
                top: i === 0 ? "-5%" : "30%",
                opacity: mounted ? 1 : 0,
                transitionDelay: `${i * 120}ms`,
                filter: "blur(40px)",
              }}
            />
          );
        })}
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div
          className="mb-10 space-y-3 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(18px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">STEAL</p>
          <h1 className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white/96">
            Who&apos;s training<br />today?
          </h1>
        </div>

        {/* Profile cards */}
        <div className="space-y-3">
          {profiles.map((profile, i) => {
            const cfg = getConfig(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                aria-label={`Open profile ${profile.name}`}
                className="group w-full overflow-hidden rounded-[22px] border px-5 py-5 text-left"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(22px)",
                  transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1), transform 600ms cubic-bezier(0.16,1,0.3,1), background 150ms ease, border-color 150ms ease",
                  transitionDelay: `${120 + i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with glow */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="absolute inset-0 rounded-full blur-md transition-opacity duration-300 group-active:opacity-100"
                      style={{ background: cfg.glow, opacity: 0.7, transform: "scale(1.3)" }}
                    />
                    <div
                      className="relative flex h-12 w-12 items-center justify-center rounded-full text-[17px] font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${cfg.color}28 0%, ${cfg.color}14 100%)`,
                        border: `1px solid ${cfg.color}30`,
                        color: cfg.color,
                      }}
                    >
                      {cfg.initial}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/32">Open profile</p>
                    <p className="mt-0.5 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-white/94">
                      {profile.name}
                    </p>
                    <p className="mt-0.5 text-[13px] text-white/48">{profile.tagline}</p>
                  </div>

                  {/* Arrow */}
                  <div
                    className="flex-shrink-0 rounded-full p-1.5 transition-transform duration-150 group-active:translate-x-0.5"
                    style={{ background: `${cfg.color}18`, color: cfg.color }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Bottom color accent line */}
                <div
                  className="absolute bottom-0 left-5 right-5 h-px opacity-0 transition-opacity duration-300 group-active:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }}
                />
              </button>
            );
          })}
        </div>

        {/* Install */}
        <div
          className="mt-5 rounded-[20px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "360ms",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28">Install</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/44">{installHint}</p>
          {canInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="mt-4 inline-flex h-[50px] w-full items-center justify-center rounded-full border border-white/[0.1] bg-transparent text-[14px] font-medium text-white/60"
            >
              {installLabel}
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
