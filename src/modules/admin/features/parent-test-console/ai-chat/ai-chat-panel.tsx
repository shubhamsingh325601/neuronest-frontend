"use client";

import "../console.css";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowDown, Gauge, MessageSquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatClient } from "@/modules/chat-client/client";
import { ChatErrorCode, isChatApiError } from "@/modules/chat-client/problem";
import type { Child, Topic } from "@/modules/chat-client/types";
import { ErrorState, LoadingState } from "../../../app-shell/states";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card } from "../../../ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../ui/sheet";
import { CLOSED_PROMPT, describeAiNotice, GREETING_BODY, GREETING_TITLE } from "../ai-copy";
import { describeChatError } from "../error-copy";
import { useIsDesktop } from "../hooks";
import { consoleKeys } from "../keys";
import { getConsoleClients } from "../api";
import { useConsoleSession } from "../state/session";
import { AiResponse } from "./ai-response";
import { Composer } from "./composer";
import { DiagnosticsPanel } from "./diagnostics-panel";
import { AiOrb } from "./thinking-indicator";
import { TopicChips } from "./topic-chips";
import { useAiChat } from "./use-ai-chat";
import { useStickToBottom } from "./use-stick-to-bottom";

const SELECT_CLASS = "h-10 max-w-56 rounded-xl border border-input bg-background px-3 text-sm transition-colors disabled:opacity-50";

const NOTICE_TONE = {
  quiet: "bg-muted text-muted-foreground",
  warning: "border-warning/40 bg-warning/10",
  error: "border-destructive/40 bg-destructive/5",
} as const;

/** The parent's AI chat, as the parent app will show it. Needs a parent token; the page guarantees one. */
export function AiChatPanel() {
  const clients = getConsoleClients();
  const parent = useConsoleSession((s) => s.parent);
  if (!clients || !parent) return null;
  return <AiChatPanelInner client={clients.parent} parentId={parent.id} />;
}

function AiChatPanelInner({ client, parentId }: { client: ChatClient; parentId: string }) {
  const exitParent = useConsoleSession((s) => s.exitParent);

  const children = useQuery({
    queryKey: consoleKeys.children(parentId),
    queryFn: ({ signal }) => client.children({ signal }),
    retry: false,
    staleTime: 60_000,
  });
  const topics = useQuery({
    queryKey: consoleKeys.topics(parentId),
    queryFn: ({ signal }) => client.topics({ signal }),
    retry: false,
    staleTime: 60_000,
  });

  // A refused token on a plain read ends the session the same way a refused send does.
  const readError = children.error ?? topics.error;
  useEffect(() => {
    if (isChatApiError(readError) && (readError.code === ChatErrorCode.InvalidToken || readError.code === ChatErrorCode.MissingToken)) {
      exitParent("refused");
    }
  }, [readError, exitParent]);

  if (children.isPending || topics.isPending) return <LoadingState label="Loading the chat" />;
  if (children.isError || topics.isError) {
    const failed = children.isError ? children : topics;
    return (
      <ErrorState
        {...describeChatError(failed.error, children.isError ? "the children" : "the topics")}
        onRetry={() => void Promise.all([children.refetch(), topics.refetch()])}
      />
    );
  }

  return <ChatSurface client={client} childList={children.data.data} topicList={topics.data.data} />;
}

/** Mounted only once the children and topics are loaded, so its scroll refs exist from the first render. */
function ChatSurface({ client, childList, topicList }: { client: ChatClient; childList: readonly Child[]; topicList: readonly Topic[] }) {
  const isDesktop = useIsDesktop();
  const [draft, setDraft] = useState("");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [chosenChild, setChosenChild] = useState<string | null>(null);

  const childId = chosenChild && childList.some((c) => c.id === chosenChild) ? chosenChild : (childList[0]?.id ?? null);

  const ai = useAiChat({ client, onRefused: (text) => setDraft((current) => current || text) });
  const { scrollRef, contentRef, onScroll, hasNew, scrollToBottom, follow } = useStickToBottom();

  const topicLabel = ai.conversation?.topic ? (topicList.find((t) => t.id === ai.conversation?.topic)?.label ?? ai.conversation.topic) : null;
  const lastTurn = ai.chat.turns[ai.chat.turns.length - 1];
  const redirected = lastTurn?.phase === "done" && lastTurn.doneState === "REDIRECTED";
  const chatEnded = ai.chat.closed;

  function pickTopic(topic: Topic) {
    if (childId) void ai.start(childId, topic.id);
  }

  function submit() {
    const text = draft.trim();
    if (!text || ai.streaming || chatEnded) return;
    setDraft("");
    follow();
    void ai.send(text);
  }

  const diagnostics = (
    <DiagnosticsPanel
      rows={ai.rows}
      abortAfterFirstDelta={ai.abortAfterFirstDelta}
      onAbortAfterFirstDeltaChange={ai.setAbortAfterFirstDelta}
      streaming={ai.streaming}
      onAbort={ai.stop}
      canResend={ai.hasTurns}
      onResend={() => void ai.resend()}
    />
  );

  const notice = ai.chat.notice ? describeAiNotice(ai.chat.notice.code, ai.chat.notice.retryAfter) : null;
  const topicsDisabled = ai.starting || !childId;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("grid gap-4", isDesktop && diagnosticsOpen && "lg:grid-cols-[minmax(0,1fr)_28rem]")}>
        <Card className="relative mx-auto flex h-[calc(100dvh-16rem)] min-h-[32rem] w-full max-w-[720px] flex-col overflow-hidden lg:max-w-none">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <AiOrb active={ai.streaming} />
              <div className="grid min-w-0">
                <span className="truncate text-sm font-semibold">{topicLabel ?? "AI chat"}</span>
                <select
                  aria-label="Child"
                  className={cn(SELECT_CLASS, "mt-0.5 h-8 text-xs")}
                  value={childId ?? ""}
                  disabled={childList.length <= 1 || ai.streaming}
                  onChange={(event) => {
                    setChosenChild(event.target.value);
                    ai.reset();
                  }}
                >
                  {childList.length === 0 ? <option value="">No children</option> : null}
                  {childList.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.preferredName || child.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ai.conversation ? (
                <Button size="sm" variant="outline" onClick={ai.reset}>
                  <MessageSquarePlus aria-hidden="true" />
                  New chat
                </Button>
              ) : null}
              <Button size="sm" variant={diagnosticsOpen ? "default" : "outline"} aria-pressed={diagnosticsOpen} onClick={() => setDiagnosticsOpen((open) => !open)}>
                <Gauge aria-hidden="true" />
                Diagnostics
                {ai.rows.length > 0 ? <Badge tone="neutral">{ai.rows.length}</Badge> : null}
              </Button>
            </div>
          </div>

          <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div ref={contentRef} className="mx-auto grid max-w-[640px] gap-5">
              {!ai.conversation ? (
                <div className="grid justify-items-center gap-5 px-2 py-8 text-center">
                  <AiOrb size="lg" active={ai.starting} />
                  <div className="grid gap-1.5">
                    <h2 className="text-xl font-semibold tracking-tight">{GREETING_TITLE}</h2>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">{GREETING_BODY}</p>
                  </div>
                  {childList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">This parent has no child yet, so there is nothing to chat about.</p>
                  ) : (
                    <TopicChips topics={topicList} onPick={pickTopic} disabled={topicsDisabled} label="Topics" />
                  )}
                  {ai.startError ? (
                    <p role="alert" className="max-w-md rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-left text-sm">
                      <span className="font-semibold">{describeChatError(ai.startError, "the chat").title}.</span>{" "}
                      <span className="text-muted-foreground">{describeChatError(ai.startError, "the chat").description}</span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  {ai.chat.turns.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Ask anything about {topicLabel?.toLowerCase() ?? "this topic"}.</p>
                  ) : null}
                  <AnimatePresence initial={false}>
                    {ai.chat.turns.map((turn) => (
                      <div key={turn.clientMessageId} className="grid gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground"
                        >
                          <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">{turn.userText}</p>
                        </motion.div>
                        <AiResponse turn={turn} onStop={ai.stop} onRetry={(id) => void ai.retry(id)} />
                      </div>
                    ))}
                  </AnimatePresence>

                  {notice ? (
                    <div
                      role={notice.tone === "quiet" ? "status" : "alert"}
                      className={cn("flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm", NOTICE_TONE[notice.tone])}
                    >
                      <span>{notice.text}</span>
                      <button type="button" onClick={ai.dismissNotice} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}

                  {chatEnded || redirected ? (
                    <div className="grid justify-items-center gap-3 border-t pt-5 text-center">
                      <p className="text-sm text-muted-foreground">{chatEnded ? CLOSED_PROMPT : "Want to start on a specific topic?"}</p>
                      <TopicChips topics={topicList} onPick={pickTopic} disabled={topicsDisabled} label="Pick a topic" />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <AnimatePresence>
            {hasNew ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={() => scrollToBottom()}
                className="absolute bottom-28 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium shadow-md"
              >
                <ArrowDown className="size-3.5" aria-hidden="true" />
                New reply
              </motion.button>
            ) : null}
          </AnimatePresence>

          <div className="border-t bg-card px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-[640px]">
              <Composer
                value={draft}
                onChange={setDraft}
                onSend={submit}
                onStop={ai.stop}
                streaming={ai.streaming}
                disabled={!ai.conversation || chatEnded}
                placeholder={!ai.conversation ? "Pick a topic to start" : chatEnded ? "This chat has ended" : "Message the assistant"}
              />
            </div>
          </div>
        </Card>

        {diagnosticsOpen && isDesktop ? (
          <Card className="h-fit max-h-[calc(100dvh-16rem)] overflow-y-auto p-4">
            <h2 className="mb-3 text-base font-semibold">Diagnostics</h2>
            {diagnostics}
          </Card>
        ) : null}
      </div>

      {!isDesktop ? (
        <Sheet open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
          <SheetContent side="bottom" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Diagnostics</SheetTitle>
              <SheetDescription>Timings and counts for each message. No message text is recorded.</SheetDescription>
            </SheetHeader>
            {diagnostics}
          </SheetContent>
        </Sheet>
      ) : null}
    </MotionConfig>
  );
}

