import { interpolate, useCurrentFrame } from "remotion";
import { colors, ease, Scene, usePop } from "./theme";
import { clarityCopy, type Lang } from "../copy";

const FROM = [
  { x: -540, y: -180, rot: -8 },
  { x: 540, y: -120, rot: 7 },
  { x: -470, y: 200, rot: 6 },
  { x: 540, y: 260, rot: -7 }
];

const CARD_W = 780;
const ROW_H = 132;
const GAP = 26;
const CENTER_X = 960;
const LIST_CENTER_Y = 610;

function NoteRow({ index, label, note, listLeft, listTop }: { index: number; label: string; note: string; listLeft: number; listTop: number }) {
  const frame = useCurrentFrame();
  const organize = ease(frame, 55, 72);
  const pop = usePop(frame, index * 7);
  const labelIn = interpolate(organize, [0.62, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const from = FROM[index] ?? FROM[0];

  const finalY = listTop + index * (ROW_H + GAP);
  const x = interpolate(organize, [0, 1], [listLeft + from.x, listLeft]);
  const y = interpolate(organize, [0, 1], [finalY + from.y, finalY]);
  const rot = interpolate(organize, [0, 1], [from.rot, 0]);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, height: ROW_H, background: colors.panel, border: `2px solid ${colors.line}`, borderRadius: 22, padding: "0 36px", boxShadow: "0 22px 60px rgba(44,40,120,.10)" }}>
        <div style={{ width: 58, height: 58, borderRadius: 15, background: colors.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 27, opacity: labelIn, transform: `scale(${0.55 + labelIn * 0.45})` }}>
          {index + 1}
        </div>
        <div>
          <div style={{ fontSize: 33, fontWeight: 700, color: colors.text, opacity: labelIn, lineHeight: 1.2 }}>{label}</div>
          <div style={{ fontSize: 26, color: colors.muted, lineHeight: 1.25 }}>{note}</div>
        </div>
      </div>
    </div>
  );
}

export function ClarityWorkflow({ lang }: { lang: Lang }) {
  const copy = clarityCopy[lang];
  const listTotal = copy.items.length * ROW_H + (copy.items.length - 1) * GAP;
  const listTop = LIST_CENTER_Y - listTotal / 2;
  const listLeft = CENTER_X - CARD_W / 2;

  return (
    <Scene>
      <div style={{ position: "absolute", left: 160, top: 104 }}>
        <div style={{ fontFamily: "monospace", fontSize: 22, letterSpacing: 6, color: colors.muted, marginBottom: 14 }}>{copy.eyebrow}</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: colors.text }}>{copy.title}</div>
      </div>

      {copy.items.map((item, index) => (
        <NoteRow index={index} key={item.label} label={item.label} listLeft={listLeft} listTop={listTop} note={item.note} />
      ))}
    </Scene>
  );
}
