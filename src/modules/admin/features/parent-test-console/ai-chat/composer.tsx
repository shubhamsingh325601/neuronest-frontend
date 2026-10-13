"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** The server's real limit (default 1000, 2000 at most) is not exposed yet; see the backend requests in plan 0003. */
export const DEFAULT_MAX_CHARS = 1000;
/** The counter appears once this share of the limit is used. */
const COUNTER_FROM = 0.8;
const MAX_ROWS = 6;

export interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  /** A reply is being written: the send button becomes a Stop square. */
  streaming: boolean;
  /** No chat to type into (no topic yet, or the chat ended). */
  disabled: boolean;
  placeholder: string;
  maxChars?: number;
}

/**
 * Auto-growing message box. Enter sends, Shift+Enter adds a line (and Enter during IME composition is left
 * alone). While a reply streams the box stays usable for the next draft, but sending waits.
 */
export function Composer({ value, onChange, onSend, onStop, streaming, disabled, placeholder, maxChars = DEFAULT_MAX_CHARS }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to MAX_ROWS lines, then scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const line = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_ROWS + 20)}px`;
  }, [value]);

  const length = value.length;
  const tooLong = length > maxChars;
  const canSend = !disabled && !streaming && value.trim().length > 0 && !tooLong;
  const showCounter = length >= maxChars * COUNTER_FROM;

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) onSend();
  }

  return (
    <div className="grid gap-1.5">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-background p-2 transition-colors focus-within:border-ring",
          disabled && "opacity-60",
          tooLong && "border-destructive",
        )}
      >
        <textarea
          ref={ref}
          value={value}
          rows={1}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Message"
          aria-invalid={tooLong}
          className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[0.95rem] leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the answer"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
          >
            <Square className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:scale-95 disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex min-h-4 items-center justify-between px-2 text-xs text-muted-foreground">
        <span>Enter to send, Shift+Enter for a new line</span>
        {showCounter ? (
          <span className={cn("tabular-nums", tooLong && "font-semibold text-destructive")} aria-live="polite">
            {length} / {maxChars}
          </span>
        ) : null}
      </div>
    </div>
  );
}
