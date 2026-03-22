import type { UserId } from "@/lib/types";
import type { TrainingLoadMetric, TrainingLoadZone } from "@/lib/training-load";

const FRONT_ZONES_BY_ID: Array<[TrainingLoadZone, string[]]> = [
  ["upperChest", ["front-upper-chest-left", "front-upper-chest-right"]],
  ["midChest", ["front-mid-chest-left", "front-mid-chest-right"]],
  ["frontDelts", ["front-front-delt-left", "front-front-delt-right"]],
  ["sideDelts", ["front-side-delt-left", "front-side-delt-right"]],
  ["biceps", ["front-bicep-left", "front-bicep-right"]],
  ["triceps", ["front-tricep-left", "front-tricep-right"]],
  ["abs", ["front-abs"]],
  ["obliques", ["front-oblique-left", "front-oblique-right"]],
  ["quads", ["front-quad-left", "front-quad-right"]],
  ["calves", ["front-calf-left", "front-calf-right"]],
];

const BACK_ZONES_BY_ID: Array<[TrainingLoadZone, string[]]> = [
  ["rearDelts", ["back-rear-delt-left", "back-rear-delt-right"]],
  ["lats", ["back-lat-left", "back-lat-right"]],
  ["upperBack", ["back-upper"]],
  ["lowerBack", ["back-lower"]],
  ["upperGlutes", ["back-upper-glute-left", "back-upper-glute-right"]],
  ["gluteMax", ["back-glute-left", "back-glute-right"]],
  ["hamstrings", ["back-ham-left", "back-ham-right"]],
  ["calves", ["back-calf-left", "back-calf-right"]],
  ["triceps", ["back-tricep-left", "back-tricep-right"]],
  ["biceps", ["back-bicep-left", "back-bicep-right"]],
];

function getMetricMap(metrics: TrainingLoadMetric[]) {
  return metrics.reduce<Record<TrainingLoadZone, TrainingLoadMetric>>((accumulator, metric) => {
    accumulator[metric.id] = metric;
    return accumulator;
  }, {} as Record<TrainingLoadZone, TrainingLoadMetric>);
}

function getZoneMetric(
  zoneId: string,
  metricsByZone: Record<TrainingLoadZone, TrainingLoadMetric>,
  view: "front" | "back",
) {
  const match = (view === "front" ? FRONT_ZONES_BY_ID : BACK_ZONES_BY_ID).find(([, ids]) => ids.includes(zoneId))?.[0];
  return metricsByZone[match ?? "abs"];
}

function getZoneStyle(
  zoneId: string,
  metricsByZone: Record<TrainingLoadZone, TrainingLoadMetric>,
  view: "front" | "back",
) {
  const metric = getZoneMetric(zoneId, metricsByZone, view);

  if (!metric || metric.percentage <= 0) {
    return {
      fill: "rgba(137,137,150,0.16)",
      stroke: "rgba(255,255,255,0.06)",
      shadow: "none",
    };
  }

  const glow = metric.overload ? 16 : 10;
  const alpha = Math.max(0.42, metric.percentage / 100);

  return {
    fill: `${metric.color}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`,
    stroke: `${metric.color}${Math.round((metric.overload ? 0.95 : 0.76) * 255)
      .toString(16)
      .padStart(2, "0")}`,
    shadow: `drop-shadow(0 0 ${glow}px ${metric.color}${metric.overload ? "cc" : "7a"})`,
  };
}

function renderZone(
  zoneId: string,
  d: string,
  metricsByZone: Record<TrainingLoadZone, TrainingLoadMetric>,
  view: "front" | "back",
) {
  const style = getZoneStyle(zoneId, metricsByZone, view);
  return (
    <path
      d={d}
      fill={style.fill}
      stroke={style.stroke}
      strokeWidth="1.3"
      style={{ filter: style.shadow }}
    />
  );
}

function Figure({
  metricsByZone,
  variant,
  view,
}: {
  metricsByZone: Record<TrainingLoadZone, TrainingLoadMetric>;
  variant: "male" | "female";
  view: "front" | "back";
}) {
  const shell = "rgba(102,102,114,0.18)";
  const shellStroke = "rgba(255,255,255,0.07)";
  const isFront = view === "front";

  if (variant === "female") {
    return (
      <svg viewBox="0 0 120 220" className="h-[260px] w-[136px]" aria-hidden="true">
        <circle cx="60" cy="18" r="11" fill={shell} stroke={shellStroke} />
        <path d="M50 32C53 28 67 28 70 32L76 54L72 86L77 118L68 142L52 142L43 118L48 86L44 54Z" fill={shell} stroke={shellStroke} />
        <path d="M41 46L25 66L30 82L42 72L47 56Z" fill={shell} stroke={shellStroke} />
        <path d="M79 46L95 66L90 82L78 72L73 56Z" fill={shell} stroke={shellStroke} />
        <path d="M32 82L40 74L44 130L37 170L28 170L26 128Z" fill={shell} stroke={shellStroke} />
        <path d="M88 82L80 74L76 130L83 170L92 170L94 128Z" fill={shell} stroke={shellStroke} />
        <path d="M52 142L48 203L38 203L40 160L44 142Z" fill={shell} stroke={shellStroke} />
        <path d="M68 142L72 203L82 203L80 160L76 142Z" fill={shell} stroke={shellStroke} />

        {isFront ? (
          <>
            {renderZone("front-front-delt-left", "M41 46C45 41 50 40 53 43L50 60L42 58L39 51Z", metricsByZone, view)}
            {renderZone("front-front-delt-right", "M79 46C75 41 70 40 67 43L70 60L78 58L81 51Z", metricsByZone, view)}
            {renderZone("front-side-delt-left", "M38 49L42 58L36 65L31 59Z", metricsByZone, view)}
            {renderZone("front-side-delt-right", "M82 49L78 58L84 65L89 59Z", metricsByZone, view)}
            {renderZone("front-upper-chest-left", "M49 44L60 44L59 58L47 58L45 50Z", metricsByZone, view)}
            {renderZone("front-upper-chest-right", "M71 44L60 44L61 58L73 58L75 50Z", metricsByZone, view)}
            {renderZone("front-mid-chest-left", "M47 60L59 60L58 78L46 76Z", metricsByZone, view)}
            {renderZone("front-mid-chest-right", "M73 60L61 60L62 78L74 76Z", metricsByZone, view)}
            {renderZone("front-bicep-left", "M30 82L40 74L43 122L36 124L30 114Z", metricsByZone, view)}
            {renderZone("front-bicep-right", "M90 82L80 74L77 122L84 124L90 114Z", metricsByZone, view)}
            {renderZone("front-tricep-left", "M33 86L39 82L41 126L35 128L30 116Z", metricsByZone, view)}
            {renderZone("front-tricep-right", "M87 86L81 82L79 126L85 128L90 116Z", metricsByZone, view)}
            {renderZone("front-abs", "M52 84L68 84L70 122L50 122Z", metricsByZone, view)}
            {renderZone("front-oblique-left", "M46 84L52 84L50 122L44 116L42 98Z", metricsByZone, view)}
            {renderZone("front-oblique-right", "M74 84L68 84L70 122L76 116L78 98Z", metricsByZone, view)}
            {renderZone("front-quad-left", "M44 142L56 142L53 188L41 188Z", metricsByZone, view)}
            {renderZone("front-quad-right", "M64 142L76 142L79 188L67 188Z", metricsByZone, view)}
            {renderZone("front-calf-left", "M41 188L53 188L50 203L39 203Z", metricsByZone, view)}
            {renderZone("front-calf-right", "M67 188L79 188L82 203L71 203Z", metricsByZone, view)}
          </>
        ) : (
          <>
            {renderZone("back-rear-delt-left", "M41 46C45 41 50 40 53 43L49 59L42 58L39 51Z", metricsByZone, view)}
            {renderZone("back-rear-delt-right", "M79 46C75 41 70 40 67 43L71 59L78 58L81 51Z", metricsByZone, view)}
            {renderZone("back-upper", "M50 44L70 44L68 66L52 66Z", metricsByZone, view)}
            {renderZone("back-lat-left", "M45 60L52 68L50 118L42 114L39 88Z", metricsByZone, view)}
            {renderZone("back-lat-right", "M75 60L68 68L70 118L78 114L81 88Z", metricsByZone, view)}
            {renderZone("back-lower", "M52 92L68 92L69 126L51 126Z", metricsByZone, view)}
            {renderZone("back-bicep-left", "M31 82L39 74L42 120L35 122L31 112Z", metricsByZone, view)}
            {renderZone("back-bicep-right", "M89 82L81 74L78 120L85 122L89 112Z", metricsByZone, view)}
            {renderZone("back-tricep-left", "M35 86L40 82L43 126L37 128L33 114Z", metricsByZone, view)}
            {renderZone("back-tricep-right", "M85 86L80 82L77 126L83 128L87 114Z", metricsByZone, view)}
            {renderZone("back-upper-glute-left", "M47 124L59 124L57 136L45 136Z", metricsByZone, view)}
            {renderZone("back-upper-glute-right", "M61 124L73 124L75 136L63 136Z", metricsByZone, view)}
            {renderZone("back-glute-left", "M45 136L59 136L56 154L44 154Z", metricsByZone, view)}
            {renderZone("back-glute-right", "M61 136L75 136L76 154L64 154Z", metricsByZone, view)}
            {renderZone("back-ham-left", "M44 154L56 154L53 189L41 189Z", metricsByZone, view)}
            {renderZone("back-ham-right", "M64 154L76 154L79 189L67 189Z", metricsByZone, view)}
            {renderZone("back-calf-left", "M41 189L53 189L50 203L39 203Z", metricsByZone, view)}
            {renderZone("back-calf-right", "M67 189L79 189L82 203L71 203Z", metricsByZone, view)}
          </>
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 220" className="h-[260px] w-[136px]" aria-hidden="true">
      <circle cx="60" cy="18" r="11" fill={shell} stroke={shellStroke} />
      <path d="M46 32C49 28 71 28 74 32L81 56L76 88L72 132L48 132L44 88L39 56Z" fill={shell} stroke={shellStroke} />
      <path d="M36 44L18 64L22 80L35 72L42 56Z" fill={shell} stroke={shellStroke} />
      <path d="M84 44L102 64L98 80L85 72L78 56Z" fill={shell} stroke={shellStroke} />
      <path d="M27 80L35 72L40 128L33 170L23 170L22 124Z" fill={shell} stroke={shellStroke} />
      <path d="M93 80L85 72L80 128L87 170L97 170L98 124Z" fill={shell} stroke={shellStroke} />
      <path d="M48 132L44 203L34 203L37 154L41 132Z" fill={shell} stroke={shellStroke} />
      <path d="M72 132L76 203L86 203L83 154L79 132Z" fill={shell} stroke={shellStroke} />

      {isFront ? (
        <>
          {renderZone("front-front-delt-left", "M37 45C42 40 48 39 52 43L48 61L39 59L35 51Z", metricsByZone, view)}
          {renderZone("front-front-delt-right", "M83 45C78 40 72 39 68 43L72 61L81 59L85 51Z", metricsByZone, view)}
          {renderZone("front-side-delt-left", "M34 49L39 59L32 66L26 58Z", metricsByZone, view)}
          {renderZone("front-side-delt-right", "M86 49L81 59L88 66L94 58Z", metricsByZone, view)}
          {renderZone("front-upper-chest-left", "M47 44L60 44L59 60L45 60L43 50Z", metricsByZone, view)}
          {renderZone("front-upper-chest-right", "M73 44L60 44L61 60L75 60L77 50Z", metricsByZone, view)}
          {renderZone("front-mid-chest-left", "M45 62L59 62L58 82L44 80Z", metricsByZone, view)}
          {renderZone("front-mid-chest-right", "M75 62L61 62L62 82L76 80Z", metricsByZone, view)}
          {renderZone("front-bicep-left", "M26 80L35 72L39 124L31 126L25 115Z", metricsByZone, view)}
          {renderZone("front-bicep-right", "M94 80L85 72L81 124L89 126L95 115Z", metricsByZone, view)}
          {renderZone("front-tricep-left", "M30 84L36 80L38 128L32 130L26 117Z", metricsByZone, view)}
          {renderZone("front-tricep-right", "M90 84L84 80L82 128L88 130L94 117Z", metricsByZone, view)}
          {renderZone("front-abs", "M51 84L69 84L70 126L50 126Z", metricsByZone, view)}
          {renderZone("front-oblique-left", "M45 84L51 84L50 126L43 118L41 96Z", metricsByZone, view)}
          {renderZone("front-oblique-right", "M75 84L69 84L70 126L77 118L79 96Z", metricsByZone, view)}
          {renderZone("front-quad-left", "M41 132L54 132L51 188L38 188Z", metricsByZone, view)}
          {renderZone("front-quad-right", "M66 132L79 132L82 188L69 188Z", metricsByZone, view)}
          {renderZone("front-calf-left", "M38 188L51 188L48 203L36 203Z", metricsByZone, view)}
          {renderZone("front-calf-right", "M69 188L82 188L85 203L73 203Z", metricsByZone, view)}
        </>
      ) : (
        <>
          {renderZone("back-rear-delt-left", "M37 45C42 40 48 39 52 43L48 60L39 59L35 51Z", metricsByZone, view)}
          {renderZone("back-rear-delt-right", "M83 45C78 40 72 39 68 43L72 60L81 59L85 51Z", metricsByZone, view)}
          {renderZone("back-upper", "M48 44L72 44L70 70L50 70Z", metricsByZone, view)}
          {renderZone("back-lat-left", "M44 60L50 70L48 122L38 116L35 86Z", metricsByZone, view)}
          {renderZone("back-lat-right", "M76 60L70 70L72 122L82 116L85 86Z", metricsByZone, view)}
          {renderZone("back-lower", "M51 94L69 94L70 128L50 128Z", metricsByZone, view)}
          {renderZone("back-bicep-left", "M27 80L35 72L39 122L31 124L25 114Z", metricsByZone, view)}
          {renderZone("back-bicep-right", "M93 80L85 72L81 122L89 124L95 114Z", metricsByZone, view)}
          {renderZone("back-tricep-left", "M31 84L36 80L39 128L33 130L27 116Z", metricsByZone, view)}
          {renderZone("back-tricep-right", "M89 84L84 80L81 128L87 130L93 116Z", metricsByZone, view)}
          {renderZone("back-upper-glute-left", "M47 122L60 122L58 136L45 136Z", metricsByZone, view)}
          {renderZone("back-upper-glute-right", "M60 122L73 122L75 136L62 136Z", metricsByZone, view)}
          {renderZone("back-glute-left", "M45 136L60 136L57 154L43 154Z", metricsByZone, view)}
          {renderZone("back-glute-right", "M60 136L75 136L77 154L63 154Z", metricsByZone, view)}
          {renderZone("back-ham-left", "M41 154L56 154L53 189L39 189Z", metricsByZone, view)}
          {renderZone("back-ham-right", "M64 154L79 154L82 189L68 189Z", metricsByZone, view)}
          {renderZone("back-calf-left", "M39 189L53 189L50 203L36 203Z", metricsByZone, view)}
          {renderZone("back-calf-right", "M68 189L82 189L85 203L71 203Z", metricsByZone, view)}
        </>
      )}
    </svg>
  );
}

function IntensityLegend() {
  return (
    <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.16em] text-white/34">
      <span>Low</span>
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-white/14" />
        <span className="h-2 w-2 rounded-full bg-white/24" />
        <span className="h-2 w-2 rounded-full bg-white/50" />
      </div>
      <span>High</span>
    </div>
  );
}

export function BodyActivationVisual({
  metrics,
  userId,
  view,
}: {
  metrics: TrainingLoadMetric[];
  userId: UserId;
  view: "front" | "back";
}) {
  const metricsByZone = getMetricMap(metrics);
  const variant = userId === "natasha" ? "female" : "male";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_center,rgba(121,109,255,0.18),transparent_68%)]" />
      <div className="relative flex items-center justify-center">
        <Figure metricsByZone={metricsByZone} variant={variant} view={view} />
      </div>
      <div className="relative mt-2 space-y-2">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-white/42">
          {view === "front" ? "Front body" : "Back body"}
        </p>
        <IntensityLegend />
      </div>
    </div>
  );
}
