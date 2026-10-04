import { ErrorCode, isApiError } from "./api-errors";

export interface ErrorCopy {
  title: string;
  description: string;
}

/**
 * Plain-language copy for a failed read, decided by `code` (never status alone). A 429 is shown with the wait
 * time instead of being retried; queries do not retry it (lib/query-client.ts).
 */
export function describeError(error: unknown, subject: string): ErrorCopy {
  if (isApiError(error)) {
    switch (error.code) {
      case ErrorCode.RateLimited:
        return {
          title: "Too many requests",
          description:
            error.retryAfter !== undefined
              ? `Please wait ${error.retryAfter} second${error.retryAfter === 1 ? "" : "s"} and try again.`
              : "Please wait a moment and try again.",
        };
      case ErrorCode.BackendUnreachable:
        return { title: "Service unavailable", description: `The NeuroNest service could not be reached, so ${subject} can't be shown.` };
      case ErrorCode.BadResponse:
        return { title: `Unable to load ${subject}`, description: "The service returned something unexpected. Try again shortly." };
      case ErrorCode.InsufficientPermissions:
        return { title: "No access", description: `Your account is not allowed to view ${subject}.` };
    }
  }
  return { title: `Unable to load ${subject}`, description: "Something went wrong. Please try again." };
}
