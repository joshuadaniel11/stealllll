"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 28,
  scale = 0.985,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx("scroll-reveal", visible ? "scroll-reveal-visible" : "", className)}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": `${y}px`,
          "--reveal-scale": scale,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
