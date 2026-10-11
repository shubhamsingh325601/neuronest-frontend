import { ADMIN_ROUTES } from "../navigation/paths";

// The backend emails a link built from `callbackUrl` (it appends `?token=…`). Without one it falls back to its
// own APP_WEB_URL, which is not where the Admin pages live, so every email-link flow sends the Admin page URL.
// The backend only accepts origins on its APP_WEB_URL / CORS_ORIGINS list (400 INVALID_CALLBACK_URL otherwise).

/** Browser-side: the account-setup page on the origin the admin is using. `undefined` outside a browser. */
export function accountSetupCallbackUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${ADMIN_ROUTES.completeAccountSetup}`;
}

/** Server-side: build an absolute Admin URL from the incoming request's forwarded host. */
export function originFromHeaders(get: (name: string) => string | null): string | undefined {
  const host = get("x-forwarded-host") ?? get("host");
  if (!host || !/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(host)) return undefined;
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = get("x-forwarded-proto")?.split(",")[0]?.trim() || (local ? "http" : "https");
  return `${proto === "http" ? "http" : "https"}://${host}`;
}
