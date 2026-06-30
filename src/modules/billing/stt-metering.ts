export const GRANT_TTL_SECONDS = 60;

export type CounterState = { cloudReserved: number; cloudConfirmed: number };

export function decideCloudAllowed(input: { capSeconds: number; expectedSeconds: number } & CounterState): boolean {
  return input.cloudReserved + input.cloudConfirmed + input.expectedSeconds <= input.capSeconds;
}

export function applyConfirmation(
  counter: CounterState,
  session: { reservedSeconds: number; confirmedSeconds: number }
): CounterState {
  return {
    cloudReserved: Math.max(0, counter.cloudReserved - session.reservedSeconds),
    cloudConfirmed: counter.cloudConfirmed + Math.max(0, session.confirmedSeconds)
  };
}
