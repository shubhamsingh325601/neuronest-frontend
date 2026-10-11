"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "../../../notifications/toast";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { Button } from "../../../ui/button";
import { emptyInviteForm, parseInviteForm, type InviteFieldErrors, type InviteFormValues } from "../api/form";
import { ClinicianFields } from "./clinician-fields";
import { useInviteClinician } from "../hooks/use-clinicians";

/** Screen copy for a failed invite, decided by `code`. Field-level problems are returned separately. */
export function describeInviteError(error: unknown): { form?: string; fields?: InviteFieldErrors } {
  if (isApiError(error)) {
    switch (error.code) {
      case ErrorCode.EmailAlreadyRegistered:
        return { fields: { email: "This email address is already registered. Use a different one." } };
      case ErrorCode.ValidationError:
        return { form: error.errors.length > 0 ? error.errors.join(" ") : "Some details were not accepted. Check them and try again." };
      case ErrorCode.RateLimited:
        return {
          form:
            error.retryAfter !== undefined
              ? `Too many requests. Wait ${error.retryAfter} second${error.retryAfter === 1 ? "" : "s"} and try again.`
              : "Too many requests. Wait a moment and try again.",
        };
      case ErrorCode.BackendUnreachable:
        return { form: "The NeuroNest service could not be reached. Nothing was sent; try again shortly." };
      case ErrorCode.InsufficientPermissions:
        return { form: "Your account is not allowed to invite clinicians." };
    }
  }
  return { form: "The invitation could not be created. Please try again." };
}

export function InviteForm() {
  const router = useRouter();
  const invite = useInviteClinician();
  const [values, setValues] = useState<InviteFormValues>(emptyInviteForm);
  const [errors, setErrors] = useState<InviteFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  const set = (name: keyof InviteFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invite.isPending) return;
    setFormError(undefined);
    const parsed = parseInviteForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    invite.mutate(parsed.input, {
      onSuccess: (clinician) => {
        // The backend sends the email best-effort, so the invitation exists either way.
        toast.success(`Invitation created for ${clinician.name}`, {
          description: `A setup link is being sent to ${clinician.email}.`,
        });
        router.push(`${ADMIN_ROUTES.clinicians}?status=INVITED`);
      },
      onError: (error) => {
        const copy = describeInviteError(error);
        setErrors(copy.fields ?? {});
        setFormError(copy.form);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid max-w-3xl gap-6">
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}

      <ClinicianFields
        values={values}
        errors={errors}
        onChange={set}
        accountDescription="They receive an email with a link to set a password and activate their account."
        emailDescription="Can be changed until they accept the invitation."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending ? "Sending invitation…" : "Send invitation"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={ADMIN_ROUTES.clinicians}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
