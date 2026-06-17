import { normalizeTranscript, transcriptTokens } from "./normalize-transcript";

export const transcriptBufferWordLimit = 12;

export function lastTranscriptWords(value: string, limit = transcriptBufferWordLimit) {
  return transcriptTokens(value).slice(-limit).join(" ");
}

export function mergeTranscriptBuffer(input: { finalTranscript: string; interimTranscript: string; maxWords?: number }) {
  const maxWords = input.maxWords ?? transcriptBufferWordLimit;
  const finalText = normalizeTranscript(input.finalTranscript);
  const interimText = normalizeTranscript(input.interimTranscript);
  const merged = [finalText, interimText].filter(Boolean).join(" ");

  const recentText = lastTranscriptWords(merged, maxWords);

  return {
    finalText: lastTranscriptWords(finalText, maxWords),
    interimText: lastTranscriptWords(interimText, maxWords),
    isFresh: Boolean(recentText),
    lastDeltaAt: recentText ? Date.now() : 0,
    recentText,
    recentWords: transcriptTokens(recentText),
    wordCount: transcriptTokens(merged).slice(-maxWords).length
  };
}
