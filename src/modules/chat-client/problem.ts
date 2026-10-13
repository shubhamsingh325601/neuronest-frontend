// RFC 9457 problem+json -> a typed error. Callers branch on `code` (stable), never on `detail` text.

export const ChatErrorCode = {
  InvalidToken: "INVALID_TOKEN",
  MissingToken: "MISSING_TOKEN",
  RateLimited: "RATE_LIMITED",
  ValidationError: "VALIDATION_ERROR",
  ConversationClosed: "CONVERSATION_CLOSED",
  OffTopicLimit: "AI_CHAT_OFF_TOPIC_LIMIT",
  ChatBusy: "AI_CHAT_BUSY",
  ChatLimitReached: "AI_CHAT_LIMIT_REACHED",
  ReplyUnavailable: "AI_CHAT_REPLY_UNAVAILABLE",
  ClientMessageIdInUse: "CLIENT_MESSAGE_ID_IN_USE",
  MessageTooLong: "MESSAGE_TOO_LONG",
  NotAnAiConversation: "NOT_AN_AI_CONVERSATION",
  NotAHumanConversation: "NOT_A_HUMAN_CONVERSATION",
  AiDisabled: "AI_DISABLED",
  AiUnavailable: "AI_UNAVAILABLE",
  NoExpertAssigned: "NO_EXPERT_ASSIGNED",
  TooManyStreams: "TOO_MANY_STREAMS",
  ImpersonationDisabled: "IMPERSONATION_DISABLED",
  ImpersonationTargetNotAllowed: "IMPERSONATION_TARGET_NOT_ALLOWED",
  ImpersonationRestricted: "IMPERSONATION_RESTRICTED",
  AccountNotActive: "ACCOUNT_NOT_ACTIVE",
  UserNotFound: "USER_NOT_FOUND",
  /** Raised here, never by the backend: the request did not reach it (offline, DNS, CORS, CSP). */
  Network: "NETWORK_ERROR",
  /** Raised here: a 2xx body did not match the expected shape. */
  BadResponse: "BAD_RESPONSE",
  /** Raised here: the stream closed without a `done` or `error` event. */
  StreamEnded: "STREAM_ENDED",
} as const;

export interface ChatApiErrorInit {
  status: number;
  code: string;
  title?: string;
  detail?: string;
  requestId?: string | null;
  /** Seconds, from a `Retry-After` header. */
  retryAfter?: number;
}

export class ChatApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail: string;
  readonly requestId: string | null;
  readonly retryAfter: number | undefined;

  constructor(init: ChatApiErrorInit) {
    const detail = init.detail ?? init.title ?? `Request failed (${init.status}).`;
    super(detail);
    this.name = "ChatApiError";
    this.status = init.status;
    this.code = init.code;
    this.title = init.title ?? detail;
    this.detail = detail;
    this.requestId = init.requestId ?? null;
    this.retryAfter = init.retryAfter;
  }
}

export const isChatApiError = (value: unknown): value is ChatApiError => value instanceof ChatApiError;

/** True for the error a cancelled `fetch` / aborted read throws. Aborts are deliberate, not failures. */
export function isAbortError(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { name?: unknown }).name === "AbortError";
}

export function networkError(): ChatApiError {
  return new ChatApiError({
    status: 0,
    code: ChatErrorCode.Network,
    title: "Network error",
    detail: "The request did not reach the server.",
  });
}

/** `Retry-After` as whole seconds (delta-seconds or an HTTP date); undefined when absent or unusable. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now) / 1000));
}

const asString = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

/** Builds a ChatApiError from a non-OK response. Tolerates bodies that are not problem+json. */
export async function parseProblem(response: Response): Promise<ChatApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Not JSON (a proxy error page, an empty body): fall back to the status-derived error.
  }
  return new ChatApiError({
    status: response.status,
    code: asString(body.code) ?? `HTTP_${response.status}`,
    title: asString(body.title),
    detail: asString(body.detail) ?? asString(body.message),
    requestId: asString(body.requestId) ?? response.headers.get("x-request-id"),
    retryAfter: parseRetryAfter(response.headers.get("retry-after")),
  });
}
