import { ImageResponse } from "next/og";

export const alt = "Solo Speaker Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0d0e12",
          color: "#f3f3f7",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#7b79ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#ffffff" }}>S</div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Solo Speaker Studio</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Write, rehearse and deliver your talks.</div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", fontSize: 30, color: "#ffffff", background: "rgba(123,121,255,0.32)", padding: "8px 18px", borderRadius: 10 }}>AI teleprompter that follows your voice</div>
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#787a86" }}>Madebysarre</div>
      </div>
    ),
    size
  );
}
