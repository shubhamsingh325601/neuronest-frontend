/** Seconds -> "3d 4h", "2h 5m", "45s". Largest two non-zero units; whole numbers only. */
export function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes && parts.length < 2) parts.push(`${minutes}m`);
  if (rest && parts.length === 0) parts.push(`${rest}s`);
  return parts.slice(0, 2).join(" ") || "0s";
}

/** Counts render with grouping; zero is a real value and renders as 0. */
export function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

/** Time of day for "last checked" labels. */
export function formatClockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
