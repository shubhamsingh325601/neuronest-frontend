// Pure constants so the proxy (which must not pull in server-only code) and the server helpers agree.
// Admin shares an origin with the landing site, so the cookies are scoped with `Path=/admin` (see cookies.ts).
// `__Host-` would force `Path=/` and send the tokens on every landing request, so production uses `__Secure-`
// (Secure only). Dev runs on plain http, where neither prefix can be set.

export interface CookieNames {
  access: string;
  refresh: string;
}

export function cookieNames(production: boolean): CookieNames {
  const prefix = production ? "__Secure-" : "";
  return { access: `${prefix}nn_at`, refresh: `${prefix}nn_rt` };
}

/** Refresh cookie lifetime. The backend (`REFRESH_TOKEN_TTL_DAYS`, default 30) stays the authority on validity. */
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
