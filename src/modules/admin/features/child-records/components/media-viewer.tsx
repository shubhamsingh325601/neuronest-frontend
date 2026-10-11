"use client";

import { formatDate } from "../../../lib/format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../ui/dialog";
import type { Media } from "../api/types";
import { playbackState } from "../media-format";

/**
 * Plays one file. This module is loaded only when someone opens a file, and the <video>/<img> is mounted only while
 * the dialog is open (`preload="none"` so the video downloads nothing until Play is pressed).
 */
export default function MediaViewer({ media, onClose }: { media: Media; onClose: () => void }) {
  const playback = playbackState(media);
  const title = media.context ?? (media.type === "VIDEO" ? "Video" : "Photo");
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Uploaded {formatDate(media.createdAt)}</DialogDescription>
        </DialogHeader>
        {playback.kind === "unavailable" ? (
          <p role="status" className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {playback.reason}
          </p>
        ) : media.type === "VIDEO" ? (
          <video src={playback.url} controls preload="none" className="max-h-[60dvh] w-full rounded-xl bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a signed external URL; next/image would proxy it
          <img src={playback.url} alt={media.context ?? "Photo uploaded by the family"} className="max-h-[60dvh] w-full rounded-xl object-contain" />
        )}
      </DialogContent>
    </Dialog>
  );
}
