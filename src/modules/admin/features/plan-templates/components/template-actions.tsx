"use client";

import { Archive, Send } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import type { PlanTemplate } from "../api/types";
import { usePlanTemplateAction } from "../hooks/use-plan-templates";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) return "This template could not be found. Reload and try again.";
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Nothing was changed.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Publish (DRAFT only) and archive (DRAFT or PUBLISHED). Both are one-way, so each asks first. The backend would
 * also accept publishing an ARCHIVED template, so the UI is what keeps that from happening.
 */
export function TemplateActions({ template }: { template: PlanTemplate }) {
  const action = usePlanTemplateAction(template.id);

  async function run(kind: "publish" | "archive") {
    try {
      await action.mutateAsync(kind);
      toast.success(kind === "publish" ? `"${template.title}" was published` : `"${template.title}" was archived`);
    } catch (error) {
      toast.error(kind === "publish" ? "Could not publish" : "Could not archive", { description: failure(error) });
      throw error; // keeps the confirm dialog open
    }
  }

  return (
    <>
      {template.status === "DRAFT" ? (
        <ConfirmDialog
          title="Publish this template?"
          description="Publishing cannot be undone. Once published, the days can no longer be edited. You can still archive the template later."
          confirmLabel="Publish"
          onConfirm={() => run("publish")}
          trigger={
            <Button>
              <Send aria-hidden="true" /> Publish
            </Button>
          }
        />
      ) : null}
      {template.status !== "ARCHIVED" ? (
        <ConfirmDialog
          destructive
          title="Archive this template?"
          description="Archiving is permanent: there is no way to bring an archived template back. Plans already created from it are not changed."
          confirmLabel="Archive"
          onConfirm={() => run("archive")}
          trigger={
            <Button variant="outline">
              <Archive aria-hidden="true" /> Archive
            </Button>
          }
        />
      ) : null}
    </>
  );
}
