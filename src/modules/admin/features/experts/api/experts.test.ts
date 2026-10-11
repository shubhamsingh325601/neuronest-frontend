import { describe, expect, it, vi } from "vitest";
import { generatePassword, parseCreateForm, parseEditForm } from "./form";
import { expertDetailSchema } from "./types";

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api-client")>("../../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { liveExpertApi } from "./live";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const detail = {
  id: "e1",
  name: "Dr. Maya Iyer",
  email: "maya@experts.example",
  status: "ACTIVE",
  createdAt: "2026-10-10T00:00:00.000Z",
  lastLoginAt: null,
  assignedChildIds: ["c1"],
};

describe("parseCreateForm", () => {
  it("requires a name, a valid email and a 10+ character password", () => {
    const result = parseCreateForm({ name: " ", email: "nope", password: "short" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "name", "password"]);
  });

  it("trims name and email but never the password", () => {
    const result = parseCreateForm({ name: " Maya ", email: " maya@x.org ", password: " spaced pass " });
    expect(result).toEqual({ ok: true, input: { name: "Maya", email: "maya@x.org", password: " spaced pass " } });
  });
});

describe("parseEditForm", () => {
  const original = { name: "Maya", email: "maya@x.org" };

  it("sends only changed fields, and a blank password keeps the current one", () => {
    expect(parseEditForm({ ...original, password: "" }, original)).toEqual({ ok: true, input: {}, changed: false });
    expect(parseEditForm({ name: "Maya I.", email: "MAYA@x.org", password: "" }, original)).toEqual({
      ok: true,
      input: { name: "Maya I." },
      changed: true,
    });
  });

  it("rejects a too-short new password", () => {
    const result = parseEditForm({ ...original, password: "short" }, original);
    expect(result.ok).toBe(false);
  });

  it("sends a valid new password", () => {
    expect(parseEditForm({ ...original, password: "a-long-new-password" }, original)).toMatchObject({
      input: { password: "a-long-new-password" },
      changed: true,
    });
  });
});

describe("generatePassword", () => {
  it("meets the minimum length and differs between calls", () => {
    const first = generatePassword();
    expect(first).toHaveLength(16);
    expect(first).not.toBe(generatePassword());
  });
});

describe("liveExpertApi", () => {
  it("creates with name, email and password only", async () => {
    const fetchImpl = vi.fn(async () => json(201, detail));
    holder.fetchImpl = fetchImpl;
    const created = await liveExpertApi.create({ name: "Dr. Maya Iyer", email: "maya@experts.example", password: "correct-horse-battery" });
    expect(expertDetailSchema.safeParse(created).success).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/experts$/);
    expect(JSON.parse(String(init.body))).toEqual({ name: "Dr. Maya Iyer", email: "maya@experts.example", password: "correct-horse-battery" });
  });

  it("replaces the child set with PUT", async () => {
    const fetchImpl = vi.fn(async () => json(200, { childIds: ["c1", "c2"] }));
    holder.fetchImpl = fetchImpl;
    await expect(liveExpertApi.setChildren("e1", ["c1", "c2"])).resolves.toEqual({ childIds: ["c1", "c2"] });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/experts\/e1\/children$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ childIds: ["c1", "c2"] });
  });

  it("suspends through the users endpoint", async () => {
    const fetchImpl = vi.fn(async () => json(200, { id: "e1", status: "SUSPENDED", updatedAt: "2026-10-11T00:00:00.000Z" }));
    holder.fetchImpl = fetchImpl;
    await liveExpertApi.setStatus("e1", "suspend");
    expect(String((fetchImpl.mock.calls[0] as unknown[])[0])).toMatch(/\/users\/e1\/suspend$/);
  });
});
