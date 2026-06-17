import type { SpeakingTextSegment } from "../types";

export function TalkContent({ segments }: { highlightText?: string; segments: SpeakingTextSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.kind === "cue" ? (
          <span className="font-semibold text-[#9d9bff]" key={`${segment.cue.label}-${index}`}>
            {segment.cue.label}
          </span>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </>
  );
}
