import type { SignatureLiftsState, TrainingAgeState } from "@/lib/profile-training-state";
import type { Profile } from "@/lib/types";

export function SettingsModal({
  profile,
  signatureLifts,
  trainingAge,
  isProfileLocked,
  hapticEnabled,
  onClose,
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
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel sheet-detent-large" onClick={(event) => event.stopPropagation()}>
        <section className="sheet-card rounded-[20px] border border-white/[0.07] bg-[var(--bg-overlay)]">
          <div className="sheet-drag-handle" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-eyebrow">Settings</p>
              <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em]" style={{ color: "#1DB954" }}>
                {profile.name}
              </h2>
              <p className="secondary-copy mt-2">
                {trainingAge.trainingAgeLabel} - {trainingAge.rawSessionCount} sessions
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary rounded-full px-4 py-2 text-[13px] text-white/60"
            >
              Close
            </button>
          </div>

          {signatureLifts.ready ? (
            <div className="mt-8">
              <p className="label-eyebrow">Signature lifts</p>
              <div className="glass-panel mt-3 space-y-3 px-5 py-5">
                {signatureLifts.signatures.map((signature) => (
                  <p key={signature.exerciseName} className="text-[15px] text-white/82">
                    {signature.exerciseName}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <p className="label-eyebrow">Preferences</p>
            <button
              type="button"
              onClick={onToggleHaptics}
              className="glass-panel mt-3 flex w-full items-center justify-between px-5 py-5 text-left"
            >
              <div>
                <p className="text-[15px] text-white/82">Haptic feedback</p>
                <p className="secondary-copy mt-2">Subtle tap feedback only.</p>
              </div>
              <span className="text-[13px] text-white/45">{hapticEnabled ? "On" : "Off"}</span>
            </button>
          </div>

          <div className="mt-8">
            <p className="label-eyebrow">Phone lock</p>
            <button
              type="button"
              onClick={onToggleProfileLock}
              className="glass-panel mt-3 flex w-full items-center justify-between px-5 py-5 text-left"
            >
              <div>
                <p className="text-[15px] text-white/82">
                  {isProfileLocked ? `Unlock this phone from ${profile.name}` : `Lock this phone to ${profile.name}`}
                </p>
                <p className="secondary-copy mt-2">
                  {isProfileLocked ? "This phone can switch profiles again." : "This phone stays on this profile."}
                </p>
              </div>
              <span className="text-[13px] text-white/45">{isProfileLocked ? "Locked" : "Open"}</span>
            </button>
          </div>

          <div className="mt-10 pt-2 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white/[0.12]">STEAL</p>
            <p className="mt-2 text-[10px] text-white/[0.08]">v0.1.0</p>
          </div>
        </section>
      </div>
    </div>
  );
}


