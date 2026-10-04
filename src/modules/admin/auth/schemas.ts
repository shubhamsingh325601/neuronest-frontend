import { z } from "zod";

// Mirrors the backend's validation limits (login password max 128 only; new passwords 10 to 128 chars).
export const emailSchema = z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a valid email address."));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

const newPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use at most 128 characters.");

const tokenField = z.string().min(1, "This link is missing its token.").max(512);

// Reset and account setup share the same shape: one-time token, new password, confirmation.
const setPasswordSchema = z
  .object({ token: tokenField, password: newPassword, confirmPassword: z.string().min(1, "Confirm your password.") })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const resetPasswordSchema = setPasswordSchema;
export const accountSetupSchema = setPasswordSchema;

export type FieldErrors = NonNullable<import("./form-state").AuthFormState["fieldErrors"]>;

/** Flattens a zod error to the first message per field. */
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "") as keyof FieldErrors;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
