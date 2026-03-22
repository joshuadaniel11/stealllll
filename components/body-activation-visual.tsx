import type { TrainingLoadMetric, TrainingLoadMuscle } from "@/lib/training-load";

const ZONE_BY_MUSCLE: Record<TrainingLoadMuscle, string[]> = {
  chest: ["front-chest-left", "front-chest-right"],
  shoulders: ["front-shoulder-left", "front-shoulder-right", "back-shoulder-left", "back-shoulder-right"],
  arms: [
    "front-arm-left",
    "front-arm-right",
    "front-forearm-left",
    "front-forearm-right",
    "back-arm-left",
    "back-arm-right",
    "back-forearm-left",
    "back-forearm-right",
  ],
  back: ["back-upper", "back-mid", "back-lat-left", "back-lat-right"],
  abs: ["front-abs-upper", "front-abs-lower"],
  glutes: ["back-glute-left", "back-glute-right"],
  legs: [
    "front-thigh-left",
    "front-thigh-right",
    "front-calf-left",
    "front-calf-right",
    "back-ham-left",
    "back-ham-right",
    "back-calf-left",
    "back-calf-right",
  ],
};

function getMetricMap(metrics: TrainingLoadMetric[]) {
  return metrics.reduce<Record<TrainingLoadMuscle, TrainingLoadMetric>>((accumulator, metric) => {
    accumulator[metric.id] = metric;
    return accumulator;
  }, {} as Record<TrainingLoadMuscle, TrainingLoadMetric>);
}

function getZoneStyle(zoneId: string, metricsByMuscle: Record<TrainingLoadMuscle, TrainingLoadMetric>) {
  const matched = (Object.entries(ZONE_BY_MUSCLE) as Array<[TrainingLoadMuscle, string[]]>).find(([, zones]) =>
    zones.includes(zoneId),
  )?.[0];

  if (!matched) {
    return { fill: "rgba(130,130,140,0.22)", stroke: "rgba(255,255,255,0.08)" };
  }

  const metric = metricsByMuscle[matched];
  const alpha = Math.max(0.16, metric.percentage / 100);
  const strokeAlpha = metric.overload ? 0.82 : 0.5 + metric.percentage / 300;

  return {
    fill: metric.percentage > 0 ? `${metric.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}` : "rgba(130,130,140,0.18)",
    stroke: metric.percentage > 0 ? `${metric.color}${Math.round(strokeAlpha * 255).toString(16).padStart(2, "0")}` : "rgba(255,255,255,0.08)",
  };
}

function BodyFigure({
  metricsByMuscle,
  side,
}: {
  metricsByMuscle: Record<TrainingLoadMuscle, TrainingLoadMetric>;
  side: "front" | "back";
}) {
  const zone = (id: string, d: string) => {
    const style = getZoneStyle(id, metricsByMuscle);
    return <path d={d} fill={style.fill} stroke={style.stroke} strokeWidth="1.6" />;
  };

  const shell = "rgba(95,95,110,0.24)";
  const shellStroke = "rgba(255,255,255,0.08)";

  return (
    <svg viewBox="0 0 120 210" className="h-[200px] w-[104px]" aria-hidden="true">
      <circle cx="60" cy="18" r="11" fill={shell} stroke={shellStroke} />
      <path d="M46 34C48 28 72 28 74 34L80 58L74 83L70 132L50 132L46 83L40 58Z" fill={shell} stroke={shellStroke} />
      <path d="M35 46L19 66L22 80L33 72L41 56Z" fill={shell} stroke={shellStroke} />
      <path d="M85 46L101 66L98 80L87 72L79 56Z" fill={shell} stroke={shellStroke} />
      <path d="M28 80L34 72L39 128L31 170L22 170L24 125Z" fill={shell} stroke={shellStroke} />
      <path d="M92 80L86 72L81 128L89 170L98 170L96 125Z" fill={shell} stroke={shellStroke} />
      <path d="M50 132L45 198L35 198L38 154L42 132Z" fill={shell} stroke={shellStroke} />
      <path d="M70 132L75 198L85 198L82 154L78 132Z" fill={shell} stroke={shellStroke} />

      {side === "front" ? (
        <>
          {zone("front-shoulder-left", "M35 45C40 40 47 39 50 44L47 61C42 60 37 57 33 52Z")}
          {zone("front-shoulder-right", "M85 45C80 40 73 39 70 44L73 61C78 60 83 57 87 52Z")}
          {zone("front-chest-left", "M47 48C53 45 58 45 60 48L59 69L47 67L43 55Z")}
          {zone("front-chest-right", "M73 48C67 45 62 45 60 48L61 69L73 67L77 55Z")}
          {zone("front-arm-left", "M28 80L34 72L39 128L31 130L24 118L24 92Z")}
          {zone("front-arm-right", "M92 80L86 72L81 128L89 130L96 118L96 92Z")}
          {zone("front-forearm-left", "M24 118L31 130L28 170L22 170L20 142Z")}
          {zone("front-forearm-right", "M96 118L89 130L92 170L98 170L100 142Z")}
          {zone("front-abs-upper", "M52 76L68 76L70 106L50 106Z")}
          {zone("front-abs-lower", "M50 108L70 108L72 132L48 132Z")}
          {zone("front-thigh-left", "M42 132L50 132L47 182L37 182L38 154Z")}
          {zone("front-thigh-right", "M70 132L78 132L82 154L83 182L73 182Z")}
          {zone("front-calf-left", "M37 182L47 182L45 198L35 198Z")}
          {zone("front-calf-right", "M73 182L83 182L85 198L75 198Z")}
        </>
      ) : (
        <>
          {zone("back-shoulder-left", "M35 45C40 40 47 39 50 44L46 60L36 58L33 52Z")}
          {zone("back-shoulder-right", "M85 45C80 40 73 39 70 44L74 60L84 58L87 52Z")}
          {zone("back-upper", "M47 48L73 48L70 74L50 74Z")}
          {zone("back-mid", "M50 76L70 76L72 120L48 120Z")}
          {zone("back-lat-left", "M44 60L50 76L48 120L39 116L36 86Z")}
          {zone("back-lat-right", "M76 60L70 76L72 120L81 116L84 86Z")}
          {zone("back-arm-left", "M28 80L34 72L39 128L31 130L24 118L24 92Z")}
          {zone("back-arm-right", "M92 80L86 72L81 128L89 130L96 118L96 92Z")}
          {zone("back-forearm-left", "M24 118L31 130L28 170L22 170L20 142Z")}
          {zone("back-forearm-right", "M96 118L89 130L92 170L98 170L100 142Z")}
          {zone("back-glute-left", "M48 122L60 122L58 144L44 144Z")}
          {zone("back-glute-right", "M60 122L72 122L76 144L62 144Z")}
          {zone("back-ham-left", "M42 144L58 144L54 182L41 182Z")}
          {zone("back-ham-right", "M62 144L78 144L79 182L66 182Z")}
          {zone("back-calf-left", "M41 182L54 182L50 198L38 198Z")}
          {zone("back-calf-right", "M66 182L79 182L82 198L70 198Z")}
        </>
      )}
    </svg>
  );
}

export function BodyActivationVisual({ metrics }: { metrics: TrainingLoadMetric[] }) {
  const metricsByMuscle = getMetricMap(metrics);

  return (
    <div className="flex items-center justify-center gap-3 rounded-[24px] bg-[var(--card-strong)]/68 px-3 py-4">
      <div className="text-center">
        <BodyFigure metricsByMuscle={metricsByMuscle} side="front" />
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/40">Front</p>
      </div>
      <div className="text-center">
        <BodyFigure metricsByMuscle={metricsByMuscle} side="back" />
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/40">Back</p>
      </div>
    </div>
  );
}
