import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const colors = {
  accent: "#6C63FF",
  accentSoft: "#ECEBFF",
  aqua: "#54C7CA",
  bg: "#F7F7FA",
  faint: "#DADAE4",
  line: "#E7E7EF",
  muted: "#8A8A98",
  panel: "#FFFFFF",
  text: "#15151A"
};

export function ease(frame: number, from: number, duration: number) {
  return interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}

export function usePop(frame: number, delay = 0) {
  const config = useVideoConfig();
  return spring({
    fps: config.fps,
    frame: frame - delay,
    config: {
      damping: 16,
      mass: 0.9,
      stiffness: 120
    }
  });
}

export function Scene({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 82% 26%, rgba(108,99,255,.16), transparent 34%), radial-gradient(circle at 12% 18%, rgba(84,199,202,.12), transparent 30%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, transparent 0 44%, rgba(108,99,255,.07) 44% 56%, transparent 56% 100%)"
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

export function SoftFrame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        border: `2px solid ${colors.line}`,
        borderRadius: 44,
        background: "rgba(255,255,255,.94)",
        boxShadow: "0 38px 90px rgba(44,40,120,.18)",
        overflow: "hidden",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function BrowserShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <SoftFrame style={style}>
      <div
        style={{
          height: 82,
          borderBottom: `2px solid ${colors.line}`,
          background: "rgba(250,250,253,.92)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 42px"
        }}
      >
        {["#FF5F57", "#FFBD2E", "#28C840"].map((color) => (
          <span key={color} style={{ width: 16, height: 16, borderRadius: 99, background: color }} />
        ))}
        <div style={{ width: 520, height: 20, borderRadius: 99, marginLeft: 64, background: "#EDEDF4" }} />
        <div style={{ width: 240, height: 32, borderRadius: 10, marginLeft: "auto", background: colors.text }} />
      </div>
      {children}
    </SoftFrame>
  );
}

export function LineBlock({ width, tone = "muted", style }: { width: number; tone?: "accent" | "dark" | "muted" | "aqua"; style?: CSSProperties }) {
  const color = {
    accent: colors.accent,
    aqua: colors.aqua,
    dark: colors.text,
    muted: "#C8C8D4"
  }[tone];

  return <div style={{ width, height: 22, borderRadius: 99, background: color, ...style }} />;
}

export function MicGlyph({ size = 120, active = false }: { size?: number; active?: boolean }) {
  const frame = useCurrentFrame();
  const pulse = active ? 1 + Math.sin(frame / 8) * 0.045 : 1;
  const stroke = active ? colors.accent : colors.text;

  return (
    <svg height={size} viewBox="0 0 120 120" width={size} style={{ transform: `scale(${pulse})` }}>
      <rect fill={colors.accentSoft} height="120" rx="28" width="120" />
      <rect fill="none" height="48" rx="24" stroke={colors.text} strokeWidth="8" width="28" x="46" y="32" />
      <path d="M30 57c0 20 13 35 30 35s30-15 30-35" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="7" />
      <path d="M60 92v18" stroke={colors.text} strokeLinecap="round" strokeWidth="7" />
      <path d="M41 22c12-8 26-8 38 0" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="7" />
      <path d="M31 34c18-14 40-14 58 0" fill="none" opacity=".58" stroke={stroke} strokeLinecap="round" strokeWidth="6" />
    </svg>
  );
}

export function Cursor({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 7) * 0.09;

  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <div
        style={{
          position: "absolute",
          left: -24,
          top: -24,
          width: 48,
          height: 48,
          borderRadius: 99,
          border: `7px solid ${colors.accent}`,
          opacity: 0.78,
          transform: `scale(${pulse})`
        }}
      />
      <svg height="132" viewBox="0 0 80 132" width="80">
        <path d="M8 6l58 58-25 5-13 51-18-5 13-49-22 17z" fill="#fff" stroke={colors.text} strokeLinejoin="round" strokeWidth="3" />
      </svg>
    </div>
  );
}
