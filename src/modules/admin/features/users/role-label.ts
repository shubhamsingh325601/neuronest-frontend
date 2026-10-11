import type { UserRole } from "./api/types";

const LABELS: Record<UserRole, string> = { PARENT: "Parent", CLINICIAN: "Clinician", ADMIN: "Admin" };

export const roleLabel = (role: UserRole): string => LABELS[role];
