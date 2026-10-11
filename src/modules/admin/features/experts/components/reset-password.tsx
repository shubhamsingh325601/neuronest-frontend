"use client";

import { useState } from "react";
import { z } from "zod";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { passwordSchema } from "../api/form";
import type { ExpertDetail } from "../api/types";
import { useResetExpertPassword } from "../hooks/use-experts";
import { ErrorBanner } from "./create-form";
import { PasswordField } from "./password-field";

function failure(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === ErrorCode.ValidationError) return error.errors.length > 0 ? error.errors.join(" ") : "That password was not accepted.";
    if (error.code === ErrorCode.RateLimited) return "Too many requests. Wait a moment and try again.";
    if (error.code === ErrorCode.BackendUnreachable) return "The NeuroNest service could not be reached. The password was not changed.";
    if (error.code === ErrorCode.InsufficientPermissions) return "Your account is not allowed to do this.";
    if (error.status === 404) return "This expert could not be found. Reload and try again.";
  }
  return "The password could not be changed. Please try again.";
}

/** Sets a new password for the expert. The old one stops working and their refresh sessions are revoked. */
export function ResetPassword({ expert }: { expert: ExpertDetail }) {
  const reset = useResetExpertPassword(expert.id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reset.isPending) return;
    setFormError(undefined);
    const parsed = z.object({ password: passwordSchema }).safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    reset.mutate(parsed.data.password, {
      onSuccess: () => {
        setPassword("");
        toast.success("Password changed", { description: "Pass the new password on to them yourself; no email was sent." });
      },
      onError: (caught) => setFormError(failure(caught)),
    });
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Sets a new password and revokes the expert&apos;s refresh sessions, so they need to sign in again with it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {formError ? <ErrorBanner message={formError} /> : null}
          <PasswordField
            label="New password"
            description="At least 10 characters."
            value={password}
            error={error}
            onChange={(value) => {
              setPassword(value);
              setError(undefined);
            }}
            disabled={reset.isPending}
          />
          <div>
            <Button type="submit" variant="outline" disabled={reset.isPending || password === ""}>
              {reset.isPending ? "Changing…" : "Change password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
