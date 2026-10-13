// Pure helpers for the impersonation countdown. The token has no refresh, so the banner is the only warning.

/** Warn when this little time is left (seconds). */
export const EXPIRY_WARNING_SECONDS = 5 * 60;

/** Whole seconds left, never negative. */
export function secondsRemaining(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

/** `mm:ss`, or `h:mm:ss` from an hour up. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pair = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
}

export type ExpiryLevel = "ok" | "warning" | "expired";

export function expiryLevel(remainingSeconds: number): ExpiryLevel {
  if (remainingSeconds <= 0) return "expired";
  return remainingSeconds < EXPIRY_WARNING_SECONDS ? "warning" : "ok";
}
