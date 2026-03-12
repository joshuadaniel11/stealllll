"use client";

import { Heart } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function ProfileEntryScreen({
  profiles,
  onSelect,
}: {
  profiles: Profile[];
  onSelect: (profileId: Profile["id"]) => void;
}) {
  return (
    <main className="theme-shell min-h-screen px-4 py-6 text-text sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">
        <div className="pt-8 text-center">
          <ScrollReveal delay={0} y={16} scale={0.996}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/46">
              STEALLLLL
            </p>
          </ScrollReveal>
          <ScrollReveal delay={50} y={18} scale={0.994}>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.07em] text-white">
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
                  <span className="entry-choice-subtle">
                    {profile.id === "natasha" ? "For Natasha by Joshua" : "Built for Natasha"}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={210} y={16} scale={0.996}>
          <p className="pb-3 text-center text-xs leading-6 text-white/45">
            Private on this phone. Clean, focused, and ready when you are.
          </p>
        </ScrollReveal>
      </div>
    </main>
  );
}
