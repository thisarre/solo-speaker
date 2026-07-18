export const GRANT_TTL_SECONDS = 60;

export type CounterState = { cloudReserved: number; cloudConfirmed: number };

export function decideCloudAllowed(input: { capSeconds: number; expectedSeconds: number } & CounterState): boolean {
  return input.cloudReserved + input.cloudConfirmed + input.expectedSeconds <= input.capSeconds;
}

/**
 * SPÉCIFICATION EXÉCUTABLE de la confirmation (testée dans stt-metering.test).
 * Depuis l'audit 2026-07-18 (reco Technique-2), le calcul RÉEL vit dans la
 * fonction Postgres transactionnelle confirm_stt_session (migration
 * 20260718190000) — cette fonction pure en reste la référence de sémantique :
 * toute évolution doit être portée DES DEUX côtés.
 */
export function applyConfirmation(
  counter: CounterState,
  session: { reservedSeconds: number; confirmedSeconds: number }
): CounterState {
  return {
    cloudReserved: Math.max(0, counter.cloudReserved - session.reservedSeconds),
    cloudConfirmed: counter.cloudConfirmed + Math.max(0, session.confirmedSeconds)
  };
}
