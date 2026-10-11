import { ErrorCode } from "@/modules/admin/lib/api-errors";
import type {
  Clinician,
  ClinicianApi,
  ClinicianDetail,
  CreateClinicianInput,
  ProfileField,
} from "@/modules/admin/features/clinicians/api/types";
import { MOCK_LATENCY_MS, delay, mockError, paginate } from "./_factory";

// TEMPORARY sample clinicians (plan 0001 §18). Shown only when the data-source flags select mock data for
// Clinicians. Created clinicians live in memory until the page reloads.
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const seed = (): Clinician[] => [
  { id: "c-1", name: "Dr. Sam Okafor", email: "sam.okafor@clinic.example", status: "ACTIVE", createdAt: ago(90), invitationSentAt: ago(90), invitationExpiresAt: ago(83) },
  { id: "c-2", name: "Dr. Priya Raman", email: "priya.raman@clinic.example", status: "INVITED", createdAt: ago(2), invitationSentAt: ago(2), invitationExpiresAt: inDays(5) },
  { id: "c-3", name: "Alex Moreau", email: "alex.moreau@clinic.example", status: "SUSPENDED", createdAt: ago(40), invitationSentAt: ago(40), invitationExpiresAt: ago(33) },
];

let clinicians = seed();
const profiles = new Map<string, Partial<Record<ProfileField, string | null>>>();

const notFound = () => mockError(404, "CLINICIAN_NOT_FOUND", "Clinician not found.");

function detailOf(row: Clinician): ClinicianDetail {
  const p = profiles.get(row.id) ?? {};
  return {
    ...row,
    profile: { phone: p.phone ?? null, specialisation: p.specialisation ?? null, qualifications: p.qualifications ?? null, licenseNumber: p.licenseNumber ?? null, bio: p.bio ?? null },
    activatedAt: row.status === "INVITED" ? null : row.createdAt,
    lastLoginAt: row.status === "ACTIVE" ? row.createdAt : null,
    assignedChildIds: [],
  };
}


export const mockClinicianApi: ClinicianApi = {
  async list({ cursor, limit, status, q }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    const needle = q?.trim().toLowerCase();
    const rows = clinicians.filter(
      (c) =>
        (!status || c.status === status) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)),
    );
    return paginate(rows, { cursor, limit });
  },

  async create(input: CreateClinicianInput): Promise<ClinicianDetail> {
    await delay(MOCK_LATENCY_MS);
    const email = input.email.trim().toLowerCase();
    if (clinicians.some((c) => c.email.toLowerCase() === email)) {
      throw mockError(409, ErrorCode.EmailAlreadyRegistered, "This email is already registered.");
    }
    const now = new Date().toISOString();
    const row: Clinician = {
      id: `c-${clinicians.length + 1}`,
      name: input.name,
      email,
      status: "INVITED",
      createdAt: now,
      invitationSentAt: now,
      invitationExpiresAt: inDays(7),
    };
    clinicians = [row, ...clinicians];
    profiles.set(row.id, { ...(input.profile ?? {}) });
    return detailOf(row);
  },

  async get(id, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    const row = clinicians.find((c) => c.id === id);
    if (!row) throw notFound();
    return detailOf(row);
  },

  async update(id, input) {
    await delay(MOCK_LATENCY_MS);
    const row = clinicians.find((c) => c.id === id);
    if (!row) throw notFound();
    if (input.email !== undefined) {
      if (row.status !== "INVITED") throw mockError(409, ErrorCode.ClinicianEmailLocked, "The email can no longer be changed.");
      const email = input.email.trim().toLowerCase();
      if (clinicians.some((c) => c.id !== id && c.email.toLowerCase() === email)) {
        throw mockError(409, ErrorCode.EmailAlreadyRegistered, "This email is already registered.");
      }
      row.email = email;
    }
    if (input.name !== undefined) row.name = input.name;
    if (input.profile) profiles.set(id, { ...(profiles.get(id) ?? {}), ...input.profile });
    return detailOf(row);
  },

  async resendInvitation(id) {
    await delay(MOCK_LATENCY_MS);
    const row = clinicians.find((c) => c.id === id);
    if (!row) throw notFound();
    if (row.status !== "INVITED") throw mockError(409, ErrorCode.ClinicianNotInvited, "This clinician has already activated their account.");
    row.invitationSentAt = new Date().toISOString();
    row.invitationExpiresAt = inDays(7);
  },

  async setStatus(id, action) {
    await delay(MOCK_LATENCY_MS);
    const row = clinicians.find((c) => c.id === id);
    if (!row) throw notFound();
    row.status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    return { id, status: row.status, updatedAt: new Date().toISOString() };
  },
};

/** Test hook: restore the sample rows. */
export function resetMockClinicians(): void {
  clinicians = seed();
  profiles.clear();
}
