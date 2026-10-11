"use client";

import { UserCheck, UserX } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import type { ExpertDetail } from "../api/types";
import { useExpertStatus } from "../hooks/use-experts";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Try again shortly.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
    if (error.status === 409 || error.status === 400) return error.detail ?? "That change is not allowed for this account.";
  }
  return "Something went wrong. Please try again.";
}

/** Suspend (ACTIVE) and reactivate (SUSPENDED / DEACTIVATED). */
export function StatusActions({ expert }: { expert: ExpertDetail }) {
  const status = useExpertStatus(expert.id);

  async function run(action: "suspend" | "reactivate") {
    try {
      await status.mutateAsync(action);
      toast.success(action === "suspend" ? `${expert.name} was suspended` : `${expert.name} was reactivated`);
    } catch (error) {
      toast.error(action === "suspend" ? "Could not suspend" : "Could not reactivate", { description: failure(error) });
      throw error; // keeps the confirm dialog open
    }
  }

  if (expert.status === "ACTIVE") {
    return (
      <ConfirmDialog
        destructive
        title={`Suspend ${expert.name}?`}
        description="They are signed out and cannot sign in until you reactivate them. Their children stay assigned."
        confirmLabel="Suspend"
        onConfirm={() => run("suspend")}
        trigger={
          <Button variant="outline">
            <UserX aria-hidden="true" /> Suspend
          </Button>
        }
      />
    );
  }
  return (
    <ConfirmDialog
      title={`Reactivate ${expert.name}?`}
      description="They will be able to sign in again."
      confirmLabel="Reactivate"
      onConfirm={() => run("reactivate")}
      trigger={
        <Button>
          <UserCheck aria-hidden="true" /> Reactivate
        </Button>
      }
    />
  );
}
