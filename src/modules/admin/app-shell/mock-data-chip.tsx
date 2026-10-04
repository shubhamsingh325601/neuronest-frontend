import { FlaskConical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// Shown whenever any mock / stub source is active, so temporary data can never be mistaken for real data.
export function MockDataChip({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
        >
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Mock data
        </span>
      </TooltipTrigger>
      <TooltipContent>Temporary stand-ins, not real data: {sources.join(", ")}.</TooltipContent>
    </Tooltip>
  );
}
