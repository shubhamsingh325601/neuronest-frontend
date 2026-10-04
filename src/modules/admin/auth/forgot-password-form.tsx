"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { FormAlert } from "./form-alert";
import { ADMIN_ROUTES } from "../navigation/paths";
import { idleState } from "./form-state";
import { forgotPasswordAction } from "./recovery-actions";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, idleState);

  if (state.status === "success") {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">{state.message}</FormAlert>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href={ADMIN_ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-5">
      {state.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" placeholder="you@neuronest.org" defaultValue={state.email} autoFocus />
      </Field>
      <SubmitButton label="Send reset link" pendingLabel="Sending…" pending={pending} retryUntil={state.retryUntil} className="w-full" />
      <Link href={ADMIN_ROUTES.login} className="rounded-sm text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
