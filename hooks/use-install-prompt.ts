"use client";

import { useEffect, useRef, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function useInstallPrompt(onInstalled?: () => void) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallLaunch, setShowInstallLaunch] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isIosInstallPath, setIsIosInstallPath] = useState(false);

  // Callback ref — always holds the latest onInstalled without re-running the effect
  const onInstalledRef = useRef(onInstalled);
  onInstalledRef.current = onInstalled;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandalone(true);
      onInstalledRef.current?.();
    };

    setIsStandalone(standalone);
    setIsIosInstallPath(isIos);
    document.body.classList.toggle("app-standalone", standalone);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    setShowInstallLaunch(true);
    const timeout = window.setTimeout(
      () => setShowInstallLaunch(false),
      standalone ? 1200 : 900,
    );

    return () => {
      document.body.classList.remove("app-standalone");
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(timeout);
    };
  }, []);

  return {
    isStandalone,
    setIsStandalone,
    showInstallLaunch,
    deferredInstallPrompt,
    setDeferredInstallPrompt,
    isIosInstallPath,
  };
}
