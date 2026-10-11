import type { Media } from "./api/types";

/** 9_400_000 -> "9.0 MB". Null or negative sizes have no label. */
export function formatBytes(bytes: number | null): string | null {
  if (bytes === null || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** 75 -> "1:15". */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds < 0) return null;
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export type PlaybackState =
  | { kind: "ready"; url: string }
  | { kind: "unavailable"; reason: string };

/**
 * Whether a row can be opened, and if not why. `playbackUrl` is null unless the upload finished, and the viewer only
 * ever loads an https URL (the CSP allows only the media host, so anything else would be blocked anyway).
 */
export function playbackState(media: Pick<Media, "status" | "playbackUrl">): PlaybackState {
  if (media.status === "PENDING") return { kind: "unavailable", reason: "The upload has not finished yet." };
  if (media.status === "FAILED") return { kind: "unavailable", reason: "The upload failed, so there is nothing to play." };
  if (!media.playbackUrl) return { kind: "unavailable", reason: "No playback link is available for this file." };
  try {
    if (new URL(media.playbackUrl).protocol !== "https:") throw new Error("not https");
  } catch {
    return { kind: "unavailable", reason: "The playback link is not valid." };
  }
  return { kind: "ready", url: media.playbackUrl };
}
