import { z } from "zod";
import { CLINICIAN_LIMITS, PROFILE_FIELDS, type CreateClinicianInput, type UpdateClinicianInput } from "./types";

// Invite-form validation: same rules as the backend DTO, so most mistakes are caught before the request.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optional = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

export const inviteFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the clinician's name.")
    .max(CLINICIAN_LIMITS.name, `Name must be ${CLINICIAN_LIMITS.name} characters or fewer.`),
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address.")
    .max(CLINICIAN_LIMITS.email, `Email must be ${CLINICIAN_LIMITS.email} characters or fewer.`)
    .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address."),
  phone: optional(CLINICIAN_LIMITS.phone, "Phone"),
  specialisation: optional(CLINICIAN_LIMITS.specialisation, "Specialisation"),
  qualifications: optional(CLINICIAN_LIMITS.qualifications, "Qualifications"),
  licenseNumber: optional(CLINICIAN_LIMITS.licenseNumber, "Licence number"),
  bio: optional(CLINICIAN_LIMITS.bio, "Bio"),
});

export type InviteFormValues = z.input<typeof inviteFormSchema>;
export type InviteFieldErrors = Partial<Record<keyof InviteFormValues, string>>;

export const emptyInviteForm: InviteFormValues = {
  name: "",
  email: "",
  phone: "",
  specialisation: "",
  qualifications: "",
  licenseNumber: "",
  bio: "",
};

export type InviteParse =
  | { ok: true; input: CreateClinicianInput }
  | { ok: false; errors: InviteFieldErrors };

/** Validates the form and builds the request body: blank profile fields (and an all-blank profile) are omitted. */
export function parseInviteForm(values: InviteFormValues): InviteParse {
  const result = inviteFormSchema.safeParse(values);
  if (!result.success) {
    const errors: InviteFieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof InviteFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const { name, email, ...rest } = result.data;
  const profile: NonNullable<CreateClinicianInput["profile"]> = {};
  for (const field of PROFILE_FIELDS) if (rest[field]) profile[field] = rest[field];
  return { ok: true, input: { name, email, ...(Object.keys(profile).length > 0 ? { profile } : {}) } };
}

export interface EditContext {
  /** Email can only change while INVITED (CLINICIAN_EMAIL_LOCKED afterwards). */
  emailEditable: boolean;
  original: InviteFormValues;
}

export type EditParse =
  | { ok: true; input: UpdateClinicianInput; changed: boolean }
  | { ok: false; errors: InviteFieldErrors };

/** Builds a PATCH body from the edit form: only changed fields; a blanked profile field is sent as null to clear it. */
export function parseEditForm(values: InviteFormValues, { emailEditable, original }: EditContext): EditParse {
  const result = inviteFormSchema.safeParse(values);
  if (!result.success) {
    const errors: InviteFieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof InviteFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const next = result.data;
  const before = inviteFormSchema.parse(original);
  const input: UpdateClinicianInput = {};
  if (next.name !== before.name) input.name = next.name;
  if (emailEditable && next.email.toLowerCase() !== before.email.toLowerCase()) input.email = next.email;
  const profile: NonNullable<UpdateClinicianInput["profile"]> = {};
  for (const field of PROFILE_FIELDS) if (next[field] !== before[field]) profile[field] = next[field] || null;
  if (Object.keys(profile).length > 0) input.profile = profile;
  return { ok: true, input, changed: Object.keys(input).length > 0 };
}
