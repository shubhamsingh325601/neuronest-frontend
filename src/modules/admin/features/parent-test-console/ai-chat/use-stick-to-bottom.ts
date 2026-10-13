"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Within this many px of the bottom counts as "at the bottom". */
const NEAR_BOTTOM_PX = 48;

/**
 * Keeps a scroller pinned to its newest content, unless the person scrolled up to read. Then it stays put and
 * `hasNew` turns on so a "New reply" pill can offer the way back down.
 */
export function useStickToBottom() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [hasNew, setHasNew] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (stuck.current) setHasNew(false);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (stuck.current) scroller.scrollTop = scroller.scrollHeight;
      else setHasNew(true);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  /** Jump to the newest content and resume following it. */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    stuck.current = true;
    setHasNew(false);
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /** Sending a message always follows the conversation, even if the person had scrolled up. */
  const follow = useCallback(() => {
    stuck.current = true;
  }, []);

  return { scrollRef, contentRef, onScroll, hasNew, scrollToBottom, follow };
}
