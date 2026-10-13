"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Power } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { ConversationStream } from "@/modules/chat-client/conversation-stream";
import { ChatErrorCode, isChatApiError } from "@/modules/chat-client/problem";
import type { Conversation } from "@/modules/chat-client/types";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { getConsoleClients } from "../api";
import { ExpertLogin } from "../components/expert-login";
import { describeChatError } from "../error-copy";
import { consoleKeys } from "../keys";
import { useConsoleSession } from "../state/session";
import { ChatPane } from "./chat-pane";
import { useConversationStream } from "./use-conversation-stream";

const SELECT_CLASS = "h-10 rounded-xl border border-input bg-background px-3 text-sm transition-colors disabled:opacity-50";
const REPLAY_COUNT = 5;

/** Parent <-> expert live chat: one stream per side, side by side, with the controls that test resume and replay. */
export function ExpertChatPanel() {
  const clients = getConsoleClients();
  const parent = useConsoleSession((s) => s.parent);
  const expert = useConsoleSession((s) => s.expert);
  const exitParent = useConsoleSession((s) => s.exitParent);

  const [chosenChild, setChosenChild] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<unknown>(null);

  const children = useQuery({
    queryKey: consoleKeys.children(parent?.id ?? ""),
    queryFn: ({ signal }) => clients!.parent.children({ signal }),
    enabled: Boolean(clients && parent),
    retry: false,
    staleTime: 60_000,
  });

  const conversationId = conversation?.id ?? null;
  const parentStream = useConversationStream(clients?.parent ?? null, conversationId);
  // The expert pane only streams once an expert is signed in.
  const expertStream = useConversationStream(expert ? (clients?.expert ?? null) : null, conversationId);

  const refuseParent = useCallback(() => exitParent("refused"), [exitParent]);

  if (!clients || !parent) return null;

  const childList = children.data?.data ?? [];
  const childId = chosenChild && childList.some((c) => c.id === chosenChild) ? chosenChild : (childList[0]?.id ?? null);

  async function start() {
    if (!childId || !clients) return;
    setStarting(true);
    setProblem(null);
    try {
      setConversation(await clients.parent.createConversation(childId));
    } catch (error) {
      if (isChatApiError(error) && (error.code === ChatErrorCode.InvalidToken || error.code === ChatErrorCode.MissingToken)) {
        exitParent("refused");
        return;
      }
      setProblem(error);
    } finally {
      setStarting(false);
    }
  }

  async function close() {
    if (!conversationId || !clients) return;
    try {
      setConversation(await clients.parent.closeConversation(conversationId));
    } catch (error) {
      setProblem(error);
    }
  }

  /** Replay test: this pane leaves, the other side sends a few messages, this pane comes back and must catch up. */
  const replayFor = (away: ConversationStream | null, other: ConversationStream | null) => async () => {
    if (!away || !other) return;
    away.disconnect();
    for (let i = 1; i <= REPLAY_COUNT; i++) await other.send(`Replay test message ${i} of ${REPLAY_COUNT}`);
    away.connect();
  };

  const failure = problem ? describeChatError(problem, "the chat") : null;
  const noExpert = isChatApiError(problem) && problem.code === ChatErrorCode.NoExpertAssigned;

  return (
    <div className="grid gap-4">
      <ExpertLogin />

      <Card>
        <CardHeader>
          <CardTitle>Chat with the expert</CardTitle>
          <CardDescription>
            The parent starts a chat with the child&apos;s assigned expert. Both sides then see each other&apos;s messages live.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {children.isPending ? (
            <LoadingState rows={1} label="Loading children" />
          ) : children.isError ? (
            <ErrorState {...describeChatError(children.error, "the children")} onRetry={() => void children.refetch()} />
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Child
                <select
                  className={SELECT_CLASS}
                  value={childId ?? ""}
                  disabled={childList.length <= 1 || Boolean(conversation)}
                  onChange={(event) => setChosenChild(event.target.value)}
                >
                  {childList.length === 0 ? <option value="">No children</option> : null}
                  {childList.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.preferredName || child.name}
                    </option>
                  ))}
                </select>
              </label>
              {conversation && conversation.status === "OPEN" ? (
                <Button variant="outline" onClick={() => void close()}>
                  <Power aria-hidden="true" />
                  Close chat
                </Button>
              ) : conversation ? (
                <Button variant="outline" onClick={() => setConversation(null)}>
                  <MessageCircle aria-hidden="true" />
                  Start a new chat
                </Button>
              ) : (
                <Button onClick={() => void start()} disabled={!childId || starting}>
                  <MessageCircle aria-hidden="true" />
                  {starting ? "Starting…" : "Start chat with expert"}
                </Button>
              )}
            </div>
          )}

          {failure ? (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
              <span className="font-semibold">{failure.title}.</span> <span className="text-muted-foreground">{failure.description}</span>
              {noExpert ? (
                <>
                  {" "}
                  <Link href={ADMIN_ROUTES.experts} className="font-medium text-foreground underline">
                    Open the Experts page
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {conversation ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChatPane
            title="Parent"
            side="PARENT"
            stream={parentStream}
            emptyHint="Starting…"
            onReplayTest={replayFor(parentStream, expertStream)}
            onUnauthorized={refuseParent}
          />
          <ChatPane
            title="Expert"
            side="EXPERT"
            stream={expertStream}
            emptyHint="Sign in as the expert above to join this chat."
            onReplayTest={replayFor(expertStream, parentStream)}
          />
        </div>
      ) : null}
    </div>
  );
}
