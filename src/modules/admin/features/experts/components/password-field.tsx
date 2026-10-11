"use client";

import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { Button } from "../../../ui/button";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import { generatePassword } from "../api/form";
import { EXPERT_LIMITS } from "../api/types";

interface PasswordFieldProps {
  label: string;
  description: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Password input that can be revealed or generated, so the admin can read it out and pass it on. */
export function PasswordField({ label, description, value, error, onChange, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="grid gap-2">
      <Field label={label} error={error} description={description}>
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          maxLength={EXPERT_LIMITS.passwordMax}
          disabled={disabled}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setVisible((current) => !current)} aria-pressed={visible} disabled={disabled}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />} {visible ? "Hide password" : "Show password"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setVisible(true);
            onChange(generatePassword());
          }}
          disabled={disabled}
        >
          <Wand2 aria-hidden="true" /> Generate one
        </Button>
      </div>
    </div>
  );
}
