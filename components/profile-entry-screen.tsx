"use client";

import { Heart } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import type { Profile } from "@/lib/types";

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
  return (
    <main className="theme-shell min-h-screen px-4 py-6 text-text sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">
        <div className="pt-8 text-center">
          <ScrollReveal delay={0} y={16} scale={0.996}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/46">
              STEAL
            </p>
          </ScrollReveal>
          <ScrollReveal delay={50} y={18} scale={0.994}>
            <h1 className="mx-auto mt-5 max-w-sm text-center text-5xl font-semibold tracking-[-0.07em] text-white">
              Choose your side.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={95} y={20} scale={0.992}>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-white/66">
              Tap your name and open straight into your own space.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={150} y={22} scale={0.99}>
          <Card className="entry-shell px-5 py-5">
            <div className="mb-5 flex items-center justify-center">
              <span className="entry-heart">
                <Heart className="h-4 w-4" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelect(profile.id)}
                  className={`entry-choice ${profile.id === "natasha" ? "entry-choice-natasha" : "entry-choice-joshua"}`}
                >
                  <span className="entry-choice-label">{profile.name}</span>
                </button>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        <div className="space-y-3 pb-3">
          {canInstall ? (
            <ScrollReveal delay={190} y={14} scale={0.996}>
              <button
                type="button"
                onClick={onInstall}
                className="mx-auto flex w-full max-w-sm items-center justify-center rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8"
              >
                {installLabel}
              </button>
            </ScrollReveal>
          ) : null}
          <ScrollReveal delay={210} y={16} scale={0.996}>
            <p className="mx-auto max-w-sm text-center text-xs leading-6 text-white/45">
              {installHint}
            </p>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
