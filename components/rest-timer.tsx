import { Pause, Play, SkipForward, TimerReset } from "lucide-react";

export function RestTimer({
  seconds,
  running,
  onToggle,
  onSkip,
  onRestart,
  onSetPreset,
}: {
  seconds: number;
  running: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onSetPreset: (seconds: number) => void;
}) {
  if (seconds <= 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-md rounded-[28px] border border-stroke bg-[var(--card)] p-4 shadow-card backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Rest timer</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-stroke p-3 text-muted" onClick={onToggle}>
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button className="rounded-full border border-stroke p-3 text-muted" onClick={onSkip}>
            <SkipForward className="h-5 w-5" />
          </button>
          <button className="rounded-full border border-stroke p-3 text-muted" onClick={onRestart}>
            <TimerReset className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {[60, 90, 120].map((value) => (
          <button
            key={value}
            className="rounded-full bg-black/5 px-3 py-2 text-xs text-muted dark:bg-white/5"
            onClick={() => onSetPreset(value)}
          >
            {value}s
          </button>
        ))}
      </div>
    </div>
  );
}
