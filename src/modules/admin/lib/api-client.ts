import { refreshSession, type RefreshOutcome } from "../auth/browser-refresh";
import { CSRF_HEADER, CSRF_VALUE } from "../auth/request-headers";
import { ErrorCode, backendUnreachable, isAccessTokenRejected, parseApiError } from "./api-errors";
import { createHttpClient, type HttpClient, type Transport } from "./http";

// Browser -> BFF client. This is what stores, hooks and feature services call; they never use fetch directly
// and never see a token (the BFF adds the bearer from the httpOnly cookie).
//
//   const page = await apiClient.get("users", { query: { role: "PARENT", limit: 20 }, schema: usersPage });
//   await apiClient.post(`users/${id}/suspend`);
//
// Paths are relative to /v1 and must be on the BFF allowlist (bff/allowlist.ts). On a rejected access token
// the client refreshes the session once and retries; if the session is over it sends the user to sign in.
// Every failure arrives as an ApiError, decided by `code`.

export interface ApiClientDeps {
  fetchImpl?: typeof fetch;
  refresh?: () => Promise<RefreshOutcome>;
  navigate?: (location: string) => void;
}

export function createApiClient(deps: ApiClientDeps = {}): HttpClient {
  const doFetch = deps.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const refresh = deps.refresh ?? refreshSession;
  const navigate = deps.navigate ?? ((location: string) => window.location.assign(location));

  const transport: Transport = async (request) => {
    const send = async () => {
      try {
        return await doFetch(`/api/backend/${request.path}${request.search}`, {
          method: request.method,
          headers: {
            Accept: "application/json, application/problem+json",
            [CSRF_HEADER]: CSRF_VALUE,
            ...(request.body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          body: request.body,
          credentials: "same-origin",
          cache: "no-store",
          signal: request.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error; // cancelled, not a failure
        throw backendUnreachable();
      }
    };

    let response = await send();
    if (response.status !== 401 && response.status !== 403) return response;

    const error = await parseApiError(response.clone());
    if (error.code === ErrorCode.AccountNotActive) {
      navigate("/login?reason=suspended");
      return response;
    }
    if (!isAccessTokenRejected(error)) return response;

    // Expired / rejected access token: one refresh, one retry.
    const outcome = await refresh();
    if ("redirect" in outcome) {
      navigate(outcome.redirect);
      return response;
    }
    response = await send();
    return response;
  };

  return createHttpClient(transport);
}

export const apiClient = createApiClient();
