import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(239,111,154,0.26), transparent 38%), linear-gradient(180deg, #141018 0%, #050507 100%)",
          color: "#ffffff",
          fontSize: 168,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 120,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(8,8,10,0.58) 72%)",
            boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          STEAL
        </div>
      </div>
    ),
    size,
  );
}
