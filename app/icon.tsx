import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #041628 0%, #020b14 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(0,200,190,0.35)",
          boxShadow: "0 0 10px rgba(0,200,190,0.2)",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "hsl(185,100%,55%)",
            letterSpacing: "-0.5px",
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
