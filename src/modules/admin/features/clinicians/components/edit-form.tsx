"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "../../../notifications/toast";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { Button } from "../../../ui/button";
import { parseEditForm, type InviteFieldErrors, type InviteFormValues } from "../api/form";
import type { ClinicianDetail } from "../api/types";
import { useUpdateClinician } from "../hooks/use-clinicians";
import { ClinicianFields } from "./clinician-fields";

export function toFormValues(clinician: ClinicianDetail): InviteFormValues {
  return {
    name: clinician.name,
    email: clinician.email,
    phone: clinician.profile.phone ?? "",
    specialisation: clinician.profile.specialisation ?? "",
    qualifications: clinician.profile.qualifications ?? "",
    licenseNumber: clinician.profile.licenseNumber ?? "",
    bio: clinician.profile.bio ?? "",
  };
}

/** Screen copy for a failed save, decided by `code`. */
export function describeEditError(error: unknown): { form?: string; fields?: InviteFieldErrors } {
  if (isApiError(error)) {
    switch (error.code) {
      case ErrorCode.EmailAlreadyRegistered:
        return { fields: { email: "This email address is already registered. Use a different one." } };
      case ErrorCode.ClinicianEmailLocked:
        return { form: "The email can't be changed after the clinician has accepted their invitation. Reload to see the current state." };
      case ErrorCode.ValidationError:
        return { form: error.errors.length > 0 ? error.errors.join(" ") : "Some details were not accepted. Check them and try again." };
      case ErrorCode.RateLimited:
        return { form: "Too many requests. Wait a moment and try again." };
      case ErrorCode.BackendUnreachable:
        return { form: "The NeuroNest service could not be reached. Nothing was saved; try again shortly." };
      case ErrorCode.InsufficientPermissions:
        return { form: "Your account is not allowed to edit clinicians." };
    }
  }
  return { form: "The changes could not be saved. Please try again." };
}

export function EditForm({ clinician }: { clinician: ClinicianDetail }) {
  const update = useUpdateClinician(clinician.id);
  const original = toFormValues(clinician);
  const [values, setValues] = useState<InviteFormValues>(original);
  const [errors, setErrors] = useState<InviteFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const emailEditable = clinician.status === "INVITED";

  const set = (name: keyof InviteFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (update.isPending) return;
    setFormError(undefined);
    const parsed = parseEditForm(values, { emailEditable, original });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (!parsed.changed) {
      toast.info("Nothing to save", { description: "No details were changed." });
      return;
    }
    update.mutate(parsed.input, {
      onSuccess: (saved) => {
        setValues(toFormValues(saved));
        toast.success("Changes saved", {
          description: parsed.input.email ? `A new setup link is being sent to ${saved.email}.` : undefined,
        });
      },
      onError: (error) => {
        const copy = describeEditError(error);
        setErrors(copy.fields ?? {});
        setFormError(copy.form);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid max-w-3xl gap-6">
      {formError ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}
      <ClinicianFields
        values={values}
        errors={errors}
        onChange={set}
        accountDescription="Name and contact details."
        emailDescription="Changing the email sends a new setup link to the new address."
        emailLockedReason={emailEditable ? undefined : "Locked: the clinician has already accepted their invitation."}
      />
      <div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
