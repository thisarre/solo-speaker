export type AutoScrollState = {
  clientHeight: number;
  isPlaying: boolean;
  scrollHeight: number;
  scrollTop: number;
  voiceFollowActive?: boolean;
};

export const basePixelsPerSecond = 32;

export function effectiveScrollSpeed(speedMultiplier: number, baseSpeed = basePixelsPerSecond) {
  return Math.max(0, baseSpeed * speedMultiplier);
}

export function canAutoScroll({ clientHeight, isPlaying, scrollHeight, scrollTop, voiceFollowActive = false }: AutoScrollState) {
  if (!isPlaying || voiceFollowActive) return false;
  if (scrollHeight <= clientHeight) return false;
  return scrollTop < scrollHeight - clientHeight - 1;
}

export function nextScrollTop({
  clientHeight,
  deltaSeconds,
  scrollHeight,
  scrollTop,
  speedMultiplier
}: {
  clientHeight: number;
  deltaSeconds: number;
  scrollHeight: number;
  scrollTop: number;
  speedMultiplier: number;
}) {
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  return Math.min(maxScroll, scrollTop + effectiveScrollSpeed(speedMultiplier) * deltaSeconds);
}
