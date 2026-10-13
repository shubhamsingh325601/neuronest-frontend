"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ChatClient } from "@/modules/chat-client/client";
import { ConversationStream, type ConversationStreamState } from "@/modules/chat-client/conversation-stream";

/**
 * One live stream for one side of a chat. Created when both a client and a conversation exist, connected on
 * mount and aborted on unmount, so leaving the page (or Exit) frees the server's stream slots.
 */
export function useConversationStream(client: ChatClient | null, conversationId: string | null): ConversationStream | null {
  const stream = useMemo(
    () => (client && conversationId ? new ConversationStream({ client, conversationId }) : null),
    [client, conversationId],
  );
  useEffect(() => {
    if (!stream) return;
    stream.connect();
    return () => stream.destroy();
  }, [stream]);
  return stream;
}

const EMPTY: ConversationStreamState | null = null;

/** The stream's state for rendering; null while there is no stream. */
export function useStreamState(stream: ConversationStream | null): ConversationStreamState | null {
  return useSyncExternalStore(
    (onChange) => (stream ? stream.subscribe(onChange) : () => undefined),
    () => (stream ? stream.getState() : EMPTY),
    () => EMPTY,
  );
}
