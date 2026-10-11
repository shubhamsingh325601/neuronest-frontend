"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Image as ImageIcon, Video } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../app-shell/states";
import { describeError } from "../../lib/describe-error";
import { formatDate } from "../../lib/format";
import { Button } from "../../ui/button";
import { StatusBadge } from "../../ui/status-badge";
import type { Media } from "./api/types";
import { PersonLink } from "./components/person-link";
import { useMediaQuery } from "./hooks/use-child-records";
import { formatBytes, formatDuration, playbackState } from "./media-format";

// The viewer (dialog + player) is fetched only when a file is opened.
const MediaViewer = dynamic(() => import("./components/media-viewer"), { ssr: false });

function Tile({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const Icon = media.type === "VIDEO" ? Video : ImageIcon;
  const playback = playbackState(media);
  const facts = [formatDuration(media.durationSeconds), formatBytes(media.sizeBytes)].filter(Boolean).join(" · ");
  return (
    <li className="grid content-between gap-3 rounded-2xl border p-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Icon className="size-4" aria-hidden="true" /> {media.type === "VIDEO" ? "Video" : "Photo"}
          </span>
          <StatusBadge status={media.status} />
        </div>
        <p className="text-sm">{media.context ?? <span className="text-muted-foreground">No description</span>}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(media.createdAt)} · <PersonLink id={media.uploadedById} />
          {facts ? ` · ${facts}` : ""}
        </p>
      </div>
      {playback.kind === "ready" ? (
        <Button variant="outline" size="sm" onClick={onOpen}>
          Open
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{playback.reason}</p>
      )}
    </li>
  );
}

/** Files the family uploaded for this child. No previews load in the grid: a file is fetched only when opened. */
export default function MediaTab({ childId }: { childId: string }) {
  const list = useMediaQuery(childId);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.items.find((item) => item.id === openId) ?? null;

  if (list.isPending) return <LoadingState label="Loading media" />;
  if (list.isError) return <ErrorState {...describeError(list.error, "the media")} onRetry={() => void list.refetch()} />;
  if (list.items.length === 0) {
    return <EmptyState icon={ImageIcon} title="No media yet" description="Photos and videos the family uploads appear here." />;
  }
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((media) => (
          <Tile key={media.id} media={media} onOpen={() => setOpenId(media.id)} />
        ))}
      </ul>
      {list.hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
      {open ? <MediaViewer media={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
