export const GRANT_TTL_SECONDS = 60;

export type CounterState = { cloudReserved: number; cloudConfirmed: number };

export function decideCloudAllowed(input: { capSeconds: number; expectedSeconds: number } & CounterState): boolean {
  return input.cloudReserved + input.cloudConfirmed + input.expectedSeconds <= input.capSeconds;
}

export type SttSessionStatus = "reserved" | "confirmed" | "expired";
export type SttSessionRow = { user_id: string; status: SttSessionStatus };

export type SessionReuseDecision =
  | { kind: "fresh" } // aucune ligne : on frappe le token ET on écrit la réservation
  | { kind: "remint" } // re-mint légitime en cours de session : on frappe, sans re-réserver
  | { kind: "reject"; status: 403 | 409; error: string };

/**
 * Garde anti-rejeu de /api/deepgram/token. Le sessionId vient du client, il ne
 * prouve rien : sans filtre sur user_id ET status, la simple EXISTENCE d'une
 * ligne suffisait à sauter la réservation et le compteur, donc à frapper des
 * tokens Deepgram non métrés en boucle avec un id déjà clos (ou celui d'un
 * autre compte). Le client honnête tire un UUID neuf par session et le remet à
 * null après confirmation : il ne peut pas atteindre ces refus.
 */
export function decideSessionReuse(existing: SttSessionRow | null, userId: string): SessionReuseDecision {
  if (!existing) return { kind: "fresh" };
  if (existing.user_id !== userId) return { kind: "reject", status: 403, error: "Unknown session." };
  if (existing.status !== "reserved") {
    // 'confirmed'/'expired' = réservation déjà relâchée : rejouer cet id remintait
    // à coût zéro, et le confirm suivant était idempotent donc no-op.
    return { kind: "reject", status: 409, error: "Session already closed. Start a new one." };
  }
  return { kind: "remint" };
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
