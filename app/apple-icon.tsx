import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(circle at top, rgba(239,111,154,0.24), transparent 40%), linear-gradient(180deg, #161218 0%, #050507 100%)",
          color: "#ffffff",
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          borderRadius: 42,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        STEAL
      </div>
    ),
    size,
  );
}
