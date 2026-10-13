"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Compass, Copy, Info, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isTurnActive, type AiTurn } from "@/modules/chat-client/ai-chat-state";
import { Button } from "../../../ui/button";
import { describeAiFailure, FOOTER_LABEL, REDIRECTED_LABEL, RETRACTED_LABEL } from "../ai-copy";
import { useNow } from "../hooks";
import { StreamingText } from "./streaming-text";
import { AiOrb, ThinkingIndicator } from "./thinking-indicator";
import { useSmoothReveal } from "./use-smooth-reveal";

const BUBBLE = "min-w-0 max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (permissions, insecure origin): leave the button as it was.
    }
  }
  return (
    <Button size="sm" variant="ghost" onClick={() => void copy()} aria-label="Copy the answer">
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

interface AiResponseProps {
  turn: AiTurn;
  onStop: () => void;
  onRetry: (clientMessageId: string) => void;
}

/** One AI reply, drawn from the turn's phase. See ai-chat-state.ts for the phases. */
export function AiResponse({ turn, onStop, onRetry }: AiResponseProps) {
  const active = isTurnActive(turn);
  // Ticks only while the answer is pending, to word the wait honestly (see ai-copy.ts).
  const elapsedMs = Math.max(0, useNow(active ? 500 : null) - turn.startedAt);
  const reveal = useSmoothReveal(turn.reply, active, turn.phase === "retracted");
  const hasText = turn.reply.length > 0;
  const redirected = turn.phase === "done" && turn.doneState === "REDIRECTED";

  if (turn.phase === "failed") {
    const failure = describeAiFailure(turn.failureCode);
    return (
      <div className="flex items-start gap-3">
        <AiOrb />
        <div className={cn(BUBBLE, "grid gap-2 border border-destructive/30 bg-destructive/5")} role="alert">
          {hasText ? (
            <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-muted-foreground line-through decoration-muted-foreground/40">
              {turn.reply}
            </p>
          ) : null}
          <p className="flex items-start gap-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>{failure.text}</span>
          </p>
          {hasText ? <p className="text-xs text-muted-foreground">The partly shown answer was not saved.</p> : null}
          {failure.canRetry ? (
            <div>
              <Button size="sm" variant="outline" onClick={() => onRetry(turn.clientMessageId)}>
                <RotateCcw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!hasText && active) {
    return (
      <div className="flex items-center gap-3">
        <AiOrb active />
        <ThinkingIndicator statusPhase={turn.statusPhase} elapsedMs={elapsedMs} onStop={onStop} />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AiOrb active={active || !reveal.done} />
      <AnimatePresence mode="wait" initial={false}>
        {turn.phase === "retracted" ? (
          <motion.div
            key="retracted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(BUBBLE, "grid gap-2 border border-info/30 bg-info/5")}
          >
            <p className="flex items-center gap-2 text-xs font-medium text-info">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {RETRACTED_LABEL}
            </p>
            <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">{turn.reply}</p>
          </motion.div>
        ) : (
          <motion.div
            key="live"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(BUBBLE, "grid gap-2", redirected ? "border border-dashed bg-accent/40" : "bg-muted")}
          >
            {redirected ? (
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Compass className="size-4" aria-hidden="true" />
                {REDIRECTED_LABEL}
              </p>
            ) : null}
            <StreamingText reveal={reveal} />
            {reveal.done && turn.footer ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-start gap-2 border-t pt-2 text-xs text-muted-foreground"
              >
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="sr-only">{FOOTER_LABEL}: </span>
                  {turn.footer}
                </span>
              </motion.p>
            ) : null}
            {turn.phase === "done" && reveal.done ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="-ml-2 flex">
                <CopyButton text={turn.reply} />
              </motion.div>
            ) : null}
            {turn.phase === "done" && reveal.done ? (
              <p className="sr-only" role="status">
                {turn.reply}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
