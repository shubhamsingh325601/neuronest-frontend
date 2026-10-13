"use client";

import { motion } from "motion/react";
import { ExternalLink, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Topic } from "@/modules/chat-client/types";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const CHIP =
  "inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-left text-sm font-medium transition-colors";

/**
 * The topics the server returned, never a hard-coded list. `AI` starts a chat; `ROUTE` opens another screen in
 * the real app (shown, not clickable here); `UNAVAILABLE` is "coming soon".
 */
export function TopicChips({
  topics,
  onPick,
  disabled = false,
  label,
}: {
  topics: readonly Topic[];
  onPick: (topic: Topic) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show" aria-label={label} className="flex flex-wrap justify-center gap-2">
      {topics.map((topic) => (
        <motion.li key={topic.id} variants={item}>
          {topic.kind === "AI" ? (
            <button
              type="button"
              title={topic.description}
              disabled={disabled}
              onClick={() => onPick(topic)}
              className={cn(CHIP, "hover:border-primary/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50")}
            >
              {topic.label}
            </button>
          ) : topic.kind === "ROUTE" ? (
            <span title={topic.description} className={cn(CHIP, "border-dashed text-muted-foreground")}>
              {topic.label}
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="text-xs font-normal">Opens in the app</span>
            </span>
          ) : (
            <button type="button" disabled title={topic.description} className={cn(CHIP, "cursor-not-allowed border-dashed text-muted-foreground opacity-70")}>
              {topic.label}
              <Lock className="size-3.5" aria-hidden="true" />
              <span className="text-xs font-normal">Coming soon</span>
            </button>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}
