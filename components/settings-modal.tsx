import { ChevronRight, Download, RefreshCcw, Shield, Trash2, Upload } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function SettingsModal({
  profile,
  onClose,
  onExport,
  onImport,
  onResetProfile,
  onResetAll,
}: {
  profile: Profile;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File | null) => void;
  onResetProfile: () => void;
  onResetAll: () => void;
}) {
  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel sheet-detent-large animate-sheet-up">
        <Card className="sheet-card bg-[var(--surface)]">
          <div className="sheet-drag-handle" />

          <ScrollReveal delay={0} y={18} scale={0.994}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">Settings</p>
                <h2 className="large-title mt-1 font-semibold tracking-[-0.05em]">Quiet, private, simple.</h2>
                <p className="caption-text mt-2 text-muted">Everything important for this phone, without extra noise.</p>
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
                      <p className="text-sm font-medium text-text">Saved on this device</p>
                      <p className="caption-text mt-1 text-muted">
                        Use the same browser or home screen app each time to keep this phone&apos;s progress intact.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={110} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Backups</p>
                <div className="grouped-section">
                  <button className="grouped-row" onClick={onExport}>
                    <span className="row-icon">
                      <Download className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Export a backup</p>
                      <p className="caption-text mt-1 text-muted">Keep a private copy of this phone&apos;s progress.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>

                  <label className="grouped-row cursor-pointer">
                    <span className="row-icon">
                      <Upload className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Import a backup</p>
                      <p className="caption-text mt-1 text-muted">Restore a previously exported file on this phone.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                    <input
                      className="hidden"
                      type="file"
                      accept="application/json"
                      onChange={(event) => onImport(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={160} y={18} scale={0.994}>
              <div>
                <p className="caption-text px-2 pb-2 text-muted">Resets</p>
                <div className="grouped-section">
                  <button className="grouped-row" onClick={onResetProfile}>
                    <span className="row-icon text-warning">
                      <RefreshCcw className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Reset {profile.name}</p>
                      <p className="caption-text mt-1 text-muted">Clear only this profile&apos;s saved training history.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>

                  <button className="grouped-row" onClick={onResetAll}>
                    <span className="row-icon text-warning">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">Reset all data</p>
                      <p className="caption-text mt-1 text-muted">Return the whole app to a clean start on this device.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Card>
      </div>
    </div>
  );
}
