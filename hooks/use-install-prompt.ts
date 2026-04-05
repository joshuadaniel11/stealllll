"use client";

import { useEffect, useRef, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectIosInstallPath() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function useInstallPrompt(onInstalled?: () => void) {
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
  const [isIosInstallPath] = useState(detectIosInstallPath);
  const [showInstallLaunch, setShowInstallLaunch] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);

  // Callback ref — always holds the latest onInstalled without re-running the effect
  const onInstalledRef = useRef(onInstalled);
  useEffect(() => {
    onInstalledRef.current = onInstalled;
  });

  // Sync body class with standalone state
  useEffect(() => {
    document.body.classList.toggle("app-standalone", isStandalone);
    return () => {
      document.body.classList.remove("app-standalone");
    };
  }, [isStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone = detectStandalone();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandalone(true);
      onInstalledRef.current?.();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    // Defer setState calls so they run in a callback, not synchronously in the effect body
    const showTimeout = window.setTimeout(() => setShowInstallLaunch(true), 0);
    const hideTimeout = window.setTimeout(
      () => setShowInstallLaunch(false),
      standalone ? 1200 : 900,
    );

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
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
