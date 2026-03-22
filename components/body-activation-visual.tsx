import type { UserId } from "@/lib/types";
import type { TrainingLoadMetric, TrainingLoadZone } from "@/lib/training-load";

type BodyView = "front" | "back";
type BodyVariant = "male" | "female";
type ZoneShape = { zone: TrainingLoadZone; d: string };

const FRONT_ZONES: ZoneShape[] = [
  { zone: "frontDelts", d: "M28 58C31 50 39 46 45 50L40 68L30 68Z" },
  { zone: "frontDelts", d: "M92 58C89 50 81 46 75 50L80 68L90 68Z" },
  { zone: "sideDelts", d: "M24 62L31 58L35 74L26 77L20 70Z" },
  { zone: "sideDelts", d: "M96 62L89 58L85 74L94 77L100 70Z" },
  { zone: "upperChest", d: "M43 56L60 54L59 70L40 71L38 62Z" },
  { zone: "upperChest", d: "M77 56L60 54L61 70L80 71L82 62Z" },
  { zone: "midChest", d: "M41 73L59 73L57 92L39 90Z" },
  { zone: "midChest", d: "M79 73L61 73L63 92L81 90Z" },
  { zone: "lowerChest", d: "M42 94L57 94L55 106L43 106Z" },
  { zone: "lowerChest", d: "M78 94L63 94L65 106L77 106Z" },
  { zone: "biceps", d: "M22 78L34 76L37 118L27 121L20 108Z" },
  { zone: "biceps", d: "M98 78L86 76L83 118L93 121L100 108Z" },
  { zone: "triceps", d: "M28 80L35 79L39 120L31 123L26 109Z" },
  { zone: "triceps", d: "M92 80L85 79L81 120L89 123L94 109Z" },
  { zone: "forearms", d: "M24 120L35 121L33 157L25 157L21 142Z" },
  { zone: "forearms", d: "M96 120L85 121L87 157L95 157L99 142Z" },
  { zone: "obliques", d: "M42 108L50 108L48 144L40 138L38 120Z" },
  { zone: "obliques", d: "M78 108L70 108L72 144L80 138L82 120Z" },
  { zone: "upperAbs", d: "M52 108L68 108L68 126L52 126Z" },
  { zone: "lowerAbs", d: "M52 128L68 128L67 148L53 148Z" },
  { zone: "sideGlutes", d: "M36 146L44 144L45 162L36 166L33 154Z" },
  { zone: "sideGlutes", d: "M84 146L76 144L75 162L84 166L87 154Z" },
  { zone: "quads", d: "M42 160L57 160L54 208L40 208Z" },
  { zone: "quads", d: "M78 160L63 160L66 208L80 208Z" },
  { zone: "calves", d: "M40 208L53 208L50 238L40 238Z" },
  { zone: "calves", d: "M80 208L67 208L70 238L80 238Z" },
];

const BACK_ZONES: ZoneShape[] = [
  { zone: "rearDelts", d: "M28 58C31 50 39 46 45 50L40 68L30 68Z" },
  { zone: "rearDelts", d: "M92 58C89 50 81 46 75 50L80 68L90 68Z" },
  { zone: "upperBack", d: "M44 54L76 54L72 78L48 78Z" },
  { zone: "lats", d: "M41 80L50 80L48 132L36 126L33 100Z" },
  { zone: "lats", d: "M79 80L70 80L72 132L84 126L87 100Z" },
  { zone: "midBack", d: "M51 80L69 80L68 116L52 116Z" },
  { zone: "lowerBack", d: "M50 118L70 118L69 144L51 144Z" },
  { zone: "triceps", d: "M26 78L36 77L39 120L31 123L24 107Z" },
  { zone: "triceps", d: "M94 78L84 77L81 120L89 123L96 107Z" },
  { zone: "biceps", d: "M22 82L30 82L34 118L27 120L21 106Z" },
  { zone: "biceps", d: "M98 82L90 82L86 118L93 120L99 106Z" },
  { zone: "forearms", d: "M24 120L34 120L32 157L24 157L20 140Z" },
  { zone: "forearms", d: "M96 120L86 120L88 157L96 157L100 140Z" },
  { zone: "upperGlutes", d: "M44 144L58 144L56 156L44 156Z" },
  { zone: "upperGlutes", d: "M76 144L62 144L64 156L76 156Z" },
  { zone: "gluteMax", d: "M43 158L58 158L56 176L42 176Z" },
  { zone: "gluteMax", d: "M77 158L62 158L64 176L78 176Z" },
  { zone: "sideGlutes", d: "M37 154L43 150L43 174L36 176L33 165Z" },
  { zone: "sideGlutes", d: "M83 154L77 150L77 174L84 176L87 165Z" },
  { zone: "hamstrings", d: "M42 178L56 178L53 220L40 220Z" },
  { zone: "hamstrings", d: "M78 178L64 178L67 220L80 220Z" },
  { zone: "calves", d: "M40 220L52 220L49 238L40 238Z" },
  { zone: "calves", d: "M80 220L68 220L71 238L80 238Z" },
];

const FEMALE_FRONT_ZONES: ZoneShape[] = FRONT_ZONES.map((shape) => ({
  ...shape,
  d: shape.d
    .replace(/42 160/g, "43 164")
    .replace(/57 160/g, "56 164")
    .replace(/78 160/g, "77 164")
    .replace(/63 160/g, "64 164"),
}));

const FEMALE_BACK_ZONES: ZoneShape[] = BACK_ZONES.map((shape) => ({
  ...shape,
  d: shape.d
    .replace(/43 158/g, "44 160")
    .replace(/58 158/g, "57 160")
    .replace(/77 158/g, "76 160")
    .replace(/62 158/g, "63 160"),
}));

function getMetricMap(metrics: TrainingLoadMetric[]) {
  return metrics.reduce<Record<TrainingLoadZone, TrainingLoadMetric>>((accumulator, metric) => {
    accumulator[metric.id] = metric;
    return accumulator;
  }, {} as Record<TrainingLoadZone, TrainingLoadMetric>);
}

function getZoneStyle(metric?: TrainingLoadMetric) {
  if (!metric || metric.percentage <= 0) {
    return {
      fill: "rgba(128,128,140,0.14)",
      stroke: "rgba(255,255,255,0.07)",
      filter: "none",
    };
  }

  const alpha = Math.max(0.34, Math.min(0.9, metric.percentage / 100));
  const strokeAlpha = metric.overload ? 0.95 : 0.76;
  const glow = metric.overload ? 18 : 11;

  return {
    fill: `${metric.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`,
    stroke: `${metric.color}${Math.round(strokeAlpha * 255).toString(16).padStart(2, "0")}`,
    filter: `drop-shadow(0 0 ${glow}px ${metric.color}${metric.overload ? "bb" : "66"})`,
  };
}

function BodyShell({ variant, view }: { variant: BodyVariant; view: BodyView }) {
  const shell = "rgba(103,103,118,0.16)";
  const shellStroke = "rgba(255,255,255,0.06)";

  if (variant === "female") {
    return (
      <>
        <circle cx="60" cy="20" r="12" fill={shell} stroke={shellStroke} />
        <path d="M45 35C48 30 72 30 75 35L82 64L78 102L80 146L69 162L51 162L40 146L42 102L38 64Z" fill={shell} stroke={shellStroke} />
        <path d="M38 54L20 78L24 92L38 82L44 64Z" fill={shell} stroke={shellStroke} />
        <path d="M82 54L100 78L96 92L82 82L76 64Z" fill={shell} stroke={shellStroke} />
        <path d="M24 92L35 84L39 156L32 195L22 195L20 140Z" fill={shell} stroke={shellStroke} />
        <path d="M96 92L85 84L81 156L88 195L98 195L100 140Z" fill={shell} stroke={shellStroke} />
        <path d="M50 162L46 248L35 248L38 190L42 162Z" fill={shell} stroke={shellStroke} />
        <path d="M70 162L74 248L85 248L82 190L78 162Z" fill={shell} stroke={shellStroke} />
      </>
    );
  }

  return (
    <>
      <circle cx="60" cy="20" r="12" fill={shell} stroke={shellStroke} />
      <path d="M42 34C46 30 74 30 78 34L86 68L81 106L78 146L70 160L50 160L42 146L39 106L34 68Z" fill={shell} stroke={shellStroke} />
      <path d="M34 52L15 77L20 92L35 82L42 64Z" fill={shell} stroke={shellStroke} />
      <path d="M86 52L105 77L100 92L85 82L78 64Z" fill={shell} stroke={shellStroke} />
      <path d="M20 92L32 84L37 156L30 195L19 195L18 138Z" fill={shell} stroke={shellStroke} />
      <path d="M100 92L88 84L83 156L90 195L101 195L102 138Z" fill={shell} stroke={shellStroke} />
      <path d="M50 160L46 248L34 248L38 188L42 160Z" fill={shell} stroke={shellStroke} />
      <path d="M70 160L74 248L86 248L82 188L78 160Z" fill={shell} stroke={shellStroke} />
    </>
  );
}

function getShapes(variant: BodyVariant, view: BodyView) {
  if (variant === "female" && view === "front") return FEMALE_FRONT_ZONES;
  if (variant === "female" && view === "back") return FEMALE_BACK_ZONES;
  if (variant === "male" && view === "front") return FRONT_ZONES;
  return BACK_ZONES;
}

export function BodyActivationVisual({
  metrics,
  userId,
  view,
  selectedZone,
  onSelectZone,
}: {
  metrics: TrainingLoadMetric[];
  userId: UserId;
  view: BodyView;
  selectedZone?: TrainingLoadZone | null;
  onSelectZone?: (zone: TrainingLoadZone) => void;
}) {
  const variant: BodyVariant = userId === "natasha" ? "female" : "male";
  const metricsByZone = getMetricMap(metrics);
  const shapes = getShapes(variant, view);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_center,rgba(113,109,255,0.16),transparent_68%)]" />
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 260" className="h-[320px] w-[150px]" aria-hidden="true">
          <BodyShell variant={variant} view={view} />
          {shapes.map((shape, index) => {
            const style = getZoneStyle(metricsByZone[shape.zone]);
            const isSelected = selectedZone === shape.zone;

            return (
              <path
                key={`${shape.zone}-${index}`}
                d={shape.d}
                fill={style.fill}
                stroke={isSelected ? "rgba(255,255,255,0.94)" : style.stroke}
                strokeWidth={isSelected ? "1.8" : "1.25"}
                style={{ filter: style.filter }}
                className={onSelectZone ? "cursor-pointer transition" : undefined}
                onClick={() => onSelectZone?.(shape.zone)}
              />
            );
          })}
        </svg>
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/36">
        <span>{view === "front" ? "Front body" : "Back body"}</span>
        <span>Current week only</span>
      </div>
    </div>
  );
}
