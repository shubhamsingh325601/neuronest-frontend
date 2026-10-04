"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { FormAlert } from "./form-alert";
import { ADMIN_ROUTES } from "../navigation/paths";
import { idleState, type AuthFormState } from "./form-state";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

interface SetPasswordFormProps {
  action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  /** One-time token from the emailed link; posted back as a hidden field, never shown. */
  token: string;
  submitLabel: string;
  pendingLabel: string;
}

/** Shared by reset-password and complete-account-setup: new password + confirmation. */
export function SetPasswordForm({ action, token, submitLabel, pendingLabel }: SetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, idleState);

  if (state.status === "success") {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">{state.message}</FormAlert>
        <Button asChild size="lg" className="w-full">
          <Link href={ADMIN_ROUTES.login}>Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      {state.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}
      <Field label="New password" description="10 to 128 characters." error={state.fieldErrors?.password}>
        <PasswordInput name="password" autoComplete="new-password" autoFocus />
      </Field>
      <Field label="Confirm password" error={state.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" />
      </Field>
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} pending={pending} retryUntil={state.retryUntil} className="w-full" />
    </form>
  );
}
