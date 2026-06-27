import { interpolate, useCurrentFrame } from "remotion";
import { colors, Scene, SoftFrame, usePop } from "./theme";
import { flowCopy, type Lang } from "../copy";

const START = 24;
const PER_LINE = 50;
const LINE_H = 116;
const SCREEN_TOP = 280;
const SCREEN_H = 660;
const READING = 300;
const SCREEN_TEXT = "#f3f3f7";
const SCREEN_DIM = "rgba(247,247,250,.3)";
const SCREEN_HL = "rgba(108,99,255,.42)";

export function ProductFlow({ lang }: { lang: Lang }) {
  const copy = flowCopy[lang];
  const lines = copy.lines;
  const frame = useCurrentFrame();
  const shell = usePop(frame, 4);
  const pos = interpolate(frame, [START, START + (lines.length - 1) * PER_LINE], [0, lines.length - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const active = Math.min(lines.length - 1, Math.round(pos));
  const lineFrame = frame - START - active * PER_LINE;
  const trackY = READING - (pos * LINE_H + LINE_H / 2);
  const waveBase = interpolate(lineFrame, [4, 18], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Scene>
      <div style={{ position: "absolute", left: 160, top: 104 }}>
        <div style={{ fontFamily: "monospace", fontSize: 22, letterSpacing: 6, color: colors.muted, marginBottom: 14 }}>{copy.eyebrow}</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: colors.text }}>{copy.title}</div>
      </div>

      <SoftFrame style={{ left: 160, top: SCREEN_TOP, width: 540, height: SCREEN_H, opacity: shell, transform: `scale(${0.94 + shell * 0.06})`, padding: 40, borderRadius: 30 }}>
        <div style={{ fontFamily: "monospace", fontSize: 18, letterSpacing: 4, textTransform: "uppercase", color: colors.muted, marginBottom: 30 }}>{copy.planLabel}</div>
        {copy.outline.map((item, index) => {
          const on = index === active;
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 22, height: 96, marginBottom: 18, borderRadius: 18, border: `2px solid ${on ? colors.accent : colors.line}`, background: on ? colors.accentSoft : colors.panel, padding: "0 28px" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: on ? colors.accent : colors.line, color: on ? "#fff" : colors.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22 }}>
                {index + 1}
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, color: on ? colors.text : colors.muted }}>{item}</div>
            </div>
          );
        })}
      </SoftFrame>

      <div style={{ position: "absolute", left: 760, top: SCREEN_TOP, width: 1000, height: SCREEN_H, borderRadius: 34, background: colors.text, overflow: "hidden", opacity: shell, transform: `scale(${0.94 + shell * 0.06})` }}>
        <div style={{ position: "absolute", left: 56, right: 56, top: READING, height: 2, background: "rgba(247,247,250,.42)" }} />
        <div style={{ position: "absolute", left: 56, right: 56, top: 0, transform: `translateY(${trackY}px)` }}>
          {lines.map((line, index) => {
            const isActive = index === active;
            const words = line.split(" ");
            const lit = isActive
              ? Math.floor(interpolate(lineFrame, [8, PER_LINE - 10], [0, words.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
              : 0;
            return (
              <p key={line} style={{ margin: 0, height: LINE_H, display: "flex", alignItems: "center", flexWrap: "wrap", fontSize: 52, fontWeight: 700, lineHeight: 1.05, color: isActive ? SCREEN_TEXT : SCREEN_DIM }}>
                {words.map((word, wordIndex) => (
                  <span key={`${word}-${wordIndex}`} style={{ borderRadius: 8, padding: "2px 4px", color: isActive && wordIndex < lit ? "#ffffff" : "inherit", background: isActive && wordIndex < lit ? SCREEN_HL : "transparent" }}>
                    {wordIndex > 0 ? ` ${word}` : word}
                  </span>
                ))}
              </p>
            );
          })}
        </div>
        <div style={{ position: "absolute", right: 64, bottom: 60, display: "flex", alignItems: "flex-end", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((bar) => (
            <div key={bar} style={{ width: 14, height: 22 + Math.abs(Math.sin(frame / 6 + bar)) * 54 * waveBase, borderRadius: 99, background: colors.accent }} />
          ))}
        </div>
      </div>
    </Scene>
  );
}
