"use client";

import { Square } from "lucide-react";
import { Button } from "../../../ui/button";
import { offersInlineStop, thinkingLabel } from "../ai-copy";

/**
 * Shown from the moment a message is sent until the first words appear, so nothing ever looks stuck. The label
 * comes from `thinkingLabel`: neutral wording, driven by the clock (and by `status` events once the backend
 * sends them). It never claims to know what the model is doing.
 */
export function ThinkingIndicator({
  statusPhase,
  elapsedMs,
  onStop,
}: {
  statusPhase: string | null;
  elapsedMs: number;
  onStop: () => void;
}) {
  const label = thinkingLabel(statusPhase, elapsedMs);
  return (
    <div className="flex flex-wrap items-center gap-3 py-0.5" role="status" aria-live="polite">
      <span className="pc-shimmer text-sm font-medium">{label}</span>
      {offersInlineStop(elapsedMs) ? (
        <Button size="sm" variant="outline" onClick={onStop}>
          <Square aria-hidden="true" className="fill-current" />
          Stop
        </Button>
      ) : null}
    </div>
  );
}

export function AiOrb({ active = false, size = "md" }: { active?: boolean; size?: "md" | "lg" }) {
  return <span className="pc-orb" data-active={active} data-size={size} aria-hidden="true" />;
}
