import type { UserRole } from "./api/types";

const LABELS: Record<UserRole, string> = { PARENT: "Parent", CLINICIAN: "Clinician", EXPERT: "Expert", ADMIN: "Admin" };

export const roleLabel = (role: UserRole): string => LABELS[role];
