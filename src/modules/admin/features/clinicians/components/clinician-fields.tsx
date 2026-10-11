import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import type { InviteFieldErrors, InviteFormValues } from "../api/form";
import { CLINICIAN_LIMITS } from "../api/types";

const TEXTAREA_CLASS =
  "flex min-h-24 w-full min-w-0 rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

interface ClinicianFieldsProps {
  values: InviteFormValues;
  errors: InviteFieldErrors;
  onChange: (name: keyof InviteFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Email is locked once the clinician has accepted the invitation. */
  emailLockedReason?: string;
  accountDescription: string;
  emailDescription?: string;
  disabled?: boolean;
}

/** Account + profile cards shared by the invite and edit forms. */
export function ClinicianFields({
  values,
  errors,
  onChange,
  emailLockedReason,
  accountDescription,
  emailDescription,
  disabled,
}: ClinicianFieldsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{accountDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <Input value={values.name} onChange={onChange("name")} autoComplete="off" maxLength={CLINICIAN_LIMITS.name} placeholder="Dr. Sam Okafor" disabled={disabled} />
          </Field>
          <Field label="Email address" error={errors.email} description={emailLockedReason ?? emailDescription}>
            <Input type="email" value={values.email} onChange={onChange("email")} autoComplete="off" maxLength={CLINICIAN_LIMITS.email} placeholder="sam.okafor@clinic.example" disabled={disabled || Boolean(emailLockedReason)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile (optional)</CardTitle>
          <CardDescription>Shown on their clinician profile. Leave blank to fill in later.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" error={errors.phone}>
            <Input type="tel" value={values.phone} onChange={onChange("phone")} maxLength={CLINICIAN_LIMITS.phone} disabled={disabled} />
          </Field>
          <Field label="Licence number" error={errors.licenseNumber}>
            <Input value={values.licenseNumber} onChange={onChange("licenseNumber")} maxLength={CLINICIAN_LIMITS.licenseNumber} disabled={disabled} />
          </Field>
          <Field label="Specialisation" error={errors.specialisation} className="sm:col-span-2">
            <Input value={values.specialisation} onChange={onChange("specialisation")} maxLength={CLINICIAN_LIMITS.specialisation} disabled={disabled} />
          </Field>
          <Field label="Qualifications" error={errors.qualifications} className="sm:col-span-2">
            <textarea className={TEXTAREA_CLASS} rows={3} value={values.qualifications} onChange={onChange("qualifications")} maxLength={CLINICIAN_LIMITS.qualifications} disabled={disabled} />
          </Field>
          <Field label="Bio" error={errors.bio} className="sm:col-span-2">
            <textarea className={TEXTAREA_CLASS} rows={5} value={values.bio} onChange={onChange("bio")} maxLength={CLINICIAN_LIMITS.bio} disabled={disabled} />
          </Field>
        </CardContent>
      </Card>
    </>
  );
}
