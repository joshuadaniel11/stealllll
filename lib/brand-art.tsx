import type { CSSProperties } from "react";

const brand = {
  background: "#090a0d",
  panel: "#121722",
  panelStrong: "#1b2130",
  text: "#f4efe8",
  textMuted: "rgba(244, 239, 232, 0.72)",
  victory: "#35d07f",
  powder: "#8fb9ff",
  champagne: "#e8d2b0",
  success: "#40d98a",
};

export function StealGlyph({ size = 256 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" role="img" aria-label="STEAL glyph">
      <defs>
        <linearGradient id="steal-panel" x1="28" y1="20" x2="228" y2="236" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1f2737" />
          <stop offset="1" stopColor="#0b0e14" />
        </linearGradient>
        <radialGradient id="steal-green-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 58) rotate(90) scale(80)">
          <stop stopColor="#35d07f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#35d07f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="steal-blue-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(192 60) rotate(90) scale(84)">
          <stop stopColor="#8fb9ff" stopOpacity="0.78" />
          <stop offset="1" stopColor="#8fb9ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="steal-green-lane" x1="69" y1="50" x2="85" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#62f0a3" />
          <stop offset="1" stopColor="#1f8d56" />
        </linearGradient>
        <linearGradient id="steal-blue-lane" x1="171" y1="50" x2="187" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b6d0ff" />
          <stop offset="1" stopColor="#5f84db" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="232" height="232" rx="60" fill="url(#steal-panel)" />
      <rect x="12.75" y="12.75" width="230.5" height="230.5" rx="59.25" stroke="rgba(255,255,255,0.1)" />
      <circle cx="60" cy="58" r="74" fill="url(#steal-green-wash)" />
      <circle cx="194" cy="60" r="76" fill="url(#steal-blue-wash)" />
      <rect x="58" y="54" width="34" height="132" rx="17" fill="url(#steal-green-lane)" />
      <rect x="164" y="54" width="34" height="132" rx="17" fill="url(#steal-blue-lane)" />
      <circle cx="128" cy="126" r="46" stroke={brand.champagne} strokeWidth="14" />
      <path d="M164 56L98 190" stroke="#0a0d12" strokeWidth="20" strokeLinecap="round" />
      <path d="M169 52L103 186" stroke="rgba(244,239,232,0.18)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="78" cy="188" r="7" fill={brand.victory} />
      <circle cx="128" cy="202" r="7" fill={brand.champagne} />
      <circle cx="178" cy="188" r="7" fill={brand.powder} />
    </svg>
  );
}

function pillStyle(accent: string): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: 999,
    border: `1px solid ${accent}`,
    color: accent,
    background: "rgba(255,255,255,0.04)",
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  };
}

export function buildBrandIconFrame({ showWordmark }: { showWordmark: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(53,208,127,0.16), transparent 26%), radial-gradient(circle at top right, rgba(143,185,255,0.16), transparent 30%), linear-gradient(180deg, #171d29 0%, #090a0d 42%, #07080b 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 120,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(27,33,48,0.82), rgba(10,12,17,0.96) 72%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <StealGlyph size={showWordmark ? 230 : 280} />
        {showWordmark ? (
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.08em",
              color: brand.text,
            }}
          >
            STEAL
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function buildSocialCard({
  eyebrow,
  title,
  description,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(53,208,127,0.16), transparent 24%), radial-gradient(circle at top right, rgba(143,185,255,0.14), transparent 30%), linear-gradient(180deg, #171d29 0%, #090a0d 38%, #07080b 100%)",
        color: brand.text,
        padding: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "stretch",
          justifyContent: "space-between",
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(27,33,48,0.82), rgba(10,12,17,0.96) 72%)",
          padding: 42,
          gap: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 620 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(244,239,232,0.62)",
              }}
            >
              {eyebrow}
            </div>
            <div style={{ fontSize: 94, fontWeight: 800, letterSpacing: "-0.09em", lineHeight: 0.9 }}>STEAL</div>
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>
              {title}
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.4, color: brand.textMuted }}>{description}</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={pillStyle(brand.victory)}>Healthy Competition</div>
            <div style={pillStyle(brand.champagne)}>Wedding Editorial</div>
            <div style={pillStyle(brand.powder)}>Coach Mode</div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 38%), linear-gradient(180deg, rgba(26,31,43,0.94) 0%, rgba(12,14,19,0.98) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <StealGlyph size={300} />
            <div style={{ fontSize: 24, color: "rgba(244,239,232,0.68)", letterSpacing: "-0.02em" }}>{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
