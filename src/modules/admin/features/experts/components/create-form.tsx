"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { emptyExpertForm, parseCreateForm, type ExpertFieldErrors, type ExpertFormValues } from "../api/form";
import { useCreateExpert } from "../hooks/use-experts";
import { ExpertFields } from "./expert-fields";

/** Screen copy for a failed save, decided by `code`. Field-level problems are returned separately. */
export function describeSaveError(error: unknown): { form?: string; fields?: ExpertFieldErrors } {
  if (isApiError(error)) {
    switch (error.code) {
      case ErrorCode.EmailAlreadyRegistered:
        return { fields: { email: "This email address is already registered. Use a different one." } };
      case ErrorCode.ValidationError:
        return { form: error.errors.length > 0 ? error.errors.join(" ") : "Some details were not accepted. Check them and try again." };
      case ErrorCode.RateLimited:
        return { form: "Too many requests. Wait a moment and try again." };
      case ErrorCode.BackendUnreachable:
        return { form: "The NeuroNest service could not be reached. Nothing was saved; try again shortly." };
      case ErrorCode.InsufficientPermissions:
        return { form: "Your account is not allowed to manage experts." };
    }
    if (error.status === 404) return { form: "The expert service is not available on this server yet." };
  }
  return { form: "The expert could not be saved. Please try again." };
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function CreateForm() {
  const router = useRouter();
  const create = useCreateExpert();
  const [values, setValues] = useState<ExpertFormValues>(emptyExpertForm);
  const [errors, setErrors] = useState<ExpertFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  const set = (name: keyof ExpertFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending) return;
    setFormError(undefined);
    const parsed = parseCreateForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    create.mutate(parsed.input, {
      onSuccess: (expert) => {
        toast.success(`${expert.name} can now sign in`, { description: "Share the password with them yourself; no email was sent." });
        router.push(`${ADMIN_ROUTES.experts}/${encodeURIComponent(expert.id)}`);
      },
      onError: (error) => {
        const copy = describeSaveError(error);
        setErrors(copy.fields ?? {});
        setFormError(copy.form);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid max-w-3xl gap-6">
      {formError ? <ErrorBanner message={formError} /> : null}
      <ExpertFields
        values={values}
        errors={errors}
        onChange={set}
        onPassword={(password) => setValues((current) => ({ ...current, password }))}
        description="The account is active straight away. No email is sent, so pass the sign-in details on yourself."
        passwordLabel="Password"
        passwordDescription="At least 10 characters. You can change it later from the expert's page."
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create expert"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={ADMIN_ROUTES.experts}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
