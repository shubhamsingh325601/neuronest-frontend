"use client";

import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import { generatePassword, type ExpertFieldErrors, type ExpertFormValues } from "../api/form";
import { EXPERT_LIMITS } from "../api/types";

interface ExpertFieldsProps {
  values: ExpertFormValues;
  errors: ExpertFieldErrors;
  onChange: (name: keyof ExpertFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPassword: (value: string) => void;
  passwordLabel: string;
  passwordDescription: string;
  description: string;
  disabled?: boolean;
}

/** Account card shared by the add and edit forms. The password is shown on request so the admin can pass it on. */
export function ExpertFields({
  values,
  errors,
  onChange,
  onPassword,
  passwordLabel,
  passwordDescription,
  description,
  disabled,
}: ExpertFieldsProps) {
  const [visible, setVisible] = useState(false);
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
        <div className="grid gap-2 sm:col-span-2">
          <Field label={passwordLabel} error={errors.password} description={passwordDescription}>
            <Input
              type={visible ? "text" : "password"}
              value={values.password}
              onChange={onChange("password")}
              autoComplete="new-password"
              maxLength={EXPERT_LIMITS.passwordMax}
              disabled={disabled}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVisible((current) => !current)}
              aria-pressed={visible}
              disabled={disabled}
            >
              {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />} {visible ? "Hide password" : "Show password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setVisible(true);
                onPassword(generatePassword());
              }}
              disabled={disabled}
            >
              <Wand2 aria-hidden="true" /> Generate one
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
