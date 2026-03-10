import { Download, Upload } from "lucide-react";

import { Card } from "@/components/ui";

export function DataPortabilityCard({
  onExport,
  onImport,
}: {
  onExport: () => void;
  onImport: (file: File | null) => void;
}) {
  return (
    <Card>
      <p className="text-sm text-muted">Data</p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Export and import</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Keep Joshua and Natasha&apos;s workout history, plans, notes, and check-ins portable across devices.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5"
          onClick={onExport}
        >
          <Download className="h-5 w-5 text-accent" />
          <p className="mt-3 font-medium">Export Data</p>
          <p className="mt-1 text-sm text-muted">Download a JSON backup.</p>
        </button>

        <label className="rounded-[22px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5">
          <Upload className="h-5 w-5 text-accent" />
          <p className="mt-3 font-medium">Import Data</p>
          <p className="mt-1 text-sm text-muted">Restore from a saved backup.</p>
          <input
            className="hidden"
            type="file"
            accept="application/json"
            onChange={(event) => onImport(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </Card>
  );
}
