import type { UserId } from "@/lib/types";
import type { TrainingLoadMetric, TrainingLoadZone } from "@/lib/training-load";

type BodyView = "front" | "back";
type BodyVariant = "male" | "female";

type PathShape = {
  kind: "path";
  zone: TrainingLoadZone;
  d: string;
};

type ShapeDef = PathShape;

const SECONDARY_PHONE_ZONES = new Set<TrainingLoadZone>(["biceps", "triceps", "forearms", "calves"]);

const FRONT_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M39 56C42 49 48 47 52 50L50 67C45 67 40 63 39 56Z" },
  { kind: "path", zone: "frontDelts", d: "M81 56C78 49 72 47 68 50L70 67C75 67 80 63 81 56Z" },
  { kind: "path", zone: "sideDelts", d: "M34 61C36 54 41 51 45 53L44 77C38 77 34 70 34 61Z" },
  { kind: "path", zone: "sideDelts", d: "M86 61C84 54 79 51 75 53L76 77C82 77 86 70 86 61Z" },
  { kind: "path", zone: "upperChest", d: "M47 58C51 54 55 52 60 52C65 52 69 54 73 58L69 69C65 67 63 66 60 66C57 66 55 67 51 69Z" },
  { kind: "path", zone: "midChest", d: "M49 70C52 67 56 66 60 66C64 66 68 67 71 70L69 81C66 81 63 80 60 80C57 80 54 81 51 81Z" },
  { kind: "path", zone: "midChest", d: "M51 82C54 80 57 79 60 79C63 79 66 80 69 82L67 91C64 91 62 90 60 90C58 90 56 91 53 91Z" },
  { kind: "path", zone: "biceps", d: "M27 83C30 80 34 80 36 84L36 112C31 112 27 103 27 92Z" },
  { kind: "path", zone: "biceps", d: "M93 83C90 80 86 80 84 84L84 112C89 112 93 103 93 92Z" },
  { kind: "path", zone: "triceps", d: "M34 80C38 79 41 82 41 88L40 118C35 117 32 108 32 96Z" },
  { kind: "path", zone: "triceps", d: "M86 80C82 79 79 82 79 88L80 118C85 117 88 108 88 96Z" },
  { kind: "path", zone: "forearms", d: "M27 118C31 116 34 119 34 126L33 150C28 149 25 141 25 130Z" },
  { kind: "path", zone: "forearms", d: "M93 118C89 116 86 119 86 126L87 150C92 149 95 141 95 130Z" },
  { kind: "path", zone: "obliques", d: "M47 100C50 99 52 100 53 104L51 139C47 135 45 124 45 111Z" },
  { kind: "path", zone: "obliques", d: "M73 100C70 99 68 100 67 104L69 139C73 135 75 124 75 111Z" },
  { kind: "path", zone: "upperAbs", d: "M55 99C57 97 58 96 60 96C62 96 63 97 65 99L65 118C63 120 62 121 60 121C58 121 57 120 55 118Z" },
  { kind: "path", zone: "lowerAbs", d: "M55 119C57 117 58 116 60 116C62 116 63 117 65 119L64 140C62 142 61 143 60 143C59 143 58 142 56 140Z" },
  { kind: "path", zone: "sideGlutes", d: "M44 149C49 146 53 148 54 154L49 168C44 167 41 160 41 154Z" },
  { kind: "path", zone: "sideGlutes", d: "M76 149C71 146 67 148 66 154L71 168C76 167 79 160 79 154Z" },
  { kind: "path", zone: "hipFlexors", d: "M52 146C55 144 58 144 60 146L59 163C56 163 53 158 52 151Z" },
  { kind: "path", zone: "hipFlexors", d: "M68 146C65 144 62 144 60 146L61 163C64 163 67 158 68 151Z" },
  { kind: "path", zone: "adductors", d: "M55 171C58 170 60 171 60 177L59 214C56 214 54 202 54 188Z" },
  { kind: "path", zone: "adductors", d: "M65 171C62 170 60 171 60 177L61 214C64 214 66 202 66 188Z" },
  { kind: "path", zone: "quads", d: "M47 170C53 168 58 171 58 180L56 220C49 219 45 205 45 187Z" },
  { kind: "path", zone: "quads", d: "M73 170C67 168 62 171 62 180L64 220C71 219 75 205 75 187Z" },
  { kind: "path", zone: "calves", d: "M48 223C52 221 55 223 55 230L53 250C49 250 46 242 46 233Z" },
  { kind: "path", zone: "calves", d: "M72 223C68 221 65 223 65 230L67 250C71 250 74 242 74 233Z" },
];

const BACK_ZONES_MALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M39 56C42 49 48 47 52 50L49 67C44 67 40 63 39 56Z" },
  { kind: "path", zone: "rearDelts", d: "M81 56C78 49 72 47 68 50L71 67C76 67 80 63 81 56Z" },
  { kind: "path", zone: "upperTraps", d: "M47 55C51 52 55 50 60 50C65 50 69 52 73 55L69 74C65 76 63 77 60 77C57 77 55 76 51 74Z" },
  { kind: "path", zone: "lats", d: "M46 74C49 73 52 74 53 78L51 130C47 126 44 116 44 97Z" },
  { kind: "path", zone: "lats", d: "M74 74C71 73 68 74 67 78L69 130C73 126 76 116 76 97Z" },
  { kind: "path", zone: "midBack", d: "M54 77C56 75 58 74 60 74C62 74 64 75 66 77L66 114C64 116 62 117 60 117C58 117 56 116 54 114Z" },
  { kind: "path", zone: "lowerBack", d: "M54 115C56 113 58 112 60 112C62 112 64 113 66 115L65 142C63 144 62 145 60 145C58 145 57 144 55 142Z" },
  { kind: "path", zone: "triceps", d: "M32 80C37 79 40 82 40 89L39 119C34 118 31 108 31 97Z" },
  { kind: "path", zone: "triceps", d: "M88 80C83 79 80 82 80 89L81 119C86 118 89 108 89 97Z" },
  { kind: "path", zone: "biceps", d: "M26 86C29 84 32 84 34 87L34 108C30 108 27 101 27 92Z" },
  { kind: "path", zone: "biceps", d: "M94 86C91 84 88 84 86 87L86 108C90 108 93 101 93 92Z" },
  { kind: "path", zone: "forearms", d: "M27 119C31 117 34 120 34 127L33 150C28 150 25 142 25 131Z" },
  { kind: "path", zone: "forearms", d: "M93 119C89 117 86 120 86 127L87 150C92 150 95 142 95 131Z" },
  { kind: "path", zone: "upperGlutes", d: "M48 145C52 143 56 142 60 142C64 142 68 143 72 145L69 156C66 154 63 153 60 153C57 153 54 154 51 156Z" },
  { kind: "path", zone: "gluteMax", d: "M45 157C50 154 55 155 57 161L55 181C49 181 45 171 45 160Z" },
  { kind: "path", zone: "gluteMax", d: "M75 157C70 154 65 155 63 161L65 181C71 181 75 171 75 160Z" },
  { kind: "path", zone: "sideGlutes", d: "M41 157C45 154 48 155 49 160L46 174C42 173 40 167 40 161Z" },
  { kind: "path", zone: "sideGlutes", d: "M79 157C75 154 72 155 71 160L74 174C78 173 80 167 80 161Z" },
  { kind: "path", zone: "hamstrings", d: "M47 182C52 180 56 182 56 191L54 227C48 226 45 214 45 198Z" },
  { kind: "path", zone: "hamstrings", d: "M73 182C68 180 64 182 64 191L66 227C72 226 75 214 75 198Z" },
  { kind: "path", zone: "calves", d: "M48 227C52 225 54 227 54 233L53 251C49 251 46 243 46 235Z" },
  { kind: "path", zone: "calves", d: "M72 227C68 225 66 227 66 233L67 251C71 251 74 243 74 235Z" },
];

const FRONT_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "frontDelts", d: "M41 57C43 51 47 49 50 51L49 66C45 66 42 63 41 57Z" },
  { kind: "path", zone: "frontDelts", d: "M79 57C77 51 73 49 70 51L71 66C75 66 78 63 79 57Z" },
  { kind: "path", zone: "sideDelts", d: "M36 62C38 56 42 53 45 54L44 75C39 75 36 69 36 62Z" },
  { kind: "path", zone: "sideDelts", d: "M84 62C82 56 78 53 75 54L76 75C81 75 84 69 84 62Z" },
  { kind: "path", zone: "upperChest", d: "M48 60C51 56 55 55 60 55C65 55 69 56 72 60L69 69C65 68 63 67 60 67C57 67 55 68 51 69Z" },
  { kind: "path", zone: "midChest", d: "M49 70C52 68 56 67 60 67C64 67 68 68 71 70L69 79C66 79 63 78 60 78C57 78 54 79 51 79Z" },
  { kind: "path", zone: "midChest", d: "M51 80C53 79 56 78 60 78C64 78 67 79 69 80L67 88C64 88 62 87 60 87C58 87 56 88 53 88Z" },
  { kind: "path", zone: "biceps", d: "M28 84C31 82 34 82 36 85L36 110C31 110 28 102 28 92Z" },
  { kind: "path", zone: "biceps", d: "M92 84C89 82 86 82 84 85L84 110C89 110 92 102 92 92Z" },
  { kind: "path", zone: "triceps", d: "M34 82C38 81 40 84 40 90L39 117C35 116 32 108 32 98Z" },
  { kind: "path", zone: "triceps", d: "M86 82C82 81 80 84 80 90L81 117C85 116 88 108 88 98Z" },
  { kind: "path", zone: "forearms", d: "M28 118C31 116 34 118 34 125L33 150C29 149 26 141 26 131Z" },
  { kind: "path", zone: "forearms", d: "M92 118C89 116 86 118 86 125L87 150C91 149 94 141 94 131Z" },
  { kind: "path", zone: "obliques", d: "M48 99C50 98 52 99 53 103L51 140C47 137 45 126 45 113Z" },
  { kind: "path", zone: "obliques", d: "M72 99C70 98 68 99 67 103L69 140C73 137 75 126 75 113Z" },
  { kind: "path", zone: "upperAbs", d: "M55 98C57 96 58 95 60 95C62 95 63 96 65 98L65 118C63 120 62 121 60 121C58 121 57 120 55 118Z" },
  { kind: "path", zone: "lowerAbs", d: "M55 119C57 117 58 116 60 116C62 116 63 117 65 119L64 141C62 143 61 144 60 144C59 144 58 143 56 141Z" },
  { kind: "path", zone: "sideGlutes", d: "M41 151C47 147 52 149 54 156L49 172C43 171 39 163 39 155Z" },
  { kind: "path", zone: "sideGlutes", d: "M79 151C73 147 68 149 66 156L71 172C77 171 81 163 81 155Z" },
  { kind: "path", zone: "hipFlexors", d: "M52 147C55 145 58 145 60 147L59 164C56 164 53 159 52 152Z" },
  { kind: "path", zone: "hipFlexors", d: "M68 147C65 145 62 145 60 147L61 164C64 164 67 159 68 152Z" },
  { kind: "path", zone: "adductors", d: "M55 172C58 171 60 172 60 178L59 215C56 215 54 203 54 189Z" },
  { kind: "path", zone: "adductors", d: "M65 172C62 171 60 172 60 178L61 215C64 215 66 203 66 189Z" },
  { kind: "path", zone: "quads", d: "M45 171C52 168 58 171 58 181L55 220C48 219 44 205 44 188Z" },
  { kind: "path", zone: "quads", d: "M75 171C68 168 62 171 62 181L65 220C72 219 76 205 76 188Z" },
  { kind: "path", zone: "calves", d: "M47 223C51 221 54 223 54 230L53 250C49 250 46 243 46 234Z" },
  { kind: "path", zone: "calves", d: "M73 223C69 221 66 223 66 230L67 250C71 250 74 243 74 234Z" },
];

const BACK_ZONES_FEMALE: ShapeDef[] = [
  { kind: "path", zone: "rearDelts", d: "M41 57C43 51 47 49 50 51L48 66C44 66 41 63 41 57Z" },
  { kind: "path", zone: "rearDelts", d: "M79 57C77 51 73 49 70 51L72 66C76 66 79 63 79 57Z" },
  { kind: "path", zone: "upperTraps", d: "M48 56C51 53 55 52 60 52C65 52 69 53 72 56L69 74C65 76 63 77 60 77C57 77 55 76 51 74Z" },
  { kind: "path", zone: "lats", d: "M47 74C49 73 51 74 52 78L50 131C46 127 44 117 44 99Z" },
  { kind: "path", zone: "lats", d: "M73 74C71 73 69 74 68 78L70 131C74 127 76 117 76 99Z" },
  { kind: "path", zone: "midBack", d: "M55 76C57 74 58 73 60 73C62 73 63 74 65 76L65 114C63 116 62 117 60 117C58 117 57 116 55 114Z" },
  { kind: "path", zone: "lowerBack", d: "M55 115C57 113 58 112 60 112C62 112 63 113 65 115L64 143C62 145 61 146 60 146C59 146 58 145 56 143Z" },
  { kind: "path", zone: "triceps", d: "M33 83C37 82 40 85 40 90L39 118C35 117 32 109 32 98Z" },
  { kind: "path", zone: "triceps", d: "M87 83C83 82 80 85 80 90L81 118C85 117 88 109 88 98Z" },
  { kind: "path", zone: "biceps", d: "M28 87C30 85 33 85 34 88L34 108C30 108 28 101 28 93Z" },
  { kind: "path", zone: "biceps", d: "M92 87C90 85 87 85 86 88L86 108C90 108 92 101 92 93Z" },
  { kind: "path", zone: "forearms", d: "M28 119C31 117 34 119 34 126L33 150C29 150 26 142 26 132Z" },
  { kind: "path", zone: "forearms", d: "M92 119C89 117 86 119 86 126L87 150C91 150 94 142 94 132Z" },
  { kind: "path", zone: "upperGlutes", d: "M48 145C52 143 56 142 60 142C64 142 68 143 72 145L69 156C66 154 63 153 60 153C57 153 54 154 51 156Z" },
  { kind: "path", zone: "gluteMax", d: "M43 156C50 152 56 154 58 161L55 183C48 183 43 172 43 160Z" },
  { kind: "path", zone: "gluteMax", d: "M77 156C70 152 64 154 62 161L65 183C72 183 77 172 77 160Z" },
  { kind: "path", zone: "sideGlutes", d: "M38 158C43 154 47 155 49 160L46 176C41 175 38 168 38 161Z" },
  { kind: "path", zone: "sideGlutes", d: "M82 158C77 154 73 155 71 160L74 176C79 175 82 168 82 161Z" },
  { kind: "path", zone: "hamstrings", d: "M45 184C52 181 57 184 57 193L54 228C47 227 43 215 43 199Z" },
  { kind: "path", zone: "hamstrings", d: "M75 184C68 181 63 184 63 193L66 228C73 227 77 215 77 199Z" },
  { kind: "path", zone: "calves", d: "M47 228C51 226 54 228 54 234L53 251C49 251 46 244 46 236Z" },
  { kind: "path", zone: "calves", d: "M73 228C69 226 66 228 66 234L67 251C71 251 74 244 74 236Z" },
];

function getMetricMap(metrics: TrainingLoadMetric[]) {
  return metrics.reduce<Record<TrainingLoadZone, TrainingLoadMetric>>((accumulator, metric) => {
    accumulator[metric.id] = metric;
    return accumulator;
  }, {} as Record<TrainingLoadZone, TrainingLoadMetric>);
}

function withAlpha(color: string, alpha: number) {
  return `${color}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

function getZoneStyle(metric?: TrainingLoadMetric) {
  if (!metric || metric.percentage <= 0) {
    return {
      fill: "rgba(255,255,255,0.015)",
      stroke: "rgba(255,255,255,0.03)",
      filter: "none",
    };
  }

  const fillAlpha = Math.max(0.1, Math.min(0.22, metric.percentage / 320));
  const strokeAlpha = metric.overload ? 0.18 : 0.12;

  return {
    fill: withAlpha("#ffffff", fillAlpha),
    stroke: withAlpha("#ffffff", strokeAlpha),
    filter: "none",
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
  return (
    <path
      d={shape.d}
      fill={selected ? style.fill : subdued ? "rgba(255,255,255,0.01)" : style.fill}
      stroke={selected ? "rgba(255,255,255,0.88)" : subdued ? "rgba(255,255,255,0.02)" : style.stroke}
      strokeWidth={selected ? 1.2 : 0.8}
      style={{
        filter: style.filter,
        opacity: subdued ? 0.18 : 1,
      }}
      className={onClick ? "cursor-pointer transition" : undefined}
      onClick={onClick}
    />
  );
}

function BodyBaseArt({ variant, view }: { variant: BodyVariant; view: BodyView }) {
  const shellFill = "rgba(255,255,255,0.022)";
  const shellStroke = "rgba(244,246,255,0.16)";
  const contourStroke = "rgba(255,255,255,0.032)";
  const frame = variant === "male" ? { x: 13, y: 8, width: 94, height: 236 } : { x: 15, y: 8, width: 90, height: 236 };
  const frontShell =
    variant === "male"
      ? "M60 27C54 27 50 29 47 33C44 38 42 43 38 49C34 56 32 67 33 79C34 91 36 102 39 114C42 129 44 143 47 155C49 164 51 171 53 178C55 186 55 195 54 208L52 246H57L59 209C59 194 59 182 60 171C61 182 61 194 61 209L63 246H68L66 208C65 195 65 186 67 178C69 171 71 164 73 155C76 143 78 129 81 114C84 102 86 91 87 79C88 67 86 56 82 49C78 43 76 38 73 33C70 29 66 27 60 27Z"
      : "M60 27C55 27 51 29 48 33C45 38 43 43 39 49C36 55 34 65 35 77C36 89 38 101 40 113C43 128 45 143 48 156C50 164 52 171 54 179C56 187 56 196 55 209L53 246H58L59 210C59 195 59 184 60 173C61 184 61 195 61 210L62 246H67L65 209C64 196 64 187 66 179C68 171 70 164 72 156C75 143 77 128 80 113C82 101 84 89 85 77C86 65 84 55 81 49C77 43 75 38 72 33C69 29 65 27 60 27Z";
  const backShell =
    variant === "male"
      ? "M60 27C54 27 50 29 47 33C44 38 42 43 38 49C34 56 32 67 33 79C34 92 36 103 39 116C42 129 44 143 47 156C49 165 51 172 53 179C55 187 55 196 54 209L52 246H57L59 210C59 195 59 184 60 173C61 184 61 195 61 210L63 246H68L66 209C65 196 65 187 67 179C69 172 71 165 73 156C76 143 78 129 81 116C84 103 86 92 87 79C88 67 86 56 82 49C78 43 76 38 73 33C70 29 66 27 60 27Z"
      : "M60 27C55 27 51 29 48 33C45 38 43 43 39 49C36 55 34 65 35 77C36 89 38 101 40 114C43 128 45 143 48 156C50 164 52 171 54 180C56 188 56 197 55 210L53 246H58L59 211C59 196 59 185 60 174C61 185 61 196 61 211L62 246H67L65 210C64 197 64 188 66 180C68 171 70 164 72 156C75 143 77 128 80 114C82 101 84 89 85 77C86 65 84 55 81 49C77 43 75 38 72 33C69 29 65 27 60 27Z";

  return (
    <svg x={frame.x} y={frame.y} width={frame.width} height={frame.height} viewBox="0 0 120 260">
      <ellipse cx="60" cy="118" rx={variant === "male" ? 24 : 22} ry="62" fill="rgba(255,255,255,0.01)" />
      <circle cx="60" cy="17" r={variant === "male" ? 10.5 : 10} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path d={view === "front" ? frontShell : backShell} fill={shellFill} stroke={shellStroke} strokeWidth="1" />
      <path
        d={variant === "male" ? "M44 49C40 61 38 75 38 93" : "M45 50C41 61 39 75 39 93"}
        fill="none"
        stroke={contourStroke}
        strokeWidth="0.82"
        strokeLinecap="round"
      />
      <path
        d={variant === "male" ? "M76 49C80 61 82 75 82 93" : "M75 50C79 61 81 75 81 93"}
        fill="none"
        stroke={contourStroke}
        strokeWidth="0.82"
        strokeLinecap="round"
      />
      {view === "front" ? (
        <>
          <path d="M49 54C52 51 56 50 60 50C64 50 68 51 71 54" fill="none" stroke={contourStroke} strokeWidth="0.6" strokeLinecap="round" />
          <path d="M60 50L60 142" fill="none" stroke="rgba(255,255,255,0.024)" strokeWidth="0.7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M49 50L60 68L71 50" fill="none" stroke={contourStroke} strokeWidth="0.66" strokeLinecap="round" />
          <path d="M60 67L60 145" fill="none" stroke="rgba(255,255,255,0.024)" strokeWidth="0.68" strokeLinecap="round" />
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
    <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] px-5 py-5">
      <div className="relative mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-white/35">
        <span>{selectedMetric ? selectedMetric.label : "Weekly activation"}</span>
        <span>{selectedMetric ? `${selectedMetric.percentage}%` : `${activeMetricCount} active`}</span>
      </div>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 260" className="h-[330px] w-[154px]" aria-hidden="true">
          <defs>
            <linearGradient id="body-fade-left" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(14,15,22,0.94)" />
              <stop offset="100%" stopColor="rgba(14,15,22,0)" />
            </linearGradient>
            <linearGradient id="body-fade-right" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(14,15,22,0.94)" />
              <stop offset="100%" stopColor="rgba(14,15,22,0)" />
            </linearGradient>
            <linearGradient id="body-fade-top" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(18,19,28,0.62)" />
              <stop offset="100%" stopColor="rgba(18,19,28,0)" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="132" rx="36" ry="112" fill="rgba(255,255,255,0.008)" />
          <BodyBaseArt variant={variant} view={view} />
          <rect x="0" y="0" width="18" height="260" fill="url(#body-fade-left)" />
          <rect x="102" y="0" width="18" height="260" fill="url(#body-fade-right)" />
          <rect x="0" y="0" width="120" height="30" fill="url(#body-fade-top)" />
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
      <div className="relative mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-white/30">
        <span>{view === "front" ? "Front" : "Back"} view</span>
        <span>{selectedMetric ? "Focused" : "This week"}</span>
      </div>
    </div>
  );
}
