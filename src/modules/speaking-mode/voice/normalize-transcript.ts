export function normalizeTranscript(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9À-ÿ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function transcriptTokens(value: string) {
  return normalizeTranscript(value).split(" ").filter((token) => token.length > 2);
}
