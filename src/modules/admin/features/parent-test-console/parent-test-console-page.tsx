"use client";

import { FlaskConical, PowerOff, Settings2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../app-shell/page-header";
import { EmptyState } from "../../app-shell/states";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { AiChatPanel } from "./ai-chat/ai-chat-panel";
import { ConsoleBanner } from "./components/console-banner";
import { ParentPicker } from "./components/parent-picker";
import { describeImpersonationError } from "./error-copy";
import { ExpertChatPanel } from "./expert-chat/expert-chat-panel";
import { parentConsoleApiOrigin } from "./flag";
import { useActAsParent } from "./hooks";
import { consoleKeys } from "./keys";
import { useConsoleSession } from "./state/session";

type Tab = "ai" | "expert";

const TABS: { value: Tab; label: string }[] = [
  { value: "ai", label: "AI chat" },
  { value: "expert", label: "Expert chat" },
];

const ENDED_COPY = {
  expired: "The impersonation token expired. Act as a parent again to continue.",
  refused: "Session expired, act as this parent again.",
} as const;

/**
 * Temporary Parent test console (plan 0003). The admin acts as a parent through a short-lived impersonation
 * token, and exercises the AI chat and the parent-to-expert chat against the backend directly. Delete this
 * folder, the route, and the `parent-console:` lines to remove it.
 */
export function ParentTestConsolePage() {
  const origin = parentConsoleApiOrigin();
  const parentToken = useConsoleSession((s) => s.parentToken);
  const endedBecause = useConsoleSession((s) => s.endedBecause);
  const act = useActAsParent();
  const [tab, setTab] = useState<Tab>("ai");
  const queryClient = useQueryClient();

  // Exit, expiry or a refused token: the previous parent's children and topics must not linger in the cache.
  useEffect(() => {
    if (!parentToken) queryClient.removeQueries({ queryKey: consoleKeys.all });
  }, [parentToken, queryClient]);

  const header = (
    <PageHeader
      eyebrow={
        <Badge tone="warning">
          <FlaskConical aria-hidden="true" />
          Temporary test tool
        </Badge>
      }
      title="Parent test console"
      description="Act as a parent to try the AI chat and the live chat with an expert. Use test accounts: what you send is stored as real data on them."
    />
  );

  if (!origin) {
    return (
      <div className="grid gap-6">
        {header}
        <EmptyState
          icon={Settings2}
          title="The backend URL is not set"
          description="Set API_BASE_URL to the backend origin (scheme://host[:port], no /v1) and restart the dev server."
        />
      </div>
    );
  }

  const failure = act.isError ? describeImpersonationError(act.error) : null;
  if (failure?.impersonationDisabled) {
    return (
      <div className="grid gap-6">
        {header}
        <EmptyState
          icon={PowerOff}
          title={failure.title}
          description={failure.description}
          action={
            <Button variant="outline" onClick={() => act.reset()}>
              Check again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {header}

      {!parentToken ? (
        <>
          {endedBecause ? (
            <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
              {ENDED_COPY[endedBecause]}
            </p>
          ) : null}
          <ParentPicker act={act} />
        </>
      ) : (
        <>
          <ConsoleBanner />
          <div role="group" aria-label="Console panel" className="flex w-fit gap-1 rounded-xl border p-1">
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={tab === item.value}
                onClick={() => setTab(item.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Both stay mounted so switching tabs keeps the transcript and the live streams. */}
          <div hidden={tab !== "ai"}>
            <AiChatPanel />
          </div>
          <div hidden={tab !== "expert"}>
            <ExpertChatPanel />
          </div>
        </>
      )}
    </div>
  );
}
