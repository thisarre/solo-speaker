import type { SpeakingTextSegment } from "../types";

const pauseCuePattern = /\[pause(?:\s+(\d+(?:[.,]\d+)?)\s*s?)?\]/gi;

export function parseCues(text: string): SpeakingTextSegment[] {
  const segments: SpeakingTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pauseCuePattern)) {
    const index = match.index ?? 0;
    const raw = match[0];

    if (index > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, index) });
    }

    const seconds = match[1] ? Number(match[1].replace(",", ".")) : 2;
    segments.push({
      kind: "cue",
      cue: {
        kind: "pause",
        seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 2,
        label: raw
      }
    });

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ kind: "text", text }];
}

export function cuePauseSeconds(segments: SpeakingTextSegment[]) {
  return segments.reduce((total, segment) => total + (segment.kind === "cue" ? segment.cue.seconds : 0), 0);
}
