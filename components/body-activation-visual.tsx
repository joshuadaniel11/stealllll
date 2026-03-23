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
      fill: "rgba(132,136,150,0.02)",
      stroke: "rgba(255,255,255,0.022)",
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
    fill: selected ? style.fill : subdued ? "rgba(110,118,130,0.012)" : style.fill,
    stroke: selected ? "rgba(255,255,255,0.94)" : subdued ? "rgba(255,255,255,0.018)" : style.stroke,
    strokeWidth: selected ? 1.9 : 1.05,
    style: {
      filter: selected ? `${style.filter} drop-shadow(0 0 12px rgba(255,255,255,0.18))` : style.filter,
      opacity: subdued ? 0.34 : 1,
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
  const shellFill = "rgba(255,255,255,0.02)";
  const shellStroke = "rgba(244,246,255,0.12)";
  const contourStroke = "rgba(228,232,255,0.075)";
  const detailStroke = "rgba(228,232,255,0.048)";
  const frame = variant === "male" ? { x: 14, y: 12, width: 92, height: 228 } : { x: 16, y: 12, width: 88, height: 228 };
  const frontShell =
    variant === "male"
      ? "M60 29C54 29 50 31 48 34C44 40 42 45 39 48C33 55 31 65 32 75C33 87 36 95 38 106C40 120 42 137 46 150C48 158 50 164 52 171C54 178 54 190 53 206L51 244H57L59 207C59 190 59 177 60 166C61 177 61 190 61 207L63 244H69L67 206C66 190 66 178 68 171C70 164 72 158 74 150C78 137 80 120 82 106C84 95 87 87 88 75C89 65 87 55 81 48C78 45 76 40 72 34C70 31 66 29 60 29Z"
      : "M60 29C55 29 51 31 49 34C45 40 43 45 40 48C35 54 33 63 34 73C35 84 37 94 39 106C41 120 43 137 46 150C48 158 50 165 53 173C55 180 55 191 54 206L52 244H58L59 207C59 191 59 179 60 169C61 179 61 191 61 207L62 244H68L66 206C65 191 65 180 67 173C70 165 72 158 74 150C77 137 79 120 81 106C83 94 85 84 86 73C87 63 85 54 80 48C77 45 75 40 71 34C69 31 65 29 60 29Z";
  const backShell =
    variant === "male"
      ? "M60 29C54 29 50 31 48 34C44 40 42 45 39 48C33 55 31 65 32 75C33 87 35 97 38 109C40 121 42 138 46 151C48 159 50 166 52 173C54 180 54 191 53 206L51 244H57L59 207C59 191 59 179 60 169C61 179 61 191 61 207L63 244H69L67 206C66 191 66 180 68 173C70 166 72 159 74 151C78 138 80 121 82 109C85 97 87 87 88 75C89 65 87 55 81 48C78 45 76 40 72 34C70 31 66 29 60 29Z"
      : "M60 29C55 29 51 31 49 34C45 40 43 45 40 48C35 54 33 63 34 73C35 84 37 95 39 108C41 121 43 138 46 151C48 159 50 166 53 174C55 181 55 191 54 206L52 244H58L59 207C59 191 59 180 60 170C61 180 61 191 61 207L62 244H68L66 206C65 191 65 181 67 174C70 166 72 159 74 151C77 138 79 121 81 108C83 95 85 84 86 73C87 63 85 54 80 48C77 45 75 40 71 34C69 31 65 29 60 29Z";

  return (
    <svg x={frame.x} y={frame.y} width={frame.width} height={frame.height} viewBox="0 0 120 260">
      <circle cx="60" cy="18" r={variant === "male" ? 10.5 : 10} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path d={view === "front" ? frontShell : backShell} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path d={variant === "male" ? "M43 48C38 60 36 74 36 90" : "M44 49C40 60 38 74 38 90"} fill="none" stroke={contourStroke} strokeWidth="0.9" strokeLinecap="round" />
      <path d={variant === "male" ? "M77 48C82 60 84 74 84 90" : "M76 49C80 60 82 74 82 90"} fill="none" stroke={contourStroke} strokeWidth="0.9" strokeLinecap="round" />
      {view === "front" ? (
        <>
          <path d="M48 54C51 51 55 50 60 50C65 50 69 51 72 54" fill="none" stroke={contourStroke} strokeWidth="0.85" strokeLinecap="round" />
          <path d="M48 68C51 66 55 65 60 65C65 65 69 66 72 68" fill="none" stroke={contourStroke} strokeWidth="0.78" strokeLinecap="round" />
          <path d="M60 50L60 142" fill="none" stroke={detailStroke} strokeWidth="0.78" strokeLinecap="round" />
          <path d="M54 100L54 140" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
          <path d="M66 100L66 140" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
          <path d="M49 151C52 155 56 157 60 157C64 157 68 155 71 151" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M48 50L60 68L72 50" fill="none" stroke={contourStroke} strokeWidth="0.88" strokeLinecap="round" />
          <path d="M46 73C50 76 55 77 60 77C65 77 70 76 74 73" fill="none" stroke={contourStroke} strokeWidth="0.78" strokeLinecap="round" />
          <path d="M60 68L60 145" fill="none" stroke={detailStroke} strokeWidth="0.78" strokeLinecap="round" />
          <path d="M55 80L55 142" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
          <path d="M65 80L65 142" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
          <path d="M49 146C53 151 56 153 60 153C64 153 67 151 71 146" fill="none" stroke={detailStroke} strokeWidth="0.72" strokeLinecap="round" />
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

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.008))] px-5 py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_center,rgba(110,120,255,0.06),transparent_72%)]" />
      <div className="relative mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/34">
        <span>Weekly activation</span>
        <span>{selectedZone ? "Inspecting zone" : "Tap a lit zone"}</span>
      </div>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 260" className="h-[308px] w-[142px]" aria-hidden="true">
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
          <path d="M60 31L60 246" stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" strokeDasharray="3 5" />
          <BodyBaseArt variant={variant} view={view} />
          <rect x="0" y="0" width="20" height="260" fill="url(#body-fade-left)" />
          <rect x="100" y="0" width="20" height="260" fill="url(#body-fade-right)" />
          <rect x="0" y="0" width="120" height="34" fill="url(#body-fade-top)" />
          {shapes.map((shape, index) => {
            const style = getZoneStyle(metricsByZone[shape.zone]);
            const metric = metricsByZone[shape.zone];
            const isSecondary = SECONDARY_PHONE_ZONES.has(shape.zone);
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
      <div className="relative mt-2.5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/30">
        <span>{view === "front" ? "Front" : "Back"} view</span>
        <span>This week</span>
      </div>
    </div>
  );
}
