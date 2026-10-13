import { describe, expect, it } from "vitest";
import { ChatApiError } from "@/modules/chat-client/problem";
import { ApiError } from "../../lib/api-errors";
import { describeChatError, describeImpersonationError, describeLoginError } from "./error-copy";

const api = (status: number, code: string, requestId?: string) => new ApiError({ status, code, requestId });
const chat = (status: number, code: string, extra: { requestId?: string; retryAfter?: number } = {}) =>
  new ChatApiError({ status, code, ...extra });

describe("describeImpersonationError", () => {
  it("flags a server with impersonation switched off", () => {
    const copy = describeImpersonationError(api(404, "IMPERSONATION_DISABLED"));
    expect(copy.impersonationDisabled).toBe(true);
    expect(copy.title).toBe("Impersonation is switched off on the server");
  });

  it.each([
    ["IMPERSONATION_TARGET_NOT_ALLOWED", "Not a parent"],
    ["ACCOUNT_NOT_ACTIVE", "Account not active"],
    ["USER_NOT_FOUND", "User not found"],
  ])("maps %s", (code, title) => {
    const copy = describeImpersonationError(api(409, code));
    expect(copy.title).toBe(title);
    expect(copy.impersonationDisabled).toBeUndefined();
  });

  it("falls back to the shared admin copy, with the reference", () => {
    const copy = describeImpersonationError(api(500, "INTERNAL_ERROR", "req-4"));
    expect(copy.description).toContain("Reference: req-4");
  });
});

describe("describeChatError", () => {
  it("tells the admin to act as the parent again when the token is refused", () => {
    expect(describeChatError(chat(401, "INVALID_TOKEN"), "x").description).toBe("Session expired, act as this parent again.");
    expect(describeChatError(chat(401, "MISSING_TOKEN"), "x").title).toBe("Session expired");
  });

  it("points at CORS and the URL for a network error", () => {
    const copy = describeChatError(chat(0, "NETWORK_ERROR"), "x");
    expect(copy.description).toContain("CORS_ORIGINS");
    expect(copy.description).toContain("API_BASE_URL");
  });

  it("links NO_EXPERT_ASSIGNED to the experts page task and appends the request id", () => {
    const copy = describeChatError(chat(409, "NO_EXPERT_ASSIGNED", { requestId: "r-1" }), "x");
    expect(copy.description).toContain("Experts page");
    expect(copy.description).toContain("Reference: r-1");
  });

  it("shows the wait for a rate limit and the code for anything unknown", () => {
    expect(describeChatError(chat(429, "RATE_LIMITED", { retryAfter: 1 }), "x").description).toContain("1 second ");
    expect(describeChatError(chat(500, "WEIRD"), "the topics").description).toContain("WEIRD");
    expect(describeChatError(new Error("boom"), "the topics").title).toBe("Unable to load the topics");
  });
});

describe("describeLoginError", () => {
  it("explains the expert login failures", () => {
    expect(describeLoginError(chat(401, "INVALID_CREDENTIALS")).title).toBe("Wrong email or password");
    expect(describeLoginError(chat(403, "EMAIL_NOT_VERIFIED")).title).toBe("Email not verified");
    expect(describeLoginError(chat(429, "RATE_LIMITED", { retryAfter: 30 })).description).toContain("5 per minute");
    expect(describeLoginError(chat(429, "RATE_LIMITED", { retryAfter: 30 })).description).toContain("30 seconds");
  });

  it("never echoes the error detail, which could contain input", () => {
    const error = new ChatApiError({ status: 401, code: "INVALID_CREDENTIALS", detail: "bad password hunter2 for a@b.c" });
    const copy = describeLoginError(error);
    expect(JSON.stringify(copy)).not.toContain("hunter2");
  });
});
