import type { UserId } from "@/lib/types";
import type { TrainingLoadMetric, TrainingLoadZone } from "@/lib/training-load";

type BodyView = "front" | "back";
type BodyVariant = "male" | "female";

type PathShape = {
  kind: "path";
  zone: TrainingLoadZone;
  d: string;
};

type EllipseShape = {
  kind: "ellipse";
  zone: TrainingLoadZone;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
};

type ShapeDef = PathShape | EllipseShape;

const SECONDARY_PHONE_ZONES = new Set<TrainingLoadZone>(["biceps", "triceps", "forearms", "calves"]);

const FRONT_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M39 51C40 47 45 45 49 46C52 47 54 50 54 54L50 68C46 67 41 63 39 51Z" },
  { kind: "path", zone: "frontDelts", d: "M81 51C80 47 75 45 71 46C68 47 66 50 66 54L70 68C74 67 79 63 81 51Z" },
  { kind: "ellipse", zone: "sideDelts", cx: 36, cy: 60, rx: 5.8, ry: 9.5, rotate: -16 },
  { kind: "ellipse", zone: "sideDelts", cx: 84, cy: 60, rx: 5.8, ry: 9.5, rotate: 16 },
  { kind: "path", zone: "upperChest", d: "M47 56C50 53 55 51 60 51C65 51 70 53 73 56L70 66C66 65 63 64 60 64C57 64 54 65 50 66Z" },
  { kind: "path", zone: "midChest", d: "M47 68C50 66 55 65 60 65C65 65 70 66 73 68L71 79C67 79 64 78 60 78C56 78 53 79 49 79Z" },
  { kind: "path", zone: "lowerChest", d: "M49 80C52 79 56 78 60 78C64 78 68 79 71 80L69 89C66 89 63 88 60 88C57 88 54 89 51 89Z" },
  { kind: "ellipse", zone: "biceps", cx: 28, cy: 91, rx: 5.5, ry: 14.5, rotate: -10 },
  { kind: "ellipse", zone: "biceps", cx: 92, cy: 91, rx: 5.5, ry: 14.5, rotate: 10 },
  { kind: "ellipse", zone: "triceps", cx: 32, cy: 93, rx: 4.2, ry: 15.5, rotate: -8 },
  { kind: "ellipse", zone: "triceps", cx: 88, cy: 93, rx: 4.2, ry: 15.5, rotate: 8 },
  { kind: "ellipse", zone: "forearms", cx: 29, cy: 129, rx: 4.4, ry: 16.5, rotate: -6 },
  { kind: "ellipse", zone: "forearms", cx: 91, cy: 129, rx: 4.4, ry: 16.5, rotate: 6 },
  { kind: "path", zone: "obliques", d: "M46 103C48 102 50 102 52 103L50 140C46 137 44 128 44 115Z" },
  { kind: "path", zone: "obliques", d: "M74 103C72 102 70 102 68 103L70 140C74 137 76 128 76 115Z" },
  { kind: "path", zone: "upperAbs", d: "M54 100C56 99 58 98 60 98C62 98 64 99 66 100L66 118C64 119 62 120 60 120C58 120 56 119 54 118Z" },
  { kind: "path", zone: "lowerAbs", d: "M54 119C56 118 58 117 60 117C62 117 64 118 66 119L65 141C63 142 62 143 60 143C58 143 57 142 55 141Z" },
  { kind: "ellipse", zone: "sideGlutes", cx: 48, cy: 156, rx: 6.4, ry: 9.4, rotate: -18 },
  { kind: "ellipse", zone: "sideGlutes", cx: 72, cy: 156, rx: 6.4, ry: 9.4, rotate: 18 },
  { kind: "ellipse", zone: "quads", cx: 52, cy: 191, rx: 7.4, ry: 24.5, rotate: -4 },
  { kind: "ellipse", zone: "quads", cx: 68, cy: 191, rx: 7.4, ry: 24.5, rotate: 4 },
  { kind: "ellipse", zone: "calves", cx: 51, cy: 235, rx: 6.2, ry: 18.5, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 69, cy: 235, rx: 6.2, ry: 18.5, rotate: 2 },
];

const BACK_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M38 52C39 48 44 46 48 47C51 48 53 50 53 54L49 68C45 68 40 64 38 52Z" },
  { kind: "path", zone: "rearDelts", d: "M82 52C81 48 76 46 72 47C69 48 67 50 67 54L71 68C75 68 80 64 82 52Z" },
  { kind: "path", zone: "upperBack", d: "M47 54C50 51 55 50 60 50C65 50 70 51 73 54L71 73C67 75 64 76 60 76C56 76 53 75 49 73Z" },
  { kind: "path", zone: "lats", d: "M46 74C48 73 51 73 54 74L52 128C48 126 45 116 44 98Z" },
  { kind: "path", zone: "lats", d: "M74 74C72 73 69 73 66 74L68 128C72 126 75 116 76 98Z" },
  { kind: "path", zone: "midBack", d: "M54 76C56 75 58 74 60 74C62 74 64 75 66 76L66 113C64 114 62 115 60 115C58 115 56 114 54 113Z" },
  { kind: "path", zone: "lowerBack", d: "M53 114C55 113 58 112 60 112C62 112 65 113 67 114L66 142C64 143 62 144 60 144C58 144 56 143 54 142Z" },
  { kind: "ellipse", zone: "triceps", cx: 31, cy: 92, rx: 4.4, ry: 16.5, rotate: -6 },
  { kind: "ellipse", zone: "triceps", cx: 89, cy: 92, rx: 4.4, ry: 16.5, rotate: 6 },
  { kind: "ellipse", zone: "biceps", cx: 27, cy: 92, rx: 3.8, ry: 11.8, rotate: -10 },
  { kind: "ellipse", zone: "biceps", cx: 93, cy: 92, rx: 3.8, ry: 11.8, rotate: 10 },
  { kind: "ellipse", zone: "forearms", cx: 29, cy: 130, rx: 4.4, ry: 16.2, rotate: -5 },
  { kind: "ellipse", zone: "forearms", cx: 91, cy: 130, rx: 4.4, ry: 16.2, rotate: 5 },
  { kind: "path", zone: "upperGlutes", d: "M48 145C51 143 56 142 60 142C64 142 69 143 72 145L70 155C67 154 64 153 60 153C56 153 53 154 50 155Z" },
  { kind: "ellipse", zone: "gluteMax", cx: 52, cy: 167, rx: 8.2, ry: 11.8, rotate: -10 },
  { kind: "ellipse", zone: "gluteMax", cx: 68, cy: 167, rx: 8.2, ry: 11.8, rotate: 10 },
  { kind: "ellipse", zone: "sideGlutes", cx: 46, cy: 165, rx: 4.8, ry: 8.4, rotate: -22 },
  { kind: "ellipse", zone: "sideGlutes", cx: 74, cy: 165, rx: 4.8, ry: 8.4, rotate: 22 },
  { kind: "ellipse", zone: "hamstrings", cx: 52, cy: 200, rx: 7.2, ry: 22.2, rotate: -3 },
  { kind: "ellipse", zone: "hamstrings", cx: 68, cy: 200, rx: 7.2, ry: 22.2, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 51, cy: 236, rx: 6.2, ry: 18.2, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 69, cy: 236, rx: 6.2, ry: 18.2, rotate: 2 },
];

const FRONT_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M41 53C42 49 46 47 49 48C51 49 52 51 52 54L50 66C46 66 43 63 41 53Z" },
  { kind: "path", zone: "frontDelts", d: "M79 53C78 49 74 47 71 48C69 49 68 51 68 54L70 66C74 66 77 63 79 53Z" },
  { kind: "ellipse", zone: "sideDelts", cx: 37, cy: 61, rx: 5.2, ry: 8.7, rotate: -16 },
  { kind: "ellipse", zone: "sideDelts", cx: 83, cy: 61, rx: 5.2, ry: 8.7, rotate: 16 },
  { kind: "path", zone: "upperChest", d: "M47 58C50 55 55 54 60 54C65 54 70 55 73 58L70 66C66 65 63 64 60 64C57 64 54 65 50 66Z" },
  { kind: "path", zone: "midChest", d: "M47 67C50 65 55 64 60 64C65 64 70 65 73 67L71 77C67 77 64 76 60 76C56 76 53 77 49 77Z" },
  { kind: "path", zone: "lowerChest", d: "M49 78C52 77 56 76 60 76C64 76 68 77 71 78L69 86C66 86 63 85 60 85C57 85 54 86 51 86Z" },
  { kind: "ellipse", zone: "biceps", cx: 29, cy: 92, rx: 4.6, ry: 13.2, rotate: -10 },
  { kind: "ellipse", zone: "biceps", cx: 91, cy: 92, rx: 4.6, ry: 13.2, rotate: 10 },
  { kind: "ellipse", zone: "triceps", cx: 33, cy: 94, rx: 3.8, ry: 14.4, rotate: -7 },
  { kind: "ellipse", zone: "triceps", cx: 87, cy: 94, rx: 3.8, ry: 14.4, rotate: 7 },
  { kind: "ellipse", zone: "forearms", cx: 30, cy: 132, rx: 4, ry: 15.8, rotate: -6 },
  { kind: "ellipse", zone: "forearms", cx: 90, cy: 132, rx: 4, ry: 15.8, rotate: 6 },
  { kind: "path", zone: "obliques", d: "M47 99C49 98 51 98 53 99L51 139C47 136 45 127 45 113Z" },
  { kind: "path", zone: "obliques", d: "M73 99C71 98 69 98 67 99L69 139C73 136 75 127 75 113Z" },
  { kind: "path", zone: "upperAbs", d: "M55 97C57 96 58 95 60 95C62 95 63 96 65 97L65 116C63 117 62 118 60 118C58 118 57 117 55 116Z" },
  { kind: "path", zone: "lowerAbs", d: "M55 117C57 116 58 115 60 115C62 115 63 116 65 117L64 140C62 141 61 142 60 142C59 142 58 141 56 140Z" },
  { kind: "ellipse", zone: "sideGlutes", cx: 45, cy: 159, rx: 7.8, ry: 11.8, rotate: -22 },
  { kind: "ellipse", zone: "sideGlutes", cx: 75, cy: 159, rx: 7.8, ry: 11.8, rotate: 22 },
  { kind: "ellipse", zone: "quads", cx: 48, cy: 194, rx: 8.4, ry: 24.8, rotate: -4 },
  { kind: "ellipse", zone: "quads", cx: 72, cy: 194, rx: 8.4, ry: 24.8, rotate: 4 },
  { kind: "ellipse", zone: "calves", cx: 49, cy: 236, rx: 6, ry: 17.5, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 71, cy: 236, rx: 6, ry: 17.5, rotate: 2 },
];

const BACK_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M39 55C40 49 45 46 48 47C50 48 51 50 51 53L48 67C44 67 41 64 39 55Z" },
  { kind: "path", zone: "rearDelts", d: "M81 55C80 49 75 46 72 47C70 48 69 50 69 53L72 67C76 67 79 64 81 55Z" },
  { kind: "path", zone: "upperBack", d: "M48 55C51 53 55 52 60 52C65 52 69 53 72 55L70 72C66 74 63 75 60 75C57 75 54 74 50 72Z" },
  { kind: "path", zone: "lats", d: "M47 73C49 72 51 72 54 73L52 128C48 126 45 117 45 100Z" },
  { kind: "path", zone: "lats", d: "M73 73C71 72 69 72 66 73L68 128C72 126 75 117 75 100Z" },
  { kind: "path", zone: "midBack", d: "M55 74C57 73 58 72 60 72C62 72 63 73 65 74L65 112C63 113 62 114 60 114C58 114 57 113 55 112Z" },
  { kind: "path", zone: "lowerBack", d: "M54 113C56 112 58 111 60 111C62 111 64 112 66 113L65 142C63 143 62 144 60 144C58 144 57 143 55 142Z" },
  { kind: "ellipse", zone: "triceps", cx: 32, cy: 93, rx: 4, ry: 15, rotate: -6 },
  { kind: "ellipse", zone: "triceps", cx: 88, cy: 93, rx: 4, ry: 15, rotate: 6 },
  { kind: "ellipse", zone: "biceps", cx: 28, cy: 93, rx: 3.4, ry: 11.2, rotate: -9 },
  { kind: "ellipse", zone: "biceps", cx: 92, cy: 93, rx: 3.4, ry: 11.2, rotate: 9 },
  { kind: "ellipse", zone: "forearms", cx: 30, cy: 131, rx: 4, ry: 15.6, rotate: -5 },
  { kind: "ellipse", zone: "forearms", cx: 90, cy: 131, rx: 4, ry: 15.6, rotate: 5 },
  { kind: "path", zone: "upperGlutes", d: "M48 145C51 143 56 142 60 142C64 142 69 143 72 145L70 155C66 154 63 153 60 153C57 153 54 154 50 155Z" },
  { kind: "ellipse", zone: "gluteMax", cx: 48, cy: 168, rx: 10.2, ry: 14.2, rotate: -10 },
  { kind: "ellipse", zone: "gluteMax", cx: 72, cy: 168, rx: 10.2, ry: 14.2, rotate: 10 },
  { kind: "ellipse", zone: "sideGlutes", cx: 40, cy: 166, rx: 6.4, ry: 10.2, rotate: -20 },
  { kind: "ellipse", zone: "sideGlutes", cx: 80, cy: 166, rx: 6.4, ry: 10.2, rotate: 20 },
  { kind: "ellipse", zone: "hamstrings", cx: 48, cy: 202, rx: 7.4, ry: 21.8, rotate: -3 },
  { kind: "ellipse", zone: "hamstrings", cx: 72, cy: 202, rx: 7.4, ry: 21.8, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 49, cy: 237, rx: 6, ry: 17.8, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 71, cy: 237, rx: 6, ry: 17.8, rotate: 2 },
];

function getMetricMap(metrics: TrainingLoadMetric[]) {
  return metrics.reduce<Record<TrainingLoadZone, TrainingLoadMetric>>((accumulator, metric) => {
    accumulator[metric.id] = metric;
    return accumulator;
  }, {} as Record<TrainingLoadZone, TrainingLoadMetric>);
}

function getZoneStyle(metric?: TrainingLoadMetric) {
  if (!metric || metric.percentage <= 0) {
    return {
      fill: "rgba(132,136,150,0.015)",
      stroke: "rgba(255,255,255,0.018)",
      filter: "none",
    };
  }

  const alpha = Math.max(0.3, Math.min(0.82, metric.percentage / 100));
  const strokeAlpha = metric.overload ? 0.9 : 0.68;
  const glow = metric.overload ? 16 : 9;

  return {
    fill: `${metric.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`,
    stroke: `${metric.color}${Math.round(strokeAlpha * 255).toString(16).padStart(2, "0")}`,
    filter: `drop-shadow(0 0 ${glow}px ${metric.color}${metric.overload ? "88" : "4a"})`,
  };
}

function Shape({
  shape,
  style,
  selected,
  subdued,
  onClick,
}: {
  shape: ShapeDef;
  style: { fill: string; stroke: string; filter: string };
  selected: boolean;
  subdued: boolean;
  onClick?: () => void;
}) {
  const commonProps = {
    fill: selected ? style.fill : subdued ? "rgba(110,118,130,0.01)" : style.fill,
    stroke: selected ? "rgba(255,255,255,0.9)" : subdued ? "rgba(255,255,255,0.015)" : style.stroke,
    strokeWidth: selected ? 1.6 : 0.92,
    style: {
      filter: selected ? `${style.filter} drop-shadow(0 0 9px rgba(255,255,255,0.14))` : style.filter,
      opacity: subdued ? 0.28 : 1,
    },
    className: onClick ? "cursor-pointer transition" : undefined,
    onClick,
  };

  if (shape.kind === "ellipse") {
    const transform = shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined;
    return <ellipse {...commonProps} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} transform={transform} />;
  }

  return <path {...commonProps} d={shape.d} />;
}

function BodyBaseArt({ variant, view }: { variant: BodyVariant; view: BodyView }) {
  const shellFill = "rgba(255,255,255,0.024)";
  const shellStroke = "rgba(244,246,255,0.18)";
  const contourStroke = "rgba(255,255,255,0.038)";
  const frame = variant === "male" ? { x: 14, y: 10, width: 92, height: 232 } : { x: 16, y: 10, width: 88, height: 232 };
  const frontShell =
    variant === "male"
      ? "M60 28C54 28 50 30 47 34C43 40 41 45 38 49C33 56 31 66 32 77C33 89 35 98 37 111C39 124 42 140 46 153C48 161 50 168 52 176C54 184 54 194 53 207L51 245H57L59 208C59 191 59 179 60 168C61 179 61 191 61 208L63 245H69L67 207C66 194 66 184 68 176C70 168 72 161 74 153C78 140 81 124 83 111C85 98 87 89 88 77C89 66 87 56 82 49C79 45 77 40 73 34C70 30 66 28 60 28Z"
      : "M60 28C55 28 51 30 48 34C44 40 42 45 39 49C35 55 33 64 34 75C35 87 37 97 39 110C41 123 43 139 46 153C48 161 50 168 53 177C55 185 55 195 54 208L52 245H58L59 209C59 193 59 181 60 170C61 181 61 193 61 209L62 245H68L66 208C65 195 65 185 67 177C70 168 72 161 74 153C77 139 79 123 81 110C83 97 85 87 86 75C87 64 85 55 81 49C78 45 76 40 72 34C69 30 65 28 60 28Z";
  const backShell =
    variant === "male"
      ? "M60 28C54 28 50 30 47 34C43 40 41 45 38 49C33 56 31 66 32 77C33 89 35 100 38 112C40 124 42 140 46 153C48 161 50 168 52 176C54 184 54 194 53 207L51 245H57L59 208C59 192 59 180 60 170C61 180 61 192 61 208L63 245H69L67 207C66 194 66 184 68 176C70 168 72 161 74 153C78 140 80 124 82 112C85 100 87 89 88 77C89 66 87 56 82 49C79 45 77 40 73 34C70 30 66 28 60 28Z"
      : "M60 28C55 28 51 30 48 34C44 40 42 45 39 49C35 55 33 64 34 75C35 87 37 98 39 111C41 123 43 139 46 153C48 161 50 168 53 177C55 185 55 195 54 208L52 245H58L59 209C59 193 59 181 60 171C61 181 61 193 61 209L62 245H68L66 208C65 195 65 185 67 177C70 168 72 161 74 153C77 139 79 123 81 111C83 98 85 87 86 75C87 64 85 55 81 49C78 45 76 40 72 34C69 30 65 28 60 28Z";

  return (
    <svg x={frame.x} y={frame.y} width={frame.width} height={frame.height} viewBox="0 0 120 260">
      <ellipse cx="60" cy="112" rx={variant === "male" ? 22 : 20} ry="60" fill="rgba(255,255,255,0.012)" />
      <circle cx="60" cy="18" r={variant === "male" ? 10.5 : 10} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path d={view === "front" ? frontShell : backShell} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path d={variant === "male" ? "M43 50C39 61 37 75 37 92" : "M44 51C40 61 38 75 38 92"} fill="none" stroke={contourStroke} strokeWidth="0.82" strokeLinecap="round" />
      <path d={variant === "male" ? "M77 50C81 61 83 75 83 92" : "M76 51C80 61 82 75 82 92"} fill="none" stroke={contourStroke} strokeWidth="0.82" strokeLinecap="round" />
      {view === "front" ? (
        <>
          <path d="M48 54C51 51 55 50 60 50C65 50 69 51 72 54" fill="none" stroke={contourStroke} strokeWidth="0.62" strokeLinecap="round" />
          <path d="M60 52L60 143" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.72" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M48 50L60 68L72 50" fill="none" stroke={contourStroke} strokeWidth="0.7" strokeLinecap="round" />
          <path d="M60 66L60 145" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function getShapes(variant: BodyVariant, view: BodyView) {
  if (variant === "female") {
    return view === "front" ? FRONT_ZONES_FEMALE : BACK_ZONES_FEMALE;
  }
  return view === "front" ? FRONT_ZONES_MALE : BACK_ZONES_MALE;
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
  const hasSelection = Boolean(selectedZone);
  const activeMetricCount = metrics.filter((metric) => metric.effectiveSets > 0).length;
  const selectedMetric = selectedZone ? metricsByZone[selectedZone] : null;
  const zoneIsVisible = (zone: TrainingLoadZone) => {
    const metric = metricsByZone[zone];
    if (selectedZone === zone) {
      return true;
    }
    return (metric?.effectiveSets ?? 0) > 0;
  };

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.006))] px-5 py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_center,rgba(110,120,255,0.06),transparent_72%)]" />
      <div className="relative mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/34">
        <span>{selectedMetric ? selectedMetric.label : "Weekly activation"}</span>
        <span>{selectedMetric ? `${selectedMetric.percentage}%` : `${activeMetricCount} active`}</span>
      </div>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 260" className="h-[322px] w-[148px]" aria-hidden="true">
          <defs>
            <linearGradient id="body-fade-left" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(14,15,22,0.96)" />
              <stop offset="100%" stopColor="rgba(14,15,22,0)" />
            </linearGradient>
            <linearGradient id="body-fade-right" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(14,15,22,0.96)" />
              <stop offset="100%" stopColor="rgba(14,15,22,0)" />
            </linearGradient>
            <linearGradient id="body-fade-top" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(18,19,28,0.72)" />
              <stop offset="100%" stopColor="rgba(18,19,28,0)" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="132" rx="34" ry="108" fill="rgba(255,255,255,0.014)" />
          <BodyBaseArt variant={variant} view={view} />
          <rect x="0" y="0" width="20" height="260" fill="url(#body-fade-left)" />
          <rect x="100" y="0" width="20" height="260" fill="url(#body-fade-right)" />
          <rect x="0" y="0" width="120" height="34" fill="url(#body-fade-top)" />
          {shapes.map((shape, index) => {
            const style = getZoneStyle(metricsByZone[shape.zone]);
            const metric = metricsByZone[shape.zone];
            const isSecondary = SECONDARY_PHONE_ZONES.has(shape.zone);
            if (!zoneIsVisible(shape.zone)) {
              return null;
            }
            if (isSecondary && !metric?.percentage && selectedZone !== shape.zone) {
              return null;
            }
            return (
              <Shape
                key={`${shape.zone}-${index}`}
                shape={shape}
                style={style}
                selected={selectedZone === shape.zone}
                subdued={hasSelection && selectedZone !== shape.zone}
                onClick={onSelectZone ? () => onSelectZone(shape.zone) : undefined}
              />
            );
          })}
        </svg>
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/30">
        <span>{view === "front" ? "Front" : "Back"} view</span>
        <span>{selectedMetric ? "Focused" : "This week"}</span>
      </div>
    </div>
  );
}
