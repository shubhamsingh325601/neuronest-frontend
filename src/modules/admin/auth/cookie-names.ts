// Pure constants so the proxy (which must not pull in server-only code) and the server helpers agree.
// `__Host-` needs Secure + Path=/ + no Domain, so it is only used in production (dev runs on plain http).

export interface CookieNames {
  access: string;
  refresh: string;
}

export function cookieNames(production: boolean): CookieNames {
  const prefix = production ? "__Host-" : "";
  return { access: `${prefix}nn_at`, refresh: `${prefix}nn_rt` };
}

/** Refresh cookie lifetime. The backend (`REFRESH_TOKEN_TTL_DAYS`, default 30) stays the authority on validity. */
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
