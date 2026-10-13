"use client";

import { Plug, PlugZap, Radio, RefreshCw, Send, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ConversationStream, Connection, EndedReason } from "@/modules/chat-client/conversation-stream";
import type { Message } from "@/modules/chat-client/types";
import { Badge, type BadgeTone } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card } from "../../../ui/card";
import { useStreamState } from "./use-conversation-stream";

const CONNECTION: Record<Connection, { label: string; tone: BadgeTone }> = {
  idle: { label: "Not started", tone: "neutral" },
  connecting: { label: "Connecting", tone: "info" },
  connected: { label: "Connected", tone: "success" },
  reconnecting: { label: "Reconnecting", tone: "warning" },
  disconnected: { label: "Disconnected", tone: "neutral" },
  ended: { label: "Ended", tone: "destructive" },
};

const ENDED: Record<EndedReason, string> = {
  closed: "The chat was closed. The stream stopped by itself.",
  purged: "The messages were purged by the retention job. The stream stopped by itself.",
  unauthorized: "The token was refused. Sign in again (the parent: Act as this parent again; the expert: sign out and in).",
  forbidden: "This account may not read this chat (the expert is not assigned to the child, or the chat belongs to someone else).",
  "not-found": "The chat was not found.",
  invalid: "The server refused to stream this conversation.",
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour12: false });

function Bubble({ message, own }: { message: Message; own: boolean }) {
  return (
    <li className={cn("grid max-w-[85%] gap-0.5", own ? "ml-auto justify-items-end" : "justify-items-start")}>
      <div className={cn("rounded-2xl px-3.5 py-2 text-sm", own ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <span className="text-[0.7rem] text-muted-foreground">
        {message.sender.toLowerCase()} · #{message.seq} · {time(message.createdAt)}
      </span>
    </li>
  );
}

export interface ChatPaneProps {
  title: string;
  /** Which sender is "me" in this pane. */
  side: "PARENT" | "EXPERT";
  stream: ConversationStream | null;
  /** Why there is no stream, when there is none. */
  emptyHint: string;
  /** Sends a few messages from the OTHER side while this pane is away (the replay test). */
  onReplayTest: () => Promise<void>;
  /** A refused parent token ends the whole session, the same as anywhere else in the console. */
  onUnauthorized?: () => void;
}

/** One side of a human chat: its own messages, connection state, event log and the controls that test resume. */
export function ChatPane({ title, side, stream, emptyHint, onReplayTest, onUnauthorized }: ChatPaneProps) {
  const state = useStreamState(stream);
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);

  const unauthorized = state?.endedReason === "unauthorized";
  useEffect(() => {
    if (unauthorized) onUnauthorized?.();
  }, [unauthorized, onUnauthorized]);

  if (!stream || !state) {
    return (
      <Card className="grid content-start gap-2 p-5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </Card>
    );
  }

  const connection = CONNECTION[state.connection];
  const canSend = draft.trim().length > 0 && state.endedReason !== "closed" && state.endedReason !== "purged";

  function submit() {
    const text = draft.trim();
    if (!text || !canSend || !stream) return;
    setDraft("");
    void stream.send(text);
  }

  async function openExtra() {
    if (!stream) return;
    const result = await stream.openExtra();
    setExtra(
      result.code
        ? `Refused: HTTP ${result.status} ${result.code}${result.requestId ? ` (${result.requestId})` : ""}`
        : "Accepted: this stream now holds one more slot until the page is left.",
    );
  }

  async function replay() {
    setReplaying(true);
    try {
      await onReplayTest();
    } finally {
      setReplaying(false);
    }
  }

  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <Badge tone={connection.tone}>
          <Radio aria-hidden="true" />
          {connection.label}
          {state.connection === "reconnecting" && state.retryInMs !== null ? ` in ${Math.round(state.retryInMs / 1000)}s` : ""}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Last event id</dt>
          <dd className="font-mono tabular-nums">{state.lastSeq || "–"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Heartbeats</dt>
          <dd className="font-mono tabular-nums">{state.heartbeats}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Retries</dt>
          <dd className="font-mono tabular-nums">{state.attempt}</dd>
        </div>
      </dl>

      {state.endedReason ? <p className="rounded-xl border bg-muted px-3 py-2 text-xs">{ENDED[state.endedReason]}</p> : null}
      {state.lastError && state.connection !== "connected" ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs" role="status">
          Last error: {state.lastError.status === 0 ? "network" : `HTTP ${state.lastError.status}`} {state.lastError.code}
          {state.lastError.requestId ? ` (${state.lastError.requestId})` : ""}
        </p>
      ) : null}

      <ul aria-label={`${title} messages`} className="grid max-h-80 min-h-40 content-start gap-2 overflow-y-auto rounded-xl border bg-background p-3">
        {state.messages.length === 0 && state.pending.length === 0 ? (
          <li className="py-6 text-center text-xs text-muted-foreground">No messages yet.</li>
        ) : null}
        {state.messages.map((message) => (
          <Bubble key={message.seq} message={message} own={message.sender === side} />
        ))}
        {state.pending.map((pending) => (
          <li key={pending.clientMessageId} className="ml-auto grid max-w-[85%] justify-items-end gap-0.5">
            <div className="rounded-2xl rounded-br-md bg-primary/60 px-3.5 py-2 text-sm text-primary-foreground">
              <p className="whitespace-pre-wrap break-words">{pending.text}</p>
            </div>
            <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
              {pending.status === "sending" ? "sending…" : `not sent (${pending.errorCode})`}
              {pending.status === "failed" ? (
                <button type="button" className="font-medium text-foreground underline" onClick={() => void stream.retry(pending.clientMessageId)}>
                  retry with the same id
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Send as ${side.toLowerCase()}`}
          aria-label={`Message as ${side.toLowerCase()}`}
          maxLength={2000}
          className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm" className="h-10" disabled={!canSend}>
          <Send aria-hidden="true" />
          Send
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {state.connection === "disconnected" ? (
          <Button size="sm" variant="outline" onClick={() => stream.connect()}>
            <Plug aria-hidden="true" />
            Reconnect
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={state.connection === "ended"} onClick={() => stream.disconnect()}>
            <Unplug aria-hidden="true" />
            Disconnect
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={replaying || state.connection === "ended"} onClick={() => void replay()}>
          <RefreshCw aria-hidden="true" />
          {replaying ? "Testing replay…" : "Send 5 while away, then reconnect"}
        </Button>
        <Button size="sm" variant="outline" disabled={state.connection === "ended"} onClick={() => void openExtra()}>
          <PlugZap aria-hidden="true" />
          Open a second stream
        </Button>
      </div>
      {extra ? (
        <p className="text-xs text-muted-foreground" role="status">
          {extra}
        </p>
      ) : null}

      <details className="text-xs">
        <summary className="cursor-pointer font-medium">Event log ({state.log.length})</summary>
        <p className="mt-1 text-muted-foreground">Event names and arrival times only, never message text.</p>
        <ol className="mt-2 max-h-40 overflow-y-auto font-mono">
          {state.log.length === 0 ? <li className="text-muted-foreground">Nothing yet.</li> : null}
          {state.log.map((entry, index) => (
            <li key={index}>
              {clock(entry.at)} {entry.name}
            </li>
          ))}
        </ol>
      </details>
    </Card>
  );
}
