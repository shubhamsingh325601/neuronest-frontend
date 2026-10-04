// Messages shown on /login when the user was sent there (`?reason=`). Never put a caller-supplied string
// on screen: the reason is looked up here and unknown values are ignored.

export type LoginReason = "expired" | "suspended" | "forbidden" | "signed-out";

export const LOGIN_REASONS: Record<LoginReason, { tone: "notice" | "error"; message: string }> = {
  expired: { tone: "notice", message: "Your session expired. Sign in again to continue." },
  "signed-out": { tone: "notice", message: "You have been signed out." },
  suspended: { tone: "error", message: "This account is not active. Contact another administrator." },
  forbidden: { tone: "error", message: "This account does not have admin access." },
};

export function isLoginReason(value: string): value is LoginReason {
  return Object.hasOwn(LOGIN_REASONS, value);
}
