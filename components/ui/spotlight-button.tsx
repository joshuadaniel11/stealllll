"use client";

import { startTransition, useEffect, useRef, useState, type ElementType } from "react";
import clsx from "clsx";
import { Bookmark, Home, PlusCircle, Settings, User } from "lucide-react";

export type SpotlightNavItem = {
  id: string;
  label: string;
  icon: ElementType;
  badge?: boolean;
  onClick?: () => void;
};

export function SpotlightNav({
  items,
  activeId,
  className,
}: {
  items: SpotlightNavItem[];
  activeId: string;
  className?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    const activeIndex = items.findIndex((item) => item.id === activeId);
    const buttonEl = buttonRefs.current[activeIndex];
    const navEl = navRef.current;
    if (!buttonEl || !navEl) return;

    const navRect = navEl.getBoundingClientRect();
    const btnRect = buttonEl.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
    });
  }, [activeId, items, mounted]);

  return (
    <nav
      ref={navRef}
      className={clsx(
        "glass-nav relative flex items-center gap-0.5 rounded-[28px] p-1.5",
        className,
      )}
    >
      {/* Sliding capsule indicator */}
      {indicatorStyle ? (
        <span
          className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-[22px]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: "rgba(255,255,255,0.07)",
            transition: mounted ? "left 280ms cubic-bezier(0.34,1.56,0.64,1), width 280ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
          }}
        />
      ) : null}

      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => { buttonRefs.current[i] = el; }}
            type="button"
            aria-label={item.label}
            onClick={item.onClick}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-2.5"
          >
            {/* Accent glow for active */}
            {isActive ? (
              <span
                className="pointer-events-none absolute left-1/2 top-1.5 h-9 w-9 -translate-x-1/2 rounded-full"
                style={{
                  background: "radial-gradient(circle, var(--accent-glow, rgba(29,185,84,0.18)) 0%, transparent 70%)",
                }}
              />
            ) : null}

            <span
              className="relative transition-transform duration-200"
              style={{ transform: isActive ? "scale(1.08)" : "scale(1)" }}
            >
              <Icon
                className={clsx(
                  "h-[22px] w-[22px] transition-colors duration-200",
                  isActive ? "text-[color:var(--accent)]" : "text-white/28",
                )}
                strokeWidth={isActive ? 2 : 1.6}
              />
              {item.badge ? (
                <span className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full bg-[color:var(--accent)] ring-[1.5px] ring-black" />
              ) : null}
            </span>

            <span
              className={clsx(
                "text-[10px] font-medium uppercase tracking-[0.1em] transition-colors duration-200",
                isActive ? "text-white/72" : "text-white/28",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export const Component = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "bookmarks", icon: Bookmark, label: "Saved" },
    { id: "add", icon: PlusCircle, label: "Add" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex min-h-[240px] w-full items-center justify-center bg-[#080808] p-6">
      <SpotlightNav
        items={navItems.map((item, index) => ({
          ...item,
          onClick: () => setActiveIndex(index),
        }))}
        activeId={navItems[activeIndex]?.id ?? navItems[0].id}
        className="w-full max-w-sm"
      />
    </div>
  );
};
