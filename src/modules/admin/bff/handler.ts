import "server-only";
import { ApiError, ErrorCode } from "../lib/api-errors";
import { backendFetch } from "../lib/server-api";
import { isAllowed } from "./allowlist";
import { checkCsrf, problemResponse } from "./guards";

// The browser's only path to the backend: same-origin /api/backend/<path> -> <API_BASE_URL>/v1/<path>.
// Allowlist, CSRF checks and bearer injection happen here; problem+json is returned unchanged so the client
// can decide by `code`. This handler never refreshes tokens: an expired access token surfaces as 401
// MISSING_TOKEN / INVALID_TOKEN and the client calls /api/auth/refresh once (plan 0001 §16).

const MAX_BODY_BYTES = 256 * 1024;
const FORWARDED_RESPONSE_HEADERS = ["content-type", "retry-after", "x-request-id"];

export interface BffContext {
  accessToken: string | undefined;
}

export async function handleBackendRequest(request: Request, segments: readonly string[], context: BffContext): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!isAllowed(method, segments)) {
    return problemResponse(
      new ApiError({ status: 404, code: ErrorCode.NotAllowed, title: "Not found", detail: "This endpoint is not available." }),
    );
  }

  const csrf = checkCsrf(request);
  if (csrf) return problemResponse(csrf);

  if (!context.accessToken) {
    return problemResponse(
      new ApiError({ status: 401, code: ErrorCode.MissingToken, title: "Unauthorized", detail: "No active session." }),
    );
  }

  let rawBody: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return problemResponse(new ApiError({ status: 413, code: "PAYLOAD_TOO_LARGE", title: "Payload too large", detail: "Request body is too large." }));
    }
    if (rawBody === "") rawBody = undefined;
  }

  const query = new URL(request.url).search;
  let backend: Response;
  try {
    backend = await backendFetch({
      path: `/v1/${segments.map(encodeURIComponent).join("/")}`,
      method: method as "GET" | "POST" | "PATCH" | "DELETE",
      rawBody,
      query,
      accessToken: context.accessToken,
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof ApiError) return problemResponse(error);
    throw error;
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backend.headers.get(name);
    if (value) headers.set(name, value);
  }
  // 204 / 304 must not carry a body; everything else is passed through byte for byte.
  const hasBody = backend.status !== 204 && backend.status !== 304;
  return new Response(hasBody ? backend.body : null, { status: backend.status, headers });
}
