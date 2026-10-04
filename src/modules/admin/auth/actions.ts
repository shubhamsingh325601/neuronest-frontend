"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "../lib/api-errors";
import { fetchMe, login, logout } from "./backend-auth";
import { clearSessionCookies, readSessionCookies, writeSessionCookies } from "./cookies";
import { authFailure } from "./error-messages";
import type { AuthFormState } from "./form-state";
import { safeNextPath } from "./safe-next";
import { fieldErrorsFrom, loginSchema } from "./schemas";

/** Server-side diagnostics for failed sign-ins: status, code and requestId only, never credentials or tokens. */
function logAuthFailure(error: ApiError) {
  console.error(`[admin-auth] login failed: status=${error.status} code=${error.code} requestId=${error.requestId ?? "-"}`);
}

const NOT_ADMIN = "This account does not have admin access.";
const NOT_ACTIVE = "This account is not active. Contact another administrator.";

/**
 * Login (plan 0001 §16): backend login -> GET /users/me with the new token -> require ADMIN + ACTIVE, else
 * revoke the just-issued refresh token and show a form error -> set cookies -> redirect to a validated `next`.
 * INVALID_CREDENTIALS is a form error, never a session-expiry signal.
 */
export async function loginAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = loginSchema.safeParse({ email, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), email };

  const next = safeNextPath(String(formData.get("next") ?? ""));

  let tokens;
  try {
    tokens = await login(parsed.data.email, parsed.data.password);
  } catch (error) {
    if (error instanceof ApiError) {
      logAuthFailure(error);
      return { ...authFailure(error, "login"), email };
    }
    throw error;
  }

  // The refresh token exists now; if this account may not use the console it must not outlive this request.
  const revoke = async () => {
    try {
      await logout(tokens.refreshToken);
    } catch {
      // Best effort (idempotent endpoint, but throttled to 5/min per IP).
    }
  };

  try {
    const user = await fetchMe(tokens.accessToken);
    if (user.role !== "ADMIN") {
      await revoke();
      return { status: "error", error: NOT_ADMIN, email };
    }
    if (user.status !== "ACTIVE") {
      await revoke();
      return { status: "error", error: NOT_ACTIVE, email };
    }
  } catch (error) {
    await revoke();
    if (error instanceof ApiError) {
      logAuthFailure(error);
      return { ...authFailure(error, "login"), email };
    }
    throw error;
  }

  writeSessionCookies(await cookies(), tokens);
  redirect(next);
}

/** Sign-out: revoke the refresh token (best effort), clear cookies, back to the sign-in screen. */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const { refreshToken } = readSessionCookies(cookieStore);
  clearSessionCookies(cookieStore);
  if (refreshToken) {
    try {
      await logout(refreshToken);
    } catch {
      // The cookie is gone either way; a throttled / failed revoke leaves the token to expire on its own.
    }
  }
  redirect("/login?reason=signed-out");
}
