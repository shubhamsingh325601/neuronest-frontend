import "server-only";
import { getAdminEnv } from "../config/env";
import { REFRESH_COOKIE_MAX_AGE, cookieNames } from "./cookie-names";
import type { SessionTokens } from "./backend-auth";

// httpOnly, host-only (no Domain), SameSite=Lax, Path=/. `__Host-` names + Secure in production.
// Browser JS never sees a token (plan 0001 §16).

/** The subset of Next's cookie store these helpers need (readable in tests without Next). */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete(name: string): unknown;
}

function baseOptions(production: boolean) {
  return { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/" };
}

export function readSessionCookies(store: CookieStore, production = getAdminEnv().production) {
  const names = cookieNames(production);
  return { accessToken: store.get(names.access)?.value, refreshToken: store.get(names.refresh)?.value };
}

export function writeSessionCookies(
  store: CookieStore,
  tokens: Pick<SessionTokens, "accessToken" | "refreshToken" | "expiresIn">,
  production = getAdminEnv().production,
) {
  const names = cookieNames(production);
  const base = baseOptions(production);
  store.set(names.access, tokens.accessToken, { ...base, maxAge: Math.max(1, Math.floor(tokens.expiresIn)) });
  store.set(names.refresh, tokens.refreshToken, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });
}

export function clearSessionCookies(store: CookieStore, production = getAdminEnv().production) {
  const names = cookieNames(production);
  // `delete` alone would drop the attributes browsers match on (`__Host-` needs Secure + Path=/).
  for (const name of [names.access, names.refresh]) {
    store.set(name, "", { ...baseOptions(production), maxAge: 0 });
  }
}
