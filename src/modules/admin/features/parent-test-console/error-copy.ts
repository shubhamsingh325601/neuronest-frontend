import { ChatErrorCode, isChatApiError } from "@/modules/chat-client/problem";
import { ErrorCode, isApiError } from "../../lib/api-errors";
import { describeError, type ErrorCopy } from "../../lib/describe-error";

// Plain-language copy for the console's failures, decided by `code` (never by `detail` text). Message text and
// tokens are never part of any string built here.

export interface ConsoleErrorCopy extends ErrorCopy {
  /** The server has impersonation switched off: the console body is hidden, not retried. */
  impersonationDisabled?: boolean;
}

const withReference = (copy: ErrorCopy, requestId: string | null | undefined): ErrorCopy =>
  requestId ? { ...copy, description: `${copy.description} Reference: ${requestId}` } : copy;

/** `POST users/:id/impersonate` through the admin BFF (an admin ApiError). */
export function describeImpersonationError(error: unknown): ConsoleErrorCopy {
  if (isApiError(error)) {
    switch (error.code) {
      case "IMPERSONATION_DISABLED":
        return {
          title: "Impersonation is switched off on the server",
          description: "Set IMPERSONATION_ENABLED=true on the backend to use this console.",
          impersonationDisabled: true,
        };
      case "IMPERSONATION_TARGET_NOT_ALLOWED":
        return { title: "Not a parent", description: "Only a parent account can be impersonated." };
      case ErrorCode.AccountNotActive:
        return { title: "Account not active", description: "This account is suspended or not yet active, so it cannot be used." };
      case "USER_NOT_FOUND":
        return { title: "User not found", description: "That user no longer exists. Refresh the list and try again." };
    }
  }
  return describeError(error, "the impersonation token");
}

const CHAT_COPY: Record<string, ErrorCopy> = {
  [ChatErrorCode.InvalidToken]: {
    title: "Session expired",
    description: "Session expired, act as this parent again.",
  },
  [ChatErrorCode.MissingToken]: {
    title: "Session expired",
    description: "Session expired, act as this parent again.",
  },
  [ChatErrorCode.Network]: {
    title: "Can't reach the server",
    description:
      "The request did not reach the backend. Check that it is running, that API_BASE_URL is right (it is read at build time), and that this site's origin is in its CORS_ORIGINS.",
  },
  [ChatErrorCode.ImpersonationRestricted]: {
    title: "Not allowed while acting as a parent",
    description: "Changing the password or deactivating the account is refused for an impersonated session.",
  },
  [ChatErrorCode.NoExpertAssigned]: {
    title: "No expert assigned",
    description: "This child has no expert yet. Assign one from the Experts page, then try again.",
  },
  [ChatErrorCode.TooManyStreams]: {
    title: "Too many open streams",
    description: "The server allows 5 open streams per user and 4 per conversation. Close one and try again.",
  },
};

/** Any call made with a chat-client (parent or expert token, direct to the backend). */
export function describeChatError(error: unknown, subject: string): ErrorCopy {
  if (!isChatApiError(error)) return { title: `Unable to load ${subject}`, description: "Something went wrong. Please try again." };
  const known = CHAT_COPY[error.code];
  if (known) return withReference(known, error.requestId);
  if (error.code === ChatErrorCode.RateLimited) {
    const wait = error.retryAfter !== undefined ? `Wait ${error.retryAfter} second${error.retryAfter === 1 ? "" : "s"} and try again.` : "Wait a moment and try again.";
    return withReference({ title: "Too many requests", description: wait }, error.requestId);
  }
  return withReference({ title: `Unable to load ${subject}`, description: `The server answered ${error.code}.` }, error.requestId);
}

/** `POST auth/login` for the expert account. The login limit is 5 per minute. */
export function describeLoginError(error: unknown): ErrorCopy {
  if (isChatApiError(error)) {
    switch (error.code) {
      case "INVALID_CREDENTIALS":
        return { title: "Wrong email or password", description: "Check the expert's credentials and try again." };
      case "EMAIL_NOT_VERIFIED":
        return { title: "Email not verified", description: "This account has not verified its email yet." };
      case ChatErrorCode.AccountNotActive:
        return { title: "Account not active", description: "This account is suspended or not yet active." };
      case "NOT_AN_EXPERT":
        return { title: "Not an expert", description: "That account signed in, but its role is not EXPERT. Use an account created on the Experts page." };
      case ChatErrorCode.RateLimited:
        return {
          title: "Too many sign-in attempts",
          description:
            error.retryAfter !== undefined
              ? `Sign-in is limited to 5 per minute. Wait ${error.retryAfter} second${error.retryAfter === 1 ? "" : "s"}.`
              : "Sign-in is limited to 5 per minute. Wait a moment.",
        };
    }
  }
  return describeChatError(error, "the expert sign-in");
}
