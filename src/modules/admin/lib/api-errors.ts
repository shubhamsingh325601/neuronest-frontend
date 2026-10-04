// RFC 9457 problem+json from the backend -> a typed ApiError. Decide by `code`, never by status alone
// (plan 0001 §16; the codes are the ones in the backend's docs/auth-flows.md and its filters).

export const ErrorCode = {
  InvalidCredentials: "INVALID_CREDENTIALS",
  EmailNotVerified: "EMAIL_NOT_VERIFIED",
  AccountNotActive: "ACCOUNT_NOT_ACTIVE",
  InvalidRefreshToken: "INVALID_REFRESH_TOKEN",
  InvalidToken: "INVALID_TOKEN",
  MissingToken: "MISSING_TOKEN",
  InsufficientPermissions: "INSUFFICIENT_PERMISSIONS",
  RateLimited: "RATE_LIMITED",
  InvalidResetToken: "INVALID_RESET_TOKEN",
  InvalidSetupToken: "INVALID_SETUP_TOKEN",
  ValidationError: "VALIDATION_ERROR",
  // Raised by the BFF itself, never by the backend.
  BackendUnreachable: "BACKEND_UNREACHABLE",
  BadResponse: "BAD_BACKEND_RESPONSE",
  CsrfRejected: "CSRF_REJECTED",
  NotAllowed: "BFF_NOT_ALLOWED",
} as const;

export interface ApiErrorInit {
  status: number;
  code: string;
  title?: string;
  detail?: string;
  errors?: string[];
  requestId?: string | null;
  /** Seconds, from a `Retry-After` header (429). */
  retryAfter?: number;
  /** The parsed JSON body when it was an object (lets a caller read a non-problem error body, e.g. /health 503). */
  body?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail: string;
  readonly errors: string[];
  readonly requestId: string | null;
  readonly retryAfter: number | undefined;
  readonly body: Record<string, unknown> | undefined;

  constructor(init: ApiErrorInit) {
    const detail = init.detail ?? init.title ?? `Request failed (${init.status}).`;
    super(detail);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.title = init.title ?? detail;
    this.detail = detail;
    this.errors = init.errors ?? [];
    this.requestId = init.requestId ?? null;
    this.retryAfter = init.retryAfter;
    this.body = init.body;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** The access token was refused: one refresh may fix it. */
export const isAccessTokenRejected = (error: ApiError) =>
  error.code === ErrorCode.InvalidToken || error.code === ErrorCode.MissingToken;

/** The session cannot continue and the cookies must go (refresh token dead, or the account was disabled). */
export const isSessionOver = (error: ApiError) =>
  error.code === ErrorCode.InvalidRefreshToken || error.code === ErrorCode.AccountNotActive;

/**
 * A /auth/refresh call that can never succeed for this cookie: the token is unknown / expired / revoked, the
 * account is disabled, or the backend's DTO validation rejects its shape (a tampered or truncated cookie).
 */
export const isRefreshDead = (error: ApiError) => isSessionOver(error) || error.code === ErrorCode.ValidationError;

/** `Retry-After` as whole seconds (delta-seconds or an HTTP date); undefined when absent or unusable. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now) / 1000));
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/** Builds an ApiError from a non-OK backend response. Tolerates bodies that are not problem+json. */
export async function parseApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Not JSON (a proxy error page, an empty body): fall through to the status-derived error.
  }
  const errors = Array.isArray(body.errors) ? body.errors.filter((e): e is string => typeof e === "string") : undefined;
  return new ApiError({
    status: response.status,
    code: asString(body.code) ?? `HTTP_${response.status}`,
    title: asString(body.title),
    detail: asString(body.detail) ?? asString(body.message),
    errors,
    requestId: asString(body.requestId) ?? response.headers.get("x-request-id"),
    retryAfter: parseRetryAfter(response.headers.get("retry-after")),
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}

export function backendUnreachable(): ApiError {
  return new ApiError({
    status: 503,
    code: ErrorCode.BackendUnreachable,
    title: "Service unavailable",
    detail: "The NeuroNest service could not be reached.",
  });
}
