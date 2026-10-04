import "server-only";
import { z } from "zod";
import { createServerApi } from "../lib/server-api";

// Typed wrappers for the /v1/auth/* and /v1/users/me calls. Bodies carry ONLY documented fields.

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string(),
  expiresIn: z.number().positive(),
});
export type SessionTokens = z.infer<typeof tokensSchema>;

const profileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  role: z.enum(["PARENT", "CLINICIAN", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED", "INVITED"]),
  emailVerifiedAt: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type UserProfile = z.infer<typeof profileSchema>;

export const login = (email: string, password: string) =>
  createServerApi().post("auth/login", { body: { email, password }, schema: tokensSchema });

export const refresh = (refreshToken: string) =>
  createServerApi().post("auth/refresh", { body: { refreshToken }, schema: tokensSchema });

/** Idempotent on the backend (unknown token is a no-op, 204). Callers usually ignore failures. */
export const logout = (refreshToken: string): Promise<void> =>
  createServerApi().post<void>("auth/logout", { body: { refreshToken } });

export const fetchMe = (accessToken: string) =>
  createServerApi({ accessToken }).get("users/me", { schema: profileSchema });

// 202 with no body for any well-formed request (the backend never reveals whether the address exists).
export const forgotPassword = (email: string): Promise<void> =>
  createServerApi().post<void>("auth/forgot-password", { body: { email } });

export const resetPassword = (token: string, newPassword: string): Promise<void> =>
  createServerApi().post<void>("auth/reset-password", { body: { token, newPassword } });

export const completeAccountSetup = (token: string, password: string): Promise<void> =>
  createServerApi().post<void>("auth/complete-account-setup", { body: { token, password } });
