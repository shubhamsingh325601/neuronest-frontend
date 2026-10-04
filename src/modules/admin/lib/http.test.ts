import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "./api-errors";
import { buildQuery, createHttpClient, readResponse, type TransportRequest } from "./http";
import { createApiClient } from "./api-client";

describe("buildQuery", () => {
  it("serialises scalars and arrays, skipping empty values", () => {
    expect(buildQuery({ role: "PARENT", limit: 20, q: "", status: undefined, cursor: null, tag: ["a", "b"], on: false })).toBe(
      "?role=PARENT&limit=20&tag=a&tag=b&on=false",
    );
    expect(buildQuery(undefined)).toBe("");
    expect(buildQuery({ q: undefined })).toBe("");
  });
  it("encodes values", () => {
    expect(buildQuery({ q: "a b&c" })).toBe("?q=a+b%26c");
  });
});

describe("readResponse", () => {
  it("parses JSON, treats 204 and empty bodies as undefined", async () => {
    expect(await readResponse(Response.json({ a: 1 }))).toEqual({ a: 1 });
    expect(await readResponse(new Response(null, { status: 204 }))).toBeUndefined();
    expect(await readResponse(new Response("", { status: 202 }))).toBeUndefined();
  });

  it("turns problem+json into an ApiError", async () => {
    const response = new Response(JSON.stringify({ code: "CHILD_NOT_FOUND", status: 404, detail: "gone" }), { status: 404 });
    await expect(readResponse(response)).rejects.toMatchObject({ name: "ApiError", status: 404, code: "CHILD_NOT_FOUND" });
  });

  it("validates against a schema and reports a mismatch as BAD_BACKEND_RESPONSE", async () => {
    const schema = z.object({ id: z.string() });
    expect(await readResponse(Response.json({ id: "x", extra: 1 }), schema)).toEqual({ id: "x" });
    await expect(readResponse(Response.json({ id: 5 }), schema)).rejects.toMatchObject({ code: "BAD_BACKEND_RESPONSE" });
    await expect(readResponse(new Response("<html>", { status: 200 }))).rejects.toMatchObject({ code: "BAD_BACKEND_RESPONSE" });
  });
});

describe("createHttpClient", () => {
  it("maps every verb to the transport with a normalised path, query and JSON body", async () => {
    const seen: TransportRequest[] = [];
    const client = createHttpClient(async (request) => {
      seen.push(request);
      return Response.json({ ok: true });
    });

    await client.get("/users", { query: { limit: 5 } });
    await client.post("users/1/suspend");
    await client.put("a", { body: { x: 1 } });
    await client.patch("clinicians/2", { body: { name: "N" } });
    await client.delete("children/1/clinicians/2");

    expect(seen.map((r) => [r.method, r.path, r.search, r.body])).toEqual([
      ["GET", "users", "?limit=5", undefined],
      ["POST", "users/1/suspend", "", undefined],
      ["PUT", "a", "", '{"x":1}'],
      ["PATCH", "clinicians/2", "", '{"name":"N"}'],
      ["DELETE", "children/1/clinicians/2", "", undefined],
    ]);
  });
});

describe("createApiClient (browser -> BFF)", () => {
  const problem = (status: number, code: string) =>
    new Response(JSON.stringify({ status, code }), { status, headers: { "content-type": "application/problem+json" } });

  function setup(responses: Response[], refresh: () => Promise<{ next: number } | { redirect: string }>) {
    const fetchImpl = vi.fn(async () => responses.shift()!) as unknown as typeof fetch;
    const navigate = vi.fn();
    const refreshFn = vi.fn(refresh);
    return { client: createApiClient({ fetchImpl, refresh: refreshFn, navigate }), fetchImpl: fetchImpl as unknown as ReturnType<typeof vi.fn>, navigate, refreshFn };
  }

  it("calls the same-origin BFF with the CSRF header and no token", async () => {
    const { client, fetchImpl } = setup([Response.json({ data: [] })], async () => ({ next: 1 }));
    await client.get("users", { query: { role: "PARENT" } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/admin/api/backend/users?role=PARENT");
    expect(init.headers["x-nn-admin"]).toBe("1");
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.credentials).toBe("same-origin");
  });

  it("refreshes once and retries when the access token is rejected", async () => {
    const { client, fetchImpl, refreshFn } = setup([problem(401, "INVALID_TOKEN"), Response.json({ id: "u" })], async () => ({ next: 1 }));
    expect(await client.get("users/u")).toEqual({ id: "u" });
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not loop: a second rejection surfaces as an ApiError", async () => {
    const { client, refreshFn } = setup([problem(401, "INVALID_TOKEN"), problem(401, "INVALID_TOKEN")], async () => ({ next: 1 }));
    await expect(client.get("users")).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("sends the user to sign in when the session is over", async () => {
    const { client, navigate } = setup([problem(401, "MISSING_TOKEN")], async () => ({ redirect: "/admin/login?reason=expired" }));
    await expect(client.get("users")).rejects.toBeInstanceOf(ApiError);
    expect(navigate).toHaveBeenCalledWith("/admin/login?reason=expired");
  });

  it("forces sign-in on ACCOUNT_NOT_ACTIVE without refreshing, and leaves other 4xx alone", async () => {
    const a = setup([problem(403, "ACCOUNT_NOT_ACTIVE")], async () => ({ next: 1 }));
    await expect(a.client.get("users")).rejects.toMatchObject({ code: "ACCOUNT_NOT_ACTIVE" });
    expect(a.navigate).toHaveBeenCalledWith("/admin/login?reason=suspended");
    expect(a.refreshFn).not.toHaveBeenCalled();

    const b = setup([problem(403, "INSUFFICIENT_PERMISSIONS")], async () => ({ next: 1 }));
    await expect(b.client.get("users")).rejects.toMatchObject({ code: "INSUFFICIENT_PERMISSIONS" });
    expect(b.refreshFn).not.toHaveBeenCalled();
    expect(b.navigate).not.toHaveBeenCalled();
  });

  it("maps a network failure to BACKEND_UNREACHABLE", async () => {
    const client = createApiClient({ fetchImpl: (async () => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch });
    await expect(client.get("users")).rejects.toMatchObject({ code: "BACKEND_UNREACHABLE", status: 503 });
  });
});
