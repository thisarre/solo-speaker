import { transcriptTokens } from "./normalize-transcript";

// Pure geometry: where should the scroll container sit so that a given anchor point
// lands at `readingAnchorRatio` down the viewport. Kept side-effect free so it can be
// unit-tested without the DOM.
export function anchoredScrollTop(input: {
  anchorOffset: number; // anchor point measured downward from the container's top edge, in client px
  clientHeight: number;
  maxScroll: number;
  readingAnchorRatio: number;
  scrollTop: number;
}): number {
  const anchorWithinContent = input.scrollTop + input.anchorOffset;
  const target = anchorWithinContent - input.clientHeight * input.readingAnchorRatio;
  return Math.min(input.maxScroll, Math.max(0, target));
}

export function estimateSpokenProgress(input: { fullText: string; spokenText: string }): number | null {
  const fullTokens = transcriptTokens(input.fullText);
  const spokenTokens = transcriptTokens(input.spokenText).slice(-10);
  if (fullTokens.length < 4 || spokenTokens.length < 3) return null;

  let bestScore = 0;
  let bestEndIndex = 0;

  for (let start = 0; start < fullTokens.length; start += 1) {
    let fullIndex = start;
    let matched = 0;
    let endIndex = start;

    for (const token of spokenTokens) {
      while (fullIndex < fullTokens.length && fullTokens[fullIndex] !== token) {
        fullIndex += 1;
      }

      if (fullTokens[fullIndex] === token) {
        matched += 1;
        endIndex = fullIndex;
        fullIndex += 1;
      }
    }

    const densityPenalty = Math.max(1, endIndex - start + 1) / Math.max(1, matched);
    const score = (matched / spokenTokens.length) * (1 / Math.max(1, densityPenalty * 0.24));
    if (score > bestScore || (score === bestScore && endIndex > bestEndIndex)) {
      bestScore = score;
      bestEndIndex = endIndex;
    }
  }

  if (bestScore < 0.42) return null;
  return Math.min(0.94, Math.max(0.12, (bestEndIndex + 1) / fullTokens.length));
}

// DOM wrapper: anchor on the followed block while the animation loop eases toward the target.
// The text highlight is visual only; scroll movement stays prompter-smooth instead of snapping
// to individual recognized words.
export function getVoiceFollowScrollTop(input: {
  container: HTMLElement | null;
  element: HTMLElement | null;
  readingAnchorRatio: number;
  spokenText?: string;
}): number | null {
  const { container, element } = input;
  if (!container || !element) return null;

  const containerTop = container.getBoundingClientRect().top;
  const anchorRect = element.getBoundingClientRect();
  const progress = estimateSpokenProgress({ fullText: element.textContent ?? "", spokenText: input.spokenText ?? "" });
  const blockProgressAnchor = progress === null ? 0.25 : 0.18 + progress * 0.72;
  const anchorOffset = anchorRect.top - containerTop + anchorRect.height * blockProgressAnchor;

  return anchoredScrollTop({
    anchorOffset,
    clientHeight: container.clientHeight,
    maxScroll: Math.max(0, container.scrollHeight - container.clientHeight),
    readingAnchorRatio: input.readingAnchorRatio,
    scrollTop: container.scrollTop
  });
}
