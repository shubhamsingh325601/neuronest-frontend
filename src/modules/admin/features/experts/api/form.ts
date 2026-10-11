import { z } from "zod";
import { EXPERT_LIMITS, type CreateExpertInput, type UpdateExpertInput } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const name = z
  .string()
  .trim()
  .min(1, "Enter the expert's name.")
  .max(EXPERT_LIMITS.name, `Name must be ${EXPERT_LIMITS.name} characters or fewer.`);

const email = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .max(EXPERT_LIMITS.email, `Email must be ${EXPERT_LIMITS.email} characters or fewer.`)
  .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(EXPERT_LIMITS.passwordMin, `Password must be at least ${EXPERT_LIMITS.passwordMin} characters.`)
  .max(EXPERT_LIMITS.passwordMax, `Password must be ${EXPERT_LIMITS.passwordMax} characters or fewer.`);

export interface ExpertFormValues {
  name: string;
  email: string;
  password: string;
}
export type ExpertFieldErrors = Partial<Record<keyof ExpertFormValues, string>>;

export const emptyExpertForm: ExpertFormValues = { name: "", email: "", password: "" };

function collect(error: z.ZodError): ExpertFieldErrors {
  const errors: ExpertFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ExpertFormValues;
    errors[key] ??= issue.message;
  }
  return errors;
}

export type CreateParse = { ok: true; input: CreateExpertInput } | { ok: false; errors: ExpertFieldErrors };

export function parseCreateForm(values: ExpertFormValues): CreateParse {
  const result = z.object({ name, email, password: passwordSchema }).safeParse(values);
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: collect(result.error) };
}

export type EditParse =
  | { ok: true; input: UpdateExpertInput; changed: boolean }
  | { ok: false; errors: ExpertFieldErrors };

/** Builds a PATCH body with only the changed name and email. */
export function parseEditForm(values: Pick<ExpertFormValues, "name" | "email">, original: Pick<ExpertFormValues, "name" | "email">): EditParse {
  const result = z.object({ name, email }).safeParse(values);
  if (!result.success) return { ok: false, errors: collect(result.error) };
  const next = result.data;
  const input: UpdateExpertInput = {};
  if (next.name !== original.name.trim()) input.name = next.name;
  if (next.email.toLowerCase() !== original.email.trim().toLowerCase()) input.email = next.email;
  return { ok: true, input, changed: Object.keys(input).length > 0 };
}

const PASSWORD_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A random 16-character password (no look-alike characters), for the admin to hand over. */
export function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("");
}
