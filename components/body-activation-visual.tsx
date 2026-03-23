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
  { kind: "path", zone: "frontDelts", d: "M34 56C34 49 40 44 46 46C49 47 51 50 51 54L48 70C43 69 38 66 34 56Z" },
  { kind: "path", zone: "frontDelts", d: "M86 56C86 49 80 44 74 46C71 47 69 50 69 54L72 70C77 69 82 66 86 56Z" },
  { kind: "ellipse", zone: "sideDelts", cx: 31, cy: 63, rx: 7.5, ry: 12, rotate: -12 },
  { kind: "ellipse", zone: "sideDelts", cx: 89, cy: 63, rx: 7.5, ry: 12, rotate: 12 },
  { kind: "path", zone: "upperChest", d: "M44 57C49 53 56 51 60 51C64 51 71 53 76 57L72 71C68 68 64 66 60 66C56 66 52 68 48 71Z" },
  { kind: "path", zone: "midChest", d: "M45 73C49 69 54 68 60 68C66 68 71 69 75 73L72 89C68 87 64 86 60 86C56 86 52 87 48 89Z" },
  { kind: "path", zone: "lowerChest", d: "M48 91C51 89 55 88 60 88C65 88 69 89 72 91L69 102C66 101 63 100 60 100C57 100 54 101 51 102Z" },
  { kind: "ellipse", zone: "biceps", cx: 23, cy: 92, rx: 8, ry: 18, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 97, cy: 92, rx: 8, ry: 18, rotate: 8 },
  { kind: "ellipse", zone: "triceps", cx: 29, cy: 95, rx: 6.5, ry: 19, rotate: -4 },
  { kind: "ellipse", zone: "triceps", cx: 91, cy: 95, rx: 6.5, ry: 19, rotate: 4 },
  { kind: "ellipse", zone: "forearms", cx: 25, cy: 131, rx: 6.5, ry: 20, rotate: -4 },
  { kind: "ellipse", zone: "forearms", cx: 95, cy: 131, rx: 6.5, ry: 20, rotate: 4 },
  { kind: "path", zone: "obliques", d: "M43 108C46 106 49 105 52 106L50 144C45 140 42 131 41 120Z" },
  { kind: "path", zone: "obliques", d: "M77 108C74 106 71 105 68 106L70 144C75 140 78 131 79 120Z" },
  { kind: "path", zone: "upperAbs", d: "M53 107C55 105 58 104 60 104C62 104 65 105 67 107L67 126C65 127 63 128 60 128C57 128 55 127 53 126Z" },
  { kind: "path", zone: "lowerAbs", d: "M53 128C55 127 58 126 60 126C62 126 65 127 67 128L66 149C64 150 62 151 60 151C58 151 56 150 54 149Z" },
  { kind: "ellipse", zone: "sideGlutes", cx: 45, cy: 161, rx: 8, ry: 12, rotate: -18 },
  { kind: "ellipse", zone: "sideGlutes", cx: 75, cy: 161, rx: 8, ry: 12, rotate: 18 },
  { kind: "ellipse", zone: "quads", cx: 49, cy: 193, rx: 10, ry: 29, rotate: -3 },
  { kind: "ellipse", zone: "quads", cx: 71, cy: 193, rx: 10, ry: 29, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 48, cy: 237, rx: 8.5, ry: 22, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 72, cy: 237, rx: 8.5, ry: 22, rotate: 2 },
];

const BACK_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M34 56C35 49 40 45 46 46C49 47 51 50 51 54L48 70C43 69 38 66 34 56Z" },
  { kind: "path", zone: "rearDelts", d: "M86 56C85 49 80 45 74 46C71 47 69 50 69 54L72 70C77 69 82 66 86 56Z" },
  { kind: "path", zone: "upperBack", d: "M45 55C49 52 54 50 60 50C66 50 71 52 75 55L72 76C68 78 64 79 60 79C56 79 52 78 48 76Z" },
  { kind: "path", zone: "lats", d: "M43 78C47 76 50 76 53 77L50 131C45 128 41 117 40 98Z" },
  { kind: "path", zone: "lats", d: "M77 78C73 76 70 76 67 77L70 131C75 128 79 117 80 98Z" },
  { kind: "path", zone: "midBack", d: "M53 80C55 79 58 78 60 78C62 78 65 79 67 80L67 118C65 120 63 121 60 121C57 121 55 120 53 118Z" },
  { kind: "path", zone: "lowerBack", d: "M52 120C55 118 58 117 60 117C62 117 65 118 68 120L67 146C64 147 62 148 60 148C58 148 56 147 53 146Z" },
  { kind: "ellipse", zone: "triceps", cx: 28, cy: 93, rx: 7, ry: 19, rotate: -5 },
  { kind: "ellipse", zone: "triceps", cx: 92, cy: 93, rx: 7, ry: 19, rotate: 5 },
  { kind: "ellipse", zone: "biceps", cx: 22.5, cy: 93, rx: 6, ry: 15, rotate: -8 },
  { kind: "ellipse", zone: "biceps", cx: 97.5, cy: 93, rx: 6, ry: 15, rotate: 8 },
  { kind: "ellipse", zone: "forearms", cx: 25, cy: 131, rx: 6.5, ry: 20, rotate: -4 },
  { kind: "ellipse", zone: "forearms", cx: 95, cy: 131, rx: 6.5, ry: 20, rotate: 4 },
  { kind: "path", zone: "upperGlutes", d: "M46 148C50 145 55 144 60 144C65 144 70 145 74 148L71 159C67 158 64 157 60 157C56 157 53 158 49 159Z" },
  { kind: "ellipse", zone: "gluteMax", cx: 50, cy: 170, rx: 11, ry: 14, rotate: -12 },
  { kind: "ellipse", zone: "gluteMax", cx: 70, cy: 170, rx: 11, ry: 14, rotate: 12 },
  { kind: "ellipse", zone: "sideGlutes", cx: 42, cy: 167, rx: 6, ry: 11, rotate: -22 },
  { kind: "ellipse", zone: "sideGlutes", cx: 78, cy: 167, rx: 6, ry: 11, rotate: 22 },
  { kind: "ellipse", zone: "hamstrings", cx: 49, cy: 201, rx: 9.5, ry: 24, rotate: -3 },
  { kind: "ellipse", zone: "hamstrings", cx: 71, cy: 201, rx: 9.5, ry: 24, rotate: 3 },
  { kind: "ellipse", zone: "calves", cx: 48, cy: 237, rx: 8.5, ry: 21, rotate: -2 },
  { kind: "ellipse", zone: "calves", cx: 72, cy: 237, rx: 8.5, ry: 21, rotate: 2 },
];

const FRONT_ZONES_FEMALE: ShapeDef[] = [
  ...FRONT_ZONES_MALE.map((shape) => {
    if (shape.kind === "path") {
      return {
        ...shape,
        d: shape.d
          .replace(/45 144/g, "44 146")
          .replace(/75 161/g, "76 164")
          .replace(/49 193/g, "50 196")
          .replace(/71 193/g, "70 196"),
      };
    }
    if (shape.zone === "sideGlutes") {
      return { ...shape, cx: shape.cx < 60 ? 43 : 77, cy: 166, rx: 9, ry: 13 };
    }
    if (shape.zone === "quads") {
      return { ...shape, cy: 197, rx: 9, ry: 28 };
    }
    return shape;
  }),
];

const BACK_ZONES_FEMALE: ShapeDef[] = [
  ...BACK_ZONES_MALE.map((shape) => {
    if (shape.zone === "gluteMax" && shape.kind === "ellipse") {
      return { ...shape, cx: shape.cx < 60 ? 49 : 71, cy: 171, rx: 12, ry: 15 };
    }
    if (shape.zone === "sideGlutes" && shape.kind === "ellipse") {
      return { ...shape, cx: shape.cx < 60 ? 40 : 80, cy: 168, rx: 7, ry: 12 };
    }
    if (shape.zone === "hamstrings" && shape.kind === "ellipse") {
      return { ...shape, cy: 203, rx: 9, ry: 25 };
    }
    return shape;
  }),
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
      fill: "rgba(122,122,136,0.12)",
      stroke: "rgba(255,255,255,0.055)",
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
      crop: { x: 122, y: 18, width: 112, height: 322 },
      frame: { x: 14, y: 14, width: 92, height: 224 },
    },
    back: {
      href: "/body-map/female-base.svg",
      sourceHeight: 386,
      crop: { x: 365, y: 18, width: 112, height: 322 },
      frame: { x: 14, y: 14, width: 92, height: 224 },
    },
  },
  female: {
    front: {
      href: "/body-map/male-base.svg",
      sourceHeight: 388,
      crop: { x: 118, y: 20, width: 122, height: 314 },
      frame: { x: 17, y: 14, width: 86, height: 224 },
    },
    back: {
      href: "/body-map/male-base.svg",
      sourceHeight: 388,
      crop: { x: 362, y: 20, width: 122, height: 314 },
      frame: { x: 17, y: 14, width: 86, height: 224 },
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
                  0 0 0 0.28 0
                "
              />
            </filter>
          </defs>
          <path d="M60 31L60 246" stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" strokeDasharray="3 5" />
          <BodyBaseArt variant={variant} view={view} />
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
