"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { UserId } from "@/lib/types";

function buildPaths(direction: 1 | -1) {
  return Array.from({ length: 5 }, (_, index) => {
    const offset = index * 14;
    return {
      id: `${direction}-${index}`,
      d: `M${-120 + offset * direction} ${42 + index * 18} C ${80 + offset * direction} ${8 + index * 10}, ${240 + offset * direction} ${180 - index * 8}, ${460 + offset * direction} ${136 + index * 14} C ${580 + offset * direction} ${110 + index * 16}, ${680 + offset * direction} ${170 + index * 8}, ${760 + offset * direction} ${146 + index * 10}`,
      width: 0.8 + index * 0.12,
      opacity: 0.07 + index * 0.022,
    };
  });
}

function getStroke(profileId?: UserId) {
  if (profileId === "natasha") {
    return "rgba(45,139,255,0.30)";
  }

  if (profileId === "joshua") {
    return "rgba(29,185,84,0.26)";
  }

  return "rgba(255,255,255,0.16)";
}

export function BackgroundPaths({
  profileId,
  className,
}: {
  profileId?: UserId;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const stroke = getStroke(profileId);
  const paths = useMemo(() => [...buildPaths(1), ...buildPaths(-1)], []);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}
    >
      <svg className="h-full w-full" viewBox="0 0 720 220" fill="none" preserveAspectRatio="none">
        {paths.map((path, index) =>
          reduceMotion ? (
            <path
              key={path.id}
              d={path.d}
              stroke={stroke}
              strokeWidth={path.width}
              strokeOpacity={path.opacity}
              strokeLinecap="round"
            />
          ) : (
            <motion.path
              key={path.id}
              d={path.d}
              stroke={stroke}
              strokeWidth={path.width}
              strokeOpacity={path.opacity}
              strokeLinecap="round"
              initial={{ pathLength: 0.2, opacity: path.opacity * 0.7 }}
              animate={{
                pathLength: 1,
                opacity: [path.opacity * 0.75, path.opacity, path.opacity * 0.75],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: 22 + index * 0.9,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ),
        )}
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_40%,transparent_60%,rgba(0,0,0,0.16))]" />
    </div>
  );
}
