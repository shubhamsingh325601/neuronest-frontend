"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { loginAction } from "./actions";
import { SubmitButton } from "./submit-button";
import { ADMIN_ROUTES } from "../navigation/paths";
import { idleState } from "./form-state";

interface LoginFormProps {
  /** Form-level error shown before any submit (e.g. "no admin access" after a forced sign-out). */
  error?: string;
  /** Neutral notice, e.g. "Your session expired". */
  notice?: string;
  /** Validated post-login destination, posted back with the form. */
  next?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side checks give instant feedback; the Server Action validates again and talks to the backend.
export function LoginForm({ error, notice, next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, idleState);
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const fieldErrors = { ...state.fieldErrors, ...clientErrors };
  const formError = state.error ?? error;
  const formNotice = state.status === "idle" ? notice : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const found: typeof clientErrors = {};
    if (!email) found.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email)) found.email = "Enter a valid email address.";
    if (!password) found.password = "Enter your password.";
    setClientErrors(found);
    if (found.email || found.password) event.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}
      {formNotice ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formNotice}</p>
        </div>
      ) : null}

      <Field label="Email" error={fieldErrors.email}>
        <Input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@neuronest.org"
          defaultValue={state.email}
          autoFocus
        />
      </Field>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="admin-password" className="text-sm font-medium leading-none">
            Password
          </label>
          <Link
            href={ADMIN_ROUTES.forgotPassword}
            className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "admin-password-error" : undefined}
            className="pr-12"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
        {fieldErrors.password ? (
          <p id="admin-password-error" role="alert" className="text-xs font-medium text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <SubmitButton label="Sign in" pendingLabel="Signing in…" pending={pending} retryUntil={state.retryUntil} className="mt-1 w-full" />
    </form>
  );
}
