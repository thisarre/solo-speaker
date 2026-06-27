import type { Talk } from "@/types/talk";
import type { SpeakingItem } from "../types";
import { estimateTextDuration } from "./estimateDuration";
import { parseCues } from "./parseCues";

function splitIntoChunks(text: string) {
  const sentences = text.match(/[^.!?…]+[.!?…]+["'’»]?/g) ?? (text.trim() ? [text] : []);
  return sentences.map((sentence) => sentence.trim()).filter(Boolean);
}

function makeItem(input: Omit<SpeakingItem, "segments" | "estimatedSeconds">): SpeakingItem {
  return {
    ...input,
    segments: parseCues(input.text),
    estimatedSeconds: input.kind === "heading" ? 3 : estimateTextDuration(input.text)
  };
}

export function buildSpeakingItems(talk: Talk, fallbackTitle: string): SpeakingItem[] {
  return talk.sections.flatMap((section, sectionIndex) => {
    const items: SpeakingItem[] = [
      makeItem({
        id: `${section.id}-heading`,
        sectionId: section.id,
        sectionIndex,
        kind: "heading",
        text: `${sectionIndex + 1} · ${section.heading || fallbackTitle}`
      })
    ];

    const chunks = splitIntoChunks(section.body);
    chunks.forEach((chunk, chunkIndex) => {
      items.push(
        makeItem({
          id: `${section.id}-body-${chunkIndex}`,
          sectionId: section.id,
          sectionIndex,
          kind: "body",
          text: chunk
        })
      );
    });

    return items;
  });
}
