"use client";

import { startTransition, useEffect, useState } from "react";
import type { UserId } from "@/lib/types";
import type { SessionSummary } from "@/components/session-summary-modal";

export type TabId = "home" | "workout" | "progress";

export type ToastOptions = {
  title?: string;
  actionLabel?: string;
  actionKind?: "undo-schedule";
  pendingScheduleUndo?: { userId: UserId; previousNextWorkoutId: string | null } | null;
};

type ToastState = {
  visible: boolean;
  title: string;
  message: string;
  actionLabel: string | null;
  actionKind: "undo-schedule" | null;
  pendingScheduleUndo: { userId: UserId; previousNextWorkoutId: string | null } | null;
};

const TOAST_DURATION_DEFAULT = 1250;
const TOAST_DURATION_WITH_ACTION = 3600;

export function useUIState() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [scrollY, setScrollY] = useState(0);
  const [hasEnteredProfile, setHasEnteredProfile] = useState(false);
  const [profileEntryTransition, setProfileEntryTransition] = useState<UserId | null>(null);

  // Modals
  const [showDailyVerse, setShowDailyVerse] = useState(false);
  const [showWorkoutFeelingPrompt, setShowWorkoutFeelingPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [workoutPreviewId, setWorkoutPreviewId] = useState<string | null>(null);
  const [suggestedSessionPreview, setSuggestedSessionPreview] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  // Toast (consolidated from 5 separate state vars)
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    title: "Update",
    message: "",
    actionLabel: null,
    actionKind: null,
    pendingScheduleUndo: null,
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast.visible) {
      return;
    }
    const duration = toast.actionKind ? TOAST_DURATION_WITH_ACTION : TOAST_DURATION_DEFAULT;
    const timeout = window.setTimeout(() => {
      setToast((current) => ({
        ...current,
        visible: false,
        title: "Update",
        actionLabel: null,
        actionKind: null,
        pendingScheduleUndo: null,
      }));
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [toast.visible, toast.actionKind]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showToast = (message: string, options?: ToastOptions) => {
    setToast({
      visible: true,
      title: options?.title ?? "Update",
      message,
      actionLabel: options?.actionLabel ?? null,
      actionKind: options?.actionKind ?? null,
      pendingScheduleUndo: options?.pendingScheduleUndo ?? null,
    });
  };

  const clearWorkoutUI = () => {
    setSuggestedSessionPreview(false);
    setWorkoutPreviewId(null);
    setShowWorkoutFeelingPrompt(false);
  };

  const navigateTo = (tab: TabId) => {
    startTransition(() => setActiveTab(tab));
  };

  return {
    // Navigation
    activeTab,
    setActiveTab,
    navigateTo,
    scrollY,
    hasEnteredProfile,
    setHasEnteredProfile,
    profileEntryTransition,
    setProfileEntryTransition,
    // Modals
    showDailyVerse,
    setShowDailyVerse,
    showWorkoutFeelingPrompt,
    setShowWorkoutFeelingPrompt,
    showSettings,
    setShowSettings,
    showOnboarding,
    setShowOnboarding,
    workoutPreviewId,
    setWorkoutPreviewId,
    suggestedSessionPreview,
    setSuggestedSessionPreview,
    selectedExerciseId,
    setSelectedExerciseId,
    editingSessionId,
    setEditingSessionId,
    sessionSummary,
    setSessionSummary,
    // Toast
    showToast,
    // Backward-compatible aliases so render code references don't change
    showCompletionCelebration: toast.visible,
    completionTitle: toast.title,
    completionMessage: toast.message,
    toastActionLabel: toast.actionLabel,
    toastActionKind: toast.actionKind,
    pendingScheduleUndo: toast.pendingScheduleUndo,
    // Helpers
    clearWorkoutUI,
  };
}
