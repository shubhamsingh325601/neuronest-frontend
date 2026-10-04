import "server-only";
import { getAdminEnv } from "../config/env";
import { backendUnreachable } from "./api-errors";
import { createHttpClient, type HttpClient } from "./http";

// Server -> backend transport. With lib/api-client.ts (browser -> BFF) it is the only place that knows URLs
// and auth headers; parsing and errors live in lib/http.ts (plan 0001 §19).

const TIMEOUT_MS = 15_000;

export interface BackendRequest {
  /** Path including the version, e.g. `/v1/auth/login`. */
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serialisable body. Send ONLY documented fields: the backend uses forbidNonWhitelisted. */
  body?: unknown;
  /** Pre-serialised body (the BFF forwards the client's JSON untouched). Wins over `body`. */
  rawBody?: string;
  query?: string;
  accessToken?: string;
  signal?: AbortSignal;
}

/** Performs the call and returns the raw Response. Network failures and timeouts become ApiError(503). */
export async function backendFetch(request: BackendRequest): Promise<Response> {
  const { apiBaseUrl } = getAdminEnv();
  const headers: Record<string, string> = { Accept: "application/json, application/problem+json" };
  const payload = request.rawBody ?? (request.body === undefined ? undefined : JSON.stringify(request.body));
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  if (request.accessToken) headers.Authorization = `Bearer ${request.accessToken}`;

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  try {
    return await fetch(`${apiBaseUrl}${request.path}${request.query ?? ""}`, {
      method: request.method ?? (payload === undefined ? "GET" : "POST"),
      headers,
      body: payload,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal ? AbortSignal.any([request.signal, timeout]) : timeout,
    });
  } catch {
    throw backendUnreachable();
  }
}

export interface ServerApiContext {
  accessToken?: string;
  signal?: AbortSignal;
}

/**
 * Typed server -> backend client (get / post / put / patch / delete) on the shared HTTP core.
 * Paths are relative to /v1 (`users/me`, `auth/login`). One instance per request context.
 */
export function createServerApi(context: ServerApiContext = {}): HttpClient {
  return createHttpClient((request) =>
    backendFetch({
      path: `/v1/${request.path}`,
      method: request.method,
      rawBody: request.body,
      query: request.search,
      accessToken: context.accessToken,
      signal: request.signal ?? context.signal,
    }),
  );
}
