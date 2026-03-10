import { Download, RefreshCcw, Smartphone, Trash2, Upload } from "lucide-react";

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
    <div className="fixed inset-0 z-40 bg-slate-950/30 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-md">
        <Card className="bg-[var(--surface)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Settings</p>
              <h2 className="mt-1 text-[28px] font-bold tracking-[-0.05em]">Device and data</h2>
            </div>
            <button
              className="rounded-full bg-black/5 px-3 py-2 text-sm text-muted dark:bg-white/5"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="mt-5 rounded-[24px] bg-black/5 p-4 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-accent" />
              <p className="text-sm font-medium text-text">Local-only saving</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              This phone keeps its own workout history and progress. Use the same browser or home screen app each time to keep data consistent.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5"
              onClick={onExport}
            >
              <Download className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Export</p>
              <p className="mt-1 text-sm text-muted">Backup this phone&apos;s data.</p>
            </button>

            <label className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5">
              <Upload className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Import</p>
              <p className="mt-1 text-sm text-muted">Restore from a backup.</p>
              <input
                className="hidden"
                type="file"
                accept="application/json"
                onChange={(event) => onImport(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5"
              onClick={onResetProfile}
            >
              <RefreshCcw className="h-5 w-5 text-warning" />
              <p className="mt-3 font-medium">Reset {profile.name}</p>
              <p className="mt-1 text-sm text-muted">Clear this profile&apos;s progress only.</p>
            </button>

            <button
              className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5"
              onClick={onResetAll}
            >
              <Trash2 className="h-5 w-5 text-warning" />
              <p className="mt-3 font-medium">Reset all</p>
              <p className="mt-1 text-sm text-muted">Return the app to a clean start.</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
