import { ChevronRight, Download, RefreshCcw, Smartphone, Trash2, Upload } from "lucide-react";

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Settings</p>
              <h2 className="large-title mt-1 font-semibold tracking-[-0.05em]">Device and data</h2>
            </div>
            <button
              className="rounded-full bg-[var(--card-strong)] px-3 py-2 text-sm text-muted"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="grouped-list mt-5">
            <div>
              <p className="caption-text px-2 pb-2 text-muted">This device</p>
              <div className="grouped-section">
                <div className="grouped-row">
                  <span className="row-icon">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Local-only saving</p>
                    <p className="caption-text mt-1 text-muted">
                      This phone keeps its own workout history and progress. Use the same browser or home screen app each time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="caption-text px-2 pb-2 text-muted">Backup</p>
              <div className="grouped-section">
                <button className="grouped-row" onClick={onExport}>
                  <span className="row-icon">
                    <Download className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Export backup</p>
                    <p className="caption-text mt-1 text-muted">Save this phone&apos;s data as a file.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </button>

                <label className="grouped-row cursor-pointer">
                  <span className="row-icon">
                    <Upload className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Import backup</p>
                    <p className="caption-text mt-1 text-muted">Restore from a previous export file.</p>
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

            <div>
              <p className="caption-text px-2 pb-2 text-muted">Reset</p>
              <div className="grouped-section">
                <button className="grouped-row" onClick={onResetProfile}>
                  <span className="row-icon text-warning">
                    <RefreshCcw className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Reset {profile.name}</p>
                    <p className="caption-text mt-1 text-muted">Clear this profile&apos;s progress only.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </button>

                <button className="grouped-row" onClick={onResetAll}>
                  <span className="row-icon text-warning">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Reset all data</p>
                    <p className="caption-text mt-1 text-muted">Return the app to a clean start.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
