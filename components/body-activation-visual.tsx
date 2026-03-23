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
type BodyBaseConfig = {
  href: string;
  sourceHeight: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const FRONT_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M37 52C38 47 44 44 48 45C51 46 53 49 53 53L49 69C44 68 39 64 37 52Z" },
  { kind: "path", zone: "frontDelts", d: "M83 52C82 47 76 44 72 45C69 46 67 49 67 53L71 69C76 68 81 64 83 52Z" },
  { kind: "ellipse", zone: "sideDelts", cx: 33, cy: 61, rx: 7, ry: 11, rotate: -12 },
  { kind: "ellipse", zone: "sideDelts", cx: 87, cy: 61, rx: 7, ry: 11, rotate: 12 },
  { kind: "path", zone: "upperChest", d: "M46 58C50 54 56 52 60 52C64 52 70 54 74 58L71 68C67 66 64 65 60 65C56 65 53 66 49 68Z" },
  { kind: "path", zone: "midChest", d: "M46 70C50 67 55 66 60 66C65 66 70 67 74 70L71 83C67 82 64 81 60 81C56 81 53 82 49 83Z" },
  { kind: "path", zone: "lowerChest", d: "M48 84C51 82 55 81 60 81C65 81 69 82 72 84L69 94C66 93 63 92 60 92C57 92 54 93 51 94Z" },
  { kind: "ellipse", zone: "biceps", cx: 25, cy: 90, rx: 7, ry: 17, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 95, cy: 90, rx: 7, ry: 17, rotate: 8 },
  { kind: "ellipse", zone: "triceps", cx: 30, cy: 93, rx: 5.5, ry: 18, rotate: -6 },
  { kind: "ellipse", zone: "triceps", cx: 90, cy: 93, rx: 5.5, ry: 18, rotate: 6 },
  { kind: "ellipse", zone: "forearms", cx: 27, cy: 130, rx: 5.5, ry: 20, rotate: -5 },
  { kind: "ellipse", zone: "forearms", cx: 93, cy: 130, rx: 5.5, ry: 20, rotate: 5 },
  { kind: "path", zone: "obliques", d: "M46 103C48 102 50 102 52 103L50 140C46 137 44 128 44 115Z" },
  { kind: "path", zone: "obliques", d: "M74 103C72 102 70 102 68 103L70 140C74 137 76 128 76 115Z" },
  { kind: "path", zone: "upperAbs", d: "M54 100C56 99 58 98 60 98C62 98 64 99 66 100L66 118C64 119 62 120 60 120C58 120 56 119 54 118Z" },
  { kind: "path", zone: "lowerAbs", d: "M54 119C56 118 58 117 60 117C62 117 64 118 66 119L65 141C63 142 62 143 60 143C58 143 57 142 55 141Z" },
  { kind: "ellipse", zone: "sideGlutes", cx: 47, cy: 157, rx: 7.5, ry: 10.5, rotate: -18 },
  { kind: "ellipse", zone: "sideGlutes", cx: 73, cy: 157, rx: 7.5, ry: 10.5, rotate: 18 },
  { kind: "ellipse", zone: "quads", cx: 51, cy: 192, rx: 8.5, ry: 28, rotate: -4 },
  { kind: "ellipse", zone: "quads", cx: 69, cy: 192, rx: 8.5, ry: 28, rotate: 4 },
  { kind: "ellipse", zone: "calves", cx: 50, cy: 236, rx: 7.5, ry: 22, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 70, cy: 236, rx: 7.5, ry: 22, rotate: 2 },
];

const BACK_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M36 53C37 48 43 45 47 46C50 47 52 49 52 53L48 68C43 68 39 64 36 53Z" },
  { kind: "path", zone: "rearDelts", d: "M84 53C83 48 77 45 73 46C70 47 68 49 68 53L72 68C77 68 81 64 84 53Z" },
  { kind: "path", zone: "upperBack", d: "M47 54C50 51 55 50 60 50C65 50 70 51 73 54L71 73C67 75 64 76 60 76C56 76 53 75 49 73Z" },
  { kind: "path", zone: "lats", d: "M46 74C48 73 51 73 54 74L52 128C48 126 45 116 44 98Z" },
  { kind: "path", zone: "lats", d: "M74 74C72 73 69 73 66 74L68 128C72 126 75 116 76 98Z" },
  { kind: "path", zone: "midBack", d: "M54 76C56 75 58 74 60 74C62 74 64 75 66 76L66 113C64 114 62 115 60 115C58 115 56 114 54 113Z" },
  { kind: "path", zone: "lowerBack", d: "M53 114C55 113 58 112 60 112C62 112 65 113 67 114L66 142C64 143 62 144 60 144C58 144 56 143 54 142Z" },
  { kind: "ellipse", zone: "triceps", cx: 29, cy: 92, rx: 6, ry: 19, rotate: -5 },
  { kind: "ellipse", zone: "triceps", cx: 91, cy: 92, rx: 6, ry: 19, rotate: 5 },
  { kind: "ellipse", zone: "biceps", cx: 24, cy: 92, rx: 4.5, ry: 14, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 96, cy: 92, rx: 4.5, ry: 14, rotate: 8 },
  { kind: "ellipse", zone: "forearms", cx: 27, cy: 130, rx: 5.5, ry: 20, rotate: -4 },
  { kind: "ellipse", zone: "forearms", cx: 93, cy: 130, rx: 5.5, ry: 20, rotate: 4 },
  { kind: "path", zone: "upperGlutes", d: "M48 145C51 143 56 142 60 142C64 142 69 143 72 145L70 155C67 154 64 153 60 153C56 153 53 154 50 155Z" },
  { kind: "ellipse", zone: "gluteMax", cx: 51, cy: 167, rx: 9.5, ry: 13, rotate: -12 },
  { kind: "ellipse", zone: "gluteMax", cx: 69, cy: 167, rx: 9.5, ry: 13, rotate: 12 },
  { kind: "ellipse", zone: "sideGlutes", cx: 44, cy: 165, rx: 5.5, ry: 10, rotate: -22 },
  { kind: "ellipse", zone: "sideGlutes", cx: 76, cy: 165, rx: 5.5, ry: 10, rotate: 22 },
  { kind: "ellipse", zone: "hamstrings", cx: 51, cy: 201, rx: 8.5, ry: 25, rotate: -3 },
  { kind: "ellipse", zone: "hamstrings", cx: 69, cy: 201, rx: 8.5, ry: 25, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 50, cy: 237, rx: 7.5, ry: 21, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 70, cy: 237, rx: 7.5, ry: 21, rotate: 2 },
];

const FRONT_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M39 53C40 48 45 45 48 46C50 47 52 49 52 52L49 66C45 66 41 63 39 53Z" },
  { kind: "path", zone: "frontDelts", d: "M81 53C80 48 75 45 72 46C70 47 68 49 68 52L71 66C75 66 79 63 81 53Z" },
  { kind: "ellipse", zone: "sideDelts", cx: 35, cy: 61, rx: 6.5, ry: 10.5, rotate: -14 },
  { kind: "ellipse", zone: "sideDelts", cx: 85, cy: 61, rx: 6.5, ry: 10.5, rotate: 14 },
  { kind: "path", zone: "upperChest", d: "M47 58C50 55 55 54 60 54C65 54 70 55 73 58L70 66C66 65 63 64 60 64C57 64 54 65 50 66Z" },
  { kind: "path", zone: "midChest", d: "M47 67C50 65 55 64 60 64C65 64 70 65 73 67L71 77C67 77 64 76 60 76C56 76 53 77 49 77Z" },
  { kind: "path", zone: "lowerChest", d: "M49 78C52 77 56 76 60 76C64 76 68 77 71 78L69 86C66 86 63 85 60 85C57 85 54 86 51 86Z" },
  { kind: "ellipse", zone: "biceps", cx: 26, cy: 91, rx: 6.5, ry: 17, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 94, cy: 91, rx: 6.5, ry: 17, rotate: 8 },
  { kind: "ellipse", zone: "triceps", cx: 31, cy: 94, rx: 5, ry: 18, rotate: -5 },
  { kind: "ellipse", zone: "triceps", cx: 89, cy: 94, rx: 5, ry: 18, rotate: 5 },
  { kind: "ellipse", zone: "forearms", cx: 28, cy: 132, rx: 5, ry: 19, rotate: -5 },
  { kind: "ellipse", zone: "forearms", cx: 92, cy: 132, rx: 5, ry: 19, rotate: 5 },
  { kind: "path", zone: "obliques", d: "M47 99C49 98 51 98 53 99L51 139C47 136 45 127 45 113Z" },
  { kind: "path", zone: "obliques", d: "M73 99C71 98 69 98 67 99L69 139C73 136 75 127 75 113Z" },
  { kind: "path", zone: "upperAbs", d: "M55 97C57 96 58 95 60 95C62 95 63 96 65 97L65 116C63 117 62 118 60 118C58 118 57 117 55 116Z" },
  { kind: "path", zone: "lowerAbs", d: "M55 117C57 116 58 115 60 115C62 115 63 116 65 117L64 140C62 141 61 142 60 142C59 142 58 141 56 140Z" },
  { kind: "ellipse", zone: "sideGlutes", cx: 46, cy: 158, rx: 9, ry: 12.5, rotate: -20 },
  { kind: "ellipse", zone: "sideGlutes", cx: 74, cy: 158, rx: 9, ry: 12.5, rotate: 20 },
  { kind: "ellipse", zone: "quads", cx: 49, cy: 194, rx: 9.5, ry: 27, rotate: -4 },
  { kind: "ellipse", zone: "quads", cx: 71, cy: 194, rx: 9.5, ry: 27, rotate: 4 },
  { kind: "ellipse", zone: "calves", cx: 49, cy: 236, rx: 7.5, ry: 21, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 71, cy: 236, rx: 7.5, ry: 21, rotate: 2 },
];

const BACK_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M39 55C40 49 45 46 48 47C50 48 51 50 51 53L48 67C44 67 41 64 39 55Z" },
  { kind: "path", zone: "rearDelts", d: "M81 55C80 49 75 46 72 47C70 48 69 50 69 53L72 67C76 67 79 64 81 55Z" },
  { kind: "path", zone: "upperBack", d: "M48 55C51 53 55 52 60 52C65 52 69 53 72 55L70 72C66 74 63 75 60 75C57 75 54 74 50 72Z" },
  { kind: "path", zone: "lats", d: "M47 73C49 72 51 72 54 73L52 128C48 126 45 117 45 100Z" },
  { kind: "path", zone: "lats", d: "M73 73C71 72 69 72 66 73L68 128C72 126 75 117 75 100Z" },
  { kind: "path", zone: "midBack", d: "M55 74C57 73 58 72 60 72C62 72 63 73 65 74L65 112C63 113 62 114 60 114C58 114 57 113 55 112Z" },
  { kind: "path", zone: "lowerBack", d: "M54 113C56 112 58 111 60 111C62 111 64 112 66 113L65 142C63 143 62 144 60 144C58 144 57 143 55 142Z" },
  { kind: "ellipse", zone: "triceps", cx: 30, cy: 93, rx: 5.5, ry: 18, rotate: -5 },
  { kind: "ellipse", zone: "triceps", cx: 90, cy: 93, rx: 5.5, ry: 18, rotate: 5 },
  { kind: "ellipse", zone: "biceps", cx: 25, cy: 93, rx: 4.5, ry: 13, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 95, cy: 93, rx: 4.5, ry: 13, rotate: 8 },
  { kind: "ellipse", zone: "forearms", cx: 28, cy: 131, rx: 5, ry: 19, rotate: -4 },
  { kind: "ellipse", zone: "forearms", cx: 92, cy: 131, rx: 5, ry: 19, rotate: 4 },
  { kind: "path", zone: "upperGlutes", d: "M48 145C51 143 56 142 60 142C64 142 69 143 72 145L70 155C66 154 63 153 60 153C57 153 54 154 50 155Z" },
  { kind: "ellipse", zone: "gluteMax", cx: 49, cy: 168, rx: 11.5, ry: 15, rotate: -10 },
  { kind: "ellipse", zone: "gluteMax", cx: 71, cy: 168, rx: 11.5, ry: 15, rotate: 10 },
  { kind: "ellipse", zone: "sideGlutes", cx: 41, cy: 166, rx: 7, ry: 11, rotate: -20 },
  { kind: "ellipse", zone: "sideGlutes", cx: 79, cy: 166, rx: 7, ry: 11, rotate: 20 },
  { kind: "ellipse", zone: "hamstrings", cx: 49, cy: 202, rx: 8.5, ry: 24, rotate: -3 },
  { kind: "ellipse", zone: "hamstrings", cx: 71, cy: 202, rx: 8.5, ry: 24, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 49, cy: 237, rx: 7.5, ry: 21, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 71, cy: 237, rx: 7.5, ry: 21, rotate: 2 },
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
      fill: "rgba(132,136,150,0.045)",
      stroke: "rgba(255,255,255,0.03)",
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
  onClick,
}: {
  shape: ShapeDef;
  style: { fill: string; stroke: string; filter: string };
  selected: boolean;
  onClick?: () => void;
}) {
  const commonProps = {
    fill: style.fill,
    stroke: selected ? "rgba(255,255,255,0.92)" : style.stroke,
    strokeWidth: selected ? 1.7 : 1.1,
    style: { filter: style.filter },
    className: onClick ? "cursor-pointer transition" : undefined,
    onClick,
  };

  if (shape.kind === "ellipse") {
    const transform = shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined;
    return <ellipse {...commonProps} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} transform={transform} />;
  }

  return <path {...commonProps} d={shape.d} />;
}

const BODY_BASES: Record<BodyVariant, Record<BodyView, BodyBaseConfig>> = {
  male: {
    front: {
      href: "/body-map/female-base.svg",
      sourceHeight: 386,
      crop: { x: 128, y: 18, width: 102, height: 322 },
      frame: { x: 14, y: 14, width: 92, height: 224 },
    },
    back: {
      href: "/body-map/female-base.svg",
      sourceHeight: 386,
      crop: { x: 370, y: 18, width: 102, height: 322 },
      frame: { x: 14, y: 14, width: 92, height: 224 },
    },
  },
  female: {
    front: {
      href: "/body-map/male-base.svg",
      sourceHeight: 388,
      crop: { x: 129, y: 20, width: 98, height: 314 },
      frame: { x: 18, y: 14, width: 84, height: 224 },
    },
    back: {
      href: "/body-map/male-base.svg",
      sourceHeight: 388,
      crop: { x: 371, y: 20, width: 102, height: 314 },
      frame: { x: 18, y: 14, width: 84, height: 224 },
    },
  },
};

function BodyBaseArt({ variant, view }: { variant: BodyVariant; view: BodyView }) {
  const base = BODY_BASES[variant][view];

  return (
    <svg
      x={base.frame.x}
      y={base.frame.y}
      width={base.frame.width}
      height={base.frame.height}
      viewBox={`${base.crop.x} ${base.crop.y} ${base.crop.width} ${base.crop.height}`}
    >
      <image
        href={base.href}
        x="0"
        y="0"
        width="600"
        height={base.sourceHeight}
        preserveAspectRatio="none"
        filter="url(#body-base-tone)"
        opacity="0.72"
      />
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

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/7 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-5 py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_center,rgba(110,120,255,0.08),transparent_72%)]" />
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 260" className="h-[312px] w-[144px]" aria-hidden="true">
          <defs>
            <filter id="body-base-tone" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="
                  0 0 0 0 0.92
                  0 0 0 0 0.93
                  0 0 0 0 1
                  0 0 0 0.18 0
                "
              />
            </filter>
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
            return (
              <Shape
                key={`${shape.zone}-${index}`}
                shape={shape}
                style={style}
                selected={selectedZone === shape.zone}
                onClick={onSelectZone ? () => onSelectZone(shape.zone) : undefined}
              />
            );
          })}
        </svg>
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/34">
        <span>{view === "front" ? "Front body" : "Back body"}</span>
        <span>Current week only</span>
      </div>
    </div>
  );
}
