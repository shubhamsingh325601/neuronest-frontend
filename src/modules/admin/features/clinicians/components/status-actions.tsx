"use client";

import { MailPlus, UserCheck, UserX } from "lucide-react";
import { toast } from "../../../notifications/toast";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { Button } from "../../../ui/button";
import { ConfirmDialog } from "../../../ui/confirm-dialog";
import type { ClinicianDetail } from "../api/types";
import { useClinicianStatus, useResendInvitation } from "../hooks/use-clinicians";

function failure(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.code === ErrorCode.ClinicianNotInvited) return "This clinician has already activated their account. Reload to see the current state.";
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. Try again shortly.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
  }
  return fallback;
}

/** Resend invitation (INVITED), suspend (ACTIVE / INVITED) and reactivate (SUSPENDED / DEACTIVATED). */
export function StatusActions({ clinician }: { clinician: ClinicianDetail }) {
  const resend = useResendInvitation(clinician.id);
  const status = useClinicianStatus(clinician.id);
  const canSuspend = clinician.status === "ACTIVE" || clinician.status === "INVITED";
  const canReactivate = clinician.status === "SUSPENDED" || clinician.status === "DEACTIVATED";

  async function run(action: "suspend" | "reactivate") {
    try {
      await status.mutateAsync(action);
      toast.success(action === "suspend" ? `${clinician.name} was suspended` : `${clinician.name} was reactivated`);
    } catch (error) {
      toast.error(action === "suspend" ? "Could not suspend" : "Could not reactivate", {
        description: failure(error, "Something went wrong. Please try again."),
      });
      throw error; // keeps the confirm dialog open
    }
  }

  function sendInvitation() {
    resend.mutate(undefined, {
      onSuccess: () => toast.success("Invitation sent", { description: `A new setup link is on its way to ${clinician.email}.` }),
      onError: (error) =>
        toast.error("Could not resend the invitation", { description: failure(error, "Something went wrong. Please try again.") }),
    });
  }

  return (
    <>
      {clinician.status === "INVITED" ? (
        <Button variant="outline" onClick={sendInvitation} disabled={resend.isPending}>
          <MailPlus aria-hidden="true" /> {resend.isPending ? "Sending…" : "Resend invitation"}
        </Button>
      ) : null}
      {canSuspend ? (
        <ConfirmDialog
          destructive
          title={`Suspend ${clinician.name}?`}
          description="They cannot sign in until you reactivate them."
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
          title={`Reactivate ${clinician.name}?`}
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
