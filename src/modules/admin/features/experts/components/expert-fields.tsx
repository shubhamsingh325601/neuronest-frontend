"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import { type ExpertFieldErrors, type ExpertFormValues } from "../api/form";
import { EXPERT_LIMITS } from "../api/types";
import { PasswordField } from "./password-field";

interface ExpertFieldsProps {
  values: ExpertFormValues;
  errors: ExpertFieldErrors;
  onChange: (name: keyof ExpertFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
  /** Present on the add form only; the edit form leaves the password to the reset card. */
  password?: { label: string; description: string; onChange: (value: string) => void };
  disabled?: boolean;
}

/** Account card shared by the add and edit forms. */
export function ExpertFields({ values, errors, onChange, description, password, disabled }: ExpertFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name}>
          <Input value={values.name} onChange={onChange("name")} autoComplete="off" maxLength={EXPERT_LIMITS.name} disabled={disabled} />
        </Field>
        <Field label="Email address" error={errors.email} description="They sign in with this address.">
          <Input type="email" value={values.email} onChange={onChange("email")} autoComplete="off" maxLength={EXPERT_LIMITS.email} disabled={disabled} />
        </Field>
        {password ? (
          <div className="sm:col-span-2">
            <PasswordField
              label={password.label}
              description={password.description}
              value={values.password}
              error={errors.password}
              onChange={password.onChange}
              disabled={disabled}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
