"use client";

import { UserCheck, UserX } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import type { UserDetail } from "../api/types";
import { useMeId, useUserStatus } from "../hooks/use-users";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Try again shortly.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
    if (error.status === 409 || error.status === 400) return error.detail ?? "That change is not allowed for this account.";
  }
  return "Something went wrong. Please try again.";
}

/** Suspend (ACTIVE / INVITED) and reactivate (SUSPENDED / DEACTIVATED). You cannot act on your own account. */
export function UserStatusActions({ user }: { user: UserDetail }) {
  const mutation = useUserStatus(user.id);
  const me = useMeId();
  if (me.data === user.id) return null;

  const canSuspend = user.status === "ACTIVE" || user.status === "INVITED";
  const canReactivate = user.status === "SUSPENDED" || user.status === "DEACTIVATED";

  async function run(action: "suspend" | "reactivate") {
    try {
      await mutation.mutateAsync(action);
      toast.success(action === "suspend" ? `${user.name} was suspended` : `${user.name} was reactivated`);
    } catch (error) {
      toast.error(action === "suspend" ? "Could not suspend" : "Could not reactivate", { description: failure(error) });
      throw error; // keeps the confirm dialog open
    }
  }

  return (
    <>
      {canSuspend ? (
        <ConfirmDialog
          destructive
          title={`Suspend ${user.name}?`}
          description="They are signed out everywhere and cannot sign in until you reactivate them."
          confirmLabel="Suspend"
          onConfirm={() => run("suspend")}
          trigger={
            <Button variant="outline">
              <UserX aria-hidden="true" /> Suspend
            </Button>
          }
        />
      ) : null}
      {canReactivate ? (
        <ConfirmDialog
          title={`Reactivate ${user.name}?`}
          description="They will be able to sign in again."
          confirmLabel="Reactivate"
          onConfirm={() => run("reactivate")}
          trigger={
            <Button>
              <UserCheck aria-hidden="true" /> Reactivate
            </Button>
          }
        />
      ) : null}
    </>
  );
}
