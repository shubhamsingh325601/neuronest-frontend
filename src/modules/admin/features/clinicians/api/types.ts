import { z } from "zod";
import type { CursorPage } from "../../../lib/pagination";
import { cursorPageSchema } from "../../../lib/pagination";

// Contract: docs/api-1.json (ClinicianDto, ClinicianDetailDto, CreateClinicianDto, ClinicianProfileInputDto).
// The backend validates with `forbidNonWhitelisted`, so create sends only documented fields.

export const CLINICIAN_STATUSES = ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;
export type ClinicianStatus = (typeof CLINICIAN_STATUSES)[number];

const timestamp = z.string().nullable();

export const clinicianSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(CLINICIAN_STATUSES),
  createdAt: z.string(),
  invitationSentAt: timestamp,
  invitationExpiresAt: timestamp,
});
export type Clinician = z.infer<typeof clinicianSchema>;

export const clinicianPageSchema = cursorPageSchema(clinicianSchema);

const profileSchema = z.object({
  phone: z.string().nullable(),
  specialisation: z.string().nullable(),
  qualifications: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  bio: z.string().nullable(),
});

// POST /clinicians answers 201 with the detail DTO.
export const clinicianDetailSchema = clinicianSchema.extend({
  profile: profileSchema,
  activatedAt: timestamp,
  lastLoginAt: timestamp,
  assignedChildIds: z.array(z.string()),
});
export type ClinicianDetail = z.infer<typeof clinicianDetailSchema>;

/** Field limits from the backend DTOs; the form validates against the same numbers. */
export const CLINICIAN_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  specialisation: 200,
  qualifications: 500,
  licenseNumber: 100,
  bio: 2000,
} as const;

export const PROFILE_FIELDS = ["phone", "specialisation", "qualifications", "licenseNumber", "bio"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export interface CreateClinicianInput {
  name: string;
  email: string;
  profile?: Partial<Record<ProfileField, string>>;
}

/** PATCH body: only changed fields. Profile fields are nullable so a blank value clears it. */
export interface UpdateClinicianInput {
  name?: string;
  email?: string;
  profile?: Partial<Record<ProfileField, string | null>>;
}

export type ClinicianAction = "suspend" | "reactivate";

export const clinicianStatusResultSchema = z.object({ id: z.string(), status: z.enum(CLINICIAN_STATUSES), updatedAt: z.string() });
export type ClinicianStatusResult = z.infer<typeof clinicianStatusResultSchema>;

export interface ListCliniciansParams {
  cursor?: string;
  limit?: number;
  status?: ClinicianStatus;
  q?: string;
}

export interface ClinicianApi {
  list(params: ListCliniciansParams, signal?: AbortSignal): Promise<CursorPage<Clinician>>;
  create(input: CreateClinicianInput): Promise<ClinicianDetail>;
  get(id: string, signal?: AbortSignal): Promise<ClinicianDetail>;
  update(id: string, input: UpdateClinicianInput): Promise<ClinicianDetail>;
  /** 202: a fresh setup link is emailed. Only while INVITED (CLINICIAN_NOT_INVITED otherwise). */
  resendInvitation(id: string): Promise<void>;
  /** Suspend / reactivate go through the users endpoints (a clinician is a user). */
  setStatus(id: string, action: ClinicianAction): Promise<ClinicianStatusResult>;
}
