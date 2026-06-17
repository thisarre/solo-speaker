export type ProviderHealth = "healthy" | "degraded" | "unusable";

export function getProviderHealth(input: { latencyMs: number | null; provider: string }) {
  if (input.provider !== "realtime") return "healthy" satisfies ProviderHealth;
  if (input.latencyMs === null) return "healthy" satisfies ProviderHealth;
  if (input.latencyMs > 5000) return "unusable" satisfies ProviderHealth;
  if (input.latencyMs > 2500) return "degraded" satisfies ProviderHealth;
  return "healthy" satisfies ProviderHealth;
}
