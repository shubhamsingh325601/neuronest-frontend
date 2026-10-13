import { describe, expect, it } from "vitest";
import { createChatClient, createTransport, newClientMessageId } from "./client";
import { ChatApiError, ChatErrorCode, isAbortError, parseProblem, parseRetryAfter } from "./problem";
import { BASE, clientFor, conversation, jsonResponse, message, problem, routedFetch } from "./test-helpers";

describe("parseProblem", () => {
  it("reads code, request id and Retry-After from a problem response", async () => {
    const error = await parseProblem(problem(429, "TOO_MANY_STREAMS", { requestId: "req-1", retryAfter: 12 }));
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error).toMatchObject({ status: 429, code: "TOO_MANY_STREAMS", requestId: "req-1", retryAfter: 12 });
  });

  it("falls back to the X-Request-Id header and an HTTP_<status> code for a body that is not problem+json", async () => {
    const error = await parseProblem(new Response("<html>bad gateway</html>", { status: 502, headers: { "x-request-id": "edge-9" } }));
    expect(error).toMatchObject({ status: 502, code: "HTTP_502", requestId: "edge-9" });
  });

  it("parses Retry-After as seconds or an HTTP date", () => {
    expect(parseRetryAfter("7")).toBe(7);
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:28:10 GMT", Date.parse("Wed, 21 Oct 2026 07:28:00 GMT"))).toBe(10);
    expect(parseRetryAfter("soon")).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
  });

  it("recognises an abort", () => {
    expect(isAbortError(new DOMException("x", "AbortError"))).toBe(true);
    expect(isAbortError(new TypeError("x"))).toBe(false);
  });
});

describe("createTransport", () => {
  it("builds /v1 urls, trims the base and encodes query values", () => {
    const t = createTransport({ baseUrl: `${BASE}//`, getToken: () => null, fetch: routedFetch(() => problem(500, "X")) });
    expect(t.url("/conversations/a/messages", { afterSeq: 3, limit: 100, skip: undefined })).toBe(
      `${BASE}/v1/conversations/a/messages?afterSeq=3&limit=100`,
    );
    expect(t.url("users/me")).toBe(`${BASE}/v1/users/me`);
  });

  it("reads the token at call time and omits the header without one", () => {
    let token: string | null = null;
    const t = createTransport({ baseUrl: BASE, getToken: () => token, fetch: routedFetch(() => problem(500, "X")) });
    expect(t.headers().has("authorization")).toBe(false);
    token = "abc";
    expect(t.headers({ Accept: "x" }).get("authorization")).toBe("Bearer abc");
  });
});

describe("createChatClient", () => {
  it("returns a parsed message from sendMessage and sends the body as JSON", async () => {
    const fetchFn = routedFetch(() => jsonResponse(message(4, { clientMessageId: "cm" }), 201));
    const result = await clientFor(fetchFn).sendMessage("conv/1", { text: "hi", clientMessageId: "cm" });
    expect(result).toMatchObject({ seq: 4, clientMessageId: "cm" });
    const req = fetchFn.calls[0];
    expect(req.url.pathname).toBe("/v1/conversations/conv%2F1/messages");
    expect(req.headers.get("content-type")).toBe("application/json");
    expect(req.headers.get("authorization")).toBe("Bearer tok");
    expect(JSON.parse(req.body ?? "")).toEqual({ text: "hi", clientMessageId: "cm" });
  });

  it("passes afterSeq and limit to listMessages", async () => {
    const fetchFn = routedFetch(() => jsonResponse({ purged: false, items: [] }));
    await clientFor(fetchFn).listMessages("c", { afterSeq: 5, limit: 100 });
    expect(fetchFn.calls[0].url.search).toBe("?afterSeq=5&limit=100");
  });

  it("throws a ChatApiError carrying the code for a refused call", async () => {
    const client = clientFor(routedFetch(() => problem(409, "NO_EXPERT_ASSIGNED", { requestId: "r-1" })));
    await expect(client.createConversation("child")).rejects.toMatchObject({ status: 409, code: "NO_EXPERT_ASSIGNED", requestId: "r-1" });
  });

  it("turns a failed fetch into a NETWORK_ERROR with status 0", async () => {
    const client = clientFor(routedFetch(() => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(client.topics()).rejects.toMatchObject({ status: 0, code: ChatErrorCode.Network });
  });

  it("lets an abort through untouched", async () => {
    const client = clientFor(routedFetch(() => Promise.reject(new DOMException("aborted", "AbortError"))));
    await expect(client.topics()).rejects.toSatisfy(isAbortError);
  });

  it("rejects a 2xx body of the wrong shape as BAD_RESPONSE", async () => {
    const client = clientFor(routedFetch(() => jsonResponse({ unexpected: true })));
    await expect(client.closeConversation("c")).rejects.toMatchObject({ code: ChatErrorCode.BadResponse });
  });

  it("parses conversations, topics and login results", async () => {
    const routes: Record<string, unknown> = {
      "/v1/ai-chat/topics": { version: 1, data: [{ id: "PLAN_EXPLAINER", label: "Plan", description: "d", kind: "AI", extra: 1 }] },
      "/v1/children/ch/ai-conversations": conversation("OPEN"),
      "/v1/auth/login": { accessToken: "a", refreshToken: "r", expiresIn: 900 },
      "/v1/users/me": { id: "u", email: "e@x.io", name: "E", role: "EXPERT", status: "ACTIVE" },
    };
    const client = clientFor(routedFetch((req) => jsonResponse(routes[req.url.pathname] ?? {})), null);
    expect((await client.topics()).data[0]).toMatchObject({ id: "PLAN_EXPLAINER", kind: "AI" });
    expect(await client.createAiConversation("ch", "PLAN_EXPLAINER")).toMatchObject({ status: "OPEN" });
    expect(await client.login("e@x.io", "pw")).toMatchObject({ accessToken: "a" });
    expect(await client.me()).toMatchObject({ role: "EXPERT" });
  });

  it("generates distinct client message ids", () => {
    expect(newClientMessageId()).not.toBe(newClientMessageId());
  });

  it("never writes to the console", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) => {
      const original = console[m];
      let calls = 0;
      console[m] = () => void calls++;
      return { m, original, calls: () => calls };
    });
    try {
      const client = createChatClient({ baseUrl: BASE, getToken: () => "tok", fetch: routedFetch(() => problem(500, "X")) });
      await client.me().catch(() => undefined);
    } finally {
      for (const s of spies) console[s.m] = s.original;
    }
    expect(spies.map((s) => s.calls())).toEqual([0, 0, 0, 0, 0]);
  });
});
