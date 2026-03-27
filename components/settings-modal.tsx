import { ChevronRight, Download, RefreshCcw, Shield, Trash2, Upload, UserRound } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import type { SignatureLiftsState, TrainingAgeState } from "@/lib/profile-training-state";
import type { Profile } from "@/lib/types";

export function SettingsModal({
  profile,
  signatureLifts,
  trainingAge,
  trainingAgeMilestone,
  isProfileLocked,
  hapticEnabled,
  installState,
  onClose,
  onInstall,
  onExport,
  onImport,
  onResetProfile,
  onResetAll,
  onChooseProfile,
  onToggleHaptics,
  onToggleProfileLock,
}: {
  profile: Profile;
  signatureLifts: SignatureLiftsState;
  trainingAge: TrainingAgeState;
  trainingAgeMilestone: string | null;
  isProfileLocked: boolean;
  hapticEnabled: boolean;
  installState: {
    isStandalone: boolean;
    canPrompt: boolean;
    actionLabel: string;
    helperText: string;
  };
  onClose: () => void;
  onInstall: () => void;
  onExport: () => void;
  onImport: (file: File | null) => void;
  onResetProfile: () => void;
  onResetAll: () => void;
  onChooseProfile: () => void;
  onToggleHaptics: () => void;
  onToggleProfileLock: () => void;
}) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-large animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />

          <ScrollReveal delay={0} y={18} scale={0.994}>
            <div className="settings-hero-card animate-soft-shift flex items-start justify-between gap-4 rounded-[12px] px-4 py-4">
              <div className="pr-2">
                <p className="text-sm font-medium text-muted">Settings</p>
                <h2 className="large-title mt-1 tracking-[-0.05em]">Private. Calm. Yours.</h2>
                <p className="caption-text mt-2 text-muted">Everything important for this phone, in one place.</p>
              </div>
              <button
                className="sheet-close-button rounded-full px-3 py-2 text-sm font-medium"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </ScrollReveal>

          <div className="grouped-list mt-5">
            <ScrollReveal delay={60} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">This phone</p>
                <div className="grouped-section">
                  <div className="grouped-row">
                    <span className="row-icon">
                      <Shield className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">This phone opens as {profile.name}</p>
                      <p className="caption-text mt-1 text-muted">Your last-used profile is remembered here automatically.</p>
                    </div>
                  </div>
                  <button className="grouped-row" onClick={onToggleProfileLock}>
                    <span className="row-icon">
                      <Shield className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">
                        {isProfileLocked ? `Unlock ${profile.name} on this phone` : `Lock this phone to ${profile.name}`}
                      </p>
                      <p className="caption-text mt-1 text-muted">
                        {isProfileLocked
                          ? "Let this phone choose between profiles again."
                          : `Keep this phone fixed on ${profile.name}.`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                  <button className={`grouped-row ${isProfileLocked ? "opacity-60" : ""}`} onClick={onChooseProfile} disabled={isProfileLocked}>
                    <span className="row-icon">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Choose profile</p>
                      <p className="caption-text mt-1 text-muted">
                        {isProfileLocked
                          ? "Unlock this phone first to switch profiles."
                          : "Switch the default profile for this phone."}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={110} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Feel</p>
                <div className="grouped-section">
                  <button className="grouped-row" onClick={onToggleHaptics}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Haptic feedback</p>
                      <p className="caption-text mt-1 text-muted">Subtle feedback at key moments</p>
                    </div>
                    <span className="text-[12px] font-medium text-muted">{hapticEnabled ? "On" : "Off"}</span>
                  </button>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={135} y={18} scale={0.994}>
              {signatureLifts.ready ? (
                <div>
                  <p className="caption-text px-2 pb-2 uppercase tracking-[0.18em] text-muted">Signature lifts</p>
                  <div className="grouped-section px-4 py-4">
                    <div className="space-y-2.5">
                      {signatureLifts.signatures.map((signature) => (
                        <p key={signature.exerciseName} className="text-[14px] font-medium text-text">
                          {signature.exerciseName}
                        </p>
                      ))}
                    </div>
                    <p className="caption-text mt-4 text-muted">Based on {signatureLifts.basedOnSessions} sessions</p>
                  </div>
                </div>
              ) : null}
            </ScrollReveal>

            <ScrollReveal delay={160} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Install</p>
                <div className="grouped-section">
                  <div className="grouped-row">
                    <span className="row-icon">
                      <Download className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-text">{installState.isStandalone ? "Installed on this phone" : "Native app feel"}</p>
                      <p className="caption-text mt-1 text-muted">{installState.helperText}</p>
                    </div>
                  </div>
                  {!installState.isStandalone ? (
                    <button className="grouped-row" onClick={onInstall}>
                      <span className="row-icon">
                        <Download className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text">{installState.actionLabel}</p>
                        <p className="caption-text mt-1 text-muted">
                          {installState.canPrompt ? "Use this browser's install flow." : "Follow the iPhone/browser steps above."}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                  ) : null}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={185} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Backups</p>
                <div className="grouped-section">
                  <button className="grouped-row" onClick={onExport}>
                    <span className="row-icon">
                      <Download className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Export a backup</p>
                      <p className="caption-text mt-1 text-muted">Save a private copy of this phone&apos;s progress.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>

                  <label className="grouped-row cursor-pointer">
                    <span className="row-icon">
                      <Upload className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Import a backup</p>
                      <p className="caption-text mt-1 text-muted">Restore a previously exported file.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                    <input
                      className="hidden"
                      type="file"
                      accept="application/json"
                      onChange={(event) => {
                        onImport(event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={235} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Resets</p>
                <div className="grouped-section">
                  <button className="grouped-row" onClick={onResetProfile}>
                    <span className="row-icon text-warning">
                      <RefreshCcw className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Reset {profile.name}</p>
                      <p className="caption-text mt-1 text-muted">Clear only this profile&apos;s history.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>

                  <button className="grouped-row" onClick={onResetAll}>
                    <span className="row-icon text-warning">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Reset all data</p>
                      <p className="caption-text mt-1 text-muted">Wipe this device and start clean.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {trainingAge.rawSessionCount > 0 ? (
              <ScrollReveal delay={260} y={18} scale={0.994}>
                <div className="px-2 pb-1 pt-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Training age</p>
                  <p className="mt-2 text-[13px] font-medium text-white/68">{trainingAge.trainingAgeLabel}</p>
                  <p className="mt-1 text-[11px] text-muted">{trainingAge.rawSessionCount} sessions logged</p>
                  {trainingAgeMilestone ? (
                    <p className="mt-1 text-[11px] italic text-white/42">{trainingAgeMilestone}</p>
                  ) : null}
                </div>
              </ScrollReveal>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
