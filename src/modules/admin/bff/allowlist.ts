// What the browser may reach through /api/backend/[...path] (plan 0001 §16, §17). Anything not listed is
// refused before a request leaves the server, so the BFF cannot be used as an open proxy to the backend
// (auth routes, the jobs runner, media upload and the post-v1 admin plan writes are deliberately absent).
// Paths are relative to /v1. `:id` matches one opaque id segment. The backend still enforces ADMIN on every call.

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const RULES: ReadonlyArray<readonly [Method, string]> = [
  ["GET", "health"],
  ["GET", "admin/summary"],

  ["GET", "users/me"],
  ["GET", "users"],
  ["GET", "users/:id"],
  ["POST", "users/:id/suspend"],
  ["POST", "users/:id/reactivate"],

  ["GET", "clinicians"],
  ["POST", "clinicians"],
  ["GET", "clinicians/:id"],
  ["PATCH", "clinicians/:id"],
  ["POST", "clinicians/:id/resend-invitation"],

  // Experts are admin-created accounts (no invitation); routes read from the backend repo, see docs/plans/0001-admin-app.md.
  ["GET", "experts"],
  ["POST", "experts"],
  ["GET", "experts/:id"],
  ["GET", "experts/:id/children"],
  ["PATCH", "experts/:id"],
  ["PUT", "experts/:id/children"],
  ["POST", "experts/:id/reset-password"],

  ["GET", "children"],
  ["GET", "children/:id"],
  ["GET", "children/:id/clinicians"],
  ["GET", "children/:id/experts"],
  ["POST", "children/:id/clinicians"],
  ["DELETE", "children/:id/clinicians/:id"],
  ["GET", "children/:id/plans"],
  ["GET", "children/:id/media"],
  ["GET", "children/:id/call-logs"],
  ["GET", "plans/:id"],
  ["GET", "plans/:id/notes"],

  ["GET", "plan-templates"],
  ["POST", "plan-templates"],
  ["GET", "plan-templates/:id"],
  ["POST", "plan-templates/:id/publish"],
  ["POST", "plan-templates/:id/archive"],
];

const ID_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

const compiled = RULES.map(([method, pattern]) => ({ method, parts: pattern.split("/") }));

/** True when `method` + the already-split, still-encoded path segments match an allowlist rule. */
export function isAllowed(method: string, segments: readonly string[]): boolean {
  const verb = method.toUpperCase();
  return compiled.some(
    (rule) =>
      rule.method === verb &&
      rule.parts.length === segments.length &&
      rule.parts.every((part, index) => (part === ":id" ? ID_SEGMENT.test(segments[index]) : part === segments[index])),
  );
}
