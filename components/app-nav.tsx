"use client";

import clsx from "clsx";
import { Activity, ChartColumn, Dumbbell } from "lucide-react";
import type { UserId } from "@/lib/types";

type TabId = "home" | "workout" | "progress";

const NAV_ITEMS = [
  { id: "home" as const, label: "Home", icon: Activity },
  { id: "workout" as const, label: "Workout", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: ChartColumn },
];

interface AppNavProps {
  activeTab: TabId;
  isSessionActive: boolean;
  profileId: UserId;
  onTabChange: (tab: TabId) => void;
}

export function AppNav({ activeTab, isSessionActive, profileId, onTabChange }: AppNavProps) {
  return (
    <nav className="tabbar-shell fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between rounded-[12px] px-3.5 py-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const showSessionDot = isSessionActive && item.id === "workout";
        return (
          <button
            key={item.id}
            className={clsx(
              "tabbar-button flex flex-col items-center gap-1 text-xs font-medium transition duration-300",
              isActive ? "tabbar-button-active text-accent" : "text-muted",
            )}
            onClick={() => onTabChange(item.id)}
          >
            <div className="relative flex flex-col items-center">
              <Icon className="h-5 w-5" />
              {showSessionDot ? (
                <span
                  className={clsx(
                    "mt-1 inline-block h-1 w-1 rounded-full",
                    profileId === "joshua" ? "bg-emerald-300/90" : "bg-sky-300/90",
                  )}
                />
              ) : null}
            </div>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
