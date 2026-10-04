"use server";

import { ApiError } from "../lib/api-errors";
import { completeAccountSetup, forgotPassword, resetPassword } from "./backend-auth";
import { authFailure } from "./error-messages";
import type { AuthFormState } from "./form-state";
import { accountSetupSchema, fieldErrorsFrom, forgotPasswordSchema, resetPasswordSchema } from "./schemas";

// Forgot / reset / account setup. None of these sign anyone in: reset revokes every session on the backend
// and setup activates an invited account, so success leads back to the sign-in screen.

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function forgotPasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").trim();
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), email };

  try {
    await forgotPassword(parsed.data.email);
  } catch (error) {
    if (error instanceof ApiError) return { ...authFailure(error, "forgot"), email };
    throw error;
  }
  // The backend answers 202 whether or not the address exists; so does the UI.
  return {
    status: "success",
    message: "If an account exists for that address, a reset link is on its way. The link expires after an hour.",
    email,
  };
}

export async function resetPasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: text(formData, "token"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof ApiError) return authFailure(error, "reset");
    throw error;
  }
  return { status: "success", message: "Your password has been changed. Every device has been signed out." };
}

export async function completeAccountSetupAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = accountSetupSchema.safeParse({
    token: text(formData, "token"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await completeAccountSetup(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof ApiError) return authFailure(error, "setup");
    throw error;
  }
  return { status: "success", message: "Your account is ready. You can sign in now." };
}
