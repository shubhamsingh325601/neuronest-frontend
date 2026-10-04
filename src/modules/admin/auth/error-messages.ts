import { ApiError, ErrorCode } from "../lib/api-errors";
import type { AuthFormState } from "./form-state";

// Backend error -> what an admin sees. Decided by `code`, never by status alone (plan 0001 §16).

function waitText(seconds: number | undefined) {
  if (!seconds) return "a minute";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export const rateLimitedMessage = (retryAfter: number | undefined) =>
  `Too many attempts. Wait ${waitText(retryAfter)} and try again.`;

const INVALID_RESET_LINK = "This reset link is invalid or has expired. Request a new one.";
const INVALID_SETUP_LINK = "This setup link is invalid or has expired. Ask an administrator to resend the invitation.";

export function describeAuthError(error: ApiError, flow: "login" | "forgot" | "reset" | "setup"): string {
  switch (error.code) {
    case ErrorCode.InvalidCredentials:
      return "Incorrect email or password.";
    case ErrorCode.EmailNotVerified:
      return "This email address has not been verified yet.";
    case ErrorCode.AccountNotActive:
      return "This account is not active. Contact another administrator.";
    case ErrorCode.RateLimited:
      return rateLimitedMessage(error.retryAfter);
    case ErrorCode.InvalidResetToken:
      return INVALID_RESET_LINK;
    case ErrorCode.InvalidSetupToken:
      return INVALID_SETUP_LINK;
    case ErrorCode.ValidationError:
      // A token the backend rejects on shape (too short, tampered) is just an invalid link to the user.
      if (flow === "reset" && error.errors.some((message) => message.startsWith("token"))) return INVALID_RESET_LINK;
      if (flow === "setup" && error.errors.some((message) => message.startsWith("token"))) return INVALID_SETUP_LINK;
      return error.errors[0] ?? "Check the details you entered and try again.";
    case ErrorCode.BackendUnreachable:
      return "We could not reach the NeuroNest service. Try again in a moment.";
    default:
      return flow === "login" ? "We could not sign you in. Try again." : "Something went wrong. Try again.";
  }
}

/**
 * Form state for a failed auth call. On RATE_LIMITED (limits are per identity: user, else the email or
 * token in the body; 5 / 60 s on every auth route) it also carries the deadline so the UI can disable submit.
 */
export function authFailure(error: ApiError, flow: Parameters<typeof describeAuthError>[1]): Pick<AuthFormState, "status" | "error" | "retryUntil"> {
  const state: Pick<AuthFormState, "status" | "error" | "retryUntil"> = { status: "error", error: describeAuthError(error, flow) };
  if (error.code === ErrorCode.RateLimited) state.retryUntil = Date.now() + (error.retryAfter ?? 60) * 1000;
  return state;
}
