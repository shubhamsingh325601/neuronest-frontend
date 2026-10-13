"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { aiChatReducer, initialAiChatState, isBusy, type AiChatState } from "@/modules/chat-client/ai-chat-state";
import { sendAiMessage } from "@/modules/chat-client/ai-stream";
import { newClientMessageId, type ChatClient } from "@/modules/chat-client/client";
import { ChatErrorCode, isAbortError, isChatApiError } from "@/modules/chat-client/problem";
import type { Conversation } from "@/modules/chat-client/types";
import type { DiagnosticsRow, SendKind } from "../diagnostics";
import { useConsoleSession } from "../state/session";

interface UseAiChatOptions {
  client: ChatClient;
  /** A refused message was not stored: the caller puts its text back in the box. */
  onRefused: (text: string, code: string) => void;
}

/**
 * The AI chat controller: owns the conversation, the transcript reducer, the in-flight request and the
 * diagnostics rows. Message text lives only in the transcript state (and is handed back on a refusal); it is
 * never logged and never written into a diagnostics row.
 */
export function useAiChat({ client, onRefused }: UseAiChatOptions) {
  const exitParent = useConsoleSession((s) => s.exitParent);
  const [chat, dispatch] = useReducer(aiChatReducer, initialAiChatState);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [startError, setStartError] = useState<unknown>(null);
  const [starting, setStarting] = useState(false);
  const [rows, setRows] = useState<DiagnosticsRow[]>([]);
  const [abortAfterFirstDelta, setAbortAfterFirstDelta] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const counter = useRef(0);
  const lastSent = useRef<{ clientMessageId: string; text: string } | null>(null);
  // Read inside `run` without re-creating it on every toggle.
  const abortFlag = useRef(false);
  useEffect(() => {
    abortFlag.current = abortAfterFirstDelta;
  }, [abortAfterFirstDelta]);
  const refusedHandler = useRef(onRefused);
  useEffect(() => {
    refusedHandler.current = onRefused;
  }, [onRefused]);

  const conversationId = conversation?.id ?? null;

  // Leaving the page (or Exit, which unmounts it) cancels any reply being written.
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (clientMessageId: string, text: string, kind: SendKind) => {
      if (!conversationId) return;
      const controller = new AbortController();
      abortRef.current = controller;
      lastSent.current = { clientMessageId, text };
      dispatch({ type: "send", clientMessageId, text, at: Date.now() });

      const result = await sendAiMessage(
        client.transport,
        conversationId,
        { text, clientMessageId },
        {
          signal: controller.signal,
          abortAfterFirstDelta: abortFlag.current,
          onEvent: (event) => dispatch({ type: "event", clientMessageId, event }),
        },
      );
      if (abortRef.current === controller) abortRef.current = null;

      counter.current += 1;
      setRows((current) => [...current, { n: counter.current, kind, outcome: result.outcome, metrics: result.metrics }]);

      if (result.outcome === "aborted") {
        dispatch({ type: "stopped", clientMessageId });
      } else if (result.outcome === "failed" && result.error) {
        const { error } = result;
        if (error.code === ChatErrorCode.InvalidToken || error.code === ChatErrorCode.MissingToken) {
          exitParent("refused");
          return;
        }
        if (result.metrics.httpStatus >= 400) {
          // Refused before the stream: nothing was stored, so the draft goes back to the box.
          dispatch({ type: "refused", clientMessageId, code: error.code, retryAfter: error.retryAfter });
          refusedHandler.current(text, error.code);
        } else {
          dispatch({ type: "broken", clientMessageId, code: error.code });
        }
      }
    },
    [client, conversationId, exitParent],
  );

  const send = useCallback((text: string) => run(newClientMessageId(), text, "send"), [run]);

  /** "Try again" on a failed reply: the SAME clientMessageId, so the server never stores the message twice. */
  const retry = useCallback(
    (clientMessageId: string) => {
      const turn = chat.turns.find((t) => t.clientMessageId === clientMessageId);
      return turn ? run(clientMessageId, turn.userText, "retry") : Promise.resolve();
    },
    [chat.turns, run],
  );

  /** Diagnostics: send the last message again with its id. After a stored reply the server replays it. */
  const resend = useCallback(() => {
    const last = lastSent.current;
    return last ? run(last.clientMessageId, last.text, "resend") : Promise.resolve();
  }, [run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const start = useCallback(
    async (childId: string, topic: string) => {
      abortRef.current?.abort();
      setStarting(true);
      setStartError(null);
      try {
        const created = await client.createAiConversation(childId, topic);
        dispatch({ type: "reset" });
        lastSent.current = null;
        setConversation(created);
      } catch (error) {
        if (isAbortError(error)) return;
        if (isChatApiError(error) && (error.code === ChatErrorCode.InvalidToken || error.code === ChatErrorCode.MissingToken)) {
          exitParent("refused");
          return;
        }
        setStartError(error);
      } finally {
        setStarting(false);
      }
    },
    [client, exitParent],
  );

  /** Back to the topic picker (a different child, or "New chat"). */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "reset" });
    setConversation(null);
    setStartError(null);
    lastSent.current = null;
  }, []);

  const dismissNotice = useCallback(() => dispatch({ type: "dismiss-notice" }), []);

  return {
    chat: chat as AiChatState,
    conversation,
    streaming: isBusy(chat),
    starting,
    startError,
    rows,
    abortAfterFirstDelta,
    setAbortAfterFirstDelta,
    hasTurns: chat.turns.length > 0,
    send,
    retry,
    resend,
    stop,
    start,
    reset,
    dismissNotice,
  };
}
