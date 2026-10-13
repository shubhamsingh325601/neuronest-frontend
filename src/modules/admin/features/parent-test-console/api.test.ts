import { describe, expect, it } from "vitest";
import { ChatApiError } from "@/modules/chat-client/problem";
import { jsonResponse, problem, routedFetch } from "@/modules/chat-client/test-helpers";
import { signInExpert } from "./api";

const ORIGIN = "https://api.test";

describe("signInExpert", () => {
  it("logs in, confirms the role with users/me using the new token, and returns the token and identity", async () => {
    const fetchFn = routedFetch((req) => {
      if (req.url.pathname === "/v1/auth/login") return jsonResponse({ accessToken: "expert-token", refreshToken: "r", expiresIn: 900 });
      if (req.url.pathname === "/v1/users/me") return jsonResponse({ id: "e1", email: "e@test.io", name: "Dr E", role: "EXPERT" });
      return problem(404, "NOT_FOUND");
    });
    const result = await signInExpert(ORIGIN, "e@test.io", "pw", fetchFn);
    expect(result).toEqual({ token: "expert-token", user: { id: "e1", name: "Dr E", email: "e@test.io" } });
    const [login, me] = fetchFn.calls;
    expect(JSON.parse(login.body ?? "")).toEqual({ email: "e@test.io", password: "pw" });
    expect(login.headers.has("authorization")).toBe(false);
    expect(me.headers.get("authorization")).toBe("Bearer expert-token");
  });

  it("refuses an account that is not an expert", async () => {
    const fetchFn = routedFetch((req) =>
      req.url.pathname === "/v1/auth/login"
        ? jsonResponse({ accessToken: "t", expiresIn: 900 })
        : jsonResponse({ id: "a1", email: "a@test.io", name: "Admin", role: "ADMIN" }),
    );
    await expect(signInExpert(ORIGIN, "a@test.io", "pw", fetchFn)).rejects.toMatchObject({ code: "NOT_AN_EXPERT" });
  });

  it("passes a login refusal through with its code and does not call users/me", async () => {
    const fetchFn = routedFetch(() => problem(401, "INVALID_CREDENTIALS", { requestId: "r-1" }));
    const error = await signInExpert(ORIGIN, "e@test.io", "bad", fetchFn).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS", requestId: "r-1" });
    expect(fetchFn.calls).toHaveLength(1);
  });
});
