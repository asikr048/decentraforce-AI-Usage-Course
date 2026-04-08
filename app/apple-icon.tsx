import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #041628 0%, #020b14 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "3px solid rgba(0,200,190,0.4)",
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "hsl(185,100%,55%)",
            letterSpacing: "-2px",
            fontFamily: "sans-serif",
          }}
        >
          AR
        </span>
      </div>
    ),
    { ...size }
  );
}
