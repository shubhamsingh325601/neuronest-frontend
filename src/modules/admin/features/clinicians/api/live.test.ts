import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "../../../lib/api-errors";
import { parseInviteForm, parseEditForm, emptyInviteForm } from "./form";
import { clinicianDetailSchema } from "./types";

const holder = vi.hoisted(() => ({ fetchImpl: undefined as undefined | typeof fetch }));
vi.mock("../../../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api-client")>("../../../lib/api-client");
  return { apiClient: actual.createApiClient({ fetchImpl: (...args) => holder.fetchImpl!(...args) }) };
});
import { liveClinicianApi } from "./live";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const row = {
  id: "u1",
  name: "Dr. Sam Okafor",
  email: "sam@clinic.example",
  status: "INVITED",
  createdAt: "2026-10-10T00:00:00.000Z",
  invitationSentAt: "2026-10-10T00:00:00.000Z",
  invitationExpiresAt: "2026-10-17T00:00:00.000Z",
};
const detail = {
  ...row,
  profile: { phone: null, specialisation: null, qualifications: null, licenseNumber: null, bio: null },
  activatedAt: null,
  lastLoginAt: null,
  assignedChildIds: [],
};

describe("liveClinicianApi", () => {
  it("lists with the documented query and parses the envelope", async () => {
    const fetchImpl = vi.fn(async () => json(200, { data: [row], nextCursor: "abc" }));
    holder.fetchImpl = fetchImpl;
    const page = await liveClinicianApi.list({ status: "INVITED", q: "sam", limit: 20 });
    expect(page.nextCursor).toBe("abc");
    const url = String((fetchImpl.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/clinicians?");
    expect(url).toContain("status=INVITED");
    expect(url).toContain("q=sam");
  });

  it("rejects a row with an unknown status", async () => {
    holder.fetchImpl = async () => json(200, { data: [{ ...row, status: "WEIRD" }], nextCursor: null });
    await expect(liveClinicianApi.list({})).rejects.toMatchObject({ code: ErrorCode.BadResponse });
  });

  it("POSTs only the given fields and parses the 201 detail", async () => {
    const fetchImpl = vi.fn(async () => json(201, detail));
    holder.fetchImpl = fetchImpl;
    const created = await liveClinicianApi.create({ name: "Dr. Sam Okafor", email: "sam@clinic.example" });
    expect(created.status).toBe("INVITED");
    const init = (fetchImpl.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ name: "Dr. Sam Okafor", email: "sam@clinic.example" });
  });

  it("surfaces EMAIL_ALREADY_REGISTERED by code", async () => {
    holder.fetchImpl = async () => json(409, { code: ErrorCode.EmailAlreadyRegistered, detail: "taken" });
    await expect(liveClinicianApi.create({ name: "A", email: "a@b.co" })).rejects.toMatchObject({
      code: ErrorCode.EmailAlreadyRegistered,
      status: 409,
    });
  });

  it("GETs one clinician and PATCHes only the given fields", async () => {
    const fetchImpl = vi.fn(async () => json(200, detail));
    holder.fetchImpl = fetchImpl;
    await liveClinicianApi.get("u 1");
    expect(String((fetchImpl.mock.calls[0] as unknown[])[0])).toContain("/clinicians/u%201");
    await liveClinicianApi.update("u1", { name: "New", profile: { bio: null } });
    const init = (fetchImpl.mock.calls[1] as unknown[])[1] as RequestInit;
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ name: "New", profile: { bio: null } });
  });

  it("resends the invitation (202, no body) and surfaces CLINICIAN_NOT_INVITED", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    holder.fetchImpl = fetchImpl;
    await expect(liveClinicianApi.resendInvitation("u1")).resolves.toBeUndefined();
    expect(String((fetchImpl.mock.calls[0] as unknown[])[0])).toContain("/clinicians/u1/resend-invitation");
    holder.fetchImpl = async () => json(409, { code: ErrorCode.ClinicianNotInvited });
    await expect(liveClinicianApi.resendInvitation("u1")).rejects.toMatchObject({ code: ErrorCode.ClinicianNotInvited });
  });

  it("suspends and reactivates through the users endpoints", async () => {
    const fetchImpl = vi.fn(async () => json(200, { id: "u1", status: "SUSPENDED", updatedAt: "2026-10-10T00:00:00.000Z" }));
    holder.fetchImpl = fetchImpl;
    const result = await liveClinicianApi.setStatus("u1", "suspend");
    expect(result.status).toBe("SUSPENDED");
    await liveClinicianApi.setStatus("u1", "reactivate");
    expect(String((fetchImpl.mock.calls[0] as unknown[])[0])).toContain("/users/u1/suspend");
    expect(String((fetchImpl.mock.calls[1] as unknown[])[0])).toContain("/users/u1/reactivate");
  });

  it("detail schema accepts the DTO", () => {
    expect(clinicianDetailSchema.safeParse(detail).success).toBe(true);
  });
});

describe("parseInviteForm", () => {
  const valid = { ...emptyInviteForm, name: " Dr. Sam ", email: " sam@clinic.example " };

  it("trims, and omits a blank profile", () => {
    expect(parseInviteForm(valid)).toEqual({ ok: true, input: { name: "Dr. Sam", email: "sam@clinic.example" } });
  });

  it("sends only filled profile fields", () => {
    const result = parseInviteForm({ ...valid, specialisation: "Paediatrics", bio: "  " });
    expect(result).toEqual({
      ok: true,
      input: { name: "Dr. Sam", email: "sam@clinic.example", profile: { specialisation: "Paediatrics" } },
    });
  });

  it("reports required, email and length errors per field", () => {
    const result = parseInviteForm({ ...emptyInviteForm, email: "nope", phone: "1".repeat(41) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toMatch(/name/i);
      expect(result.errors.email).toMatch(/valid email/i);
      expect(result.errors.phone).toMatch(/40/);
    }
  });
});

describe("parseEditForm", () => {
  const original = { ...emptyInviteForm, name: "Dr. Sam", email: "sam@clinic.example", bio: "Hello" };

  it("sends nothing when nothing changed", () => {
    expect(parseEditForm(original, { emailEditable: true, original })).toEqual({ ok: true, input: {}, changed: false });
  });

  it("sends only changed fields and clears a blanked profile field with null", () => {
    const result = parseEditForm({ ...original, name: "Dr. Samuel", bio: "" }, { emailEditable: true, original });
    expect(result).toEqual({ ok: true, input: { name: "Dr. Samuel", profile: { bio: null } }, changed: true });
  });

  it("ignores an email change once the email is locked", () => {
    const result = parseEditForm({ ...original, email: "other@clinic.example" }, { emailEditable: false, original });
    expect(result).toEqual({ ok: true, input: {}, changed: false });
  });

  it("includes a changed email while INVITED", () => {
    const result = parseEditForm({ ...original, email: "other@clinic.example" }, { emailEditable: true, original });
    expect(result).toMatchObject({ ok: true, input: { email: "other@clinic.example" } });
  });
});
