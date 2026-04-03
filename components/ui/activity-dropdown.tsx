"use client";

import type React from "react";

import { useState } from "react";
import { Bell, ChevronRight, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ActivityDropdownItem {
  id: number | string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  meta?: string;
  badgeLabel?: string;
  selected?: boolean;
  onClick?: () => void;
}

interface ActivityDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  items?: ActivityDropdownItem[];
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
  headerRight?: React.ReactNode;
}

function ActivityDropdownItemRow({
  item,
  isOpen,
  index,
}: {
  item: ActivityDropdownItem;
  isOpen: boolean;
  index: number;
}) {
  const Comp = item.onClick ? "button" : "div";

  return (
    <Comp
      {...(item.onClick ? { type: "button", onClick: item.onClick } : {})}
      className={cn(
        "flex w-full items-start gap-3 rounded-[18px] border border-transparent p-3 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        item.onClick ? "hover:border-white/[0.06] hover:bg-white/[0.04]" : "",
        item.selected ? "border-white/[0.08] bg-white/[0.05]" : "bg-transparent",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
      style={{
        transitionDelay: isOpen ? `${index * 45}ms` : "0ms",
      }}
    >
      <div
        className={cn(
          "glass-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]",
          item.selected ? "text-white/82" : "text-white/60",
        )}
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[15px] font-medium", item.selected ? "text-white/94" : "text-white/88")}>{item.title}</p>
          {item.badgeLabel ? (
            <span className="rounded-full bg-[rgba(29,185,84,0.10)] px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.08em] text-[color:var(--accent)]">
              {item.badgeLabel}
            </span>
          ) : null}
        </div>
        {item.description ? <p className="mt-1 text-[13px] text-white/46">{item.description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.meta ? <span className="pt-0.5 text-[11px] uppercase tracking-[0.08em] text-white/26">{item.meta}</span> : null}
        {item.onClick ? <ChevronRight className="h-4 w-4 text-white/20" strokeWidth={1.5} /> : null}
      </div>
    </Comp>
  );
}

export function ActivityDropdown({
  title,
  description,
  icon,
  items,
  className,
  contentClassName,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headerRight,
  children,
  ...props
}: ActivityDropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <div
      className={cn(
        "glass-panel w-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOpen ? "rounded-[24px]" : "rounded-[20px]",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center gap-4 px-5 py-5 text-left"
        aria-expanded={isOpen}
      >
        <div className="glass-pill flex h-12 w-12 items-center justify-center rounded-[16px] text-white/62">
          {icon ?? <Bell className="h-5 w-5" strokeWidth={1.5} />}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="text-[15px] font-medium text-white/90">{title}</h3>
          {description ? (
            <p
              className={cn(
                "text-[13px] text-white/46 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "mt-0 max-h-0 opacity-0" : "mt-1 max-h-6 opacity-100",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        <div className="flex h-8 w-8 items-center justify-center">
          <ChevronUp
            className={cn(
              "h-5 w-5 text-white/34 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "rotate-0" : "rotate-180",
            )}
            strokeWidth={1.5}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {items?.length ? (
            <div className={cn("px-3 pb-4", contentClassName)}>
              <div className="space-y-1">
                {items.map((item, index) => (
                  <ActivityDropdownItemRow key={item.id} item={item} isOpen={isOpen} index={index} />
                ))}
              </div>
            </div>
          ) : (
            <div className={cn("px-5 pb-5", contentClassName)}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
