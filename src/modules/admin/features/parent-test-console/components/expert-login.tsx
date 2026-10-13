"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import { signInExpert } from "../api";
import { describeLoginError } from "../error-copy";
import { parentConsoleApiOrigin } from "../flag";
import { useConsoleSession } from "../state/session";

/**
 * A real expert sign-in (impersonation is parent-only): `POST auth/login` straight to the backend, then
 * `GET users/me` to confirm the role. The token goes to the in-memory session store; the password is read
 * from the form and cleared before the request starts, so it is never held in React state.
 */
export function ExpertLogin() {
  const expert = useConsoleSession((s) => s.expert);
  const startExpert = useConsoleSession((s) => s.startExpert);
  const exitExpert = useConsoleSession((s) => s.exitExpert);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const origin = parentConsoleApiOrigin();
    if (!origin || !email || !password) return;
    form.reset(); // the password leaves the DOM before the network call
    setFailure(null);
    setPending(true);
    try {
      const result = await signInExpert(origin, email, password);
      startExpert(result.token, result.user);
    } catch (error) {
      setFailure(describeLoginError(error));
    } finally {
      setPending(false);
    }
  }

  if (expert) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expert signed in</CardTitle>
          <CardDescription>
            {expert.name} ({expert.email}). The token is held in memory only and is dropped on Exit or reload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={exitExpert}>
            <LogOut aria-hidden="true" />
            Sign the expert out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in as the expert</CardTitle>
        <CardDescription>
          Use an expert account created on the Experts page, with the test child assigned. Sign-in is limited to 5 attempts per minute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-md gap-4" autoComplete="off">
          <Field label="Expert email">
            <Input name="email" type="email" required autoComplete="off" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required autoComplete="new-password" />
          </Field>
          {failure ? (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
              <span className="font-semibold">{failure.title}.</span> <span className="text-muted-foreground">{failure.description}</span>
            </p>
          ) : null}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
